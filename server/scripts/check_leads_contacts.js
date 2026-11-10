const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const leadCount = await Lead.countDocuments();
  const bootcampLeads = await Lead.countDocuments({
    $or: [{ source: 'Bootcamp' }, { studentId: { $exists: true, $ne: null } }]
  });
  const contactCount = await Contact.countDocuments();
  console.log('Counts:', { leadCount, bootcampLeads, contactCount });

  const sampleLead = await Lead.findOne({ studentId: { $exists: true, $ne: null } }).lean();
  console.log('Sample Bootcamp Lead:', JSON.stringify(sampleLead, null, 2));

  const sampleContact = await Contact.findOne().populate('company').lean();
  console.log('Sample Contact:', JSON.stringify(sampleContact, null, 2));

  const allContacts = await Contact.find().select('firstName lastName email company position').lean();
  console.log('Current contacts count:', allContacts.length);
  console.log('Current contacts first 3:', allContacts.slice(0, 3));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
