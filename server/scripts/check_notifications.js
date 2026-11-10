const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Notification = require('../models/Notification');
const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const total = await Notification.countDocuments();
  const unread = await Notification.countDocuments({ isRead: false });
  console.log({ totalNotifications: total, unreadNotifications: unread });

  const kranti = await User.findOne({ email: 'krantishantveer@gmail.com' });
  const krantiNotifs = await Notification.find({ user: kranti._id }).lean();
  console.log(`Kranti Shantveer notifications count: ${krantiNotifs.length}`);
  krantiNotifs.forEach(n => console.log(`- [${n.type}] ${n.title}: ${n.message} (Read: ${n.isRead})`));

  const allNotifs = await Notification.find().populate('user', 'name email').limit(10).lean();
  console.log('Sample all notifications:');
  allNotifs.forEach(n => console.log(`- For ${n.user?.name || 'Unknown'} (${n.user?.email}): [${n.type}] ${n.title} - ${n.message}`));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

