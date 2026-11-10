const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Company = require('../models/Company');
const User = require('../models/User');

async function populateHiringPartners() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const placementLead = await User.findOne({ email: 'placement@arshithbootcamp.com' }) 
    || await User.findOne({ email: 'krantishantveer@gmail.com' });

  // Keep Arshith Boot Camp as the primary parent institution
  let primaryBootcamp = await Company.findOne({ name: 'Arshith Boot Camp' });
  if (primaryBootcamp) {
    primaryBootcamp.industry = 'EdTech & Software Development';
    primaryBootcamp.notes = 'Primary training institution and in-house placement partner for all 121 enrolled students.';
    await primaryBootcamp.save();
    console.log('Updated primary Arshith Boot Camp company record');
  } else {
    primaryBootcamp = await Company.create({
      name: 'Arshith Boot Camp',
      industry: 'EdTech & Software Development',
      website: 'https://arshithbootcamp.com/',
      email: 'bootcamp@arshithgroup.com',
      phone: '+91 9876543210',
      size: '51-200',
      assignedTo: placementLead?._id,
      notes: 'Primary training institution and in-house placement partner for all 121 enrolled students.',
      isActive: true
    });
  }

  // Real tech hiring partners for Arshith Boot Camp graduates
  const partners = [
    {
      name: 'Arshith Technologies (Arshith Group)',
      industry: 'Technology & IT Services',
      website: 'https://arshithgroup.com/',
      email: 'careers@arshithgroup.com',
      phone: '+91 9876543210',
      size: '51-200',
      notes: 'Direct in-house hiring partner for Python, Web Development, and AI graduates.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Zoho Corporation',
      industry: 'SaaS & Cloud Computing',
      website: 'https://www.zoho.com',
      email: 'campus@zoho.com',
      phone: '+91 44 67447070',
      size: '1000+',
      notes: 'Corporate recruiter for Full Stack Web Development and Python engineers.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Razorpay Payments',
      industry: 'FinTech & Payments',
      website: 'https://razorpay.com',
      email: 'university-hiring@razorpay.com',
      phone: '+91 80 46669555',
      size: '501-1000',
      notes: 'Hiring partner for Backend Developers, Python, and SQL Mastery learners.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Freshworks Technologies',
      industry: 'Enterprise Software',
      website: 'https://www.freshworks.com',
      email: 'talent@freshworks.com',
      phone: '+91 44 66678000',
      size: '1000+',
      notes: 'Annual recruitment drive partner for Frontend & Full Stack graduates.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Thoughtworks India',
      industry: 'Software Consultancy',
      website: 'https://www.thoughtworks.com',
      email: 'graduates-india@thoughtworks.com',
      phone: '+91 80 67104000',
      size: '1000+',
      notes: 'Technology recruitment partner for clean coding & web dev trainees.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Swiggy Tech Labs',
      industry: 'Consumer Tech & Logistics',
      website: 'https://swiggy.com',
      email: 'tech-campus@swiggy.com',
      phone: '+91 80 67466720',
      size: '1000+',
      notes: 'Internship & junior developer hiring partner for Arshith Boot Camp.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Infosys Springboard Partner',
      industry: 'IT Services & Consulting',
      website: 'https://www.infosys.com',
      email: 'springboard-partners@infosys.com',
      phone: '+91 80 28520261',
      size: '1000+',
      notes: 'Industry certification and campus hiring channel for Python & AI learners.',
      assignedTo: placementLead?._id,
      isActive: true
    },
    {
      name: 'Tata Consultancy Services (TCS)',
      industry: 'IT Services & Solutions',
      website: 'https://www.tcs.com',
      email: 'careers@tcs.com',
      phone: '+91 22 67789999',
      size: '1000+',
      notes: 'Corporate tech hiring partner for qualified boot camp graduates.',
      assignedTo: placementLead?._id,
      isActive: true
    }
  ];

  for (const p of partners) {
    await Company.findOneAndUpdate(
      { name: p.name },
      { $set: p },
      { upsert: true, new: true }
    );
  }

  const finalCompanies = await Company.countDocuments();
  console.log(`Total Hiring Partners & Companies now: ${finalCompanies}`);
  process.exit(0);
}

populateHiringPartners().catch(err => {
  console.error(err);
  process.exit(1);
});

