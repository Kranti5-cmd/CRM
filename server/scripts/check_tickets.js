const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Ticket = require('../models/Ticket');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tickets = await Ticket.find().lean();
  console.log(`Tickets count: ${tickets.length}`);
  tickets.forEach(t => console.log(`- [${t.ticketNumber}] ${t.subject} | ${t.customerName} (${t.customerEmail}) | ${t.status}`));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

