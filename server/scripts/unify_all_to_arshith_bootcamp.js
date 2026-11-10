const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Company = require('../models/Company');
const Task = require('../models/Task');

async function unifyAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Ensure Arshith Boot Camp company exists
  let bootcampCompany = await Company.findOne({ name: 'Arshith Boot Camp' });
  if (!bootcampCompany) {
    bootcampCompany = await Company.create({
      name: 'Arshith Boot Camp',
      industry: 'Education',
      website: 'https://arshithbootcamp.com/',
      email: 'bootcamp@arshithgroup.com',
      phone: '+91 9876543210',
      isActive: true
    });
  }

  // Delete fake corporate companies (GreenLeaf, NovaByte, etc.)
  const compDel = await Company.deleteMany({ _id: { $ne: bootcampCompany._id } });
  console.log(`Deleted ${compDel.deletedCount} legacy mock companies. Remaining companies: 1 (Arshith Boot Camp)`);

  // 2. Fix Kranti / chani lead record so it matches Arshith Boot Camp standards
  const krantiLead = await Lead.findOne({ email: 'krantishantveer@gmail.com' });
  if (krantiLead) {
    krantiLead.fullName = 'Kranti Shantveer';
    krantiLead.companyName = 'Arshith Boot Camp';
    krantiLead.leadSource = 'Arshith Boot Camp';
    krantiLead.studentId = krantiLead.studentId || 'ARB-STU-1001';
    krantiLead.courseName = krantiLead.courseName || 'Python Programming';
    krantiLead.registrationStatus = 'Enrolled';
    krantiLead.paymentStatus = 'Paid';
    if (!krantiLead.tags.includes('Arshith Boot Camp')) krantiLead.tags.push('Arshith Boot Camp');
    await krantiLead.save();
    console.log('Normalized Kranti Shantveer student lead');
  }

  // 3. Delete all 30 legacy mock corporate leads (Cooper Inc, Ross Group, etc.)
  const leadDel = await Lead.deleteMany({
    leadSource: { $ne: 'Arshith Boot Camp' },
    companyName: { $ne: 'Arshith Boot Camp' },
    tags: { $nin: ['Arshith Boot Camp'] },
    studentId: { $in: [null, ''] }
  });
  console.log(`Deleted ${leadDel.deletedCount} legacy non-bootcamp leads.`);

  // Ensure all remaining leads have companyName = 'Arshith Boot Camp' and leadSource = 'Arshith Boot Camp'
  await Lead.updateMany(
    {},
    {
      $set: {
        companyName: 'Arshith Boot Camp',
        leadSource: 'Arshith Boot Camp'
      }
    }
  );

  // 4. Ensure Contact collection matches 1:1 with Lead collection (121 students)
  const leads = await Lead.find().lean();
  console.log(`Total Leads now in DB: ${leads.length}`);

  for (const lead of leads) {
    const rawName = String(lead.fullName || lead.email.split('@')[0]).trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || 'Learner';
    const course = lead.courseName || 'Full Stack Track';
    const regStatus = lead.registrationStatus || 'Enrolled';

    await Contact.findOneAndUpdate(
      { email: lead.email.toLowerCase() },
      {
        $set: {
          firstName,
          lastName,
          email: lead.email.toLowerCase(),
          phone: lead.phone || '',
          company: bootcampCompany._id,
          position: `${course} (${regStatus})`,
          department: 'Arshith Boot Camp',
          assignedTo: lead.assignedTo,
          notes: `Student ID: ${lead.studentId || ''} | Course: ${course} | Payment: ${lead.paymentStatus || 'Free'}`,
          tags: ['CodeLekho', 'Arshith Boot Camp', course, lead.paymentStatus || 'Free'],
          isActive: true
        }
      },
      { upsert: true }
    );
  }

  // Delete any contact that does not belong to the leads list
  const leadEmails = leads.map(l => l.email.toLowerCase());
  const orphanContacts = await Contact.deleteMany({ email: { $nin: leadEmails } });
  console.log(`Cleaned ${orphanContacts.deletedCount} orphaned contacts.`);

  // 5. Ensure Deal collection matches 1:1 with Contact collection (121 enrollment deals)
  await Deal.deleteMany({});
  for (const lead of leads) {
    const isPaid = lead.paymentStatus === 'Paid';
    const isPending = lead.paymentStatus === 'Pending';
    const value = isPaid ? 99 : (isPending ? 99 : 0);
    const stage = isPaid ? 'Won' : (isPending ? 'Proposal' : 'Qualification');
    const course = lead.courseName || 'Full Stack Track';
    const contact = await Contact.findOne({ email: lead.email.toLowerCase() });

    await Deal.create({
      title: `${course} - ${lead.fullName}`,
      value,
      stage,
      probability: isPaid ? 100 : (isPending ? 60 : 30),
      company: bootcampCompany._id,
      contact: contact ? contact._id : null,
      assignedTo: lead.assignedTo,
      notes: `Student ID: ${lead.studentId}. Status: ${lead.registrationStatus}`,
      actualCloseDate: isPaid ? (lead.registrationDate || new Date()) : null
    });
  }

  // 6. Delete fake corporate tasks (Client dinner with Pinnacle, etc.)
  const taskDel = await Task.deleteMany({
    title: { $not: /Arshith|CodeLekho|Onboarding|Student|Orientation/i }
  });
  console.log(`Cleaned ${taskDel.deletedCount} non-bootcamp tasks.`);

  // 7. Verify all counts across the system
  const finalLeads = await Lead.countDocuments();
  const finalContacts = await Contact.countDocuments();
  const finalDeals = await Deal.countDocuments();
  const bootcampSourceLeads = await Lead.countDocuments({ leadSource: 'Arshith Boot Camp' });

  console.log('=== UNIFICATION AUDIT RESULT ===');
  console.log(`Lead Collection (Lead Management):      ${finalLeads} students`);
  console.log(`Contact Collection (Student Management): ${finalContacts} students`);
  console.log(`Deal Collection (Course Enrollments):   ${finalDeals} students`);
  console.log(`Boot Camp Source Lead Count:            ${bootcampSourceLeads} students`);

  process.exit(0);
}

unifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
