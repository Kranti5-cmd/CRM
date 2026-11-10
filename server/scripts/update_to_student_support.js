const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

async function updateSupport() {
  await mongoose.connect(process.env.MONGODB_URI);

  const kranti = await User.findOne({ email: 'krantishantveer@gmail.com' });
  if (kranti) {
    kranti.department = 'Admissions & Student Support Lead';
    await kranti.save();
    console.log('Updated Kranti department to Student Support');
  }

  const emily = await User.findOne({ email: { $in: ['care@arshithbootcamp.com', 'emily@crmpro.com'] } });
  if (emily) {
    emily.name = 'Student Support Team';
    emily.email = 'support@arshithbootcamp.com';
    emily.department = 'Student Support';
    await emily.save();
    console.log('Updated Support Team profile in DB');
  }

  process.exit(0);
}

updateSupport().catch(err => {
  console.error(err);
  process.exit(1);
});

