/**
 * Automated Real-time Synchronization Engine between CodeLekho (Supabase) and CRM Pro
 * Continuously polls Supabase for newly registered learners and pushes them into MongoDB Atlas.
 */
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const brevoService = require('./brevoService');
const { emitAutomationEvent } = require('./automationEngine');

function normalizeCourse(slug) {
  if (!slug) return 'Foundations Track';
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
  const key = String(slug).toLowerCase().trim();
  return map[key] || slug;
}

let isSyncing = false;

async function syncFromSupabase() {
  if (isSyncing) return { status: 'already_syncing' };
  isSyncing = true;

  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      isSyncing = false;
      return { success: false, error: 'Supabase credentials not configured' };
    }

    const res = await fetch(url + '/rest/v1/app_state?select=key,data', {
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + key
      }
    });

    if (!res.ok) {
      isSyncing = false;
      return { success: false, error: `Supabase returned HTTP ${res.status}` };
    }

    const rows = await res.json();
    const db = Object.fromEntries(rows.map(r => [r.key, r.data]));

    const rawStudents = db.students || [];
    const rawLearners = db.learners || {};
    const payments = db.payments || [];
    const enrollments = db.learnerEnrollments || {};

    const defaultUser = await User.findOne({ role: { $in: ['Manager', 'Admin'] } });
    let bootcampCompany = await Company.findOne({ name: 'Arshith Boot Camp' });
    if (!bootcampCompany) {
      bootcampCompany = await Company.create({
        name: 'Arshith Boot Camp',
        industry: 'Education',
        website: 'https://arshithbootcamp.com/',
        email: 'bootcamp@arshithgroup.com',
        phone: '+91 9876543210',
        size: '51-200',
        assignedTo: defaultUser ? defaultUser._id : null
      });
    }

    let newCount = 0;
    let updatedCount = 0;

    // Build unified map
    const studentMap = new Map();
    for (const s of rawStudents) {
      const email = String(s.email || '').trim().toLowerCase();
      if (email) studentMap.set(email, { ...s, email });
    }
    for (const [lEmail, l] of Object.entries(rawLearners)) {
      const email = String(lEmail || l.email || '').trim().toLowerCase();
      if (email) {
        const existing = studentMap.get(email) || {};
        studentMap.set(email, { ...existing, ...l, email, id: existing.id || l.learnerId });
      }
    }

    for (const [email, s] of studentMap.entries()) {
      let courseSlug = '';
      if (s.enrolledCourses && s.enrolledCourses.length > 0) {
        courseSlug = s.enrolledCourses[0];
      } else if (enrollments[email]) {
        courseSlug = enrollments[email].courseId || Object.keys(enrollments[email].courses || {})[0] || '';
      }
      const courseName = normalizeCourse(courseSlug);

      const studentPayments = payments.filter(p => String(p.email || '').toLowerCase() === email);
      let paymentStatus = 'Free';
      let value = 0;
      if (studentPayments.some(p => p.status === 'SUCCESS' || p.status === 'paid' || p.status === 'captured')) {
        paymentStatus = 'Paid';
        value = 99;
      } else if (studentPayments.length > 0) {
        paymentStatus = 'Pending';
      }

      const regDate = s.joinDate || s.createdAt ? new Date(s.joinDate || s.createdAt) : new Date();

      let lead = await Lead.findOne({ email });
      if (lead) {
        // Safe update without overwriting staff notes
        let changed = false;
        if (s.id && lead.studentId !== s.id) { lead.studentId = s.id; changed = true; }
        if (s.phone && lead.phone !== s.phone) { lead.phone = s.phone; changed = true; }
        if (paymentStatus !== 'Free' && lead.paymentStatus !== paymentStatus) { lead.paymentStatus = paymentStatus; changed = true; }
        if (changed) {
          await lead.save();
          updatedCount++;
        }
      } else {
        // New student detected in CodeLekho!
        const newLead = await Lead.create({
          fullName: s.name || email.split('@')[0],
          email,
          phone: s.phone || '',
          companyName: 'Arshith Boot Camp',
          leadSource: 'Arshith Boot Camp',
          leadStatus: 'Converted',
          priority: 'High',
          assignedTo: defaultUser ? defaultUser._id : null,
          value,
          studentId: s.id || `ARB-STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          courseName,
          registrationDate: regDate,
          paymentStatus,
          registrationStatus: 'Enrolled',
          notes: `Live synced from CodeLekho (Supabase). RegNo: ${s.regNo || 'N/A'}`,
          tags: ['Arshith Boot Camp', courseName]
        });

        // Create onboarding task
        if (defaultUser) {
          await Task.create({
            title: `Onboarding: ${newLead.fullName} (${courseName})`,
            description: `Live registration from CodeLekho. Student ID: ${newLead.studentId}. Phone: ${newLead.phone || 'N/A'}`,
            type: 'Follow-up',
            priority: 'High',
            status: 'Pending',
            assignedTo: defaultUser._id,
            relatedLead: newLead._id,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });

          await Notification.create({
            user: defaultUser._id,
            title: 'Live CodeLekho Registration',
            message: `${newLead.fullName} just registered for ${courseName}.`,
            type: 'lead_assigned'
          });
        }

        // Trigger Brevo Welcome Email
        brevoService.sendWelcomeEmail({
          email,
          name: newLead.fullName,
          studentId: newLead.studentId,
          regNo: s.regNo,
          courseName
        }).catch(() => {});

        // Instant event-driven automation engine dispatch
        emitAutomationEvent('student_registered', { lead: newLead, email, fullName: newLead.fullName }).catch(() => {});
        emitAutomationEvent('registration_confirmed', { lead: newLead, email, fullName: newLead.fullName }).catch(() => {});
        if (newLead.courseName) {
          emitAutomationEvent('course_enrolled', { lead: newLead, email, fullName: newLead.fullName }).catch(() => {});
        }
        if (paymentStatus === 'Paid') {
          emitAutomationEvent('payment_completed', { lead: newLead, email, fullName: newLead.fullName }).catch(() => {});
        } else if (paymentStatus === 'Pending') {
          emitAutomationEvent('payment_pending', { lead: newLead, email, fullName: newLead.fullName }).catch(() => {});
        }

        newCount++;
      }

      // Upsert into Contact for Customer Management
      try {
        const rawName = String(s.name || email.split('@')[0]).trim();
        const parts = rawName.split(/\s+/);
        const firstName = parts[0] || 'Student';
        const lastName = parts.slice(1).join(' ') || 'Learner';
        const position = `${courseName} (Enrolled)`;

        await Contact.findOneAndUpdate(
          { email },
          {
            $set: {
              firstName,
              lastName,
              phone: s.phone || '',
              company: bootcampCompany._id,
              position,
              department: 'Arshith Boot Camp',
              assignedTo: defaultUser ? defaultUser._id : null,
              notes: `Student ID: ${s.id || ''} | Course: ${courseName} | Payment: ${paymentStatus}`,
              tags: ['CodeLekho', 'Arshith Boot Camp', courseName, paymentStatus],
              isActive: true
            }
          },
          { upsert: true }
        );
      } catch (cErr) {
        // Log silently
      }
    }

    isSyncing = false;
    return {
      success: true,
      totalInSupabase: studentMap.size,
      newStudentsSynced: newCount,
      updatedStudents: updatedCount
    };
  } catch (err) {
    isSyncing = false;
    console.error('[SupabaseSync] Error:', err);
    return { success: false, error: err.message };
  }
}

function initSupabasePoller() {
  console.log('[SupabaseSync] Live automated synchronization engine initialized (polling every 60s)');
  // Initial sync on startup
  setTimeout(() => syncFromSupabase(), 3000);
  // Recurring check every 60 seconds
  setInterval(() => syncFromSupabase(), 60 * 1000);
}

module.exports = {
  syncFromSupabase,
  initSupabasePoller
};

