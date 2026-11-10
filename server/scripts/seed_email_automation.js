const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const EmailTemplate = require('../models/EmailTemplate');
const EmailWorkflow = require('../models/EmailWorkflow');
const EmailCampaign = require('../models/EmailCampaign');
const EmailLog = require('../models/EmailLog');
const EmailSubscriber = require('../models/EmailSubscriber');
const Lead = require('../models/Lead');
const User = require('../models/User');

const defaultTemplates = [
  {
    name: 'New Student Welcome Email',
    subject: 'Welcome to Arshith Boot Camp, {{student_name}}! 🚀',
    category: 'Student Onboarding',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Arshith Boot Camp</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#7CC283">Learn Today, Build Tomorrow</p>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <h2 style="margin:0 0 16px;color:#013A2B;font-size:19px">Welcome aboard, {{student_name}}!</h2>
          <p>We are thrilled to welcome you to <strong>{{course_name}}</strong>. Your registration on {{registration_date}} has been confirmed.</p>
          <div style="background:#FFF;border-left:4px solid #013A2B;border-radius:8px;padding:16px 20px;margin:20px 0">
            <p style="margin:0 0 6px"><strong>Student Email:</strong> {{student_email}}</p>
            <p style="margin:0 0 6px"><strong>Course Track:</strong> {{course_name}}</p>
            <p style="margin:0"><strong>Payment Status:</strong> {{payment_status}}</p>
          </div>
          <p>You can access your modules, interactive coding environments, and capstone assignments at <a href="https://arshithbootcamp.com" style="color:#013A2B;font-weight:700">arshithbootcamp.com</a>.</p>
        </div>
      </div>
    `,
    bodyText: 'Welcome aboard {{student_name}}! You are enrolled in {{course_name}}. Access your portal at https://arshithbootcamp.com'
  },
  {
    name: 'Registration Confirmation',
    subject: 'Registration Confirmed: {{course_name}}',
    category: 'Student Onboarding',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Registration Confirmed</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>Your enrollment in <strong>{{course_name}}</strong> is officially recorded in the CRM system on {{registration_date}}.</p>
          <p>Please ensure your development environment is ready before {{course_start_date}}.</p>
        </div>
      </div>
    `,
    bodyText: 'Hi {{student_name}}, your registration for {{course_name}} is confirmed.'
  },
  {
    name: 'Course Information Email',
    subject: 'Curriculum & Schedule for {{course_name}}',
    category: 'Course Notification',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">{{course_name}} — Curriculum Overview</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>Here is your comprehensive syllabus breakdown for <strong>{{course_name}}</strong>.</p>
          <ul>
            <li>Core language & architecture mastery</li>
            <li>Database modeling & query optimization</li>
            <li>Production-ready REST APIs & front-end integration</li>
            <li>AI-proctored certification assessment</li>
          </ul>
        </div>
      </div>
    `,
    bodyText: 'Here is your syllabus for {{course_name}}.'
  },
  {
    name: 'Payment Pending Reminder',
    subject: 'Action Required: Complete your enrollment in {{course_name}}',
    category: 'Billing & Payment',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Pending Course Payment</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>We noticed your payment status for <strong>{{course_name}}</strong> is currently <span style="color:#C62828;font-weight:700">{{payment_status}}</span>.</p>
          <p>Please complete your payment securely via Cashfree to unlock full module access.</p>
          <p><a href="https://arshithbootcamp.com" style="display:inline-block;background:#013A2B;color:#FFF;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700">Pay Now</a></p>
        </div>
      </div>
    `,
    bodyText: 'Payment pending for {{course_name}}. Status: {{payment_status}}.'
  },
  {
    name: 'Payment Confirmation',
    subject: 'Payment Successful: Receipt for {{course_name}}',
    category: 'Billing & Payment',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Payment Receipt & Confirmation</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>Thank you! We received your payment for <strong>{{course_name}}</strong>. Your status is now <span style="color:#2E7D32;font-weight:700">PAID & VERIFIED</span>.</p>
        </div>
      </div>
    `,
    bodyText: 'Payment received for {{course_name}}. Thank you!'
  },
  {
    name: 'Course Starting Reminder',
    subject: 'Reminder: {{course_name}} starts on {{course_start_date}}',
    category: 'Course Notification',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Batch Kickoff Alert</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>Get ready! Your batch for <strong>{{course_name}}</strong> starts on <strong>{{course_start_date}}</strong>.</p>
        </div>
      </div>
    `,
    bodyText: '{{course_name}} begins on {{course_start_date}}.'
  },
  {
    name: 'Follow-up Reminder',
    subject: 'Following up on your tech counseling session',
    category: 'Student Engagement',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Academic Counseling Follow-Up</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>Following up on your interest in <strong>{{course_name}}</strong>. Our counselor team is available for any questions regarding curriculum or project requirements.</p>
        </div>
      </div>
    `,
    bodyText: 'Following up on {{course_name}}.'
  },
  {
    name: 'Student Re-engagement',
    subject: 'We miss you at Arshith Boot Camp! Resume {{course_name}}',
    category: 'Student Engagement',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Continue Your Learning</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>It has been a few days since your last session in <strong>{{course_name}}</strong>. Your progress is saved and waiting for you!</p>
          <p><a href="https://arshithbootcamp.com" style="display:inline-block;background:#013A2B;color:#FFF;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:700">Resume Course</a></p>
        </div>
      </div>
    `,
    bodyText: 'Resume {{course_name}} at https://arshithbootcamp.com'
  },
  {
    name: 'Course Completion Email',
    subject: 'Congratulations on completing {{course_name}}! 🎓',
    category: 'Course Notification',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Course Completed!</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Congratulations <strong>{{student_name}}</strong>!</p>
          <p>You have successfully completed <strong>{{course_name}}</strong>. Your verifiable certificate with QR code is ready in your student portal.</p>
        </div>
      </div>
    `,
    bodyText: 'Congratulations on completing {{course_name}}!'
  },
  {
    name: 'Student Feedback Request',
    subject: 'How was your experience with {{course_name}}?',
    category: 'Feedback',
    htmlContent: `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
        <div style="background:#013A2B;padding:26px 30px;color:#FBF8F1">
          <h1 style="margin:0;font-size:22px">Your Feedback Matters</h1>
        </div>
        <div style="padding:32px 30px;color:#302B25;line-height:1.7">
          <p>Hi <strong>{{student_name}}</strong>,</p>
          <p>We would love to hear your feedback on <strong>{{course_name}}</strong> to help us improve our learning experience.</p>
        </div>
      </div>
    `,
    bodyText: 'Please share your feedback for {{course_name}}.'
  }
];

const workflowConfigs = [
  { name: '1. New Student Welcome Flow', triggerEvent: 'student_registered', templateName: 'New Student Welcome Email', segment: 'New Registrations', delayHours: 0 },
  { name: '2. Registration Confirmation Flow', triggerEvent: 'registration_confirmed', templateName: 'Registration Confirmation', segment: 'Converted Students', delayHours: 0 },
  { name: '3. Course Information Flow', triggerEvent: 'course_enrolled', templateName: 'Course Information Email', segment: 'Arshith Boot Camp Students', delayHours: 24 },
  { name: '4. Payment Pending Reminder Flow', triggerEvent: 'payment_pending', templateName: 'Payment Pending Reminder', segment: 'Pending Payments', delayHours: 48 },
  { name: '5. Payment Confirmation Flow', triggerEvent: 'payment_completed', templateName: 'Payment Confirmation', segment: 'Converted Students', delayHours: 0 },
  { name: '6. Course Starting Reminder Flow', triggerEvent: 'course_starting_soon', templateName: 'Course Starting Reminder', segment: 'Arshith Boot Camp Students', delayHours: 12 },
  { name: '7. Counselor Follow-up Flow', triggerEvent: 'counselor_followup_needed', templateName: 'Follow-up Reminder', segment: 'Interested Leads', delayHours: 24 },
  { name: '8. Student Re-engagement Flow', triggerEvent: 'student_inactive_7d', templateName: 'Student Re-engagement', segment: 'Arshith Boot Camp Students', delayHours: 168 },
  { name: '9. Course Completion & Certificate Flow', triggerEvent: 'course_completed', templateName: 'Course Completion Email', segment: 'Course Completed Students', delayHours: 0 },
  { name: '10. Student Feedback Request Flow', triggerEvent: 'feedback_request', templateName: 'Student Feedback Request', segment: 'Course Completed Students', delayHours: 72 }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas for email automation seed...');

  const admin = await User.findOne({ role: { $in: ['Admin', 'Manager'] } });

  // 1. Seed Templates
  const templateMap = {};
  for (const t of defaultTemplates) {
    let existing = await EmailTemplate.findOne({ name: t.name });
    if (!existing) {
      existing = await EmailTemplate.create({ ...t, createdBy: admin?._id });
      console.log('Created template:', t.name);
    }
    templateMap[t.name] = existing._id;
  }

  // 2. Seed Workflows
  for (const w of workflowConfigs) {
    const existing = await EmailWorkflow.findOne({ name: w.name });
    if (!existing && templateMap[w.templateName]) {
      await EmailWorkflow.create({
        name: w.name,
        description: `Automated flow for ${w.triggerEvent}`,
        triggerEvent: w.triggerEvent,
        template: templateMap[w.templateName],
        segment: w.segment,
        delayHours: w.delayHours,
        isActive: true,
        createdBy: admin?._id,
        stats: { sent: 117, delivered: 114, opened: 89, clicked: 42, failed: 3 }
      });
      console.log('Created workflow:', w.name);
    }
  }

  // 3. Sync all Boot Camp leads into EmailSubscriber
  const bootcampLeads = await Lead.find({ leadSource: 'Arshith Boot Camp' });
  console.log(`Syncing ${bootcampLeads.length} leads into EmailSubscriber contacts...`);

  for (const lead of bootcampLeads) {
    const lists = ['Arshith Boot Camp Students'];
    if (lead.leadStatus === 'Converted') lists.push('Converted Students');
    if (lead.leadStatus === 'New') lists.push('New Registrations');
    if (lead.paymentStatus === 'Pending') lists.push('Pending Payments');
    lists.push('Marketing Subscribers');

    await EmailSubscriber.findOneAndUpdate(
      { email: lead.email },
      {
        email: lead.email,
        name: lead.fullName,
        phone: lead.phone,
        lead: lead._id,
        lists,
        hasConsent: true,
        isUnsubscribed: false,
      },
      { upsert: true, new: true }
    );
  }

  // 4. Seed sample Campaign
  let campaign = await EmailCampaign.findOne({ name: 'November Batch Orientation Campaign' });
  if (!campaign) {
    const welcomeTemplateId = templateMap['New Student Welcome Email'];
    await EmailCampaign.create({
      name: 'November Batch Orientation Campaign',
      subject: 'Special Orientation Session Announcement',
      template: welcomeTemplateId,
      segment: 'Arshith Boot Camp Students',
      status: 'Sent',
      scheduledAt: new Date(Date.now() - 24 * 3600 * 1000),
      sentAt: new Date(Date.now() - 24 * 3600 * 1000),
      stats: { totalRecipients: 117, sent: 117, delivered: 114, opened: 82, clicked: 38, failed: 3 },
      createdBy: admin?._id
    });
    console.log('Created sample campaign');
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch(console.error);

