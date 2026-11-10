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

function emailShell({ badge, subtitle, greeting, bodyHtml, ctaText = 'Open Student Portal', ctaUrl = 'https://arshithbootcamp.com' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:24px 12px;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1E293B;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06),0 8px 10px -6px rgba(0,0,0,0.04);border:1px solid #E2E8F0;">
    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(135deg, #013A2B 0%, #064E3B 60%, #047857 100%);padding:36px 32px 32px;text-align:left;">
        <span style="display:inline-block;padding:4px 12px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.2);border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.8px;color:#A7F3D0;text-transform:uppercase;">✦ ${badge}</span>
        <h1 style="margin:12px 0 4px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.2;">CODE Lekho</h1>
        <p style="margin:0;font-size:13px;color:#D1FAE5;font-weight:500;letter-spacing:0.2px;">${subtitle}</p>
      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="padding:36px 32px;background:#FFFFFF;">
        ${greeting ? `<h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0F172A;letter-spacing:-0.3px;">${greeting}</h2>` : ''}
        ${bodyHtml}

        ${ctaText && ctaUrl ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 12px;">
          <tr>
            <td style="border-radius:10px;background:#013A2B;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 28px;background:#013A2B;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
                ${ctaText} &rarr;
              </a>
            </td>
          </tr>
        </table>` : ''}
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding:24px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#475569;">CODE Lekho • Empowering Next-Gen Developers</p>
        <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;">Arshith Group • Bengaluru, Karnataka • support@arshithgroup.com</p>
        <p style="margin:0;font-size:11px;color:#94A3B8;">You received this email because you are a registered learner at CODE Lekho.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const defaultTemplates = [
  {
    name: 'New Student Welcome Email',
    subject: 'Welcome to CODE Lekho, {{student_name}}! 🚀',
    category: 'Student Onboarding',
    htmlContent: emailShell({
      badge: 'OFFICIAL ADMISSION',
      subtitle: 'Learn Today, Build Tomorrow',
      greeting: 'Welcome {{student_name}}!',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          We are thrilled to welcome you to <strong>{{course_name}}</strong> at <strong>CODE Lekho</strong>! Your registration on {{registration_date}} has been confirmed and verified.
        </p>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #047857;border-radius:12px;padding:20px;margin:24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;font-weight:600;">Student Email:</td>
              <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:600;">{{student_email}}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Course Track:</td>
              <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:700;">{{course_name}}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Payment Status:</td>
              <td style="padding:6px 0;">
                <span style="display:inline-block;padding:2px 10px;background:#DEF7EC;color:#03543F;border-radius:12px;font-size:12px;font-weight:700;">{{payment_status}}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Learning Portal:</td>
              <td style="padding:6px 0;font-size:14px;color:#047857;font-weight:700;">
                <a href="https://arshithbootcamp.com" target="_blank" style="color:#047857;text-decoration:none;">CodeLekho Portal &rarr;</a>
              </td>
            </tr>
          </table>
        </div>

        <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.7;">
          You can access your curriculum modules, interactive coding environments, and capstone project assignments directly on the portal.
        </p>
      `,
      ctaText: 'Access Student Portal',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Welcome {{student_name}}! You are enrolled in {{course_name}}. Access your portal at https://arshithbootcamp.com'
  },
  {
    name: 'Registration Confirmation',
    subject: 'Registration Confirmed: {{course_name}} | CODE Lekho',
    category: 'Student Onboarding',
    htmlContent: emailShell({
      badge: 'ENROLLMENT CONFIRMED',
      subtitle: 'Official Registration Record',
      greeting: 'Welcome {{student_name}}!',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          Your enrollment in <strong>{{course_name}}</strong> is officially recorded in the <strong>CODE Lekho</strong> system on {{registration_date}}.
        </p>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #047857;border-radius:12px;padding:20px;margin:24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;font-weight:600;">Track Name:</td>
              <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:700;">{{course_name}}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Registration Date:</td>
              <td style="padding:6px 0;font-size:14px;color:#334155;font-weight:600;">{{registration_date}}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Orientation:</td>
              <td style="padding:6px 0;font-size:14px;color:#047857;font-weight:700;">{{course_start_date}}</td>
            </tr>
          </table>
        </div>

        <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.7;">
          Please ensure your laptop and code editor environment are ready before {{course_start_date}}.
        </p>
      `,
      ctaText: 'Open Course Overview',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Hi {{student_name}}, your registration for {{course_name}} at CODE Lekho is confirmed.'
  },
  {
    name: 'Course Information Email',
    subject: 'Curriculum & Schedule for {{course_name}} | CODE Lekho',
    category: 'Course Notification',
    htmlContent: emailShell({
      badge: 'CURRICULUM ROADMAP',
      subtitle: 'Technical Syllabus Overview',
      greeting: 'Hi {{student_name}},',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          Here is your comprehensive syllabus roadmap for <strong>{{course_name}}</strong> at CODE Lekho.
        </p>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:20px 0;">
          <h3 style="margin:0 0 12px;font-size:14px;color:#013A2B;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Program Structure:</h3>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:1.8;">
            <li>Core programming concepts & architectural design principles</li>
            <li>Relational database modeling, SQL queries & indexing</li>
            <li>Production RESTful APIs & modern frontend integration</li>
            <li>AI-proctored certification assessment & verified digital badge</li>
          </ul>
        </div>
      `,
      ctaText: 'Download Syllabus',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Here is your syllabus for {{course_name}} at CODE Lekho.'
  },
  {
    name: 'Payment Pending Reminder',
    subject: 'Action Required: Complete your enrollment in {{course_name}} | CODE Lekho',
    category: 'Billing & Payment',
    htmlContent: emailShell({
      badge: 'FEE PAYMENT PENDING',
      subtitle: 'Specialization Track Enrollment',
      greeting: 'Hi {{student_name}},',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          We noticed your payment status for <strong>{{course_name}}</strong> is currently <span style="display:inline-block;padding:2px 8px;background:#FEE2E2;color:#991B1B;border-radius:8px;font-size:12px;font-weight:700;">{{payment_status}}</span>.
        </p>

        <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.7;">
          Please complete your enrollment fee (₹99) securely via Cashfree to instantly activate your live workshops, mentor doubts sessions, and certificate eligibility.
        </p>
      `,
      ctaText: 'Complete Payment Securely',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Payment pending for {{course_name}} at CODE Lekho. Status: {{payment_status}}.'
  },
  {
    name: 'Payment Confirmation',
    subject: 'Payment Successful: Receipt for {{course_name}} | CODE Lekho',
    category: 'Billing & Payment',
    htmlContent: emailShell({
      badge: 'FEE RECEIPT',
      subtitle: 'Transaction Verified',
      greeting: 'Welcome {{student_name}}!',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          Thank you! We have successfully received your payment for <strong>{{course_name}}</strong>. Your student account is now <span style="display:inline-block;padding:2px 10px;background:#DEF7EC;color:#03543F;border-radius:12px;font-size:12px;font-weight:700;">✓ PAID & VERIFIED</span>.
        </p>

        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #047857;border-radius:12px;padding:20px;margin:24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;font-weight:600;">Transaction ID:</td>
              <td style="padding:6px 0;font-size:13px;font-family:monospace;color:#0F172A;font-weight:700;">{{transaction_id}}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Amount Paid:</td>
              <td style="padding:6px 0;font-size:14px;color:#047857;font-weight:700;">{{amount}}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Course:</td>
              <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:600;">{{course_name}}</td>
            </tr>
          </table>
        </div>
      `,
      ctaText: 'Access Student Classroom',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Payment received for {{course_name}} at CODE Lekho. Thank you!'
  },
  {
    name: 'Course Starting Reminder',
    subject: 'Reminder: {{course_name}} starts on {{course_start_date}} | CODE Lekho',
    category: 'Course Notification',
    htmlContent: emailShell({
      badge: 'BATCH KICKOFF',
      subtitle: 'Upcoming Live Session',
      greeting: 'Hi {{student_name}},',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          Get ready! Your batch for <strong>{{course_name}}</strong> kicks off on <strong>{{course_start_date}}</strong>.
        </p>

        <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:20px;margin:20px 0;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#065F46;">⏰ Kickoff Checklist:</p>
          <ul style="margin:0;padding-left:20px;font-size:13px;color:#047857;line-height:1.7;">
            <li>Log into your CODE Lekho dashboard 15 minutes before the session</li>
            <li>Verify your IDE and browser setup</li>
            <li>Have your notebooks ready for hands-on live code demos</li>
          </ul>
        </div>
      `,
      ctaText: 'Join Live Session',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: '{{course_name}} begins on {{course_start_date}} at CODE Lekho.'
  },
  {
    name: 'Follow-up Reminder',
    subject: 'Following up on your counseling session | CODE Lekho',
    category: 'Student Engagement',
    htmlContent: emailShell({
      badge: 'ACADEMIC COUNSELING',
      subtitle: 'Student Success Advisory',
      greeting: 'Hi {{student_name}},',
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
          Following up on your recent inquiry for <strong>{{course_name}}</strong>. Our counselor team is available to assist you with curriculum roadmap details, batch timings, and portfolio guidance.
        </p>
        <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">
          Feel free to reply directly to this email or schedule a quick guidance call with our mentors.
        </p>
      `,
      ctaText: 'Connect With Advisor',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Following up on {{course_name}} at CODE Lekho.'
  },
  {
    name: 'Student Re-engagement',
    subject: 'We miss you at CODE Lekho! Resume {{course_name}}',
    category: 'Student Engagement',
    htmlContent: emailShell({
      badge: 'CONTINUE LEARNING',
      subtitle: 'Resume Your Journey',
      greeting: 'Hi {{student_name}},',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          It has been a few days since your last session in <strong>{{course_name}}</strong>. Your progress and sandbox workspaces are saved and ready for you!
        </p>
      `,
      ctaText: 'Resume My Course',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Resume {{course_name}} at https://arshithbootcamp.com'
  },
  {
    name: 'Course Completion Email',
    subject: 'Congratulations on completing {{course_name}}! 🎓 | CODE Lekho',
    category: 'Course Notification',
    htmlContent: emailShell({
      badge: 'COURSE COMPLETED',
      subtitle: 'Certification Verified',
      greeting: 'Congratulations {{student_name}}! 🎉',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          You have successfully completed <strong>{{course_name}}</strong> at <strong>CODE Lekho</strong>! Your verifiable certificate with secure QR code validation is available for download on your student portal.
        </p>
      `,
      ctaText: 'View & Share Certificate',
      ctaUrl: 'https://arshithbootcamp.com'
    }),
    bodyText: 'Congratulations on completing {{course_name}} at CODE Lekho!'
  },
  {
    name: 'Student Feedback Request',
    subject: 'How was your experience with {{course_name}}? | CODE Lekho',
    category: 'Feedback',
    htmlContent: emailShell({
      badge: 'FEEDBACK & REVIEW',
      subtitle: 'Help Us Improve',
      greeting: 'Hi {{student_name}},',
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
          We would love to hear your feedback on <strong>{{course_name}}</strong>. Your thoughts help our mentors refine practical exercises and ensure an exceptional learning experience.
        </p>
      `,
      ctaText: 'Give Quick Feedback',
      ctaUrl: 'https://arshithbootcamp.com/feedback'
    }),
    bodyText: 'Please share your feedback for {{course_name}} at CODE Lekho.'
  }
];

const workflowConfigs = [
  { name: '1. New Student Welcome Flow', triggerEvent: 'student_registered', templateName: 'New Student Welcome Email', segment: 'New Registrations', delayHours: 0 },
  { name: '2. Registration Confirmation Flow', triggerEvent: 'registration_confirmed', templateName: 'Registration Confirmation', segment: 'Converted Students', delayHours: 0 },
  { name: '3. Course Information Flow', triggerEvent: 'course_enrolled', templateName: 'Course Information Email', segment: 'CODE Lekho Students', delayHours: 24 },
  { name: '4. Payment Pending Reminder Flow', triggerEvent: 'payment_pending', templateName: 'Payment Pending Reminder', segment: 'Pending Payments', delayHours: 48 },
  { name: '5. Payment Confirmation Flow', triggerEvent: 'payment_completed', templateName: 'Payment Confirmation', segment: 'Converted Students', delayHours: 0 },
  { name: '6. Course Starting Reminder Flow', triggerEvent: 'course_starting_soon', templateName: 'Course Starting Reminder', segment: 'CODE Lekho Students', delayHours: 12 },
  { name: '7. Counselor Follow-up Flow', triggerEvent: 'counselor_followup_needed', templateName: 'Follow-up Reminder', segment: 'Interested Leads', delayHours: 24 },
  { name: '8. Student Re-engagement Flow', triggerEvent: 'student_inactive_7d', templateName: 'Student Re-engagement', segment: 'CODE Lekho Students', delayHours: 168 },
  { name: '9. Course Completion & Certificate Flow', triggerEvent: 'course_completed', templateName: 'Course Completion Email', segment: 'Course Completed Students', delayHours: 0 },
  { name: '10. Student Feedback Request Flow', triggerEvent: 'feedback_request', templateName: 'Student Feedback Request', segment: 'Course Completed Students', delayHours: 72 }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas for email automation update...');

  const admin = await User.findOne({ role: { $in: ['Admin', 'Manager'] } });

  // 1. Update/Upsert All Templates
  const templateMap = {};
  for (const t of defaultTemplates) {
    const updated = await EmailTemplate.findOneAndUpdate(
      { name: t.name },
      { ...t, createdBy: admin?._id },
      { upsert: true, new: true }
    );
    console.log('Updated template:', t.name);
    templateMap[t.name] = updated._id;
  }

  // 2. Update Workflows
  for (const w of workflowConfigs) {
    if (templateMap[w.templateName]) {
      await EmailWorkflow.findOneAndUpdate(
        { name: w.name },
        {
          name: w.name,
          description: `Automated flow for ${w.triggerEvent}`,
          triggerEvent: w.triggerEvent,
          template: templateMap[w.templateName],
          segment: w.segment,
          delayHours: w.delayHours,
          isActive: true,
          createdBy: admin?._id
        },
        { upsert: true, new: true }
      );
      console.log('Updated workflow:', w.name);
    }
  }

  console.log('All email templates & workflows successfully updated to CODE Lekho format!');
  await mongoose.disconnect();
}

seed().catch(console.error);
