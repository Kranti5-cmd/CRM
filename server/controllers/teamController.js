const User = require('../models/User');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Task = require('../models/Task');

// @desc    Get all team members with stats
// @route   GET /api/team
exports.getTeam = async (req, res, next) => {
  try {
    const users = await User.find().select('-__v');

    const teamData = await Promise.all(
      users.map(async (user) => {
        const leadCount = await Lead.countDocuments({ assignedTo: user._id });
        const dealCount = await Deal.countDocuments({ assignedTo: user._id });

        const revenueResult = await Deal.aggregate([
          { $match: { assignedTo: user._id, stage: 'Won' } },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]);
        const revenue = revenueResult[0]?.total || 0;

        const activeTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: { $nin: ['Completed', 'Cancelled'] },
        });

        return {
          ...user.toObject(),
          stats: {
            leadCount,
            dealCount,
            revenue,
            activeTasks,
          },
        };
      })
    );

    res.status(200).json({ success: true, data: teamData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single team member with full stats
// @route   GET /api/team/:id
exports.getMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    const leadCount = await Lead.countDocuments({ assignedTo: user._id });
    const leadsConverted = await Lead.countDocuments({
      assignedTo: user._id,
      leadStatus: 'Converted',
    });

    const dealCount = await Deal.countDocuments({ assignedTo: user._id });
    const dealsWon = await Deal.countDocuments({
      assignedTo: user._id,
      stage: 'Won',
    });

    const revenueResult = await Deal.aggregate([
      { $match: { assignedTo: user._id, stage: 'Won' } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const revenue = revenueResult[0]?.total || 0;

    const activeTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: { $nin: ['Completed', 'Cancelled'] },
    });

    const completedTasks = await Task.countDocuments({
      assignedTo: user._id,
      status: 'Completed',
    });

    const recentLeads = await Lead.find({ assignedTo: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName leadStatus value createdAt');

    const recentDeals = await Deal.find({ assignedTo: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title stage value createdAt');

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          leadCount,
          leadsConverted,
          conversionRate:
            leadCount > 0
              ? ((leadsConverted / leadCount) * 100).toFixed(1)
              : '0.0',
          dealCount,
          dealsWon,
          revenue,
          activeTasks,
          completedTasks,
        },
        recentLeads,
        recentDeals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team member (admin only)
// @route   PUT /api/team/:id
exports.updateMember = async (req, res, next) => {
  try {
    const { name, email, role, phone, department, salesTarget, isActive } =
      req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (salesTarget !== undefined) updateData.salesTarget = salesTarget;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Check email uniqueness
    if (updateData.email) {
      const existing = await User.findOne({
        email: updateData.email,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
