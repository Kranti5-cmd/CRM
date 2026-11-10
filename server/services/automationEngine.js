/**
 * Arshith Boot Camp Central Email Automation Engine
 * Event-driven, reliable transactional execution for 10 student lifecycle workflows.
 */
const EmailWorkflow = require('../models/EmailWorkflow');
const EmailTemplate = require('../models/EmailTemplate');
const EmailExecution = require('../models/EmailExecution');
const EmailLog = require('../models/EmailLog');
const EmailSubscriber = require('../models/EmailSubscriber');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const brevoService = require('./brevoService');

/**
 * Replace template dynamic variables with real student and course details
 */
function renderVariables(text, data = {}) {
  let rendered = text || '';
  const dateFormatted = data.registrationDate
    ? new Date(data.registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const map = {
    'student_name': data.name || data.fullName || 'Student',
    'student_email': data.email || '',
    'course_name': data.courseName || 'Python Programming',
    'registration_date': dateFormatted,
    'payment_status': data.paymentStatus || 'Confirmed',
    'course_start_date': data.courseStartDate || 'Upcoming Monday at 10:00 AM IST',
    'student_id': data.studentId || 'ARB-STU-001',
    'transaction_id': data.transactionId || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    'amount': data.amount || '₹4,999',
    'feedback_link': 'https://codelekho.com/feedback',
    'course_duration': data.courseDuration || '12 Weeks (Interactive Live Sessions)',
    'counseling_time': data.counselingTime || 'Today at 4:00 PM IST'
  };

  for (const [key, val] of Object.entries(map)) {
    const reg = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    rendered = rendered.replace(reg, String(val));
  }
  return rendered;
}

/**
 * Execute an individual queued or immediate automation job
 */
async function processExecution(executionId) {
  const execution = await EmailExecution.findById(executionId)
    .populate('workflow')
    .populate('lead');

  if (!execution) return { success: false, reason: 'Execution record not found' };
  if (['Delivered', 'Sent', 'Skipped_Consent', 'Skipped_Duplicate'].includes(execution.status)) {
    return { success: true, message: 'Execution already completed' };
  }

  const workflow = execution.workflow;
  if (!workflow || !workflow.isActive) {
    execution.status = 'Failed';
    execution.failureReason = 'Workflow was deleted or deactivated';
    await execution.save();
    return { success: false, reason: execution.failureReason };
  }

  // Retrieve Email Template
  const template = await EmailTemplate.findById(workflow.template);
  if (!template) {
    execution.status = 'Failed';
    execution.failureReason = 'Email template not found';
    await execution.save();
    return { success: false, reason: execution.failureReason };
  }

  const lead = execution.lead || {};
  const recipientEmail = execution.recipientEmail.toLowerCase().trim();
  const recipientName = execution.recipientName || lead.fullName || 'Student';

  // 1. Consent & Unsubscribe Verification (Strict rule for all marketing & re-engagement)
  const subscriber = await EmailSubscriber.findOne({ email: recipientEmail });
  if (subscriber) {
    if (subscriber.isUnsubscribed) {
      execution.status = 'Skipped_Consent';
      execution.failureReason = 'Student has unsubscribed from email communications';
      await execution.save();
      return { success: false, reason: execution.failureReason };
    }
    if (workflow.conditions?.requireConsent && !subscriber.hasConsent) {
      execution.status = 'Skipped_Consent';
      execution.failureReason = 'Marketing consent not granted';
      await execution.save();
      return { success: false, reason: execution.failureReason };
    }
  }

  // 2. Condition Verifications for Specific Workflows
  // Automation 4: Pending Payment Reminder -> Stop if already Paid or Cancelled
  if (workflow.triggerEvent === 'payment_pending') {
    if (lead.paymentStatus === 'Paid' || lead.registrationStatus === 'Dropped') {
      execution.status = 'Skipped_Duplicate';
      execution.failureReason = 'Student already paid or enrollment was dropped';
      await execution.save();
      return { success: true, message: execution.failureReason };
    }
  }

  // Automation 5: Payment Confirmation -> Must verify payment is actually Paid
  if (workflow.triggerEvent === 'payment_completed') {
    if (lead.paymentStatus && lead.paymentStatus !== 'Paid') {
      execution.status = 'Failed';
      execution.failureReason = 'Payment confirmation cannot be sent for unpaid/pending status';
      await execution.save();
      return { success: false, reason: execution.failureReason };
    }
  }

  // Automation 6: Course Starting Reminder -> Stop if enrollment was cancelled
  if (workflow.triggerEvent === 'course_starting_soon') {
    if (lead.registrationStatus === 'Dropped') {
      execution.status = 'Skipped_Duplicate';
      execution.failureReason = 'Enrollment was cancelled';
      await execution.save();
      return { success: true, message: execution.failureReason };
    }
  }

  // Automation 7: Follow-up Reminder -> Verify follow-up task is still pending
  if (workflow.triggerEvent === 'counselor_followup_needed' && execution.metadata?.taskId) {
    const task = await Task.findById(execution.metadata.taskId);
    if (!task || task.status === 'Completed' || task.status === 'Cancelled') {
      execution.status = 'Skipped_Duplicate';
      execution.failureReason = 'Follow-up task was already completed or cancelled';
      await execution.save();
      return { success: true, message: execution.failureReason };
    }
  }

  // Automation 9: Course Completion -> Must verify student actually completed
  if (workflow.triggerEvent === 'course_completed') {
    if (lead.registrationStatus && lead.registrationStatus !== 'Completed') {
      execution.status = 'Failed';
      execution.failureReason = 'Course completion email requires Completed status';
      await execution.save();
      return { success: false, reason: execution.failureReason };
    }
  }

  // 3. Render Subject and HTML with Context
  const contextData = {
    name: recipientName,
    fullName: recipientName,
    email: recipientEmail,
    courseName: lead.courseName || execution.metadata?.courseName || 'Python Programming',
    registrationDate: lead.registrationDate || new Date(),
    paymentStatus: lead.paymentStatus || execution.metadata?.paymentStatus || 'Confirmed',
    studentId: lead.studentId || execution.metadata?.studentId || 'ARB-STU-001',
    transactionId: execution.metadata?.transactionId || `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    amount: execution.metadata?.amount || (lead.value ? `₹${lead.value}` : '₹4,999'),
    courseStartDate: execution.metadata?.courseStartDate || 'Upcoming Monday at 10:00 AM IST',
    counselingTime: execution.metadata?.counselingTime || 'Today at 4:00 PM IST'
  };

  const finalSubject = renderVariables(template.subject, contextData);
  const finalHtml = renderVariables(template.htmlContent || template.htmlBody || '', contextData);

  execution.attemptCount += 1;
  execution.status = 'Processing';
  await execution.save();

  // 4. Send via Centralized ArshithBrevo API
  const brevoRes = await brevoService.sendRequest('/transactional/send', {
    to: recipientEmail,
    toName: recipientName,
    subject: finalSubject,
    html: finalHtml,
    tags: ['bootcamp', workflow.triggerEvent]
  });

  const isDelivered = brevoRes.success;
  const providerMessageId = brevoRes.data && brevoRes.data.messageId ? brevoRes.data.messageId : `sim_${Date.now()}`;

  // 5. Record EmailLog with Delivery Status and Idempotency Key
  const emailLog = await EmailLog.create({
    recipientEmail,
    recipientName,
    subject: finalSubject,
    workflow: workflow._id,
    template: template._id,
    lead: lead._id || undefined,
    status: isDelivered ? 'Delivered' : 'Sent',
    providerMessageId,
    errorMessage: brevoRes.error || '',
    idempotencyKey: execution.idempotencyKey,
    sentAt: new Date(),
    deliveredAt: new Date(),
    events: [
      {
        event: 'queued',
        timestamp: new Date(),
        details: 'Event triggered and passed verification checks'
      },
      {
        event: isDelivered ? 'delivered' : 'sent',
        timestamp: new Date(),
        details: isDelivered ? 'Confirmed delivery by ArshithBrevo' : (brevoRes.error || 'Dispatched via Brevo engine')
      }
    ]
  });

  // 6. Update Execution and Workflow Metrics
  execution.status = isDelivered ? 'Delivered' : 'Sent';
  execution.providerMessageId = providerMessageId;
  execution.executedAt = new Date();
  await execution.save();

  workflow.stats.sent += 1;
  workflow.stats.delivered += 1;
  workflow.lastTriggeredAt = new Date();
  await workflow.save();

  return {
    success: true,
    workflow: workflow.name,
    recipient: recipientEmail,
    logId: emailLog._id,
    providerMessageId
  };
}

/**
 * Primary Event Dispatcher: Emits an automation trigger across matching workflows
 */
async function emitAutomationEvent(triggerEvent, payload = {}) {
  const { lead, email, fullName, metadata = {}, uniqueKey } = payload;
  const recipientEmail = (email || (lead && lead.email) || '').toLowerCase().trim();
  const recipientName = fullName || (lead && lead.fullName) || 'Student';

  if (!recipientEmail) {
    return { success: false, message: 'Recipient email is required to trigger automation' };
  }

  // Find all active workflows for this trigger event
  const workflows = await EmailWorkflow.find({ triggerEvent, isActive: true });
  if (!workflows || workflows.length === 0) {
    return { success: true, message: `No active workflows found for trigger: ${triggerEvent}`, count: 0 };
  }

  const results = [];

  for (const wf of workflows) {
    try {
      // Create unique deterministic idempotency key for this event & workflow
      const keySuffix = uniqueKey || (metadata && metadata.suffix) || '';
      const idempotencyKey = `auto_${wf.triggerEvent}_${wf._id}_${recipientEmail}${keySuffix ? `_${keySuffix}` : ''}`;

      // Check if this execution already exists (Duplicate Protection)
      const existing = await EmailExecution.findOne({ idempotencyKey });
      if (existing) {
        results.push({
          workflowId: wf._id,
          workflowName: wf.name,
          status: 'Skipped_Duplicate',
          message: 'Duplicate event detected. Email already processed.'
        });
        continue;
      }

      // Check Consent & Unsubscribe upfront
      const subscriber = await EmailSubscriber.findOne({ email: recipientEmail });
      if (subscriber) {
        if (subscriber.isUnsubscribed) {
          results.push({
            workflowId: wf._id,
            workflowName: wf.name,
            status: 'Skipped_Consent',
            message: 'Student has unsubscribed from email communications'
          });
          continue;
        }
        if (wf.conditions?.requireConsent && !subscriber.hasConsent) {
          results.push({
            workflowId: wf._id,
            workflowName: wf.name,
            status: 'Skipped_Consent',
            message: 'Marketing consent not granted'
          });
          continue;
        }
      }

      // Check specific conditions upfront
      if (wf.triggerEvent === 'payment_pending' && lead && (lead.paymentStatus === 'Paid' || lead.registrationStatus === 'Dropped')) {
        results.push({
          workflowId: wf._id,
          workflowName: wf.name,
          status: 'Skipped_Duplicate',
          message: 'Student already paid or enrollment was dropped'
        });
        continue;
      }

      // Calculate scheduled time based on delayHours
      const delayMs = (wf.delayHours || 0) * 3600 * 1000;
      const scheduledFor = new Date(Date.now() + delayMs);
      const isImmediate = delayMs === 0 || payload.forceImmediate === true;

      // Create persistent execution record in database (Transactional Outbox)
      const execution = await EmailExecution.create({
        workflow: wf._id,
        triggerEvent,
        lead: lead ? lead._id : undefined,
        recipientEmail,
        recipientName,
        status: isImmediate ? 'Processing' : 'Queued',
        idempotencyKey,
        scheduledFor,
        metadata
      });

      if (isImmediate) {
        // Execute immediately
        const runResult = await processExecution(execution._id);
        results.push({
          workflowId: wf._id,
          workflowName: wf.name,
          status: runResult.success ? 'Success' : 'Failed',
          details: runResult
        });
      } else {
        // Scheduled for background runner
        wf.nextScheduledExecution = scheduledFor;
        await wf.save();

        results.push({
          workflowId: wf._id,
          workflowName: wf.name,
          status: 'Scheduled',
          scheduledFor
        });
      }
    } catch (err) {
      console.error(`Error processing workflow ${wf.name}:`, err);
      results.push({ workflowId: wf._id, workflowName: wf.name, status: 'Error', error: err.message });
    }
  }

  return { success: true, triggerEvent, results };
}

/**
 * Background Automation Poller: Processes queued jobs and schedules periodic checks
 */
async function runAutomationCycle() {
  try {
    const now = new Date();

    // 1. Process any pending/queued executions that have passed their scheduled time
    const pendingExecutions = await EmailExecution.find({
      status: 'Queued',
      scheduledFor: { $lte: now }
    }).limit(20);

    for (const exec of pendingExecutions) {
      await processExecution(exec._id);
    }

    // 2. Periodic Check: Pending Payment Reminders (Automation 4)
    // Find active leads whose paymentStatus is 'Pending' registered > 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const pendingPaymentLeads = await Lead.find({
      paymentStatus: 'Pending',
      registrationStatus: { $ne: 'Dropped' },
      createdAt: { $lte: oneDayAgo }
    }).limit(10);

    for (const pLead of pendingPaymentLeads) {
      const todayDateStr = now.toISOString().split('T')[0];
      await emitAutomationEvent('payment_pending', {
        lead: pLead,
        email: pLead.email,
        fullName: pLead.fullName,
        uniqueKey: `day_${todayDateStr}`
      });
    }

    // 3. Periodic Check: Inactive Students Re-engagement (Automation 8)
    // Find leads registered > 7 days ago with New or Contacted status
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const inactiveLeads = await Lead.find({
      leadStatus: { $in: ['New', 'Contacted'] },
      createdAt: { $lte: sevenDaysAgo }
    }).limit(10);

    for (const inactLead of inactiveLeads) {
      const weekBucket = `${now.getFullYear()}_w${Math.floor(now.getDate() / 7)}`;
      await emitAutomationEvent('student_inactive_7d', {
        lead: inactLead,
        email: inactLead.email,
        fullName: inactLead.fullName,
        uniqueKey: weekBucket
      });
    }

  } catch (err) {
    console.error('[AutomationEngine] Poller error:', err.message);
  }
}

let pollerInterval = null;

function initAutomationPoller() {
  if (pollerInterval) return;
  console.log('[AutomationEngine] Central event-driven email automation engine initialized (60s tick)');
  // Run on startup after 5 seconds
  setTimeout(() => runAutomationCycle(), 5000);
  // Recurring every 60 seconds
  pollerInterval = setInterval(() => runAutomationCycle(), 60 * 1000);
}

module.exports = {
  emitAutomationEvent,
  processExecution,
  runAutomationCycle,
  initAutomationPoller,
  renderVariables
};
