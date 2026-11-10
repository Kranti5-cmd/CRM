const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Get lead report
// @route   GET /api/reports/leads
exports.getLeadReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'source' } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let groupField;
    if (groupBy === 'status') {
      groupField = '$leadStatus';
    } else {
      groupField = '$leadSource';
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $group: {
          _id: groupField,
          count: { $sum: 1 },
          totalValue: { $sum: '$value' },
          avgValue: { $avg: '$value' },
        },
      },
      { $sort: { count: -1 } }
    );

    const data = await Lead.aggregate(pipeline);

    const totalLeads = data.reduce((acc, d) => acc + d.count, 0);
    const totalValue = data.reduce((acc, d) => acc + d.totalValue, 0);

    const breakdown = data.map((d) => ({
      label: d._id || 'Other',
      source: d._id || 'Other',
      count: d.count,
      totalValue: d.totalValue,
      avgValue: Math.round(d.avgValue || 0),
      percentage: totalLeads > 0 ? ((d.count / totalLeads) * 100).toFixed(1) : 0,
    }));

    const convertedLeads = await Lead.countDocuments({ leadStatus: 'Converted' });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        conversionRate,
        bySource: breakdown,
        breakdown,
        summary: { totalLeads, totalValue, conversionRate },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales report
// @route   GET /api/reports/sales
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { stage: 'Won' };
    if (startDate || endDate) {
      matchStage.actualCloseDate = {};
      if (startDate) matchStage.actualCloseDate.$gte = new Date(startDate);
      if (endDate) matchStage.actualCloseDate.$lte = new Date(endDate);
    }

    const salesByPerson = await Deal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$assignedTo',
          totalRevenue: { $sum: '$value' },
          dealsWon: { $sum: 1 },
          avgDealSize: { $avg: '$value' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userName: '$user.name',
          userEmail: '$user.email',
          totalRevenue: 1,
          dealsWon: 1,
          avgDealSize: { $round: ['$avgDealSize', 0] },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    const totalRevenue = salesByPerson.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalDeals = salesByPerson.reduce((acc, s) => acc + s.dealsWon, 0);
    const averageDealSize = totalDeals > 0 ? Math.round(totalRevenue / totalDeals) : 0;

    const formattedBySalesperson = salesByPerson.map((s) => ({
      ...s,
      name: s.userName || 'Unassigned',
      revenue: s.totalRevenue || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        dealsCount: totalDeals,
        averageDealSize,
        bySalesperson: formattedBySalesperson,
        salesByPerson: formattedBySalesperson,
        summary: {
          totalRevenue,
          totalDeals,
          dealsCount: totalDeals,
          avgDealSize: averageDealSize,
          averageDealSize,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue report
// @route   GET /api/reports/revenue
exports.getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { stage: 'Won' };
    if (startDate || endDate) {
      matchStage.actualCloseDate = {};
      if (startDate) matchStage.actualCloseDate.$gte = new Date(startDate);
      if (endDate) matchStage.actualCloseDate.$lte = new Date(endDate);
    }

    const monthlyRevenue = await Deal.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$actualCloseDate' },
            month: { $month: '$actualCloseDate' },
          },
          revenue: { $sum: '$value' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const totalRevenue = monthlyRevenue.reduce((acc, m) => acc + m.revenue, 0);

    res.status(200).json({
      success: true,
      data: {
        monthlyRevenue: monthlyRevenue.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          revenue: m.revenue,
          dealCount: m.count,
        })),
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversion report
// @route   GET /api/reports/conversions
exports.getConversionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        total: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $eq: ['$leadStatus', 'Converted'] }, 1, 0] },
        },
        lost: {
          $sum: { $cond: [{ $eq: ['$leadStatus', 'Lost'] }, 1, 0] },
        },
      },
    });
    pipeline.push({ $sort: { '_id.year': 1, '_id.month': 1 } });

    const data = await Lead.aggregate(pipeline);

    const formatted = data.map((d) => ({
      year: d._id.year,
      month: d._id.month,
      total: d.total,
      converted: d.converted,
      lost: d.lost,
      conversionRate: d.total > 0 ? ((d.converted / d.total) * 100).toFixed(1) : '0.0',
    }));

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get employee performance report
// @route   GET /api/reports/employees
exports.getEmployeeReport = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).select('name email role department');

    const report = await Promise.all(
      users.map(async (user) => {
        const leadsHandled = await Lead.countDocuments({ assignedTo: user._id });
        const leadsConverted = await Lead.countDocuments({
          assignedTo: user._id,
          leadStatus: 'Converted',
        });

        const dealsWon = await Deal.countDocuments({
          assignedTo: user._id,
          stage: 'Won',
        });

        const revenueResult = await Deal.aggregate([
          { $match: { assignedTo: user._id, stage: 'Won' } },
          { $group: { _id: null, total: { $sum: '$value' } } },
        ]);
        const revenue = revenueResult[0]?.total || 0;

        const activeDeals = await Deal.countDocuments({
          assignedTo: user._id,
          stage: { $nin: ['Won', 'Lost'] },
        });

        const activeTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: { $nin: ['Completed', 'Cancelled'] },
        });

        const completedTasks = await Task.countDocuments({
          assignedTo: user._id,
          status: 'Completed',
        });

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          leadsHandled,
          leadCount: leadsHandled,
          leadsConverted,
          conversionRate:
            leadsHandled > 0
              ? ((leadsConverted / leadsHandled) * 100).toFixed(1)
              : '0.0',
          dealsWon,
          dealCount: dealsWon,
          revenue,
          salesTarget: user.salesQuota || user.salesTarget || 300000,
          activeDeals,
          activeTasks,
          completedTasks,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export report data as CSV
// @route   GET /api/reports/export
exports.exportCSV = async (req, res, next) => {
  try {
    const { type = 'leads' } = req.query;
    let data = [];
    let headers = [];

    switch (type) {
      case 'leads': {
        headers = ['Full Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Priority', 'Value', 'Created At'];
        const leads = await Lead.find().lean();
        data = leads.map((l) => [
          l.fullName, l.email, l.phone, l.companyName, l.leadSource,
          l.leadStatus, l.priority, l.value,
          new Date(l.createdAt).toISOString().split('T')[0],
        ]);
        break;
      }
      case 'deals': {
        headers = ['Title', 'Value', 'Stage', 'Probability', 'Expected Close', 'Created At'];
        const deals = await Deal.find().lean();
        data = deals.map((d) => [
          d.title, d.value, d.stage, d.probability,
          d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().split('T')[0] : '',
          new Date(d.createdAt).toISOString().split('T')[0],
        ]);
        break;
      }
      case 'contacts': {
        headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Position', 'Department', 'Created At'];
        const contacts = await Contact.find().lean();
        const Contact = require('../models/Contact');
        data = contacts.map((c) => [
          c.firstName, c.lastName, c.email, c.phone, c.position, c.department,
          new Date(c.createdAt).toISOString().split('T')[0],
        ]);
        break;
      }
      case 'companies': {
        headers = ['Name', 'Industry', 'Size', 'Revenue', 'Website', 'Created At'];
        const Company = require('../models/Company');
        const companies = await Company.find().lean();
        data = companies.map((c) => [
          c.name, c.industry, c.size, c.revenue, c.website,
          new Date(c.createdAt).toISOString().split('T')[0],
        ]);
        break;
      }
      default: {
        headers = ['Full Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Priority', 'Value', 'Created At'];
        const defaultLeads = await Lead.find().lean();
        data = defaultLeads.map((l) => [
          l.fullName, l.email, l.phone, l.companyName, l.leadSource,
          l.leadStatus, l.priority, l.value,
          new Date(l.createdAt).toISOString().split('T')[0],
        ]);
      }
    }

    // Build CSV string
    const escapeCSV = (val) => {
      const str = String(val == null ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvRows = [headers.map(escapeCSV).join(',')];
    data.forEach((row) => {
      csvRows.push(row.map(escapeCSV).join(','));
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
