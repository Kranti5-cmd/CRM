/**
 * Centralized Brevo Email Integration Service for CODE Lekho
 * Integrates CRM with Brevo SMTP API / Direct Cloud Delivery.
 */
const http = require('http');
const https = require('https');

const getBaseUrl = () => (process.env.ARSHITH_EMAIL_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
const getApiKey = () => process.env.ARSHITH_EMAIL_KEY || '';

async function sendRequest(endpoint, payload) {
  const brevoApiKey = process.env.BREVO_API_KEY;

  // 1. Direct Brevo Cloud Delivery (Primary Live Gateway)
  if (brevoApiKey && brevoApiKey.startsWith('xkeysib-')) {
    return new Promise((resolve) => {
      try {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || 'krantishantveer@gmail.com';
        const senderName = process.env.BREVO_SENDER_NAME || 'CODE Lekho';

        const postData = JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: payload.to, name: payload.toName || 'Student' }],
          subject: payload.subject,
          htmlContent: payload.html || payload.htmlContent || '',
          tags: payload.tags || ['codelekho']
        });

        const req = https.request({
          hostname: 'api.brevo.com',
          port: 443,
          path: '/v3/smtp/email',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'api-key': brevoApiKey,
            'Accept': 'application/json'
          },
          timeout: 15000
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            let parsedBody;
            try {
              parsedBody = JSON.parse(body);
            } catch {
              parsedBody = { raw: body };
            }
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, status: res.statusCode, data: parsedBody });
            } else {
              resolve({ success: false, status: res.statusCode, error: parsedBody.message || parsedBody.error || body });
            }
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Connection to Brevo API timed out' });
        });

        req.on('error', (err) => {
          resolve({ success: false, error: `Brevo API error: ${err.message}` });
        });

        req.write(postData);
        req.end();
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  // 2. Local Centralized Brevo Microservice Gateway (Port 5001)
  return new Promise((resolve) => {
    try {
      const fullUrl = `${getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const parsed = new URL(fullUrl);
      const postData = JSON.stringify(payload);
      const isHttps = parsed.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request({
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + (parsed.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Arshith-Api-Key': getApiKey(),
          'Authorization': `Bearer ${getApiKey()}`
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let parsedBody;
          try {
            parsedBody = JSON.parse(body);
          } catch {
            parsedBody = { raw: body };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, status: res.statusCode, data: parsedBody });
          } else {
            resolve({ success: false, status: res.statusCode, error: parsedBody.message || parsedBody.error || body });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Connection to email microservice timed out' });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: `Email service offline: ${err.message}` });
      });

      req.write(postData);
      req.end();
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

/**
 * Modern, High-Conversion Responsive Email Shell for CODE Lekho
 */
function renderEmailShell({ badge = 'STUDENT ADMISSION', title = 'CODE Lekho', subtitle = 'Learn Today, Build Tomorrow', greeting, bodyHtml, ctaText = 'Open Student Portal', ctaUrl = 'https://codelekho.com' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1E293B;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.06),0 8px 10px -6px rgba(0,0,0,0.04);border:1px solid #E2E8F0;">
    <!-- HEADER -->
    <tr>
      <td style="background:linear-gradient(135deg, #013A2B 0%, #064E3B 60%, #047857 100%);padding:36px 32px 32px;text-align:left;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <span style="display:inline-block;padding:4px 12px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.2);border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.8px;color:#A7F3D0;text-transform:uppercase;">✦ ${badge}</span>
              <h1 style="margin:12px 0 4px;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#FFFFFF;line-height:1.2;">CODE Lekho</h1>
              <p style="margin:0;font-size:13px;color:#D1FAE5;font-weight:500;letter-spacing:0.2px;">${subtitle}</p>
            </td>
          </tr>
        </table>
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

/**
 * 7 Automated Brevo Email Workflows for CODE Lekho
 */

// 1. Student Registration Welcome Email (Greeting: "Welcome <Name>!" - NO "aboard")
async function sendWelcomeEmail({ email, name, studentId, regNo, courseName = 'Foundations Track' }) {
  const cleanName = (name || 'Student').trim();
  const subject = `Welcome to CODE Lekho, ${cleanName}! 🚀`;
  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Your registration with <strong>CODE Lekho</strong> has been received and successfully verified. We are thrilled to welcome you to our student community!
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #047857;border-radius:12px;padding:20px;margin:24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;font-weight:600;">Course Track:</td>
          <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:700;">${courseName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Student Name:</td>
          <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:600;">${cleanName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Learner ID:</td>
          <td style="padding:6px 0;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#047857;font-weight:700;">${studentId || 'GEN-STU-' + Math.random().toString(36).substring(2, 8).toUpperCase()}</td>
        </tr>
        ${regNo ? `<tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Registration No:</td>
          <td style="padding:6px 0;font-size:13px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#334155;">${regNo}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Access Portal:</td>
          <td style="padding:6px 0;font-size:14px;color:#047857;font-weight:700;">
            <a href="https://codelekho.com" style="color:#047857;text-decoration:none;">codelekho.com</a>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.7;">
      Our academic counselors and technical mentors are excited to guide you throughout your learning path.
    </p>
  `;

  const html = renderEmailShell({
    badge: 'OFFICIAL WELCOME',
    subtitle: 'Learn Today, Build Tomorrow',
    greeting: `Welcome ${cleanName}!`,
    bodyHtml,
    ctaText: 'Access Student Portal',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'welcome', 'student-registration']
  });
}

// 2. Registration Confirmation Email
async function sendRegistrationConfirmation({ email, name, courseName, registrationDate }) {
  const cleanName = (name || 'Student').trim();
  const cName = courseName || 'Foundations Track';
  const subject = `Registration Confirmed: ${cName} | CODE Lekho`;

  const formattedDate = registrationDate
    ? new Date(registrationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Congratulations! Your enrollment in <strong>${cName}</strong> is officially confirmed and recorded in the CODE Lekho system.
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #047857;border-radius:12px;padding:20px;margin:24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;width:130px;font-weight:600;">Enrolled Track:</td>
          <td style="padding:6px 0;font-size:14px;color:#0F172A;font-weight:700;">${cName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Confirmed Date:</td>
          <td style="padding:6px 0;font-size:14px;color:#334155;font-weight:600;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748B;font-weight:600;">Enrollment Status:</td>
          <td style="padding:6px 0;">
            <span style="display:inline-block;padding:2px 10px;background:#DEF7EC;color:#03543F;border-radius:12px;font-size:12px;font-weight:700;">✓ Verified Active</span>
          </td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.7;">
      Please ensure your development environment is ready before your first live workshop session. You can access syllabus resources, practice labs, and assessment quizzes directly on your student portal.
    </p>
  `;

  const html = renderEmailShell({
    badge: 'ENROLLMENT CONFIRMED',
    subtitle: 'Official Registration Receipt',
    greeting: `Welcome ${cleanName}!`,
    bodyHtml,
    ctaText: 'View Course Syllabus',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'registration-confirmation']
  });
}

// 3. Course Information Email
async function sendCourseInfoEmail({ email, name, courseName }) {
  const cleanName = (name || 'Student').trim();
  const cName = courseName || 'Foundations Track';
  const subject = `Curriculum & Course Details: ${cName} | CODE Lekho`;

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      Here is your complete syllabus roadmap and schedule for <strong>${cName}</strong> at CODE Lekho.
    </p>

    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin:20px 0;">
      <h3 style="margin:0 0 12px;font-size:14px;color:#013A2B;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">What You Will Master:</h3>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#334155;line-height:1.8;">
        <li>Hands-on coding exercises with browser-based IDE and live compilers</li>
        <li>Real-world enterprise capstone projects with 1-on-1 mentor code reviews</li>
        <li>Module assessment quizzes and AI-proctored certification exams</li>
        <li>Verifiable certificate with QR code validation upon course completion</li>
      </ul>
    </div>

    <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">
      If you have questions, our mentors and technical leads are always here to help.
    </p>
  `;

  const html = renderEmailShell({
    badge: 'CURRICULUM ROADMAP',
    subtitle: cName,
    greeting: `Hi ${cleanName},`,
    bodyHtml,
    ctaText: 'Explore Full Syllabus',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'course-info']
  });
}

// 4. Course Starting Reminder
async function sendCourseStartingReminder({ email, name, courseName, startDate }) {
  const cleanName = (name || 'Student').trim();
  const cName = courseName || 'Foundations Track';
  const subject = `Batch Kickoff Alert: ${cName} Starts Soon! | CODE Lekho`;

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      This is a quick reminder that your batch for <strong>${cName}</strong> begins <strong>${startDate || 'shortly'}</strong>!
    </p>

    <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:12px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#065F46;">⏰ Kickoff Checklist:</p>
      <ul style="margin:0;padding-left:20px;font-size:13px;color:#047857;line-height:1.7;">
        <li>Log into your CODE Lekho dashboard 15 minutes before the session</li>
        <li>Verify your microphone and IDE setup</li>
        <li>Have your note-taking tool ready for live code walkthroughs</li>
      </ul>
    </div>
  `;

  const html = renderEmailShell({
    badge: 'BATCH KICKOFF',
    subtitle: 'Upcoming Live Session',
    greeting: `Hi ${cleanName},`,
    bodyHtml,
    ctaText: 'Join Live Classroom',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'course-reminder']
  });
}

// 5. Pending Payment Reminder
async function sendPaymentReminder({ email, name, courseName, amount }) {
  const cleanName = (name || 'Student').trim();
  const cName = courseName || 'Specialization Track';
  const subject = `Action Required: Complete Your Enrollment in ${cName} | CODE Lekho`;

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.7;">
      We noticed you initiated enrollment for <strong>${cName}</strong> but haven't completed the course fee (${amount ? `₹${amount}` : '₹99'}).
    </p>

    <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.7;">
      Complete your payment securely via Cashfree to instantly unlock your curriculum modules, mentor access, and capstone certification path.
    </p>
  `;

  const html = renderEmailShell({
    badge: 'PAYMENT PENDING',
    subtitle: 'Enrollment Completion',
    greeting: `Hi ${cleanName},`,
    bodyHtml,
    ctaText: 'Complete Payment Now',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'payment-reminder']
  });
}

// 6. Follow-up Reminder
async function sendFollowUpReminder({ email, name, courseName, notes }) {
  const cleanName = (name || 'Student').trim();
  const subject = `Following Up on Your CODE Lekho Counseling - ${courseName || 'Tech Programs'}`;

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
      Following up on your recent interest in our learning tracks. Our counseling team is available to help clarify syllabus questions, career paths, and live project schedules.
    </p>
    ${notes ? `<div style="background:#F8FAFC;border-left:3px solid #64748B;padding:12px 16px;margin:16px 0;font-size:13px;color:#475569;font-style:italic;">${notes}</div>` : ''}
    <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">
      Feel free to reply directly to this email or connect with our advisors for personalized guidance.
    </p>
  `;

  const html = renderEmailShell({
    badge: 'ADMISSIONS COUNSELING',
    subtitle: 'We Are Here To Help',
    greeting: `Hi ${cleanName},`,
    bodyHtml,
    ctaText: 'Book 1-on-1 Guidance Call',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'follow-up']
  });
}

// 7. Promotional Campaign Emails
async function sendCampaignEmail({ email, name, campaignTitle, campaignBody }) {
  const cleanName = (name || 'Student').trim();
  const subject = campaignTitle || 'Announcement from CODE Lekho';

  const bodyHtml = `
    <div style="font-size:15px;color:#334155;line-height:1.7;margin-bottom:20px;">
      ${campaignBody || 'Check out our latest learning tracks and upcoming live workshops.'}
    </div>
  `;

  const html = renderEmailShell({
    badge: 'SPECIAL ANNOUNCEMENT',
    subtitle: 'CODE Lekho Tech Community',
    greeting: `Hi ${cleanName},`,
    bodyHtml,
    ctaText: 'Learn More',
    ctaUrl: 'https://codelekho.com'
  });

  return sendRequest('/transactional/send', {
    to: email,
    toName: cleanName,
    subject,
    html,
    tags: ['codelekho', 'promotional']
  });
}

module.exports = {
  sendWelcomeEmail,
  sendRegistrationConfirmation,
  sendCourseInfoEmail,
  sendCourseStartingReminder,
  sendPaymentReminder,
  sendFollowUpReminder,
  sendCampaignEmail,
  sendRequest,
  renderEmailShell
};
