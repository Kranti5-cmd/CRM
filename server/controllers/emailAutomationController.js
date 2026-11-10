const EmailTemplate = require('../models/EmailTemplate');
const EmailWorkflow = require('../models/EmailWorkflow');
const EmailCampaign = require('../models/EmailCampaign');
const EmailLog = require('../models/EmailLog');
const EmailSubscriber = require('../models/EmailSubscriber');
const EmailExecution = require('../models/EmailExecution');
const Lead = require('../models/Lead');
const brevoService = require('../services/brevoService');
const { emitAutomationEvent, processExecution } = require('../services/automationEngine');

/**
 * Replace dynamic template variables with real recipient/lead data
 */
function renderTemplateVariables(templateContent, data = {}) {
  let rendered = templateContent || '';
  const map = {
    'student_name': data.name || data.fullName || 'Student',
    'student_email': data.email || '',
    'course_name': data.courseName || 'Python Programming',
    'registration_date': data.registrationDate
      ? new Date(data.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    'payment_status': data.paymentStatus || 'Confirmed',
    'course_start_date': data.courseStartDate || 'Upcoming Monday at 10:00 AM IST',
  };

  for (const [key, val] of Object.entries(map)) {
    const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    rendered = rendered.replace(reg, val);
  }
  return rendered;
}

// ==========================================
// 1. DASHBOARD STATS & ANALYTICS
// ==========================================
exports.getDashboardStats = async (req, res) => {
  try {
    const totalSent = await EmailLog.countDocuments({ status: { $ne: 'Pending' } });
    const totalDelivered = await EmailLog.countDocuments({ status: { $in: ['Delivered', 'Opened', 'Clicked'] } });
    const totalOpened = await EmailLog.countDocuments({ status: { $in: ['Opened', 'Clicked'] } });
    const totalClicked = await EmailLog.countDocuments({ status: 'Clicked' });
    const totalFailed = await EmailLog.countDocuments({ status: { $in: ['Failed', 'Bounced'] } });
    const totalPending = await EmailLog.countDocuments({ status: 'Pending' });

    const activeAutomations = await EmailWorkflow.countDocuments({ isActive: true });
    const totalWorkflows = await EmailWorkflow.countDocuments();
    const totalCampaigns = await EmailCampaign.countDocuments();
    const totalSubscribers = await EmailSubscriber.countDocuments({ isUnsubscribed: false });

    const openRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '0.0';
    const clickRate = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(1) : '0.0';
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '100.0';

    // Daily email activity trend (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyLogs = await EmailLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $in: ['$status', ['Delivered', 'Opened', 'Clicked']] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $in: ['$status', ['Failed', 'Bounced']] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing dates in 7-day range
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyLogs.find(l => l._id === dateStr);
      dailyActivity.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: dateStr,
        sent: match ? match.sent : 0,
        delivered: match ? match.delivered : 0,
        failed: match ? match.failed : 0
      });
    }

    // Campaign performance overview
    const campaignList = await EmailCampaign.find()
      .populate('template', 'name subject')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        summary: {
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalFailed,
          totalPending,
          deliveryRate: Number(deliveryRate),
          openRate: Number(openRate),
          clickRate: Number(clickRate),
          activeAutomations,
          totalWorkflows,
          totalCampaigns,
          totalSubscribers
        },
        dailyActivity,
        recentCampaigns: campaignList
      }
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. AUTOMATION WORKFLOWS
// ==========================================
exports.getWorkflows = async (req, res) => {
  try {
    const workflows = await EmailWorkflow.find()
      .populate('template', 'name subject category')
      .sort({ createdAt: 1 });
    res.json({ success: true, count: workflows.length, data: workflows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, triggerEvent, conditions, delayHours, template, segment, isActive } = req.body;
    if (!name || !triggerEvent || !template) {
      return res.status(400).json({ success: false, message: 'Name, triggerEvent, and template are required' });
    }

    const workflow = await EmailWorkflow.create({
      name,
      description,
      triggerEvent,
      conditions: conditions || {},
      delayHours: delayHours || 0,
      template,
      segment: segment || 'Arshith Boot Camp Students',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user ? req.user._id : undefined
    });

    const populated = await EmailWorkflow.findById(workflow._id).populate('template', 'name subject category');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateWorkflow = async (req, res) => {
  try {
    const workflow = await EmailWorkflow.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('template', 'name subject category');

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.toggleWorkflow = async (req, res) => {
  try {
    const workflow = await EmailWorkflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }
    workflow.isActive = !workflow.isActive;
    await workflow.save();
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await EmailWorkflow.findByIdAndDelete(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }
    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Trigger workflow for a single recipient or lead (with idempotency protection)
 */
exports.triggerWorkflowForRecipient = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { email, leadId } = req.body;

    const workflow = await EmailWorkflow.findById(workflowId).populate('template');
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    let targetEmail = email;
    let targetName = 'Student';
    let leadDoc = null;

    if (leadId) {
      leadDoc = await Lead.findById(leadId);
      if (leadDoc) {
        targetEmail = leadDoc.email;
        targetName = leadDoc.fullName;
      }
    } else if (email) {
      leadDoc = await Lead.findOne({ email: email.toLowerCase().trim() });
      if (leadDoc) targetName = leadDoc.fullName;
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email or leadId is required' });
    }

    // Check Consent / Unsubscribe
    const subscriber = await EmailSubscriber.findOne({ email: targetEmail.toLowerCase().trim() });
    if (subscriber && subscriber.isUnsubscribed) {
      return res.status(400).json({
        success: false,
        message: `Recipient ${targetEmail} has unsubscribed from email communications.`
      });
    }

    // Duplicate Send Protection (Idempotency Key)
    const idempotencyKey = `wf_${workflow._id}_${targetEmail.toLowerCase().trim()}`;
    const existingLog = await EmailLog.findOne({ idempotencyKey });
    if (existingLog && existingLog.status !== 'Failed') {
      return res.status(200).json({
        success: true,
        message: `Email already sent to ${targetEmail} for this workflow (Idempotency check passed).`,
        data: existingLog
      });
    }

    // Render Template
    const template = workflow.template;
    const renderData = {
      name: targetName,
      fullName: targetName,
      email: targetEmail,
      courseName: leadDoc ? leadDoc.courseName : 'Python Programming',
      registrationDate: leadDoc ? leadDoc.registrationDate : new Date(),
      paymentStatus: leadDoc ? leadDoc.paymentStatus : 'Confirmed',
    };

    const finalSubject = renderTemplateVariables(template.subject, renderData);
    const finalHtml = renderTemplateVariables(template.htmlContent || template.htmlBody || '', renderData);

    // Call Brevo Service
    const brevoRes = await brevoService.sendRequest('/transactional/send', {
      to: targetEmail,
      toName: targetName,
      subject: finalSubject,
      html: finalHtml,
      tags: ['bootcamp', workflow.triggerEvent]
    });

    const isDelivered = brevoRes.success;
    const providerMessageId = brevoRes.data && brevoRes.data.messageId ? brevoRes.data.messageId : `sim_${Date.now()}`;

    // Create Email Log
    const emailLog = await EmailLog.create({
      recipientEmail: targetEmail.toLowerCase().trim(),
      recipientName: targetName,
      subject: finalSubject,
      workflow: workflow._id,
      template: template._id,
      lead: leadDoc ? leadDoc._id : undefined,
      status: isDelivered ? 'Delivered' : (brevoRes.error ? 'Sent' : 'Delivered'),
      providerMessageId,
      errorMessage: brevoRes.error || '',
      idempotencyKey,
      deliveredAt: new Date(),
      events: [
        {
          event: 'queued',
          timestamp: new Date(),
          details: 'Dispatched through ArshithBrevo engine'
        },
        {
          event: isDelivered ? 'delivered' : 'sent',
          timestamp: new Date(),
          details: isDelivered ? 'Confirmed delivery by Brevo' : (brevoRes.error || 'Sent via Brevo engine')
        }
      ]
    });

    // Record in EmailExecution transactional log
    await EmailExecution.create({
      workflow: workflow._id,
      triggerEvent: workflow.triggerEvent,
      lead: leadDoc ? leadDoc._id : undefined,
      recipientEmail: targetEmail.toLowerCase().trim(),
      recipientName: targetName,
      status: isDelivered ? 'Delivered' : 'Sent',
      idempotencyKey,
      attemptCount: 1,
      providerMessageId,
      executedAt: new Date(),
      metadata: renderData
    }).catch(() => {});

    // Update workflow stats
    workflow.stats.sent += 1;
    workflow.stats.delivered += 1;
    workflow.lastTriggeredAt = new Date();
    await workflow.save();

    res.json({
      success: true,
      message: `Workflow "${workflow.name}" triggered successfully for ${targetEmail}`,
      log: emailLog,
      brevoResponse: brevoRes
    });
  } catch (error) {
    console.error('triggerWorkflowForRecipient error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get detailed workflow view with configuration and execution history
 */
exports.getWorkflowDetails = async (req, res) => {
  try {
    const workflow = await EmailWorkflow.findById(req.params.id)
      .populate('template')
      .populate('createdBy', 'name email');

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const executions = await EmailExecution.find({ workflow: workflow._id })
      .populate('lead', 'fullName email courseName paymentStatus')
      .sort({ createdAt: -1 })
      .limit(50);

    const recentLogs = await EmailLog.find({ workflow: workflow._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        workflow,
        executions,
        recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get paginated execution history for a specific workflow
 */
exports.getWorkflowExecutions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { workflow: req.params.id };
    if (status && status !== 'All') {
      filter.status = status;
    }

    const total = await EmailExecution.countDocuments(filter);
    const executions = await EmailExecution.find(filter)
      .populate('lead', 'fullName email courseName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: executions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Emit an event through the central automation engine
 */
exports.triggerLifecycleEvent = async (req, res) => {
  try {
    const { triggerEvent, email, fullName, leadId, metadata } = req.body;
    if (!triggerEvent || !email) {
      return res.status(400).json({ success: false, message: 'triggerEvent and email are required' });
    }

    let lead = null;
    if (leadId) lead = await Lead.findById(leadId);
    else lead = await Lead.findOne({ email: email.toLowerCase().trim() });

    const result = await emitAutomationEvent(triggerEvent, {
      lead,
      email,
      fullName: fullName || (lead ? lead.fullName : 'Student'),
      metadata: metadata || {}
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('triggerLifecycleEvent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. EMAIL TEMPLATES
// ==========================================
exports.getTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: 1 });
    res.json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, subject, htmlBody, textBody, category, variables } = req.body;
    if (!name || !subject || !htmlBody) {
      return res.status(400).json({ success: false, message: 'Name, subject, and htmlBody are required' });
    }

    const template = await EmailTemplate.create({
      name,
      subject,
      htmlBody,
      textBody: textBody || '',
      category: category || 'General',
      variables: variables || ['student_name', 'course_name', 'student_email'],
      createdBy: req.user ? req.user._id : undefined
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendTestEmail = async (req, res) => {
  try {
    const { templateId, toEmail } = req.body;
    if (!templateId || !toEmail) {
      return res.status(400).json({ success: false, message: 'templateId and toEmail are required' });
    }

    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const mockData = {
      name: 'Sample Student',
      fullName: 'Sample Student',
      email: toEmail,
      courseName: 'Python Programming',
      registrationDate: new Date(),
      paymentStatus: 'Paid',
      courseStartDate: 'Upcoming Monday at 10:00 AM IST'
    };

    const finalSubject = `[TEST] ${renderTemplateVariables(template.subject, mockData)}`;
    const finalHtml = renderTemplateVariables(template.htmlContent || template.htmlBody || '', mockData);

    const brevoRes = await brevoService.sendRequest('/transactional/send', {
      to: toEmail,
      toName: 'Test Recipient',
      subject: finalSubject,
      html: finalHtml,
      tags: ['bootcamp', 'test-template']
    });

    // Log the test email
    await EmailLog.create({
      recipientEmail: toEmail.toLowerCase().trim(),
      recipientName: 'Test Recipient',
      subject: finalSubject,
      template: template._id,
      status: brevoRes.success ? 'Delivered' : 'Sent',
      providerMessageId: brevoRes.data && brevoRes.data.messageId ? brevoRes.data.messageId : `test_${Date.now()}`,
      errorMessage: brevoRes.error || '',
      events: [{ event: 'test_send', timestamp: new Date(), details: 'Admin triggered test email' }]
    });

    res.json({
      success: true,
      message: `Test email sent to ${toEmail}`,
      brevoResponse: brevoRes
    });
  } catch (error) {
    console.error('sendTestEmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. CAMPAIGN MANAGEMENT
// ==========================================
exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .populate('template', 'name subject category')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const { name, subject, template, segment, scheduledAt } = req.body;
    if (!name || !subject || !template) {
      return res.status(400).json({ success: false, message: 'Name, subject, and template are required' });
    }

    const campaign = await EmailCampaign.create({
      name,
      subject,
      template,
      segment: segment || 'Arshith Boot Camp Students',
      status: scheduledAt ? 'Scheduled' : 'Draft',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdBy: req.user ? req.user._id : undefined
    });

    const populated = await EmailCampaign.findById(campaign._id).populate('template', 'name subject category');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.sendCampaignNow = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id).populate('template');
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Find subscribers matching the segment
    let filter = { isUnsubscribed: false };
    if (campaign.segment !== 'All Students') {
      filter.lists = campaign.segment;
    }

    const subscribers = await EmailSubscriber.find(filter).limit(200);

    campaign.status = 'In Progress';
    campaign.stats.totalRecipients = subscribers.length;
    await campaign.save();

    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (const sub of subscribers) {
      const idempotencyKey = `camp_${campaign._id}_${sub.email}`;
      const existing = await EmailLog.findOne({ idempotencyKey });
      if (existing) continue;

      const renderData = {
        name: sub.name || 'Student',
        fullName: sub.name || 'Student',
        email: sub.email,
        courseName: 'Arshith Boot Camp',
        registrationDate: sub.createdAt,
        paymentStatus: 'Active'
      };

      const finalSubj = renderTemplateVariables(campaign.subject, renderData);
      const finalHtml = renderTemplateVariables(campaign.template.htmlContent || campaign.template.htmlBody || '', renderData);

      const brevoRes = await brevoService.sendRequest('/transactional/send', {
        to: sub.email,
        toName: sub.name,
        subject: finalSubj,
        html: finalHtml,
        tags: ['bootcamp', 'campaign', campaign.name]
      });

      sentCount++;
      if (brevoRes.success) deliveredCount++;
      else failedCount++;

      await EmailLog.create({
        recipientEmail: sub.email,
        recipientName: sub.name,
        subject: finalSubj,
        campaign: campaign._id,
        template: campaign.template._id,
        lead: sub.lead,
        status: brevoRes.success ? 'Delivered' : 'Sent',
        providerMessageId: brevoRes.data && brevoRes.data.messageId ? brevoRes.data.messageId : `camp_${Date.now()}_${sentCount}`,
        idempotencyKey,
        deliveredAt: new Date(),
        events: [{ event: 'campaign_send', timestamp: new Date(), details: `Sent campaign: ${campaign.name}` }]
      });
    }

    campaign.status = 'Sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = sentCount;
    campaign.stats.delivered = deliveredCount;
    campaign.stats.failed = failedCount;
    await campaign.save();

    res.json({
      success: true,
      message: `Campaign sent successfully to ${sentCount} recipients.`,
      stats: campaign.stats
    });
  } catch (error) {
    console.error('sendCampaignNow error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. CONTACT / SUBSCRIBER MANAGEMENT
// ==========================================
exports.getSubscribers = async (req, res) => {
  try {
    const { list, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (list && list !== 'All') {
      filter.lists = list;
    }

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await EmailSubscriber.countDocuments(filter);
    const subscribers = await EmailSubscriber.find(filter)
      .populate('lead', 'courseName leadStatus paymentStatus registrationDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get counts per list
    const lists = [
      'Arshith Boot Camp Students',
      'New Registrations',
      'Interested Leads',
      'Converted Students',
      'Pending Payments',
      'Course Completed Students',
      'Marketing Subscribers'
    ];

    const listCounts = {};
    for (const l of lists) {
      listCounts[l] = await EmailSubscriber.countDocuments({ lists: l });
    }
    listCounts['All'] = await EmailSubscriber.countDocuments();

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      listCounts,
      data: subscribers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleSubscriberConsent = async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    subscriber.isUnsubscribed = !subscriber.isUnsubscribed;
    if (subscriber.isUnsubscribed) {
      subscriber.unsubscribedAt = new Date();
      subscriber.unsubscribeReason = req.body.reason || 'Admin marked as unsubscribed';
    } else {
      subscriber.unsubscribedAt = undefined;
      subscriber.unsubscribeReason = '';
      subscriber.hasConsent = true;
    }

    await subscriber.save();
    res.json({ success: true, data: subscriber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. DELIVERY LOGS & REPORTS
// ==========================================
exports.getEmailLogs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { recipientEmail: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await EmailLog.countDocuments(filter);
    const logs = await EmailLog.find(filter)
      .populate('workflow', 'name triggerEvent')
      .populate('campaign', 'name')
      .populate('template', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDailyAutomationReport = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sentToday = await EmailLog.countDocuments({ createdAt: { $gte: today } });
    const deliveredToday = await EmailLog.countDocuments({
      createdAt: { $gte: today },
      status: { $in: ['Delivered', 'Opened', 'Clicked'] }
    });
    const failedToday = await EmailLog.countDocuments({
      createdAt: { $gte: today },
      status: { $in: ['Failed', 'Bounced'] }
    });

    const newRegistrationsToday = await Lead.countDocuments({
      leadSource: 'Arshith Boot Camp',
      createdAt: { $gte: today }
    });

    const pendingFollowUps = await Lead.countDocuments({
      leadSource: 'Arshith Boot Camp',
      leadStatus: { $in: ['New', 'Contacted'] }
    });

    res.json({
      success: true,
      reportDate: new Date().toISOString(),
      reportTarget: process.env.SRINU_REPORT_EMAIL || 'arshithgroup141@gmail.com',
      scheduledTime: process.env.SRINU_REPORT_TIME || '09:30',
      data: {
        sentToday,
        deliveredToday,
        failedToday,
        newRegistrationsToday,
        pendingFollowUps,
        deliveryRate: sentToday > 0 ? ((deliveredToday / sentToday) * 100).toFixed(1) + '%' : '100%'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportReportCSV = async (req, res) => {
  try {
    const logs = await EmailLog.find()
      .populate('workflow', 'name')
      .populate('campaign', 'name')
      .sort({ createdAt: -1 })
      .limit(500);

    let csv = 'Recipient Email,Recipient Name,Subject,Type,Status,Provider Message ID,Sent At,Delivered At\n';
    logs.forEach(log => {
      const type = log.workflow ? `Workflow: ${log.workflow.name}` : (log.campaign ? `Campaign: ${log.campaign.name}` : 'Transactional');
      const row = [
        `"${log.recipientEmail}"`,
        `"${log.recipientName || ''}"`,
        `"${(log.subject || '').replace(/"/g, '""')}"`,
        `"${type}"`,
        `"${log.status}"`,
        `"${log.providerMessageId || ''}"`,
        `"${log.sentAt ? log.sentAt.toISOString() : ''}"`,
        `"${log.deliveredAt ? log.deliveredAt.toISOString() : ''}"`
      ];
      csv += row.join(',') + '\n';
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`email-automation-report-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. BREVO WEBHOOK RECEIVER
// ==========================================
exports.handleBrevoWebhook = async (req, res) => {
  try {
    const { event, email, message_id, messageId } = req.body;
    const msgId = message_id || messageId;

    if (!email && !msgId) {
      return res.status(200).json({ received: true, ignored: true });
    }

    const query = msgId ? { providerMessageId: msgId } : { recipientEmail: email.toLowerCase().trim() };
    const log = await EmailLog.findOne(query).sort({ createdAt: -1 });

    if (log) {
      const evName = (event || 'unknown').toLowerCase();
      if (['delivered', 'opened', 'click', 'clicked', 'hard_bounce', 'soft_bounce', 'unsubscribe'].includes(evName)) {
        if (evName === 'delivered') {
          log.status = 'Delivered';
          log.deliveredAt = new Date();
        } else if (evName === 'opened') {
          log.status = 'Opened';
          log.openedAt = new Date();
        } else if (evName === 'click' || evName === 'clicked') {
          log.status = 'Clicked';
          log.clickedAt = new Date();
        } else if (evName.includes('bounce')) {
          log.status = 'Bounced';
        } else if (evName === 'unsubscribe') {
          log.status = 'Unsubscribed';
          await EmailSubscriber.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { isUnsubscribed: true, unsubscribedAt: new Date(), unsubscribeReason: 'User clicked unsubscribe in Brevo' }
          );
        }

        log.events.push({
          event: evName,
          timestamp: new Date(),
          details: JSON.stringify(req.body)
        });
        await log.save();
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Brevo webhook error:', error);
    res.status(200).json({ success: false, error: error.message });
  }
};

