const Ticket = require('../models/Ticket');
const Activity = require('../models/Activity');

// @desc Get all tickets with filtering, search & pagination
// @route GET /api/tickets
exports.getTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, priority, category, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Ticket.countDocuments(query);

    const tickets = await Ticket.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get single ticket
// @route GET /api/tickets/:id
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedTo', 'name email avatar');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// @desc Create ticket
// @route POST /api/tickets
exports.createTicket = async (req, res, next) => {
  try {
    const ticketCount = await Ticket.countDocuments();
    const ticketNumber = `TICK-${1000 + ticketCount + 1}`;

    const ticket = await Ticket.create({
      ...req.body,
      ticketNumber,
    });

    const populated = await Ticket.findById(ticket._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedTo', 'name email avatar');

    await Activity.create({
      type: 'note',
      description: `New support ticket ${ticketNumber} created: "${ticket.subject}"`,
      user: req.user._id,
      metadata: { action: 'ticket_created', ticketId: ticket._id },
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc Update ticket
// @route PUT /api/tickets/:id
exports.updateTicket = async (req, res, next) => {
  try {
    const existing = await Ticket.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.body.status === 'Resolved' && existing.status !== 'Resolved') {
      req.body.resolvedAt = new Date();
    }

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedTo', 'name email avatar');

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
};

// @desc Delete ticket
// @route DELETE /api/tickets/:id
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Ticket removed' });
  } catch (err) {
    next(err);
  }
};

// @desc Ticket status summary stats
// @route GET /api/tickets/stats
exports.getTicketStats = async (req, res, next) => {
  try {
    const [open, inProgress, resolved, total] = await Promise.all([
      Ticket.countDocuments({ status: 'Open' }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({}),
    ]);

    res.status(200).json({
      success: true,
      data: { open, inProgress, resolved, total },
    });
  } catch (err) {
    next(err);
  }
};

