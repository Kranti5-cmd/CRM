const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Deal = require('../models/Deal');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const User = require('../models/User');

async function syncRealBootcampDeals() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Delete all 21 fake corporate template deals
  const delRes = await Deal.deleteMany({});
  console.log(`Deleted ${delRes.deletedCount} legacy mock corporate deals.`);

  // 2. Find Arshith Boot Camp company & default manager
  const company = await Company.findOne({ name: 'Arshith Boot Camp' });
  const manager = await User.findOne({ email: 'krantishantveer@gmail.com' }) || await User.findOne({ role: 'Manager' });

  // 3. Find all Arshith Boot Camp students in Lead
  const bootcampStudents = await Lead.find({
    $or: [
      { companyName: /Arshith/i },
      { tags: 'Arshith Boot Camp' },
      { studentId: { $exists: true, $ne: '' } }
    ]
  }).lean();

  console.log(`Found ${bootcampStudents.length} real Boot Camp students.`);

  let createdDeals = 0;
  for (const stu of bootcampStudents) {
    const course = stu.courseName || 'Full Stack Track';
    const isPaid = stu.paymentStatus === 'Paid';
    const isPending = stu.paymentStatus === 'Pending';
    
    // Fee structure: Paid = 99, Pending = 99, Free = 0
    const value = isPaid ? 99 : (isPending ? 99 : 0);
    const stage = isPaid ? 'Won' : (isPending ? 'Proposal' : 'Qualification');
    const closeDate = isPaid ? (stu.registrationDate || stu.createdAt || new Date()) : new Date();

    await Deal.create({
      title: `${course} - ${stu.fullName}`,
      value,
      stage,
      probability: isPaid ? 100 : (isPending ? 60 : 30),
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      actualCloseDate: isPaid ? closeDate : null,
      company: company ? company._id : null,
      lead: stu._id,
      assignedTo: stu.assignedTo || (manager ? manager._id : null),
      notes: `Student ID: ${stu.studentId || 'N/A'}. Track: ${course}. Status: ${stu.registrationStatus || 'Enrolled'}`
    });
    createdDeals++;
  }

  const finalDeals = await Deal.countDocuments();
  const wonDeals = await Deal.countDocuments({ stage: 'Won' });
  const wonRevenue = (await Deal.aggregate([
    { $match: { stage: 'Won' } },
    { $group: { _id: null, total: { $sum: '$value' } } }
  ]))[0]?.total || 0;

  console.log(`Real Deals Created: ${finalDeals}, Won: ${wonDeals}, Total Real Revenue: $${wonRevenue}`);
  process.exit(0);
}

syncRealBootcampDeals().catch(err => {
  console.error(err);
  process.exit(1);
});

