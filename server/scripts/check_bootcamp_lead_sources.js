const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Lead = require('../models/Lead');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const leadsWithSource = await Lead.countDocuments({ leadSource: 'Arshith Boot Camp' });
  const allBootcampLeads = await Lead.countDocuments({
    $or: [
      { companyName: /Arshith/i },
      { leadSource: /Arshith/i },
      { tags: 'Arshith Boot Camp' },
      { studentId: { $exists: true, $ne: '' } }
    ]
  });
  console.log({ leadsWithSource, allBootcampLeads });

  const nonSource = await Lead.find({
    $or: [
      { companyName: /Arshith/i },
      { tags: 'Arshith Boot Camp' },
      { studentId: { $exists: true, $ne: '' } }
    ],
    leadSource: { $ne: 'Arshith Boot Camp' }
  }).select('fullName email leadSource companyName studentId').lean();

  console.log('Bootcamp leads with different leadSource:', nonSource);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

