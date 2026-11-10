const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Deal = require('../models/Deal');
const Lead = require('../models/Lead');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const deals = await Deal.find().lean();
  console.log(`Deals count: ${deals.length}`);
  deals.forEach(d => console.log(`- ${d.title} | ${d.value} | ${d.stage}`));

  const allLeads = await Lead.find().lean();
  const bootcampLeads = allLeads.filter(l => l.companyName?.includes('Arshith') || l.tags?.includes('Arshith Boot Camp') || l.studentId);
  console.log(`Total Leads: ${allLeads.length}, Bootcamp Leads: ${bootcampLeads.length}`);

  const paidBootcamp = bootcampLeads.filter(l => l.paymentStatus === 'Paid');
  const pendingBootcamp = bootcampLeads.filter(l => l.paymentStatus === 'Pending');
  const freeBootcamp = bootcampLeads.filter(l => l.paymentStatus === 'Free');

  console.log(`Paid: ${paidBootcamp.length}, Pending: ${pendingBootcamp.length}, Free: ${freeBootcamp.length}`);
  const totalRevenue = paidBootcamp.reduce((sum, l) => sum + (l.value || 99), 0);
  console.log(`Real Boot Camp Revenue from Paid Students: ${totalRevenue}`);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

