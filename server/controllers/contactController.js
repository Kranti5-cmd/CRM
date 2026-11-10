const Contact = require('../models/Contact');

// @desc    Get all contacts with pagination, search, filter
// @route   GET /api/contacts
exports.getContacts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      company,
      assignedTo,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ];
    }

    if (company) query.company = company;
    if (assignedTo) query.assignedTo = assignedTo;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Contact.countDocuments(query);

    const contacts = await Contact.find(query)
      .populate('company', 'name industry')
      .populate('assignedTo', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: contacts,
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

// @desc    Get single contact
// @route   GET /api/contacts/:id
exports.getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('company', 'name industry website')
      .populate('assignedTo', 'name email avatar');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a contact
// @route   POST /api/contacts
exports.createContact = async (req, res, next) => {
  try {
    const contact = await Contact.create(req.body);
    const populated = await Contact.findById(contact._id)
      .populate('company', 'name industry')
      .populate('assignedTo', 'name email avatar');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a contact
// @route   PUT /api/contacts/:id
exports.updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('company', 'name industry')
      .populate('assignedTo', 'name email avatar');

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a contact
// @route   DELETE /api/contacts/:id
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    await Contact.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
