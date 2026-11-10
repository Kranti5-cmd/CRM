const Company = require('../models/Company');
const Deal = require('../models/Deal');

// @desc    Get all companies with pagination, search, filter
// @route   GET /api/companies
exports.getCompanies = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      industry,
      size,
      assignedTo,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (industry) query.industry = industry;
    if (size) query.size = size;
    if (assignedTo) query.assignedTo = assignedTo;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Company.countDocuments(query);

    const companies = await Company.find(query)
      .populate('assignedTo', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Aggregate deal stats for each company
    const companyIds = companies.map((c) => c._id);
    const dealStats = await Deal.aggregate([
      { $match: { company: { $in: companyIds } } },
      {
        $group: {
          _id: '$company',
          dealCount: { $sum: 1 },
          totalDealValue: { $sum: '$value' },
        },
      },
    ]);

    const dealStatsMap = {};
    dealStats.forEach((ds) => {
      dealStatsMap[ds._id.toString()] = {
        dealCount: ds.dealCount,
        totalDealValue: ds.totalDealValue,
      };
    });

    const companiesWithStats = companies.map((c) => {
      const obj = c.toObject();
      const stats = dealStatsMap[c._id.toString()] || {
        dealCount: 0,
        totalDealValue: 0,
      };
      obj.dealCount = stats.dealCount;
      obj.totalDealValue = stats.totalDealValue;
      return obj;
    });

    res.status(200).json({
      success: true,
      data: companiesWithStats,
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

// @desc    Get single company
// @route   GET /api/companies/:id
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id).populate(
      'assignedTo',
      'name email avatar'
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    // Get deal stats
    const dealStats = await Deal.aggregate([
      { $match: { company: company._id } },
      {
        $group: {
          _id: null,
          dealCount: { $sum: 1 },
          totalDealValue: { $sum: '$value' },
        },
      },
    ]);

    const companyObj = company.toObject();
    companyObj.dealCount = dealStats[0]?.dealCount || 0;
    companyObj.totalDealValue = dealStats[0]?.totalDealValue || 0;

    res.status(200).json({ success: true, data: companyObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a company
// @route   POST /api/companies
exports.createCompany = async (req, res, next) => {
  try {
    const company = await Company.create(req.body);
    const populated = await company.populate('assignedTo', 'name email avatar');

    const companyObj = populated.toObject();
    companyObj.dealCount = 0;
    companyObj.totalDealValue = 0;

    res.status(201).json({ success: true, data: companyObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a company
// @route   PUT /api/companies/:id
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email avatar');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    res.status(200).json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a company
// @route   DELETE /api/companies/:id
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
