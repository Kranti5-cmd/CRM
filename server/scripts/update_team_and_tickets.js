const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Ticket = require('../models/Ticket');

async function updateToArshithBootcamp() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Update Team Members to Arshith Boot Camp
  const kranti = await User.findOne({ email: 'krantishantveer@gmail.com' });
  if (kranti) {
    kranti.department = 'Admissions & Student Care Lead';
    kranti.phone = '+91 9876543210';
    await kranti.save();
    console.log('Updated Kranti Shantveer profile');
  }

  const chanikya = await User.findOne({ email: 'chanukya110@gmail.com' });
  if (chanikya) {
    chanikya.name = 'Chanikya Battu';
    chanikya.department = 'Founder & Executive Leadership';
    chanikya.phone = '+91 9876543211';
    await chanikya.save();
    console.log('Updated Chanikya Battu profile');
  }

  const sarah = await User.findOne({ email: 'sarah@crmpro.com' });
  if (sarah) {
    sarah.name = 'Admissions Office';
    sarah.email = 'admissions@arshithbootcamp.com';
    sarah.department = 'Admissions & Onboarding';
    sarah.phone = '+91 9876543212';
    await sarah.save();
    console.log('Updated Sarah -> Admissions Office');
  }

  const mike = await User.findOne({ email: 'mike@crmpro.com' });
  if (mike) {
    mike.name = 'Technical Mentor Lead';
    mike.email = 'mentors@arshithbootcamp.com';
    mike.department = 'Technical Mentorship';
    mike.phone = '+91 9876543213';
    await mike.save();
    console.log('Updated Mike -> Technical Mentor Lead');
  }

  const emily = await User.findOne({ email: 'emily@crmpro.com' });
  if (emily) {
    emily.name = 'Student Care Team';
    emily.email = 'care@arshithbootcamp.com';
    emily.department = 'Student Care';
    emily.phone = '+91 9876543214';
    await emily.save();
    console.log('Updated Emily -> Student Care Team');
  }

  const james = await User.findOne({ email: 'james@crmpro.com' });
  if (james) {
    james.name = 'Bootcamp Instructor Lead';
    james.email = 'training@arshithbootcamp.com';
    james.department = 'Curriculum & Code Training';
    james.phone = '+91 9876543215';
    await james.save();
    console.log('Updated James -> Bootcamp Instructor Lead');
  }

  const lisa = await User.findOne({ email: 'lisa@crmpro.com' });
  if (lisa) {
    lisa.name = 'Placement & Career Cell';
    lisa.email = 'placement@arshithbootcamp.com';
    lisa.department = 'Placement & Career Guidance';
    lisa.phone = '+91 9876543216';
    await lisa.save();
    console.log('Updated Lisa -> Placement & Career Cell');
  }

  // 2. Replace mock corporate tickets with authentic Arshith Boot Camp Student Care tickets
  await Ticket.deleteMany({});
  console.log('Cleared legacy corporate tickets');

  const defaultAssignee = kranti || await User.findOne();

  await Ticket.create([
    {
      ticketNumber: 'CARE-1001',
      subject: 'Python Track Dashboard Access & Discord Community Link',
      customerName: 'Vaibhav Biradar',
      customerEmail: 'krantishantveer05@gmail.com',
      category: 'Service Request',
      priority: 'High',
      status: 'In Progress',
      assignedTo: defaultAssignee ? defaultAssignee._id : null,
      description: 'Student requested Discord invite and access to the live code repository for Python track.',
      resolutionNotes: 'Verification completed. Discord community invite sent to registered email.'
    },
    {
      ticketNumber: 'CARE-1002',
      subject: 'Orientation Session Schedule & Live Batch Timing',
      customerName: 'Rushikesh S',
      customerEmail: 'rushikeshswami2004@gmail.com',
      category: 'General Inquiry',
      priority: 'Medium',
      status: 'Open',
      assignedTo: defaultAssignee ? defaultAssignee._id : null,
      description: 'Learner inquiring about morning vs evening slot allocation for SQL Mastery live sessions.'
    },
    {
      ticketNumber: 'CARE-1003',
      subject: 'Capstone Project Evaluation & Completion Certificate',
      customerName: 'PANGA YASHWANT',
      customerEmail: 'pyashwant2002@gmail.com',
      category: 'Technical Issue',
      priority: 'Low',
      status: 'Resolved',
      assignedTo: defaultAssignee ? defaultAssignee._id : null,
      description: 'Submitted final capstone project. Requested code review and verified certificate issuance.',
      resolutionNotes: 'Reviewed by Technical Mentor. Grade: A. Certificate generated and mailed.'
    }
  ]);
  console.log('Created 3 Arshith Boot Camp Student Care requests');

  process.exit(0);
}

updateToArshithBootcamp().catch(err => {
  console.error(err);
  process.exit(1);
});
