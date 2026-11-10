const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const companies = await Company.find().select('name industry').lean();
  console.log('Companies:', companies);

  const users = await User.find().select('name email role').lean();
  console.log('Users:', users);

  const leads = await Lead.find({
    $or: [{ source: 'Bootcamp' }, { studentId: { $exists: true, $ne: null } }]
  }).lean();
  console.log(`Total Bootcamp Leads: ${leads.length}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

