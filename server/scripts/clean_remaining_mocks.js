const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Contact = require('../models/Contact');
const Company = require('../models/Company');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const company = await Company.findOne({ name: 'Arshith Boot Camp' });
  const otherContacts = await Contact.find({ company: { $ne: company._id } }).populate('company').lean();
  console.log(`Other contacts count: ${otherContacts.length}`);
  otherContacts.forEach(c => console.log(`${c.firstName} ${c.lastName} | ${c.email} | ${c.company?.name}`));

  // If these are just other mock template contacts (e.g. from seed data), we should delete them as well!
  if (otherContacts.length > 0) {
    const deleted = await Contact.deleteMany({ company: { $ne: company._id } });
    console.log(`Deleted ${deleted.deletedCount} remaining non-bootcamp mock contacts.`);
  }

  const finalTotal = await Contact.countDocuments();
  console.log(`Final total contacts (all Arshith Boot Camp): ${finalTotal}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

