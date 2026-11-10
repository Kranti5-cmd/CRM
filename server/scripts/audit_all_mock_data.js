const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Ticket = require('../models/Ticket');
const Deal = require('../models/Deal');
const Contact = require('../models/Contact');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const companies = await Company.find().lean();
  console.log('Companies count:', companies.length);
  companies.forEach(c => console.log(`- ${c.name} (${c.industry})`));

  const tasks = await Task.find().lean();
  console.log('Tasks count:', tasks.length);
  const fakeTasks = tasks.filter(t => !t.title.includes('Arshith') && !t.title.includes('CodeLekho') && !t.title.includes('Onboarding') && !t.title.includes('Student'));
  console.log('Sample tasks (first 5):');
  tasks.slice(0, 5).forEach(t => console.log(`- ${t.title} | ${t.type} | ${t.status}`));

  const activities = await Activity.find().lean();
  console.log('Activities count:', activities.length);

  process.exit(0);
}

audit().catch(err => {
  console.error(err);
  process.exit(1);
});

