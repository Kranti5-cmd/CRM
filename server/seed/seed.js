const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const connectDB = require('../config/db');

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB. Clearing existing data...');

    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Contact.deleteMany({}),
      Company.deleteMany({}),
      Deal.deleteMany({}),
      Task.deleteMany({}),
      Activity.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('All collections cleared.');

    // ---------- USERS ----------
    const users = await User.create([
      { name: 'Sarah Johnson', email: 'sarah@crmpro.com', password: 'password123', role: 'Admin', phone: '(555) 100-1001', department: 'Management', salesTarget: 500000, isActive: true },
      { name: 'Mike Chen', email: 'mike@crmpro.com', password: 'password123', role: 'Manager', phone: '(555) 100-1002', department: 'Sales', salesTarget: 400000, isActive: true },
      { name: 'Emily Davis', email: 'emily@crmpro.com', password: 'password123', role: 'Sales Representative', phone: '(555) 100-1003', department: 'Sales', salesTarget: 300000, isActive: true },
      { name: 'James Wilson', email: 'james@crmpro.com', password: 'password123', role: 'Sales Representative', phone: '(555) 100-1004', department: 'Sales', salesTarget: 300000, isActive: true },
      { name: 'Lisa Anderson', email: 'lisa@crmpro.com', password: 'password123', role: 'Sales Representative', phone: '(555) 100-1005', department: 'Sales', salesTarget: 250000, isActive: true },
    ]);
    console.log(`Created ${users.length} users`);
    const [sarah, mike, emily, james, lisa] = users;

    // ---------- COMPANIES ----------
    const companies = await Company.create([
      { name: 'TechFlow Solutions', industry: 'Technology', website: 'https://techflow.com', email: 'info@techflow.com', phone: '(555) 200-2001', address: { street: '100 Innovation Dr', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94105' }, size: '51-200', revenue: 12000000, assignedTo: emily._id, notes: 'Enterprise SaaS company' },
      { name: 'GreenLeaf Industries', industry: 'Manufacturing', website: 'https://greenleaf.com', email: 'contact@greenleaf.com', phone: '(555) 200-2002', address: { street: '250 Oak Blvd', city: 'Portland', state: 'OR', country: 'USA', zipCode: '97201' }, size: '201-500', revenue: 45000000, assignedTo: james._id, notes: 'Sustainable manufacturing' },
      { name: 'Pinnacle Financial Group', industry: 'Finance', website: 'https://pinnaclefg.com', email: 'hello@pinnaclefg.com', phone: '(555) 200-2003', address: { street: '500 Wall St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10005' }, size: '500+', revenue: 120000000, assignedTo: mike._id, notes: 'Investment banking' },
      { name: 'CloudNine Media', industry: 'Media & Entertainment', website: 'https://cloudnine.media', email: 'info@cloudnine.media', phone: '(555) 200-2004', address: { street: '800 Sunset Blvd', city: 'Los Angeles', state: 'CA', country: 'USA', zipCode: '90028' }, size: '11-50', revenue: 5000000, assignedTo: emily._id, notes: 'Digital marketing agency' },
      { name: 'HealthBridge Corp', industry: 'Healthcare', website: 'https://healthbridge.com', email: 'support@healthbridge.com', phone: '(555) 200-2005', address: { street: '300 Medical Plaza', city: 'Boston', state: 'MA', country: 'USA', zipCode: '02101' }, size: '201-500', revenue: 85000000, assignedTo: lisa._id, notes: 'Healthcare technology' },
      { name: 'Atlas Logistics', industry: 'Transportation', website: 'https://atlaslogistics.com', email: 'ops@atlaslogistics.com', phone: '(555) 200-2006', address: { street: '1200 Freight Way', city: 'Chicago', state: 'IL', country: 'USA', zipCode: '60601' }, size: '500+', revenue: 200000000, assignedTo: james._id, notes: 'Global supply chain' },
      { name: 'Quantum Education', industry: 'Education', website: 'https://quantumedu.com', email: 'info@quantumedu.com', phone: '(555) 200-2007', address: { street: '45 Learning Ln', city: 'Austin', state: 'TX', country: 'USA', zipCode: '78701' }, size: '11-50', revenue: 3000000, assignedTo: emily._id, notes: 'EdTech startup' },
      { name: 'Apex Consulting', industry: 'Consulting', website: 'https://apexconsulting.com', email: 'hello@apexconsulting.com', phone: '(555) 200-2008', address: { street: '900 Strategy Ave', city: 'Washington', state: 'DC', country: 'USA', zipCode: '20001' }, size: '51-200', revenue: 25000000, assignedTo: mike._id, notes: 'Management consulting' },
      { name: 'Skyline Properties', industry: 'Real Estate', website: 'https://skylineprops.com', email: 'sales@skylineprops.com', phone: '(555) 200-2009', address: { street: '1500 Tower Rd', city: 'Miami', state: 'FL', country: 'USA', zipCode: '33101' }, size: '51-200', revenue: 50000000, assignedTo: lisa._id, notes: 'Commercial real estate' },
      { name: 'NovaByte Software', industry: 'Technology', website: 'https://novabyte.io', email: 'contact@novabyte.io', phone: '(555) 200-2010', address: { street: '200 Code St', city: 'Seattle', state: 'WA', country: 'USA', zipCode: '98101' }, size: '1-10', revenue: 800000, assignedTo: james._id, notes: 'Early-stage startup' },
    ]);
    console.log(`Created ${companies.length} companies`);

    // ---------- CONTACTS ----------
    const contacts = await Contact.create([
      { firstName: 'Robert', lastName: 'Martinez', email: 'robert@techflow.com', phone: '(555) 300-3001', company: companies[0]._id, position: 'CTO', department: 'Engineering', assignedTo: emily._id, notes: 'Key decision maker', isActive: true },
      { firstName: 'Jennifer', lastName: 'Lee', email: 'jennifer@greenleaf.com', phone: '(555) 300-3002', company: companies[1]._id, position: 'VP of Operations', department: 'Operations', assignedTo: james._id, notes: 'Budget holder', isActive: true },
      { firstName: 'David', lastName: 'Thompson', email: 'david@pinnaclefg.com', phone: '(555) 300-3003', company: companies[2]._id, position: 'Managing Director', department: 'Finance', assignedTo: mike._id, notes: 'Executive sponsor', isActive: true },
      { firstName: 'Amanda', lastName: 'White', email: 'amanda@cloudnine.media', phone: '(555) 300-3004', company: companies[3]._id, position: 'CEO', department: 'Executive', assignedTo: emily._id, isActive: true },
      { firstName: 'Michael', lastName: 'Brown', email: 'michael@healthbridge.com', phone: '(555) 300-3005', company: companies[4]._id, position: 'VP of IT', department: 'IT', assignedTo: lisa._id, notes: 'Technical evaluator', isActive: true },
      { firstName: 'Sarah', lastName: 'Garcia', email: 'sarah@atlaslogistics.com', phone: '(555) 300-3006', company: companies[5]._id, position: 'Director of Procurement', department: 'Procurement', assignedTo: james._id, isActive: true },
      { firstName: 'Chris', lastName: 'Taylor', email: 'chris@quantumedu.com', phone: '(555) 300-3007', company: companies[6]._id, position: 'Founder', department: 'Executive', assignedTo: emily._id, isActive: true },
      { firstName: 'Rachel', lastName: 'Kim', email: 'rachel@apexconsulting.com', phone: '(555) 300-3008', company: companies[7]._id, position: 'Partner', department: 'Consulting', assignedTo: mike._id, isActive: true },
      { firstName: 'Daniel', lastName: 'Moore', email: 'daniel@skylineprops.com', phone: '(555) 300-3009', company: companies[8]._id, position: 'VP of Sales', department: 'Sales', assignedTo: lisa._id, isActive: true },
      { firstName: 'Kevin', lastName: 'Harris', email: 'kevin@novabyte.io', phone: '(555) 300-3010', company: companies[9]._id, position: 'CEO', department: 'Executive', assignedTo: james._id, isActive: true },
      { firstName: 'Laura', lastName: 'Clark', email: 'laura@techflow.com', phone: '(555) 300-3011', company: companies[0]._id, position: 'Product Manager', department: 'Product', assignedTo: emily._id, isActive: true },
      { firstName: 'Andrew', lastName: 'Lewis', email: 'andrew@pinnaclefg.com', phone: '(555) 300-3012', company: companies[2]._id, position: 'CFO', department: 'Finance', assignedTo: mike._id, isActive: true },
      { firstName: 'Jessica', lastName: 'Walker', email: 'jessica@healthbridge.com', phone: '(555) 300-3013', company: companies[4]._id, position: 'CEO', department: 'Executive', assignedTo: lisa._id, isActive: true },
      { firstName: 'Tom', lastName: 'Robinson', email: 'tom@greenleaf.com', phone: '(555) 300-3014', company: companies[1]._id, position: 'CIO', department: 'IT', assignedTo: james._id, isActive: true },
      { firstName: 'Natalie', lastName: 'Young', email: 'natalie@cloudnine.media', phone: '(555) 300-3015', company: companies[3]._id, position: 'Marketing Director', department: 'Marketing', assignedTo: emily._id, isActive: true },
    ]);
    console.log(`Created ${contacts.length} contacts`);

    // Helper to generate past dates spread across last 6 months
    const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const futureDate = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // ---------- LEADS ----------
    const leadData = [
      { fullName: 'Alex Rivera', email: 'alex.rivera@startup.io', phone: '(555) 400-4001', companyName: 'RiverTech', leadSource: 'Website', leadStatus: 'New', priority: 'High', assignedTo: emily._id, value: 25000, nextFollowUp: futureDate(2), notes: 'Interested in enterprise plan', createdAt: daysAgo(3) },
      { fullName: 'Sophia Zhang', email: 'sophia@zhang-corp.com', phone: '(555) 400-4002', companyName: 'Zhang Corp', leadSource: 'Referral', leadStatus: 'Contacted', priority: 'Medium', assignedTo: james._id, value: 50000, nextFollowUp: futureDate(5), createdAt: daysAgo(10) },
      { fullName: 'Marcus Johnson', email: 'marcus@bigdata.co', phone: '(555) 400-4003', companyName: 'BigData Co', leadSource: 'Social Media', leadStatus: 'Qualified', priority: 'High', assignedTo: emily._id, value: 75000, nextFollowUp: futureDate(1), createdAt: daysAgo(25) },
      { fullName: 'Olivia Foster', email: 'ofoster@globaltrends.com', phone: '(555) 400-4004', companyName: 'Global Trends', leadSource: 'Cold Call', leadStatus: 'Proposal Sent', priority: 'Critical', assignedTo: mike._id, value: 120000, nextFollowUp: futureDate(3), createdAt: daysAgo(40) },
      { fullName: 'Nathan Brooks', email: 'nathan@brooks-media.com', phone: '(555) 400-4005', companyName: 'Brooks Media', leadSource: 'Email Campaign', leadStatus: 'Negotiation', priority: 'High', assignedTo: lisa._id, value: 95000, nextFollowUp: futureDate(1), createdAt: daysAgo(55) },
      { fullName: 'Emma Sullivan', email: 'emma@design-first.co', phone: '(555) 400-4006', companyName: 'Design First', leadSource: 'Website', leadStatus: 'Converted', priority: 'Medium', assignedTo: emily._id, value: 35000, createdAt: daysAgo(80) },
      { fullName: 'Liam O\'Brien', email: 'liam@fincraft.io', phone: '(555) 400-4007', companyName: 'FinCraft', leadSource: 'Trade Show', leadStatus: 'Converted', priority: 'High', assignedTo: james._id, value: 200000, createdAt: daysAgo(90) },
      { fullName: 'Ava Mitchell', email: 'ava@nexwave.com', phone: '(555) 400-4008', companyName: 'NexWave', leadSource: 'Referral', leadStatus: 'Lost', priority: 'Low', assignedTo: lisa._id, value: 15000, notes: 'Went with competitor', createdAt: daysAgo(100) },
      { fullName: 'Ethan Carter', email: 'ethan@cartergroup.com', phone: '(555) 400-4009', companyName: 'Carter Group', leadSource: 'Advertisement', leadStatus: 'Qualified', priority: 'Medium', assignedTo: emily._id, value: 45000, nextFollowUp: futureDate(7), createdAt: daysAgo(15) },
      { fullName: 'Isabella Reed', email: 'isabella@reedholdings.com', phone: '(555) 400-4010', companyName: 'Reed Holdings', leadSource: 'Website', leadStatus: 'Contacted', priority: 'High', assignedTo: james._id, value: 60000, nextFollowUp: futureDate(4), createdAt: daysAgo(7) },
      { fullName: 'William Park', email: 'wpark@sunriseinc.com', phone: '(555) 400-4011', companyName: 'Sunrise Inc', leadSource: 'Social Media', leadStatus: 'New', priority: 'Low', assignedTo: lisa._id, value: 20000, createdAt: daysAgo(1) },
      { fullName: 'Mia Rodriguez', email: 'mia@rodriguezco.com', phone: '(555) 400-4012', companyName: 'Rodriguez & Co', leadSource: 'Referral', leadStatus: 'Proposal Sent', priority: 'Medium', assignedTo: emily._id, value: 80000, nextFollowUp: futureDate(2), createdAt: daysAgo(30) },
      { fullName: 'Benjamin Scott', email: 'ben@scottsolutions.com', phone: '(555) 400-4013', companyName: 'Scott Solutions', leadSource: 'Cold Call', leadStatus: 'New', priority: 'Medium', assignedTo: james._id, value: 30000, createdAt: daysAgo(5) },
      { fullName: 'Charlotte Evans', email: 'charlotte@evansgroup.com', phone: '(555) 400-4014', companyName: 'Evans Group', leadSource: 'Email Campaign', leadStatus: 'Contacted', priority: 'Low', assignedTo: mike._id, value: 22000, nextFollowUp: futureDate(10), createdAt: daysAgo(20) },
      { fullName: 'Alexander Kim', email: 'akim@kimdigital.com', phone: '(555) 400-4015', companyName: 'Kim Digital', leadSource: 'Website', leadStatus: 'Qualified', priority: 'High', assignedTo: lisa._id, value: 110000, nextFollowUp: futureDate(3), createdAt: daysAgo(35) },
      { fullName: 'Harper Lewis', email: 'harper@lewisventures.com', phone: '(555) 400-4016', companyName: 'Lewis Ventures', leadSource: 'Trade Show', leadStatus: 'Negotiation', priority: 'Critical', assignedTo: emily._id, value: 180000, nextFollowUp: futureDate(1), createdAt: daysAgo(50) },
      { fullName: 'Daniel Cooper', email: 'dcooper@cooperinc.com', phone: '(555) 400-4017', companyName: 'Cooper Inc', leadSource: 'Referral', leadStatus: 'Converted', priority: 'Medium', assignedTo: james._id, value: 55000, createdAt: daysAgo(110) },
      { fullName: 'Abigail Morgan', email: 'abigail@morgangroup.com', phone: '(555) 400-4018', companyName: 'Morgan Group', leadSource: 'Advertisement', leadStatus: 'Lost', priority: 'Low', assignedTo: lisa._id, value: 40000, createdAt: daysAgo(70) },
      { fullName: 'Lucas Turner', email: 'lucas@turnermedia.com', phone: '(555) 400-4019', companyName: 'Turner Media', leadSource: 'Social Media', leadStatus: 'New', priority: 'Medium', assignedTo: emily._id, value: 28000, createdAt: daysAgo(2) },
      { fullName: 'Ella Phillips', email: 'ella@phillipslaw.com', phone: '(555) 400-4020', companyName: 'Phillips Law', leadSource: 'Website', leadStatus: 'Converted', priority: 'High', assignedTo: mike._id, value: 150000, createdAt: daysAgo(120) },
      { fullName: 'Jack Sanders', email: 'jack@sandersgroup.com', phone: '(555) 400-4021', companyName: 'Sanders Group', leadSource: 'Cold Call', leadStatus: 'Contacted', priority: 'Medium', assignedTo: james._id, value: 42000, nextFollowUp: futureDate(6), createdAt: daysAgo(12) },
      { fullName: 'Grace Bennett', email: 'grace@bennettdesign.com', phone: '(555) 400-4022', companyName: 'Bennett Design', leadSource: 'Email Campaign', leadStatus: 'Qualified', priority: 'Low', assignedTo: lisa._id, value: 18000, nextFollowUp: futureDate(8), createdAt: daysAgo(28) },
      { fullName: 'Henry Collins', email: 'henry@collinsinc.com', phone: '(555) 400-4023', companyName: 'Collins Inc', leadSource: 'Referral', leadStatus: 'Proposal Sent', priority: 'High', assignedTo: emily._id, value: 92000, nextFollowUp: futureDate(2), createdAt: daysAgo(45) },
      { fullName: 'Zoe Murphy', email: 'zoe@murphytech.com', phone: '(555) 400-4024', companyName: 'Murphy Tech', leadSource: 'Website', leadStatus: 'Negotiation', priority: 'Critical', assignedTo: mike._id, value: 250000, nextFollowUp: futureDate(1), createdAt: daysAgo(60) },
      { fullName: 'Sebastian Price', email: 'seb@pricepoint.com', phone: '(555) 400-4025', companyName: 'PricePoint', leadSource: 'Trade Show', leadStatus: 'New', priority: 'High', assignedTo: james._id, value: 65000, createdAt: daysAgo(4) },
      { fullName: 'Chloe Howard', email: 'chloe@howardai.com', phone: '(555) 400-4026', companyName: 'Howard AI', leadSource: 'Social Media', leadStatus: 'Contacted', priority: 'Medium', assignedTo: lisa._id, value: 38000, nextFollowUp: futureDate(5), createdAt: daysAgo(8) },
      { fullName: 'Owen Stewart', email: 'owen@stewartco.com', phone: '(555) 400-4027', companyName: 'Stewart & Co', leadSource: 'Advertisement', leadStatus: 'Converted', priority: 'High', assignedTo: emily._id, value: 88000, createdAt: daysAgo(130) },
      { fullName: 'Lily Barnes', email: 'lily@barnesretail.com', phone: '(555) 400-4028', companyName: 'Barnes Retail', leadSource: 'Referral', leadStatus: 'Lost', priority: 'Medium', assignedTo: james._id, value: 32000, notes: 'Budget constraints', createdAt: daysAgo(85) },
      { fullName: 'Ryan Foster', email: 'ryan@fosterdigital.com', phone: '(555) 400-4029', companyName: 'Foster Digital', leadSource: 'Website', leadStatus: 'Qualified', priority: 'High', assignedTo: mike._id, value: 72000, nextFollowUp: futureDate(4), createdAt: daysAgo(22) },
      { fullName: 'Victoria Ross', email: 'victoria@rossgroup.com', phone: '(555) 400-4030', companyName: 'Ross Group', leadSource: 'Cold Call', leadStatus: 'New', priority: 'Low', assignedTo: lisa._id, value: 15000, createdAt: daysAgo(1) },
    ];
    const leads = await Lead.insertMany(leadData);
    console.log(`Created ${leads.length} leads`);

    // ---------- DEALS ----------
    const dealData = [
      { title: 'TechFlow Enterprise License', company: companies[0]._id, contact: contacts[0]._id, value: 150000, stage: 'Won', probability: 100, assignedTo: emily._id, expectedCloseDate: daysAgo(10), actualCloseDate: daysAgo(12), notes: 'Annual enterprise license' },
      { title: 'GreenLeaf ERP Implementation', company: companies[1]._id, contact: contacts[1]._id, value: 320000, stage: 'Negotiation', probability: 70, assignedTo: james._id, expectedCloseDate: futureDate(30), notes: 'Full ERP rollout' },
      { title: 'Pinnacle CRM Migration', company: companies[2]._id, contact: contacts[2]._id, value: 250000, stage: 'Proposal', probability: 50, assignedTo: mike._id, expectedCloseDate: futureDate(45), notes: 'Migration from legacy system' },
      { title: 'CloudNine Marketing Suite', company: companies[3]._id, contact: contacts[3]._id, value: 45000, stage: 'Won', probability: 100, assignedTo: emily._id, expectedCloseDate: daysAgo(30), actualCloseDate: daysAgo(28), notes: 'Marketing automation package' },
      { title: 'HealthBridge Patient Portal', company: companies[4]._id, contact: contacts[4]._id, value: 180000, stage: 'Qualification', probability: 30, assignedTo: lisa._id, expectedCloseDate: futureDate(60), notes: 'Patient-facing portal development' },
      { title: 'Atlas Logistics Tracking', company: companies[5]._id, contact: contacts[5]._id, value: 420000, stage: 'New Opportunity', probability: 10, assignedTo: james._id, expectedCloseDate: futureDate(90), notes: 'Real-time shipment tracking' },
      { title: 'Quantum LMS Platform', company: companies[6]._id, contact: contacts[6]._id, value: 35000, stage: 'Won', probability: 100, assignedTo: emily._id, expectedCloseDate: daysAgo(60), actualCloseDate: daysAgo(58), notes: 'Learning management system' },
      { title: 'Apex Analytics Dashboard', company: companies[7]._id, contact: contacts[7]._id, value: 85000, stage: 'Proposal', probability: 45, assignedTo: mike._id, expectedCloseDate: futureDate(20), notes: 'Custom analytics dashboard' },
      { title: 'Skyline Property Management', company: companies[8]._id, contact: contacts[8]._id, value: 200000, stage: 'Negotiation', probability: 75, assignedTo: lisa._id, expectedCloseDate: futureDate(15), notes: 'Property management platform' },
      { title: 'NovaByte MVP Development', company: companies[9]._id, contact: contacts[9]._id, value: 28000, stage: 'Won', probability: 100, assignedTo: james._id, expectedCloseDate: daysAgo(90), actualCloseDate: daysAgo(88), notes: 'MVP development sprint' },
      { title: 'TechFlow Support Contract', company: companies[0]._id, contact: contacts[10]._id, value: 60000, stage: 'Won', probability: 100, assignedTo: emily._id, expectedCloseDate: daysAgo(45), actualCloseDate: daysAgo(43), notes: 'Annual premium support' },
      { title: 'Pinnacle Data Analytics', company: companies[2]._id, contact: contacts[11]._id, value: 175000, stage: 'Qualification', probability: 25, assignedTo: mike._id, expectedCloseDate: futureDate(75), notes: 'Advanced analytics package' },
      { title: 'HealthBridge Telehealth', company: companies[4]._id, contact: contacts[12]._id, value: 300000, stage: 'New Opportunity', probability: 15, assignedTo: lisa._id, expectedCloseDate: futureDate(120), notes: 'Telehealth platform integration' },
      { title: 'GreenLeaf IoT Sensors', company: companies[1]._id, contact: contacts[13]._id, value: 95000, stage: 'Proposal', probability: 55, assignedTo: james._id, expectedCloseDate: futureDate(35), notes: 'IoT sensor integration' },
      { title: 'CloudNine SEO Package', company: companies[3]._id, contact: contacts[14]._id, value: 22000, stage: 'Lost', probability: 0, assignedTo: emily._id, expectedCloseDate: daysAgo(20), notes: 'Went with another provider' },
      { title: 'Atlas Fleet Dashboard', company: companies[5]._id, contact: contacts[5]._id, value: 150000, stage: 'Qualification', probability: 35, assignedTo: james._id, expectedCloseDate: futureDate(50), notes: 'Fleet management dashboard' },
      { title: 'Apex Strategy Portal', company: companies[7]._id, contact: contacts[7]._id, value: 110000, stage: 'Negotiation', probability: 65, assignedTo: mike._id, expectedCloseDate: futureDate(10), notes: 'Strategy collaboration portal' },
      { title: 'Skyline Tenant App', company: companies[8]._id, contact: contacts[8]._id, value: 75000, stage: 'Won', probability: 100, assignedTo: lisa._id, expectedCloseDate: daysAgo(15), actualCloseDate: daysAgo(14), notes: 'Tenant mobile application' },
      { title: 'NovaByte Scale Package', company: companies[9]._id, contact: contacts[9]._id, value: 55000, stage: 'Proposal', probability: 40, assignedTo: james._id, expectedCloseDate: futureDate(40), notes: 'Infrastructure scaling' },
      { title: 'Quantum Content Library', company: companies[6]._id, contact: contacts[6]._id, value: 18000, stage: 'Lost', probability: 0, assignedTo: emily._id, expectedCloseDate: daysAgo(5), notes: 'Budget cut by client' },
    ];
    const deals = await Deal.insertMany(dealData);
    console.log(`Created ${deals.length} deals`);

    // ---------- TASKS ----------
    const taskData = [
      { title: 'Follow up with Alex Rivera', description: 'Discuss enterprise plan pricing', type: 'Follow-up', priority: 'High', status: 'Pending', assignedTo: emily._id, relatedLead: leads[0]._id, dueDate: futureDate(2), notes: 'Send pricing deck first' },
      { title: 'Call Sophia Zhang', description: 'Initial discovery call', type: 'Call', priority: 'Medium', status: 'Pending', assignedTo: james._id, relatedLead: leads[1]._id, dueDate: futureDate(5) },
      { title: 'Prepare proposal for GreenLeaf', description: 'ERP implementation proposal', type: 'Other', priority: 'High', status: 'In Progress', assignedTo: james._id, relatedDeal: deals[1]._id, dueDate: futureDate(7) },
      { title: 'Schedule demo with Marcus Johnson', description: 'Product demonstration', type: 'Meeting', priority: 'High', status: 'Pending', assignedTo: emily._id, relatedLead: leads[2]._id, dueDate: futureDate(1) },
      { title: 'Send contract to Nathan Brooks', description: 'Final negotiation terms', type: 'Email', priority: 'Critical', status: 'Pending', assignedTo: lisa._id, relatedLead: leads[4]._id, dueDate: futureDate(1) },
      { title: 'Review Pinnacle CRM proposal', description: 'Final review before sending', type: 'Other', priority: 'High', status: 'In Progress', assignedTo: mike._id, relatedDeal: deals[2]._id, dueDate: futureDate(3) },
      { title: 'Follow up with Isabella Reed', description: 'Check interest level', type: 'Follow-up', priority: 'Medium', status: 'Pending', assignedTo: james._id, relatedLead: leads[9]._id, dueDate: futureDate(4) },
      { title: 'Quarterly team review', description: 'Q4 performance review meeting', type: 'Meeting', priority: 'Medium', status: 'Pending', assignedTo: sarah._id, dueDate: futureDate(14) },
      { title: 'Update CRM pipeline data', description: 'Ensure all deals are up to date', type: 'Other', priority: 'Low', status: 'Completed', assignedTo: emily._id, dueDate: daysAgo(2), completedAt: daysAgo(1) },
      { title: 'Send follow-up email to Mia Rodriguez', description: 'Proposal follow-up', type: 'Email', priority: 'Medium', status: 'Pending', assignedTo: emily._id, relatedLead: leads[11]._id, dueDate: futureDate(2) },
      // Overdue tasks
      { title: 'Call Ethan Carter', description: 'Qualification call overdue', type: 'Call', priority: 'High', status: 'Pending', assignedTo: emily._id, relatedLead: leads[8]._id, dueDate: daysAgo(3) },
      { title: 'Send revised proposal to Henry Collins', description: 'Updated pricing proposal', type: 'Email', priority: 'High', status: 'Pending', assignedTo: emily._id, relatedLead: leads[22]._id, dueDate: daysAgo(1) },
      { title: 'Follow up on HealthBridge deal', description: 'Check procurement timeline', type: 'Follow-up', priority: 'Medium', status: 'Pending', assignedTo: lisa._id, relatedDeal: deals[4]._id, dueDate: daysAgo(5) },
      // Completed tasks
      { title: 'Onboard Emma Sullivan', description: 'New customer onboarding', type: 'Meeting', priority: 'Medium', status: 'Completed', assignedTo: emily._id, dueDate: daysAgo(10), completedAt: daysAgo(9) },
      { title: 'Close Liam O\'Brien deal', description: 'Final contract signing', type: 'Other', priority: 'High', status: 'Completed', assignedTo: james._id, dueDate: daysAgo(20), completedAt: daysAgo(18) },
      { title: 'Send TechFlow invoice', description: 'Enterprise license invoice', type: 'Email', priority: 'Low', status: 'Completed', assignedTo: emily._id, relatedDeal: deals[0]._id, dueDate: daysAgo(15), completedAt: daysAgo(14) },
      // Today's tasks
      { title: 'Team standup meeting', description: 'Daily sales standup', type: 'Meeting', priority: 'Medium', status: 'Pending', assignedTo: mike._id, dueDate: new Date() },
      { title: 'Review new lead applications', description: 'Screen today\'s new leads', type: 'Other', priority: 'High', status: 'In Progress', assignedTo: sarah._id, dueDate: new Date() },
      // More variety
      { title: 'Prepare monthly sales report', description: 'October sales summary', type: 'Other', priority: 'Medium', status: 'Pending', assignedTo: mike._id, dueDate: futureDate(5) },
      { title: 'Client dinner with Pinnacle team', description: 'Relationship building dinner', type: 'Meeting', priority: 'Low', status: 'Pending', assignedTo: mike._id, relatedDeal: deals[2]._id, dueDate: futureDate(10) },
      { title: 'Follow up with Chloe Howard', description: 'AI product demo follow-up', type: 'Follow-up', priority: 'Medium', status: 'Pending', assignedTo: lisa._id, relatedLead: leads[25]._id, dueDate: futureDate(5) },
      { title: 'Update sales playbook', description: 'Add new objection handling scripts', type: 'Other', priority: 'Low', status: 'In Progress', assignedTo: sarah._id, dueDate: futureDate(20) },
      { title: 'Cold call batch - Week 45', description: 'Outbound calling session', type: 'Call', priority: 'Medium', status: 'Pending', assignedTo: lisa._id, dueDate: futureDate(3) },
      { title: 'Negotiate Skyline deal terms', description: 'Final pricing negotiation', type: 'Call', priority: 'Critical', status: 'Pending', assignedTo: lisa._id, relatedDeal: deals[8]._id, dueDate: futureDate(1) },
      { title: 'Send Atlas Logistics proposal', description: 'Initial tracking system proposal', type: 'Email', priority: 'High', status: 'Pending', assignedTo: james._id, relatedDeal: deals[5]._id, dueDate: futureDate(7) },
    ];
    const tasks = await Task.insertMany(taskData);
    console.log(`Created ${tasks.length} tasks`);

    // ---------- ACTIVITIES ----------
    const activityData = [
      { type: 'deal_update', description: 'Deal "TechFlow Enterprise License" was won', user: emily._id, relatedDeal: deals[0]._id, createdAt: daysAgo(12) },
      { type: 'lead_update', description: 'Lead "Emma Sullivan" converted to customer', user: emily._id, relatedLead: leads[5]._id, createdAt: daysAgo(80) },
      { type: 'call', description: 'Discovery call with Sophia Zhang - 30 min', user: james._id, relatedLead: leads[1]._id, createdAt: daysAgo(8) },
      { type: 'email', description: 'Sent pricing proposal to Nathan Brooks', user: lisa._id, relatedLead: leads[4]._id, createdAt: daysAgo(5) },
      { type: 'meeting', description: 'Demo meeting with Marcus Johnson - interested in premium tier', user: emily._id, relatedLead: leads[2]._id, createdAt: daysAgo(20) },
      { type: 'deal_update', description: 'Deal "CloudNine Marketing Suite" was won', user: emily._id, relatedDeal: deals[3]._id, createdAt: daysAgo(28) },
      { type: 'note', description: 'Olivia Foster requested custom integration - needs technical review', user: mike._id, relatedLead: leads[3]._id, createdAt: daysAgo(15) },
      { type: 'deal_update', description: 'Deal "GreenLeaf ERP" moved to Negotiation', user: james._id, relatedDeal: deals[1]._id, createdAt: daysAgo(10) },
      { type: 'call', description: 'Follow-up call with Daniel Moore about property management', user: lisa._id, relatedContact: contacts[8]._id, createdAt: daysAgo(3) },
      { type: 'deal_update', description: 'Deal "Quantum LMS Platform" was won', user: emily._id, relatedDeal: deals[6]._id, createdAt: daysAgo(58) },
      { type: 'email', description: 'Sent onboarding docs to NovaByte team', user: james._id, relatedDeal: deals[9]._id, createdAt: daysAgo(85) },
      { type: 'meeting', description: 'Strategy session with Apex Consulting team', user: mike._id, relatedDeal: deals[7]._id, createdAt: daysAgo(7) },
      { type: 'lead_update', description: 'New lead "Alex Rivera" created', user: emily._id, relatedLead: leads[0]._id, createdAt: daysAgo(3) },
      { type: 'deal_update', description: 'Deal "Skyline Tenant App" was won', user: lisa._id, relatedDeal: deals[17]._id, createdAt: daysAgo(14) },
      { type: 'lead_update', description: 'Lead "Ella Phillips" converted to customer', user: mike._id, relatedLead: leads[19]._id, createdAt: daysAgo(120) },
      { type: 'task', description: 'Completed onboarding for Emma Sullivan', user: emily._id, createdAt: daysAgo(9) },
      { type: 'call', description: 'Negotiation call with Skyline Properties - agreed on terms', user: lisa._id, relatedDeal: deals[8]._id, createdAt: daysAgo(4) },
      { type: 'email', description: 'Sent follow-up email to Charlotte Evans', user: mike._id, relatedLead: leads[13]._id, createdAt: daysAgo(18) },
      { type: 'deal_update', description: 'Deal "TechFlow Support Contract" was won', user: emily._id, relatedDeal: deals[10]._id, createdAt: daysAgo(43) },
      { type: 'deal_update', description: 'Deal "NovaByte MVP" was won', user: james._id, relatedDeal: deals[9]._id, createdAt: daysAgo(88) },
    ];
    const activities = await Activity.insertMany(activityData);
    console.log(`Created ${activities.length} activities`);

    // ---------- NOTIFICATIONS ----------
    const notificationData = [
      { user: emily._id, type: 'lead_assigned', title: 'New Lead Assigned', message: 'You have been assigned a new lead: Alex Rivera', relatedId: leads[0]._id, relatedModel: 'Lead', isRead: false, createdAt: daysAgo(3) },
      { user: james._id, type: 'follow_up', title: 'Follow-up Reminder', message: 'Follow-up with Sophia Zhang is due tomorrow', relatedId: leads[1]._id, relatedModel: 'Lead', isRead: false, createdAt: daysAgo(1) },
      { user: emily._id, type: 'task_overdue', title: 'Task Overdue', message: 'Task "Call Ethan Carter" is 3 days overdue', relatedId: tasks[10]._id, relatedModel: 'Task', isRead: false, createdAt: daysAgo(1) },
      { user: lisa._id, type: 'deal_update', title: 'Deal Stage Updated', message: 'Deal "Skyline Property Management" moved to Negotiation', relatedId: deals[8]._id, relatedModel: 'Deal', isRead: true, createdAt: daysAgo(5) },
      { user: emily._id, type: 'conversion', title: 'Lead Converted!', message: 'Lead "Emma Sullivan" has been converted to a customer', relatedId: leads[5]._id, relatedModel: 'Lead', isRead: true, createdAt: daysAgo(80) },
      { user: james._id, type: 'deal_update', title: 'Deal Won!', message: 'Congratulations! Deal "NovaByte MVP Development" was won', relatedId: deals[9]._id, relatedModel: 'Deal', isRead: true, createdAt: daysAgo(88) },
      { user: mike._id, type: 'team_activity', title: 'Team Update', message: 'Emily Davis closed 3 deals this month', isRead: false, createdAt: daysAgo(2) },
      { user: lisa._id, type: 'task_overdue', title: 'Task Overdue', message: 'Task "Follow up on HealthBridge deal" is 5 days overdue', relatedId: tasks[12]._id, relatedModel: 'Task', isRead: false, createdAt: daysAgo(1) },
      { user: emily._id, type: 'follow_up', title: 'Follow-up Tomorrow', message: 'Follow-up with Marcus Johnson is scheduled for tomorrow', relatedId: leads[2]._id, relatedModel: 'Lead', isRead: false, createdAt: new Date() },
      { user: mike._id, type: 'lead_assigned', title: 'New Lead Assigned', message: 'You have been assigned a new lead: Zoe Murphy', relatedId: leads[23]._id, relatedModel: 'Lead', isRead: false, createdAt: daysAgo(2) },
    ];
    await Notification.insertMany(notificationData);
    console.log(`Created ${notificationData.length} notifications`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Login Credentials:');
    console.log('  Admin:   sarah@crmpro.com / password123');
    console.log('  Manager: mike@crmpro.com / password123');
    console.log('  Sales:   emily@crmpro.com / password123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

