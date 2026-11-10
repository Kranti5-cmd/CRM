const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Supabase check
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  let supabaseStudentCount = 0;
  if (url && key) {
    const res = await fetch(url + '/rest/v1/app_state?select=key,data', {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    const rows = await res.json();
    const db = Object.fromEntries(rows.map(r => [r.key, r.data]));
    const rawStudents = db.students || [];
    const rawLearners = db.learners || {};
    const studentMap = new Map();
    for (const s of rawStudents) {
      const email = String(s.email || '').trim().toLowerCase();
      if (email) studentMap.set(email, s);
    }
    for (const [lEmail, l] of Object.entries(rawLearners)) {
      const email = String(lEmail || l.email || '').trim().toLowerCase();
      if (email) studentMap.set(email, l);
    }
    supabaseStudentCount = studentMap.size;
  }

  const allLeads = await Lead.find().lean();
  const bootcampLeads = allLeads.filter(l => 
    l.companyName?.includes('Arshith') || 
    l.leadSource?.includes('Arshith') || 
    l.tags?.includes('Arshith Boot Camp') || 
    (l.studentId && l.studentId !== '')
  );

  const nonBootcampLeads = allLeads.filter(l => !bootcampLeads.includes(l));

  const totalContacts = await Contact.countDocuments();
  const totalDeals = await Deal.countDocuments();

  console.log({
    supabaseUniqueStudents: supabaseStudentCount,
    allLeadsInMongo: allLeads.length,
    bootcampLeadsInMongo: bootcampLeads.length,
    nonBootcampLeadsInMongo: nonBootcampLeads.length,
    totalContactsInMongo: totalContacts,
    totalDealsInMongo: totalDeals
  });

  console.log('Sample non-bootcamp leads (first 5):');
  nonBootcampLeads.slice(0, 5).forEach(l => console.log(`- ${l.fullName} | ${l.email} | ${l.companyName} | ${l.leadSource}`));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

