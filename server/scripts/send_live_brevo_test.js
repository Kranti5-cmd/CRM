const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const key = process.env.BREVO_API_KEY;
const postData = JSON.stringify({
  sender: { name: 'Arshith Boot Camp', email: 'krantishantveer@gmail.com' },
  to: [{ email: 'krantishantveer@gmail.com', name: 'Kranti' }],
  subject: 'Welcome to Arshith Boot Camp, Kranti! 🚀',
  htmlContent: '<div style="font-family:sans-serif;padding:24px;background:#FBF8F1;border:1px solid #426557;border-radius:12px"><h2 style="color:#013A2B">Welcome to Arshith Boot Camp!</h2><p>Your email automation system is now <strong>LIVE</strong> and delivering successfully through Brevo.</p><p>Best regards,<br><strong>Arshith Boot Camp Admissions Team</strong></p></div>',
  tags: ['bootcamp', 'welcome']
});

const req = https.request({
  hostname: 'api.brevo.com',
  port: 443,
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'api-key': key,
    'Accept': 'application/json'
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'RESULT:', d));
});
req.write(postData);
req.end();

