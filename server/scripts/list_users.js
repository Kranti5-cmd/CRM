const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find().lean();
  console.log('All Users in DB:');
  users.forEach(u => console.log(`- ${u.name} | ${u.email} | ${u.role} | ${u.department}`));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

