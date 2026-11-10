const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const brevoService = require('../services/brevoService');
const { syncFromSupabase } = require('../services/supabaseSyncService');
const { emitAutomationEvent } = require('../services/automationEngine');

/**
 * Format course name to standard title
 */
function normalizeCourseName(slugOrTitle) {
  if (!slugOrTitle) return 'General Program';
  const map = {
    'python-programming': 'Python Programming',
    'web-development': 'Web Development',
    'sql-mastery': 'SQL Mastery',
    'data-science-ai': 'AI & Data Science',
    'ai-data-science': 'AI & Data Science',
    'python': 'Python Programming',
    'web': 'Web Development',
    'sql': 'SQL Mastery'
  };
  const key = String(slugOrTitle).toLowerCase().trim();
  return map[key] || slugOrTitle;
}

/**
 * 1. Synchronize single student registration from Boot Camp website
 * POST /api/bootcamp/sync
 */
exports.syncStudent = async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      email,
      phone,
      courseName,
      registrationDate,
      paymentStatus = 'N/A',
      registrationStatus = 'Enrolled',
      notes = '',
      assignedToEmail
    } = req.body;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'fullName and email are required fields.'
      });
    }

    const normEmail = String(email).trim().toLowerCase();
    const standardCourse = normalizeCourseName(courseName);

    // Find default assignee (Manager or Admin)
    let assignedUser = null;
    if (assignedToEmail) {
      assignedUser = await User.findOne({ email: String(assignedToEmail).toLowerCase() });
    }
    if (!assignedUser) {
      assignedUser = await User.findOne({ role: { $in: ['Manager', 'Admin'] } });
    }

    // Deduplication check: existing lead by email and course
    let lead = await Lead.findOne({
      email: normEmail,
      courseName: standardCourse
    });

    let isNew = false;
    const regDate = registrationDate ? new Date(registrationDate) : new Date();

    if (!lead) {
      // Check if lead exists with same email regardless of course
      lead = await Lead.findOne({ email: normEmail });
    }

    if (lead) {
      // Update existing lead metadata without overwriting staff notes or custom assignments
      lead.studentId = studentId || lead.studentId;
      lead.phone = phone || lead.phone;
      lead.courseName = standardCourse || lead.courseName;
      lead.paymentStatus = paymentStatus !== 'N/A' ? paymentStatus : lead.paymentStatus;
      lead.registrationStatus = registrationStatus !== 'N/A' ? registrationStatus : lead.registrationStatus;
      if (!lead.tags.includes('Arshith Boot Camp')) lead.tags.push('Arshith Boot Camp');
      if (standardCourse && !lead.tags.includes(standardCourse)) lead.tags.push(standardCourse);
      await lead.save();
    } else {
      isNew = true;
      lead = await Lead.create({
        fullName: String(fullName).trim(),
        email: normEmail,
        phone: phone ? String(phone).trim() : '',
        companyName: 'Arshith Boot Camp',
        leadSource: 'Arshith Boot Camp',
        leadStatus: registrationStatus === 'Enrolled' ? 'Converted' : 'New',
        priority: 'High',
        assignedTo: assignedUser ? assignedUser._id : null,
        value: paymentStatus === 'Paid' ? 99 : 0,
        studentId: studentId || `ARB-STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        courseName: standardCourse,
        registrationDate: regDate,
        paymentStatus,
        registrationStatus,
        notes: notes || `Registered via Arshith Boot Camp on ${regDate.toLocaleDateString()}`,
        tags: ['Arshith Boot Camp', standardCourse]
      });

      // Schedule automated Welcome Follow-up Task for the assigned advisor
      await Task.create({
        title: `Welcome & Onboarding: ${fullName} (${standardCourse})`,
        description: `Verify course access and invite student to orientation session. Phone: ${phone || 'N/A'}`,
        type: 'Follow-up',
        priority: 'High',
        status: 'Pending',
        assignedTo: assignedUser ? assignedUser._id : null,
        relatedLead: lead._id,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      });

      // Log CRM Activity
      if (assignedUser) {
        await Activity.create({
          user: assignedUser._id,
          type: 'lead_update',
          description: `New student registration imported from Arshith Boot Camp: ${fullName} (${standardCourse})`,
          relatedLead: lead._id
        });

        // Send System Notification to Team
        await Notification.create({
          user: assignedUser._id,
          title: 'New Boot Camp Student Registration',
          message: `${fullName} has registered for ${standardCourse}. Follow-up task scheduled.`,
          type: 'lead_assigned'
        });
      }
    }

    // Upsert into Contact for Customer Management
    try {
      let bootcampCompany = await Company.findOne({ name: 'Arshith Boot Camp' });
      if (!bootcampCompany) {
        bootcampCompany = await Company.create({
          name: 'Arshith Boot Camp',
          industry: 'Education',
          website: 'https://arshithbootcamp.com/',
          email: 'bootcamp@arshithgroup.com',
          phone: '+91 9876543210'
        });
      }

      const nameParts = String(fullName || normEmail.split('@')[0]).trim().split(/\s+/);
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || 'Learner';
      const position = `${standardCourse} (${registrationStatus || 'Enrolled'})`;

      await Contact.findOneAndUpdate(
        { email: normEmail },
        {
          $set: {
            firstName,
            lastName,
            phone: phone || '',
            company: bootcampCompany._id,
            position,
            department: 'Arshith Boot Camp',
            assignedTo: assignedUser ? assignedUser._id : null,
            notes: notes || `Student ID: ${lead.studentId} | Course: ${standardCourse} | Payment: ${paymentStatus}`,
            tags: ['CodeLekho', 'Arshith Boot Camp', standardCourse, paymentStatus],
            isActive: true
          }
        },
        { upsert: true }
      );
    } catch (cErr) {
      console.error('[bootcampController] Contact sync warning:', cErr.message);
    }

    // Trigger Brevo Welcome / Confirmation Email asynchronously
    brevoService.sendWelcomeEmail({
      email: normEmail,
      name: fullName,
      studentId: lead.studentId,
      regNo: lead.studentId,
      courseName: standardCourse
    }).catch(err => console.error('[bootcampController] Welcome email warning:', err.message));

    // Trigger full automation engine lifecycle workflows
    if (isNew) {
      emitAutomationEvent('student_registered', { lead, email: normEmail, fullName }).catch(() => {});
      emitAutomationEvent('registration_confirmed', { lead, email: normEmail, fullName }).catch(() => {});
      if (lead.courseName) {
        emitAutomationEvent('course_enrolled', { lead, email: normEmail, fullName }).catch(() => {});
      }
    }
    if (lead.paymentStatus === 'Pending') {
      emitAutomationEvent('payment_pending', { lead, email: normEmail, fullName }).catch(() => {});
    } else if (lead.paymentStatus === 'Paid') {
      emitAutomationEvent('payment_completed', { lead, email: normEmail, fullName }).catch(() => {});
    }

    return res.status(isNew ? 201 : 200).json({
      success: true,
      isNew,
      lead,
      message: isNew ? 'Student registered and synced to CRM Pro' : 'Student record updated'
    });
  } catch (err) {
    console.error('Error syncing student:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync student registration',
      error: err.message
    });
  }
};

/**
 * 2. Historical Data Batch Migration (Import 100+ students safely)
 * POST /api/bootcamp/batch-import
 */
exports.batchImport = async (req, res) => {
  try {
    const { students = [] } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payload must contain a non-empty "students" array.'
      });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const logs = [];

    // Find default team assignee
    const defaultUser = await User.findOne({ role: { $in: ['Manager', 'Admin'] } });

    for (const item of students) {
      try {
        const email = String(item.email || '').trim().toLowerCase();
        const fullName = String(item.fullName || item.name || '').trim();
        const courseName = normalizeCourseName(item.courseName || item.course || item.enrolledCourse);

        if (!email || !fullName) {
          failed++;
          logs.push({ email: item.email, status: 'failed', reason: 'Missing email or name' });
          continue;
        }

        // Deduplication lookup
        let lead = await Lead.findOne({
          email,
          $or: [{ courseName }, { leadSource: 'Arshith Boot Camp' }]
        });

        const regDate = item.registrationDate || item.joinDate || item.createdAt
          ? new Date(item.registrationDate || item.joinDate || item.createdAt)
          : new Date();

        if (lead) {
          // Record already exists - update metadata without overwriting
          lead.studentId = item.studentId || item.id || lead.studentId;
          lead.phone = item.phone || lead.phone;
          lead.courseName = courseName || lead.courseName;
          lead.paymentStatus = item.paymentStatus || lead.paymentStatus;
          lead.registrationStatus = item.registrationStatus || lead.registrationStatus;
          if (!lead.tags.includes('Arshith Boot Camp')) lead.tags.push('Arshith Boot Camp');
          if (courseName && !lead.tags.includes(courseName)) lead.tags.push(courseName);
          await lead.save();

          updated++;
          logs.push({ email, studentId: lead.studentId, status: 'updated' });
        } else {
          // Create new student lead
          const newLead = await Lead.create({
            fullName,
            email,
            phone: item.phone ? String(item.phone).trim() : '',
            companyName: 'Arshith Boot Camp',
            leadSource: 'Arshith Boot Camp',
            leadStatus: item.registrationStatus === 'Enrolled' || item.status === 'active' ? 'Converted' : 'New',
            priority: 'Medium',
            assignedTo: defaultUser ? defaultUser._id : null,
            value: item.paymentStatus === 'Paid' ? 99 : 0,
            studentId: item.studentId || item.id || `ARB-STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            courseName,
            registrationDate: regDate,
            paymentStatus: item.paymentStatus || 'Free',
            registrationStatus: item.registrationStatus || 'Enrolled',
            notes: item.notes || `Historical import from Arshith Boot Camp (${regDate.toLocaleDateString()})`,
            tags: ['Arshith Boot Camp', courseName]
          });

          imported++;
          logs.push({ email, studentId: newLead.studentId, status: 'imported' });
        }
      } catch (itemErr) {
        failed++;
        logs.push({ email: item.email, status: 'failed', reason: itemErr.message });
      }
    }

    return res.json({
      success: true,
      summary: {
        totalProcessed: students.length,
        imported,
        updated,
        skipped,
        failed
      },
      logs
    });
  } catch (err) {
    console.error('Batch import error:', err);
    return res.status(500).json({
      success: false,
      message: 'Batch import failed',
      error: err.message
    });
  }
};

/**
 * 3. Boot Camp Analytics & Stats
 * GET /api/bootcamp/stats
 */
exports.getStats = async (req, res) => {
  try {
    const bootcampFilter = { leadSource: 'Arshith Boot Camp' };

    const totalStudents = await Lead.countDocuments(bootcampFilter);

    // Today's new registrations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRegistrations = await Lead.countDocuments({
      ...bootcampFilter,
      createdAt: { $gte: startOfToday }
    });

    // Course-wise aggregation
    const courseBreakdown = await Lead.aggregate([
      { $match: bootcampFilter },
      { $group: { _id: '$courseName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Lead Status breakdown
    const statusBreakdown = await Lead.aggregate([
      { $match: bootcampFilter },
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } }
    ]);

    // Payment breakdown
    const paymentBreakdown = await Lead.aggregate([
      { $match: bootcampFilter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);

    // Follow-ups related to Boot Camp leads
    const bootcampLeadIds = await Lead.find(bootcampFilter).select('_id');
    const leadIdList = bootcampLeadIds.map(l => l._id);

    const pendingFollowUps = await Task.countDocuments({
      relatedLead: { $in: leadIdList },
      status: { $in: ['Pending', 'In Progress'] }
    });

    const completedFollowUps = await Task.countDocuments({
      relatedLead: { $in: leadIdList },
      status: 'Completed'
    });

    const overdueFollowUps = await Task.countDocuments({
      relatedLead: { $in: leadIdList },
      status: { $in: ['Pending', 'In Progress'] },
      dueDate: { $lt: new Date() }
    });

    // Registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrend = await Lead.aggregate([
      {
        $match: {
          ...bootcampFilter,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          registrations: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalStudents,
        todayRegistrations,
        courseBreakdown,
        statusBreakdown,
        paymentBreakdown,
        followUps: {
          pending: pendingFollowUps,
          completed: completedFollowUps,
          overdue: overdueFollowUps
        },
        dailyTrend
      }
    });
  } catch (err) {
    console.error('Error fetching bootcamp stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Boot Camp statistics',
      error: err.message
    });
  }
};

/**
 * 4. List all Boot Camp Students with pagination and filtering
 * GET /api/bootcamp/students
 */
exports.getStudents = async (req, res) => {
  try {
    const { course, status, search, page = 1, limit = 50 } = req.query;

    const query = { leadSource: 'Arshith Boot Camp' };

    if (course && course !== 'All') {
      query.courseName = course;
    }
    if (status && status !== 'All') {
      query.leadStatus = status;
    }
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lead.countDocuments(query);
    const students = await Lead.find(query)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      students,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student records',
      error: err.message
    });
  }
};

/**
 * 5. Schedule / Assign Follow-up Task for a Student
 * POST /api/bootcamp/follow-up
 */
exports.scheduleFollowUp = async (req, res) => {
  try {
    const { leadId, title, type = 'Follow-up', priority = 'Medium', dueDate, assignedTo, notes } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Student / Lead not found' });
    }

    const task = await Task.create({
      title: title || `Follow-up with ${lead.fullName}`,
      description: notes || `Follow-up regarding course: ${lead.courseName || 'Boot Camp'}`,
      type,
      priority,
      status: 'Pending',
      assignedTo: assignedTo || lead.assignedTo || req.user?._id,
      relatedLead: lead._id,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Update lead's nextFollowUp date
    lead.nextFollowUp = task.dueDate;
    await lead.save();

    if (req.user?._id || lead.assignedTo) {
      await Activity.create({
        user: req.user?._id || lead.assignedTo,
        type: 'task',
        description: `Follow-up scheduled for student ${lead.fullName} on ${task.dueDate.toLocaleDateString()}`,
        relatedLead: lead._id
      });
    }

    // Trigger Counselor Follow-up Email Automation (Automation 7)
    emitAutomationEvent('counselor_followup_needed', {
      lead,
      email: lead.email,
      fullName: lead.fullName,
      metadata: { taskId: task._id, counselingTime: task.dueDate.toLocaleString() }
    }).catch(() => {});

    return res.status(201).json({ success: true, task });
  } catch (err) {
    console.error('Error scheduling follow-up:', err);
    return res.status(500).json({ success: false, message: 'Failed to schedule follow-up', error: err.message });
  }
};

/**
 * 6. Generate Daily Report for Srinu
 * GET /api/bootcamp/reports/daily
 */
exports.getDailyReport = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalStudents = await Lead.countDocuments({ leadSource: 'Arshith Boot Camp' });
    const todayRegistrations = await Lead.countDocuments({
      leadSource: 'Arshith Boot Camp',
      createdAt: { $gte: startOfToday }
    });

    const courseBreakdown = await Lead.aggregate([
      { $match: { leadSource: 'Arshith Boot Camp' } },
      { $group: { _id: '$courseName', count: { $sum: 1 } } }
    ]);

    const leadsSummary = await Lead.aggregate([
      { $match: { leadSource: 'Arshith Boot Camp' } },
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } }
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      recipient: process.env.SRINU_REPORT_EMAIL || 'srinu@arshithgroup.com',
      totalStudents,
      todayRegistrations,
      courses: courseBreakdown.map(c => ({ course: c._id || 'Unassigned', count: c.count })),
      leadStatuses: leadsSummary.map(s => ({ status: s._id, count: s.count })),
      followUpsSummary: {
        pending: await Task.countDocuments({ status: { $in: ['Pending', 'In Progress'] } }),
        completedToday: await Task.countDocuments({ status: 'Completed', updatedAt: { $gte: startOfToday } })
      }
    };

    return res.json({ success: true, report });
  } catch (err) {
    console.error('Daily report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate report', error: err.message });
  }
};

/**
 * 7. Download Arshith Boot Camp CSV Report
 * GET /api/bootcamp/reports/download-csv
 */
exports.downloadReportCSV = async (req, res) => {
  try {
    const students = await Lead.find({ leadSource: 'Arshith Boot Camp' })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const header = ['Student ID', 'Full Name', 'Email', 'Phone', 'Course Name', 'Registration Date', 'Payment Status', 'Registration Status', 'Assigned Counselor', 'Created At'];

    const rows = students.map(s => [
      `"${s.studentId || ''}"`,
      `"${s.fullName || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.courseName || ''}"`,
      `"${s.registrationDate ? new Date(s.registrationDate).toLocaleDateString() : ''}"`,
      `"${s.paymentStatus || ''}"`,
      `"${s.registrationStatus || ''}"`,
      `"${s.assignedTo?.name || 'Unassigned'}"`,
      `"${new Date(s.createdAt).toISOString()}"`
    ]);

    const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Arshith_Bootcamp_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('CSV download error:', err);
    return res.status(500).json({ success: false, message: 'CSV export failed', error: err.message });
  }
};

/**
 * 8. Manual Trigger Brevo Email Workflow
 * POST /api/bootcamp/email/trigger
 */
exports.triggerBrevoWorkflow = async (req, res) => {
  try {
    const { workflow, email, name, courseName, metadata = {} } = req.body;

    if (!email || !workflow) {
      return res.status(400).json({ success: false, message: 'email and workflow are required.' });
    }

    let result;
    switch (workflow) {
      case 'welcome':
        result = await brevoService.sendWelcomeEmail({ email, name, studentId: metadata.studentId, regNo: metadata.regNo, courseName: courseName || metadata.courseName || 'Foundations Track' });
        break;
      case 'registration_confirmation':
        result = await brevoService.sendRegistrationConfirmation({ email, name, courseName, registrationDate: metadata.registrationDate });
        break;
      case 'course_info':
        result = await brevoService.sendCourseInfoEmail({ email, name, courseName });
        break;
      case 'course_starting':
        result = await brevoService.sendCourseStartingReminder({ email, name, courseName, startDate: metadata.startDate });
        break;
      case 'payment_reminder':
        result = await brevoService.sendPaymentReminder({ email, name, courseName, amount: metadata.amount });
        break;
      case 'follow_up':
        result = await brevoService.sendFollowUpReminder({ email, name, courseName, notes: metadata.notes });
        break;
      case 'campaign':
        result = await brevoService.sendCampaignEmail({ email, name, campaignTitle: metadata.title, campaignBody: metadata.body });
        break;
      default:
        return res.status(400).json({ success: false, message: `Unknown workflow: ${workflow}` });
    }

    return res.json({ success: true, workflow, result });
  } catch (err) {
    console.error('Email trigger error:', err);
    return res.status(500).json({ success: false, message: 'Failed to trigger email workflow', error: err.message });
  }
};

/**
 * 9. Immediate Sync Trigger from Live CodeLekho Supabase
 * POST /api/bootcamp/sync-supabase
 */
exports.syncNowFromSupabase = async (req, res) => {
  try {
    const result = await syncFromSupabase();
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
