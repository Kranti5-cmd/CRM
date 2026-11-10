const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const User = require('../models/User');

async function syncBootcampToContacts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Find or create Arshith Boot Camp company
  let company = await Company.findOne({ name: 'Arshith Boot Camp' });
  const managerUser = await User.findOne({ email: 'krantishantveer@gmail.com' }) || await User.findOne({ role: 'Manager' });

  if (!company) {
    company = await Company.create({
      name: 'Arshith Boot Camp',
      industry: 'Education',
      website: 'https://arshithbootcamp.com/',
      email: 'bootcamp@arshithgroup.com',
      phone: '+91 9876543210',
      address: {
        street: 'Main Campus',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560001'
      },
      size: '51-200',
      assignedTo: managerUser ? managerUser._id : null,
      notes: 'CodeLekho Arshith Boot Camp learners and students',
      isActive: true
    });
    console.log('Created Arshith Boot Camp company:', company._id);
  } else {
    console.log('Found existing Arshith Boot Camp company:', company._id);
  }

  // 2. Remove the 15 mock corporate sample contacts (Jennifer Lee, etc.)
  const mockDeleteResult = await Contact.deleteMany({
    email: {
      $in: [
        'jennifer@greenleaf.com',
        'rachel@apexconsulting.com',
        'laura@techflow.com',
        'daniel@skylineprops.com',
        'robert@techflow.com',
        'michael@healthbridge.com',
        'sarah@atlaslogistics.com',
        'kevin@novabyte.io',
        'david@cloudninemedia.com',
        'jessica@pinnaclefg.com',
        'brian@quantumed.org',
        'amanda@techflow.com',
        'thomas@greenleaf.com',
        'stephanie@skylineprops.com',
        'eric@cloudninemedia.com'
      ]
    }
  });
  console.log(`Removed ${mockDeleteResult.deletedCount} legacy mock sample contacts.`);

  // 3. Find all bootcamp leads (from CodeLekho or manual registration)
  const bootcampLeads = await Lead.find({
    $or: [
      { companyName: /Arshith/i },
      { leadSource: /Arshith/i },
      { tags: 'Arshith Boot Camp' },
      { studentId: { $exists: true, $ne: '' } }
    ]
  }).lean();

  console.log(`Found ${bootcampLeads.length} CodeLekho Arshith Boot Camp leads.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const lead of bootcampLeads) {
    const rawEmail = String(lead.email || '').trim().toLowerCase();
    if (!rawEmail) continue;

    // Parse first and last name
    const rawName = String(lead.fullName || rawEmail.split('@')[0]).trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0] || 'Student';
    const lastName = parts.slice(1).join(' ') || 'Learner';

    const course = lead.courseName || 'Full Stack Track';
    const regStatus = lead.registrationStatus || 'Enrolled';
    const payStatus = lead.paymentStatus || 'Pending';
    const stuId = lead.studentId || '';

    const position = `${course} (${regStatus})`;
    const department = 'Arshith Boot Camp';
    const notes = `Student ID: ${stuId || 'N/A'} | Course: ${course} | Payment: ${payStatus} | Reg: ${regStatus}`;
    const tags = ['CodeLekho', 'Arshith Boot Camp', course];
    if (payStatus) tags.push(payStatus);

    let contact = await Contact.findOne({ email: rawEmail });
    if (contact) {
      contact.firstName = firstName;
      contact.lastName = lastName;
      contact.phone = lead.phone || contact.phone || '';
      contact.company = company._id;
      contact.position = position;
      contact.department = department;
      contact.assignedTo = lead.assignedTo || contact.assignedTo || (managerUser ? managerUser._id : null);
      contact.notes = notes;
      contact.tags = tags;
      await contact.save();
      updatedCount++;
    } else {
      await Contact.create({
        firstName,
        lastName,
        email: rawEmail,
        phone: lead.phone || '',
        company: company._id,
        position,
        department,
        assignedTo: lead.assignedTo || (managerUser ? managerUser._id : null),
        notes,
        tags,
        isActive: true
      });
      createdCount++;
    }
  }

  const finalContactCount = await Contact.countDocuments();
  console.log(`Sync completed! Created: ${createdCount}, Updated: ${updatedCount}. Total Contacts now in DB: ${finalContactCount}`);
  process.exit(0);
}

syncBootcampToContacts().catch(err => {
  console.error('Error during sync:', err);
  process.exit(1);
});

