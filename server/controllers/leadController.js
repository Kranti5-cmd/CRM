const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const { emitAutomationEvent } = require('../services/automationEngine');

// @desc    Get all leads with pagination, search, filter, sort
// @route   GET /api/leads
exports.getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      source,
      priority,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Search across fullName, email, companyName
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (status) query.leadStatus = status;
    if (source) query.leadSource = source;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate(
      'assignedTo',
      'name email avatar'
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a lead
// @route   POST /api/leads
exports.createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create(req.body);
    const populated = await lead.populate('assignedTo', 'name email avatar');

    // Create activity
    await Activity.create({
      type: 'lead_update',
      description: `New lead "${lead.fullName}" was created`,
      user: req.user._id,
      relatedLead: lead._id,
      metadata: { action: 'created' },
    });

    // Trigger email automations if lead source is Boot Camp or has registration
    if (lead.leadSource === 'Arshith Boot Camp' || lead.courseName) {
      emitAutomationEvent('student_registered', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
      emitAutomationEvent('registration_confirmed', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
      if (lead.courseName) {
        emitAutomationEvent('course_enrolled', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
      }
      if (lead.paymentStatus === 'Pending') {
        emitAutomationEvent('payment_pending', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
      } else if (lead.paymentStatus === 'Paid') {
        emitAutomationEvent('payment_completed', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a lead
// @route   PUT /api/leads/:id
exports.updateLead = async (req, res, next) => {
  try {
    const existingLead = await Lead.findById(req.params.id);
    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    const previousStatus = existingLead.leadStatus;

    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email avatar');

    // If status changed, create an activity
    if (req.body.leadStatus && req.body.leadStatus !== previousStatus) {
      await Activity.create({
        type: 'lead_update',
        description: `Lead "${lead.fullName}" status changed from "${previousStatus}" to "${lead.leadStatus}"`,
        user: req.user._id,
        relatedLead: lead._id,
        metadata: {
          action: 'status_change',
          previousStatus,
          newStatus: lead.leadStatus,
        },
      });
    }

    // Trigger lifecycle automation events on payment, completion, or course change
    if (req.body.paymentStatus === 'Paid' && existingLead.paymentStatus !== 'Paid') {
      emitAutomationEvent('payment_completed', {
        lead,
        email: lead.email,
        fullName: lead.fullName,
        metadata: { amount: lead.value ? `₹${lead.value}` : '₹4,999' }
      }).catch(() => {});
    }

    if (req.body.registrationStatus === 'Completed' && existingLead.registrationStatus !== 'Completed') {
      emitAutomationEvent('course_completed', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
      emitAutomationEvent('feedback_request', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
    }

    if (req.body.courseName && req.body.courseName !== existingLead.courseName) {
      emitAutomationEvent('course_enrolled', { lead, email: lead.email, fullName: lead.fullName }).catch(() => {});
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lead
// @route   DELETE /api/leads/:id
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found',
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
