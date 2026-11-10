/**
 * Centralized Brevo Email Integration Service for Arshith Boot Camp
 * Integrates CRM Pro with centralized ArshithBrevo API (Port 5001) / direct Brevo delivery.
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
        const senderName = process.env.BREVO_SENDER_NAME || 'Arshith Boot Camp';

        const postData = JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: payload.to, name: payload.toName || 'Student' }],
          subject: payload.subject,
          htmlContent: payload.html || payload.htmlContent || '',
          tags: payload.tags || ['bootcamp']
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

  // 2. Local Centralized ArshithBrevo Microservice Gateway (Port 5001)
  return new Promise((resolve, reject) => {
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
        resolve({ success: false, error: 'Connection to ArshithBrevo timed out (service may be starting)' });
      });

      req.on('error', (err) => {
        // Return gracefully so failure doesn't break student registration or CRM sync
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
 * 7 Automated Brevo Email Workflows for Arshith Boot Camp
 */

// 1. Student Registration Welcome Email
async function sendWelcomeEmail({ email, name, studentId, regNo }) {
  const subject = 'Welcome to Arshith Boot Camp - Learn Today, Build Tomorrow';
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;text-align:left;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px;font-weight:700">Arshith Boot Camp</h1>
        <p style="margin:6px 0 0;font-size:14px;color:#7CC283">Empowering Tech Learners Worldwide</p>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <h2 style="margin:0 0 16px;color:#013A2B;font-size:20px">Welcome aboard, ${name}!</h2>
        <p>Your registration with Arshith Boot Camp has been received and verified in our CRM system.</p>
        <div style="background:#FFFFFF;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #013A2B">
          <p style="margin:0 0 8px"><strong>Learner ID:</strong> <span style="font-family:monospace;color:#013A2B">${studentId || 'Generated on Login'}</span></p>
          ${regNo ? `<p style="margin:0 0 8px"><strong>Registration No:</strong> <span style="font-family:monospace">${regNo}</span></p>` : ''}
          <p style="margin:0"><strong>Portal Access:</strong> <a href="https://arshithbootcamp.com" style="color:#013A2B;font-weight:600">arshithbootcamp.com</a></p>
        </div>
        <p>Our academic counselors and mentors are excited to guide you throughout your journey.</p>
        <p style="margin-top:24px;font-size:13px;color:#666">Arshith Group Â· Bengaluru, Karnataka Â· support@arshithgroup.com</p>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'welcome', 'student-registration']
  });
}

// 2. Registration Confirmation Email
async function sendRegistrationConfirmation({ email, name, courseName, registrationDate }) {
  const subject = `Registration Confirmed: ${courseName} at Arshith Boot Camp`;
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px">Enrollment Confirmed</h1>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Congratulations! You are officially confirmed for <strong>${courseName}</strong>.</p>
        <div style="background:#FFFFFF;border:1px dashed #426557;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Course:</strong> ${courseName}</p>
          <p style="margin:0"><strong>Confirmed Date:</strong> ${registrationDate ? new Date(registrationDate).toLocaleDateString() : 'Today'}</p>
        </div>
        <p>You can access module curriculum, practice labs, and assessment quizzes directly on your student portal.</p>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'registration-confirmation']
  });
}

// 3. Course Information Email
async function sendCourseInfoEmail({ email, name, courseName }) {
  const subject = `Curriculum & Course Details: ${courseName}`;
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px">${courseName} - Syllabus & Roadmap</h1>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Here is the complete syllabus and schedule for your track in <strong>${courseName}</strong>.</p>
        <ul>
          <li>Hands-on coding exercises with browser-based IDE and live compilers.</li>
          <li>Real-world enterprise capstone projects with code review.</li>
          <li>Module assessment quizzes and AI-proctored certification exam.</li>
          <li>Verifiable certificate with QR code validation upon completion.</li>
        </ul>
        <p>If you have any questions, our mentors are just an email away.</p>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'course-info']
  });
}

// 4. Course Starting Reminder
async function sendCourseStartingReminder({ email, name, courseName, startDate }) {
  const subject = `Reminder: ${courseName} Starts Soon!`;
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px">Batch Kickoff Alert</h1>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <p>Hi <strong>${name}</strong>,</p>
        <p>This is a quick reminder that your batch for <strong>${courseName}</strong> begins ${startDate || 'shortly'}!</p>
        <p>Please log in to your dashboard 15 minutes before the session to ensure your development environment is set up.</p>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'course-reminder']
  });
}

// 5. Pending Payment Reminder
async function sendPaymentReminder({ email, name, courseName, amount }) {
  const subject = `Action Required: Complete Your Enrollment in ${courseName}`;
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px">Complete Your Enrollment</h1>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <p>Hi <strong>${name}</strong>,</p>
        <p>We noticed you initiated enrollment for <strong>${courseName}</strong> but haven't completed the registration fee (${amount ? `â‚¹${amount}` : 'â‚¹99'}).</p>
        <p>Complete your payment securely via Cashfree to immediately unlock your modules and certification path.</p>
        <p><a href="https://arshithbootcamp.com" style="display:inline-block;background:#013A2B;color:#FFF;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Complete Payment</a></p>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'payment-reminder']
  });
}

// 6. Follow-up Reminder (Internal or Student)
async function sendFollowUpReminder({ email, name, courseName, notes }) {
  const subject = `Following Up on Your Arshith Boot Camp Inquiry - ${courseName || 'Tech Programs'}`;
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px">We're Here to Help</h1>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Following up on your recent interest in our boot camp courses. Our academic team is available to answer any questions about the curriculum, projects, and interview preparation.</p>
        ${notes ? `<p><em>${notes}</em></p>` : ''}
        <p>Feel free to reply directly to this email or book a 1-on-1 counseling call.</p>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'follow-up']
  });
}

// 7. Promotional Campaign Emails
async function sendCampaignEmail({ email, name, campaignTitle, campaignBody }) {
  const subject = campaignTitle || 'Special Tech Announcement from Arshith Boot Camp';
  const html = `
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FBF8F1;border:1px solid #E4E0D7;border-radius:12px;overflow:hidden">
      <div style="background:#013A2B;padding:28px;color:#FBF8F1">
        <h1 style="margin:0;font-size:24px">${campaignTitle}</h1>
      </div>
      <div style="padding:32px 28px;color:#302B25;line-height:1.7">
        <p>Hi <strong>${name}</strong>,</p>
        <div style="margin:16px 0">${campaignBody || 'Check out our latest learning tracks and upcoming workshops.'}</div>
      </div>
    </div>
  `;
  return sendRequest('/transactional/send', {
    to: email,
    toName: name,
    subject,
    html,
    tags: ['bootcamp', 'promotional']
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
  sendRequest
};

