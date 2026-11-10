const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

// @desc    Get all deals with pagination, search, filter
// @route   GET /api/deals
exports.getDeals = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      stage,
      assignedTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    if (stage) query.stage = stage;
    if (assignedTo) query.assignedTo = assignedTo;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Deal.countDocuments(query);

    const deals = await Deal.find(query)
      .populate('company', 'name industry')
      .populate('contact', 'firstName lastName email')
      .populate('assignedTo', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: deals,
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

// @desc    Get single deal
// @route   GET /api/deals/:id
exports.getDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate('company', 'name industry website')
      .populate('contact', 'firstName lastName email phone')
      .populate('assignedTo', 'name email avatar');

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a deal
// @route   POST /api/deals
exports.createDeal = async (req, res, next) => {
  try {
    const deal = await Deal.create(req.body);
    const populated = await Deal.findById(deal._id)
      .populate('company', 'name industry')
      .populate('contact', 'firstName lastName email')
      .populate('assignedTo', 'name email avatar');

    await Activity.create({
      type: 'deal_update',
      description: `New deal "${deal.title}" was created with value $${deal.value.toLocaleString()}`,
      user: req.user._id,
      relatedDeal: deal._id,
      metadata: { action: 'created', value: deal.value },
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a deal
// @route   PUT /api/deals/:id
exports.updateDeal = async (req, res, next) => {
  try {
    const existingDeal = await Deal.findById(req.params.id);
    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    const previousStage = existingDeal.stage;

    // If stage is Won, set actualCloseDate
    if (req.body.stage === 'Won' && previousStage !== 'Won') {
      req.body.actualCloseDate = new Date();
    }

    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('company', 'name industry')
      .populate('contact', 'firstName lastName email')
      .populate('assignedTo', 'name email avatar');

    // If stage changed, create activity and notification
    if (req.body.stage && req.body.stage !== previousStage) {
      await Activity.create({
        type: 'deal_update',
        description: `Deal "${deal.title}" stage changed from "${previousStage}" to "${deal.stage}"`,
        user: req.user._id,
        relatedDeal: deal._id,
        metadata: {
          action: 'stage_change',
          previousStage,
          newStage: deal.stage,
        },
      });

      if (deal.assignedTo) {
        const assignedUserId =
          typeof deal.assignedTo === 'object'
            ? deal.assignedTo._id
            : deal.assignedTo;
        await Notification.create({
          user: assignedUserId,
          type: 'deal_update',
          title: 'Deal Stage Updated',
          message: `Deal "${deal.title}" moved to "${deal.stage}"`,
          relatedId: deal._id,
          relatedModel: 'Deal',
        });
      }
    }

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc    Update deal stage (for Kanban drag-drop)
// @route   PATCH /api/deals/:id/stage
exports.updateStage = async (req, res, next) => {
  try {
    const { stage } = req.body;
    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required',
      });
    }

    const existingDeal = await Deal.findById(req.params.id);
    if (!existingDeal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    const previousStage = existingDeal.stage;
    const updateData = { stage };

    if (stage === 'Won' && previousStage !== 'Won') {
      updateData.actualCloseDate = new Date();
    }

    const deal = await Deal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('company', 'name industry')
      .populate('contact', 'firstName lastName email')
      .populate('assignedTo', 'name email avatar');

    // Create activity
    await Activity.create({
      type: 'deal_update',
      description: `Deal "${deal.title}" stage changed from "${previousStage}" to "${stage}"`,
      user: req.user._id,
      relatedDeal: deal._id,
      metadata: { action: 'stage_change', previousStage, newStage: stage },
    });

    // Create notification
    if (deal.assignedTo) {
      const assignedUserId =
        typeof deal.assignedTo === 'object'
          ? deal.assignedTo._id
          : deal.assignedTo;
      await Notification.create({
        user: assignedUserId,
        type: 'deal_update',
        title: 'Deal Stage Updated',
        message: `Deal "${deal.title}" moved to "${stage}"`,
        relatedId: deal._id,
        relatedModel: 'Deal',
      });
    }

    res.status(200).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a deal
// @route   DELETE /api/deals/:id
exports.deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    await Deal.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Deal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
