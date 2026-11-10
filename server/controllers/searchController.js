const Contact = require('../models/Contact');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Ticket = require('../models/Ticket');
const Company = require('../models/Company');

// @desc    Global search across students, leads, deals, tickets, and partner companies
// @route   GET /api/search?q=query
exports.globalSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: {
          students: [],
          leads: [],
          deals: [],
          tickets: [],
          companies: []
        }
      });
    }

    const regex = new RegExp(q, 'i');

    const [students, leads, deals, tickets, companies] = await Promise.all([
      // 1. Students / Contacts
      Contact.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { phone: regex },
          { position: regex }
        ]
      })
        .select('firstName lastName email phone position company')
        .populate('company', 'name')
        .limit(5)
        .lean(),

      // 2. Leads
      Lead.find({
        $or: [
          { fullName: regex },
          { email: regex },
          { phone: regex },
          { courseName: regex },
          { studentId: regex }
        ]
      })
        .select('fullName email phone courseName paymentStatus registrationStatus studentId')
        .limit(5)
        .lean(),

      // 3. Deals / Enrollments
      Deal.find({
        $or: [
          { title: regex },
          { notes: regex }
        ]
      })
        .select('title value stage probability')
        .limit(5)
        .lean(),

      // 4. Student Support Tickets
      Ticket.find({
        $or: [
          { ticketNumber: regex },
          { subject: regex },
          { customerName: regex },
          { customerEmail: regex }
        ]
      })
        .select('ticketNumber subject customerName customerEmail status priority')
        .limit(5)
        .lean(),

      // 5. Hiring Partner Companies
      Company.find({
        $or: [
          { name: regex },
          { industry: regex },
          { notes: regex }
        ]
      })
        .select('name industry website size')
        .limit(5)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      data: {
        students,
        leads,
        deals,
        tickets,
        companies
      }
    });
  } catch (error) {
    next(error);
  }
};

