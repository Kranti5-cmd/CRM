const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const brevoService = require('../services/brevoService');

async function testSend() {
  console.log('Sending live test email via CODE Lekho Brevo Integration...');
  const res = await brevoService.sendWelcomeEmail({
    email: 'krantishantveer@gmail.com',
    name: 'Kranti',
    studentId: 'CLK-STU-88219A',
    regNo: '98452102',
    courseName: 'Foundations Track'
  });
  console.log('Result:', JSON.stringify(res, null, 2));
}

testSend().catch(console.error);
