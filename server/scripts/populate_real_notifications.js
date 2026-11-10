const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Notification = require('../models/Notification');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Ticket = require('../models/Ticket');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // Clear out old mock notifications
  await Notification.deleteMany({});
  console.log('Cleared old template notifications');

  const users = await User.find({
    role: { $in: ['Admin', 'Manager', 'Sales Representative'] }
  });

  const kranti = await User.findOne({ email: 'krantishantveer@gmail.com' });
  const ticket1 = await Ticket.findOne({ ticketNumber: 'CARE-1001' });

  // Real Arshith Boot Camp notifications
  const realNotifications = [
    {
      title: 'Live Student Registration',
      message: 'Vaibhav Biradar registered for Foundations Track via CodeLekho.',
      type: 'lead_assigned',
      relatedModel: 'Lead',
      isRead: false
    },
    {
      title: 'Course Fee Payment Verified',
      message: 'Payment received ($99) for Python Programming Track.',
      type: 'conversion',
      relatedModel: 'Deal',
      isRead: false
    },
    {
      title: 'Brevo Welcome Email Delivered',
      message: 'Automated welcome and onboarding package delivered to student.',
      type: 'deal_update',
      isRead: false
    },
    {
      title: 'New Student Support Ticket',
      message: 'CARE-1001: Python Track Dashboard Access & Discord Link requested.',
      type: 'follow_up',
      relatedModel: 'Ticket',
      relatedId: ticket1?._id,
      isRead: false
    },
    {
      title: 'Daily Brief Dispatched to Srinu',
      message: 'Arshith Boot Camp Daily Report generated & sent to srinu@arshithgroup.com.',
      type: 'deal_update',
      isRead: false
    },
    {
      title: 'Orientation Follow-Up Due',
      message: 'Orientation session link scheduled for Rushikesh S (SQL Mastery).',
      type: 'follow_up',
      relatedModel: 'Lead',
      isRead: false
    }
  ];

  // Distribute to Kranti Shantveer and key staff
  for (const u of users) {
    for (const notif of realNotifications) {
      await Notification.create({
        user: u._id,
        ...notif,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 3600000))
      });
    }
  }

  const finalTotal = await Notification.countDocuments();
  const krantiCount = await Notification.countDocuments({ user: kranti._id, isRead: false });
  console.log(`Created real notifications. Total: ${finalTotal}, Unread for Kranti Shantveer: ${krantiCount}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

