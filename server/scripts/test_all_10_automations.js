const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');

const EmailWorkflow = require('../models/EmailWorkflow');
const EmailTemplate = require('../models/EmailTemplate');
const EmailExecution = require('../models/EmailExecution');
const EmailLog = require('../models/EmailLog');
const EmailSubscriber = require('../models/EmailSubscriber');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Task = require('../models/Task');
const { emitAutomationEvent, processExecution } = require('../services/automationEngine');

async function runTests() {
  console.log('====================================================');
  console.log('ARSHITH BOOT CAMP EMAIL AUTOMATION - END-TO-END TEST');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(' Connected to MongoDB Atlas\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  FAILED: ${message}`);
      failed++;
    }
  }

  const testEmail = `test_runner_${Date.now()}@example.com`;
  const studentName = 'Test Student E2E';

  // Create a dedicated test lead
  const testLead = await Lead.create({
    fullName: studentName,
    email: testEmail,
    phone: '+91 98765 43210',
    companyName: 'Arshith Boot Camp',
    leadSource: 'Arshith Boot Camp',
    leadStatus: 'New',
    priority: 'High',
    studentId: `ARB-TEST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    courseName: 'Web Development',
    registrationDate: new Date(),
    paymentStatus: 'Pending',
    registrationStatus: 'Enrolled'
  });

  const testSubscriber = await EmailSubscriber.create({
    email: testEmail,
    name: studentName,
    phone: '+91 98765 43210',
    lead: testLead._id,
    hasConsent: true,
    isUnsubscribed: false,
    lists: ['Arshith Boot Camp Students', 'New Registrations']
  });

  console.log(`[Setup] Created test lead ${testLead.email} (${testLead.studentId})`);

  // ----------------------------------------------------
  // TEST 1: Student Welcome Email (Automation 1)
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Student Welcome Email ---');
  const res1 = await emitAutomationEvent('student_registered', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test1'
  });
  assert(res1.success === true, 'Workflow 1 (Welcome Email) emitted successfully');
  const exec1 = await EmailExecution.findOne({ recipientEmail: testEmail, triggerEvent: 'student_registered' });
  assert(exec1 !== null, 'EmailExecution record created in MongoDB');
  assert(['Delivered', 'Sent'].includes(exec1.status), `Execution status is ${exec1.status}`);

  // ----------------------------------------------------
  // TEST 2: Registration Confirmation (Automation 2)
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Registration Confirmation ---');
  const res2 = await emitAutomationEvent('registration_confirmed', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test2'
  });
  assert(res2.success === true, 'Workflow 2 (Registration Confirmed) emitted successfully');
  const exec2 = await EmailExecution.findOne({ recipientEmail: testEmail, triggerEvent: 'registration_confirmed' });
  assert(exec2 !== null, 'Registration Confirmation execution record verified');

  // ----------------------------------------------------
  // TEST 3: Course Information Email (Automation 3)
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Course Information Email ---');
  const res3 = await emitAutomationEvent('course_enrolled', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test3',
    forceImmediate: true
  });
  assert(res3.success === true, 'Workflow 3 (Course Info) emitted successfully');
  const log3 = await EmailLog.findOne({ recipientEmail: testEmail, workflow: res3.results[0]?.workflowId });
  assert(log3 !== null, 'Course Information email logged with template variables rendered');

  // ----------------------------------------------------
  // TEST 4: Pending Payment Reminder (Automation 4)
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Pending Payment Reminder ---');
  // First test when payment is pending
  testLead.paymentStatus = 'Pending';
  await testLead.save();
  const res4a = await emitAutomationEvent('payment_pending', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'pending_run1'
  });
  assert(res4a.success === true, 'Workflow 4 (Payment Pending) dispatched for pending student');

  // Now test payment cancellation / paid protection: should skip if Paid
  testLead.paymentStatus = 'Paid';
  await testLead.save();
  const res4b = await emitAutomationEvent('payment_pending', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'paid_run2'
  });
  const skippedPaid = res4b.results.find(r => r.status === 'Skipped_Duplicate');
  assert(skippedPaid !== undefined, 'Payment reminder skipped when student is already Paid');

  // ----------------------------------------------------
  // TEST 5: Payment Confirmation (Automation 5)
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Payment Confirmation ---');
  const res5 = await emitAutomationEvent('payment_completed', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    metadata: { amount: '₹4,999', transactionId: 'TXN-TEST-1234' },
    uniqueKey: 'test5'
  });
  assert(res5.success === true, 'Workflow 5 (Payment Confirmation) emitted successfully');
  const exec5 = await EmailExecution.findOne({ recipientEmail: testEmail, triggerEvent: 'payment_completed' });
  assert(exec5 && ['Delivered', 'Sent'].includes(exec5.status), 'Payment confirmation execution logged');

  // ----------------------------------------------------
  // TEST 6: Course Starting Reminder (Automation 6)
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Course Starting Reminder ---');
  const res6 = await emitAutomationEvent('course_starting_soon', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test6'
  });
  assert(res6.success === true, 'Workflow 6 (Course Starting Soon) emitted successfully');

  // ----------------------------------------------------
  // TEST 7: Counselor Follow-up (Automation 7)
  // ----------------------------------------------------
  console.log('\n--- 7. Testing Counselor Follow-up Flow ---');
  const followUpTask = await Task.create({
    title: `Follow-up with ${studentName}`,
    status: 'Pending',
    type: 'Follow-up',
    dueDate: new Date(Date.now() + 3600000)
  });

  const res7 = await emitAutomationEvent('counselor_followup_needed', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    metadata: { taskId: followUpTask._id },
    uniqueKey: 'test7'
  });
  assert(res7.success === true, 'Workflow 7 (Follow-up Reminder) emitted successfully');

  // ----------------------------------------------------
  // TEST 8: Student Re-engagement (Automation 8)
  // ----------------------------------------------------
  console.log('\n--- 8. Testing Student Re-engagement ---');
  const res8 = await emitAutomationEvent('student_inactive_7d', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test8'
  });
  assert(res8.success === true, 'Workflow 8 (Student Re-engagement) emitted successfully');

  // ----------------------------------------------------
  // TEST 9: Course Completion (Automation 9)
  // ----------------------------------------------------
  console.log('\n--- 9. Testing Course Completion Email ---');
  testLead.registrationStatus = 'Completed';
  await testLead.save();

  const res9 = await emitAutomationEvent('course_completed', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test9'
  });
  assert(res9.success === true, 'Workflow 9 (Course Completion) emitted successfully');

  // ----------------------------------------------------
  // TEST 10: Feedback Request (Automation 10)
  // ----------------------------------------------------
  console.log('\n--- 10. Testing Feedback Request ---');
  const res10 = await emitAutomationEvent('feedback_request', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test10'
  });
  assert(res10.success === true, 'Workflow 10 (Feedback Request) emitted successfully');

  // ----------------------------------------------------
  // TEST 11: Duplicate Event Protection (Idempotency)
  // ----------------------------------------------------
  console.log('\n--- 11. Testing Duplicate Event Protection ---');
  // Attempt to emit exact same event with same unique key
  const res11 = await emitAutomationEvent('student_registered', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'test1'
  });
  const skippedResult = res11.results.find(r => r.status === 'Skipped_Duplicate');
  assert(skippedResult !== undefined, 'Engine detected duplicate event and prevented duplicate email send');

  // ----------------------------------------------------
  // TEST 12: Marketing Consent & Unsubscribe Protection
  // ----------------------------------------------------
  console.log('\n--- 12. Testing Unsubscribe & Consent Protection ---');
  testSubscriber.isUnsubscribed = true;
  await testSubscriber.save();

  const res12 = await emitAutomationEvent('student_inactive_7d', {
    lead: testLead,
    email: testLead.email,
    fullName: testLead.fullName,
    uniqueKey: 'unsubscribed_test'
  });
  const consentSkipped = res12.results.find(r => r.status === 'Skipped_Consent');
  assert(consentSkipped !== undefined, 'Engine strictly blocked email to unsubscribed student');

  // ----------------------------------------------------
  // TEST 13: Brevo Webhook Delivery Tracking
  // ----------------------------------------------------
  console.log('\n--- 13. Testing Brevo Delivery Webhook ---');
  const sampleLog = await EmailLog.findOne({ recipientEmail: testEmail }).sort({ createdAt: -1 });
  if (sampleLog) {
    const defaultUser = await User.findOne();
    const token = jwt.sign({ id: defaultUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Simulate Brevo delivery webhook call
    await new Promise((resolve) => {
      const payload = JSON.stringify({
        event: 'delivered',
        email: testEmail,
        messageId: sampleLog.providerMessageId
      });
      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/email-automation/webhook/brevo',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        resolve(res.statusCode);
      });
      req.write(payload);
      req.end();
    });

    const updatedLog = await EmailLog.findById(sampleLog._id);
    assert(updatedLog && updatedLog.status === 'Delivered', 'Brevo webhook successfully updated EmailLog status to Delivered');
  }

  // ----------------------------------------------------
  // TEST 14: Workflow Details & Execution History API
  // ----------------------------------------------------
  console.log('\n--- 14. Testing Workflow Details API ---');
  const sampleWf = await EmailWorkflow.findOne();
  const defaultUser = await User.findOne();
  const token = jwt.sign({ id: defaultUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const apiRes = await new Promise((resolve) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: `/api/email-automation/workflows/${sampleWf._id}/details`,
      headers: { Authorization: `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
  });

  assert(apiRes.success === true && Array.isArray(apiRes.data.executions), 'Workflow details API returned configuration and execution records');

  // Cleanup test artifacts
  await Lead.findByIdAndDelete(testLead._id);
  await EmailSubscriber.findByIdAndDelete(testSubscriber._id);
  await Task.findByIdAndDelete(followUpTask._id);
  await EmailExecution.deleteMany({ recipientEmail: testEmail });
  await EmailLog.deleteMany({ recipientEmail: testEmail });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});
