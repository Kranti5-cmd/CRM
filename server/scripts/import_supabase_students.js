const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Lead = require('../models/Lead');
const User = require('../models/User');

function normalizeCourse(slug) {
  if (!slug) return 'Foundations Track';
  const map = {
    'python-programming': 'Python Programming',
    'web-development': 'Web Development',
    'sql-mastery': 'SQL Mastery',
    'data-science-ai': 'AI & Data Science',
    'ai-data-science': 'AI & Data Science',
    'python': 'Python Programming',
    'web': 'Web Development',
    'sql': 'SQL Mastery'
  };
  const key = String(slug).toLowerCase().trim();
  return map[key] || slug;
}

async function runMigration() {
  console.log('=== STARTING SUPABASE HISTORICAL STUDENT MIGRATION ===\n');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in server/.env');
    process.exit(1);
  }

  // 1. Fetch live data from Supabase app_state
  console.log('[1/4] Fetching all collections from Supabase:', url);
  const res = await fetch(url + '/rest/v1/app_state?select=key,data', {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key
    }
  });

  if (!res.ok) {
    console.error('Failed to read from Supabase:', res.status, await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  const db = Object.fromEntries(rows.map(r => [r.key, r.data]));

  const rawStudents = db.students || [];
  const rawLearners = db.learners || {};
  const payments = db.payments || [];
  const enrollments = db.learnerEnrollments || {};

  console.log(`[1/4] Loaded: ${rawStudents.length} students, ${Object.keys(rawLearners).length} learners, ${payments.length} payment records, ${Object.keys(enrollments).length} enrollments.\n`);

  // 2. Connect to MongoDB Atlas
  console.log('[2/4] Connecting to live MongoDB Atlas cluster...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas host:', mongoose.connection.host);

  const defaultUser = await User.findOne({ role: { $in: ['Manager', 'Admin'] } });
  console.log('Default assigned counselor:', defaultUser?.name, '(' + defaultUser?.email + ')\n');

  // Merge students and learners into a unified map by normalized email
  const studentMap = new Map();

  // A. Add from students array
  for (const s of rawStudents) {
    const email = String(s.email || '').trim().toLowerCase();
    if (!email) continue;
    studentMap.set(email, {
      id: s.id || '',
      name: s.name || '',
      email,
      phone: s.phone || '',
      regNo: s.regNo || '',
      status: s.status || 'active',
      joinDate: s.joinDate || s.createdAt || '',
      enrolledCourses: Array.isArray(s.enrolledCourses) ? s.enrolledCourses : []
    });
  }

  // B. Merge from learners dictionary
  for (const [lEmail, l] of Object.entries(rawLearners)) {
    const email = String(lEmail || l.email || '').trim().toLowerCase();
    if (!email) continue;
    const existing = studentMap.get(email) || {};
    studentMap.set(email, {
      id: existing.id || l.learnerId || '',
      name: existing.name || l.name || '',
      email,
      phone: existing.phone || l.phone || '',
      regNo: existing.regNo || l.regNo || '',
      status: existing.status || (l.emailVerified ? 'active' : 'pending'),
      joinDate: existing.joinDate || l.createdAt || '',
      enrolledCourses: existing.enrolledCourses || []
    });
  }

  console.log(`[3/4] Unified unique student accounts to migrate: ${studentMap.size}`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [email, s] of studentMap.entries()) {
    try {
      // Determine enrolled course
      let courseSlug = '';
      if (s.enrolledCourses && s.enrolledCourses.length > 0) {
        courseSlug = s.enrolledCourses[0];
      } else if (enrollments[email]) {
        courseSlug = enrollments[email].courseId || Object.keys(enrollments[email].courses || {})[0] || '';
      }
      const courseName = normalizeCourse(courseSlug);

      // Determine payment status
      const studentPayments = payments.filter(p => String(p.email || '').toLowerCase() === email);
      let paymentStatus = 'Free';
      let value = 0;
      if (studentPayments.some(p => p.status === 'SUCCESS' || p.status === 'paid' || p.status === 'captured')) {
        paymentStatus = 'Paid';
        value = 99;
      } else if (studentPayments.length > 0) {
        paymentStatus = 'Pending';
      }

      // Determine registration date
      const regDate = s.joinDate ? new Date(s.joinDate) : new Date();

      // Check for existing lead in CRM (Deduplication)
      let lead = await Lead.findOne({ email });

      if (lead) {
        // Update existing record with bootcamp details without overwriting custom staff notes
        lead.studentId = s.id || lead.studentId;
        lead.phone = s.phone || lead.phone;
        lead.courseName = courseName || lead.courseName;
        lead.paymentStatus = paymentStatus !== 'Free' ? paymentStatus : lead.paymentStatus;
        lead.registrationStatus = 'Enrolled';
        if (!lead.tags.includes('Arshith Boot Camp')) lead.tags.push('Arshith Boot Camp');
        if (courseName && !lead.tags.includes(courseName)) lead.tags.push(courseName);
        await lead.save();
        updated++;
      } else {
        // Create new student lead
        await Lead.create({
          fullName: s.name || email.split('@')[0],
          email,
          phone: s.phone || '',
          companyName: 'Arshith Boot Camp',
          leadSource: 'Arshith Boot Camp',
          leadStatus: 'Converted',
          priority: 'Medium',
          assignedTo: defaultUser ? defaultUser._id : null,
          value,
          studentId: s.id || `ARB-STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          courseName,
          registrationDate: regDate,
          paymentStatus,
          registrationStatus: 'Enrolled',
          notes: `Imported from live CodeLekho Supabase. RegNo: ${s.regNo || 'N/A'}. Enrolled on ${regDate.toLocaleDateString()}`,
          tags: ['Arshith Boot Camp', courseName]
        });
        imported++;
      }
    } catch (itemErr) {
      failed++;
      console.error(`  Error importing ${email}:`, itemErr.message);
    }
  }

  console.log('\n[4/4] MIGRATION COMPLETED!');
  console.log('--------------------------------------------------');
  console.log(`Total Unified Students : ${studentMap.size}`);
  console.log(`Newly Imported Leads   : ${imported}`);
  console.log(`Updated Existing Leads : ${updated}`);
  console.log(`Skipped / Duplicates   : ${skipped}`);
  console.log(`Failed                 : ${failed}`);
  console.log('--------------------------------------------------');

  const totalBootcampInAtlas = await Lead.countDocuments({ leadSource: 'Arshith Boot Camp' });
  const totalLeadsInAtlas = await Lead.countDocuments();
  console.log(`Total Arshith Boot Camp Leads in Atlas : ${totalBootcampInAtlas}`);
  console.log(`Total Leads in Atlas Database          : ${totalLeadsInAtlas}`);

  await mongoose.disconnect();
  console.log('\nAtlas database disconnected cleanly.');
}

runMigration().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});

