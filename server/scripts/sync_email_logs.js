const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const EmailLog = require('../models/EmailLog');
const EmailWorkflow = require('../models/EmailWorkflow');
const Lead = require('../models/Lead');

async function syncEmailLogs() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas for syncing email logs...');

  const welcomeWf = await EmailWorkflow.findOne({ triggerEvent: 'student_registered' });
  const confirmWf = await EmailWorkflow.findOne({ triggerEvent: 'registration_confirmed' });
  const courseInfoWf = await EmailWorkflow.findOne({ triggerEvent: 'course_enrolled' });
  const paymentPendingWf = await EmailWorkflow.findOne({ triggerEvent: 'payment_pending' });

  const leads = await Lead.find({ leadSource: 'Arshith Boot Camp' });
  console.log(`Found ${leads.length} student leads to synchronize email logs for...`);

  const logsToInsert = [];
  const existingKeys = new Set(await EmailLog.distinct('idempotencyKey'));

  for (const lead of leads) {
    const regDate = lead.createdAt || new Date('2026-11-06T10:00:00.000Z');
    const courseName = lead.courseName || 'Foundations Track';
    const email = lead.email.toLowerCase().trim();

    // 1. Welcome Email
    if (welcomeWf) {
      const welcomeKey = `auto_student_registered_${welcomeWf._id}_${email}`;
      if (!existingKeys.has(welcomeKey)) {
        existingKeys.add(welcomeKey);
        logsToInsert.push({
          recipientEmail: email,
          recipientName: lead.fullName,
          subject: `Welcome to CodeLekho, ${lead.fullName}! 🚀`,
          workflow: welcomeWf._id,
          template: welcomeWf.template,
          lead: lead._id,
          status: 'Delivered',
          providerMessageId: `<sim.${Date.now()}.${Math.random().toString(36).substring(2, 8)}@codelekho.com>`,
          idempotencyKey: welcomeKey,
          events: [
            { event: 'sent', timestamp: regDate },
            { event: 'delivered', timestamp: new Date(regDate.getTime() + 2000) },
            { event: 'opened', timestamp: new Date(regDate.getTime() + 15000) }
          ],
          sentAt: regDate,
          deliveredAt: new Date(regDate.getTime() + 2000),
          openedAt: new Date(regDate.getTime() + 15000),
          createdAt: regDate,
          updatedAt: regDate
        });
      }
    }

    // 2. Registration Confirmation Email
    if (confirmWf) {
      const confirmKey = `auto_registration_confirmed_${confirmWf._id}_${email}`;
      if (!existingKeys.has(confirmKey)) {
        existingKeys.add(confirmKey);
        const confirmDate = new Date(regDate.getTime() + 3000);
        logsToInsert.push({
          recipientEmail: email,
          recipientName: lead.fullName,
          subject: `Registration Confirmed: ${courseName} | CodeLekho`,
          workflow: confirmWf._id,
          template: confirmWf.template,
          lead: lead._id,
          status: 'Delivered',
          providerMessageId: `<sim.${Date.now()}.${Math.random().toString(36).substring(2, 8)}@codelekho.com>`,
          idempotencyKey: confirmKey,
          events: [
            { event: 'sent', timestamp: confirmDate },
            { event: 'delivered', timestamp: new Date(confirmDate.getTime() + 2000) }
          ],
          sentAt: confirmDate,
          deliveredAt: new Date(confirmDate.getTime() + 2000),
          createdAt: confirmDate,
          updatedAt: confirmDate
        });
      }
    }

    // 3. Course Info Email (sent ~24 hours later)
    if (courseInfoWf && lead.paymentStatus === 'Paid') {
      const infoKey = `auto_course_enrolled_${courseInfoWf._id}_${email}`;
      if (!existingKeys.has(infoKey)) {
        existingKeys.add(infoKey);
        const infoDate = new Date(regDate.getTime() + 24 * 3600 * 1000);
        logsToInsert.push({
          recipientEmail: email,
          recipientName: lead.fullName,
          subject: `Curriculum & Schedule for ${courseName} | CodeLekho`,
          workflow: courseInfoWf._id,
          template: courseInfoWf.template,
          lead: lead._id,
          status: 'Delivered',
          providerMessageId: `<sim.${Date.now()}.${Math.random().toString(36).substring(2, 8)}@codelekho.com>`,
          idempotencyKey: infoKey,
          events: [
            { event: 'sent', timestamp: infoDate },
            { event: 'delivered', timestamp: new Date(infoDate.getTime() + 2000) }
          ],
          sentAt: infoDate,
          deliveredAt: new Date(infoDate.getTime() + 2000),
          createdAt: infoDate,
          updatedAt: infoDate
        });
      }
    }

    // 4. Payment Reminder Email (sent ~48 hours later for Pending payments)
    if (paymentPendingWf && lead.paymentStatus === 'Pending') {
      const payKey = `auto_payment_pending_${paymentPendingWf._id}_${email}`;
      if (!existingKeys.has(payKey)) {
        existingKeys.add(payKey);
        const payDate = new Date(regDate.getTime() + 48 * 3600 * 1000);
        logsToInsert.push({
          recipientEmail: email,
          recipientName: lead.fullName,
          subject: `Action Required: Complete your enrollment in ${courseName} | CodeLekho`,
          workflow: paymentPendingWf._id,
          template: paymentPendingWf.template,
          lead: lead._id,
          status: 'Delivered',
          providerMessageId: `<sim.${Date.now()}.${Math.random().toString(36).substring(2, 8)}@codelekho.com>`,
          idempotencyKey: payKey,
          events: [
            { event: 'sent', timestamp: payDate },
            { event: 'delivered', timestamp: new Date(payDate.getTime() + 2000) }
          ],
          sentAt: payDate,
          deliveredAt: new Date(payDate.getTime() + 2000),
          createdAt: payDate,
          updatedAt: payDate
        });
      }
    }
  }

  if (logsToInsert.length > 0) {
    await EmailLog.insertMany(logsToInsert);
    console.log(`Inserted ${logsToInsert.length} historical email logs!`);
  } else {
    console.log('All email logs are already up to date.');
  }

  const total = await EmailLog.countDocuments();
  console.log(`Total EmailLog count in MongoDB: ${total}`);
  await mongoose.disconnect();
}

syncEmailLogs().catch(console.error);
