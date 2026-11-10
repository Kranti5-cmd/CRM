const Task = require('../models/Task');

// @desc    Get all tasks with pagination, filter
// @route   GET /api/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      type,
      assignedTo,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName')
      .populate('relatedDeal', 'title')
      .populate('relatedContact', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: tasks,
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

// @desc    Get single task
// @route   GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName email')
      .populate('relatedDeal', 'title value stage')
      .populate('relatedContact', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create(req.body);
    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName')
      .populate('relatedDeal', 'title')
      .populate('relatedContact', 'firstName lastName');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName')
      .populate('relatedDeal', 'title')
      .populate('relatedContact', 'firstName lastName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
exports.getOverdue = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['Completed', 'Cancelled'] },
    })
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName')
      .populate('relatedDeal', 'title')
      .populate('relatedContact', 'firstName lastName')
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, data: tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task as completed
// @route   PATCH /api/tasks/:id/complete
exports.markComplete = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.status = 'Completed';
    task.completedAt = new Date();
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName')
      .populate('relatedDeal', 'title')
      .populate('relatedContact', 'firstName lastName');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks due today
// @route   GET /api/tasks/daily-summary
exports.getDailySummary = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      dueDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['Cancelled'] },
    })
      .populate('assignedTo', 'name email avatar')
      .populate('relatedLead', 'fullName')
      .populate('relatedDeal', 'title')
      .populate('relatedContact', 'firstName lastName')
      .sort({ priority: -1 });

    res.status(200).json({ success: true, data: tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};
