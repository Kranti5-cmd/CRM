const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Contact = require('../models/Contact');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc    Get dashboard KPI stats
// @route   GET /api/dashboard/stats
exports.getStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Total leads
    const totalLeads = await Lead.countDocuments();
    const totalLeadsLastMonth = await Lead.countDocuments({
      createdAt: { $lt: startOfThisMonth },
    });

    // New leads this month
    const newLeads = await Lead.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const newLeadsLastMonth = await Lead.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    // Qualified leads
    const qualifiedLeads = await Lead.countDocuments({ leadStatus: 'Qualified' });
    const qualifiedLeadsLastMonth = await Lead.countDocuments({
      leadStatus: 'Qualified',
      updatedAt: { $lt: startOfThisMonth },
    });

    // Total customers (converted leads)
    const totalCustomers = await Lead.countDocuments({ leadStatus: 'Converted' });
    const totalCustomersLastMonth = await Lead.countDocuments({
      leadStatus: 'Converted',
      updatedAt: { $lt: startOfThisMonth },
    });

    // Active deals (not Won or Lost)
    const activeDeals = await Deal.countDocuments({
      stage: { $nin: ['Won', 'Lost'] },
    });
    const activeDealsLastMonth = await Deal.countDocuments({
      stage: { $nin: ['Won', 'Lost'] },
      createdAt: { $lt: startOfThisMonth },
    });

    // Revenue (sum of won deals)
    const revenueResult = await Deal.aggregate([
      { $match: { stage: 'Won' } },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const revenueGenerated = revenueResult[0]?.total || 0;

    const revenueLastMonthResult = await Deal.aggregate([
      {
        $match: {
          stage: 'Won',
          actualCloseDate: { $lt: startOfThisMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const revenueLastMonth = revenueLastMonthResult[0]?.total || 0;

    // Conversion rate
    const convertedLeads = await Lead.countDocuments({ leadStatus: 'Converted' });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    const convertedLastMonth = await Lead.countDocuments({
      leadStatus: 'Converted',
      updatedAt: { $lt: startOfThisMonth },
    });
    const conversionRateLastMonth =
      totalLeadsLastMonth > 0
        ? ((convertedLastMonth / totalLeadsLastMonth) * 100).toFixed(1)
        : 0;

    // Pending follow-ups
    const pendingFollowUps = await Task.countDocuments({
      type: 'Follow-up',
      status: { $nin: ['Completed', 'Cancelled'] },
    });
    const pendingFollowUpsLastMonth = await Task.countDocuments({
      type: 'Follow-up',
      status: { $nin: ['Completed', 'Cancelled'] },
      createdAt: { $lt: startOfThisMonth },
    });

    // Helper to calculate percentage change
    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    res.status(200).json({
      success: true,
      data: {
        totalLeads: {
          value: totalLeads,
          change: parseFloat(calcChange(totalLeads, totalLeadsLastMonth)),
        },
        newLeads: {
          value: newLeads,
          change: parseFloat(calcChange(newLeads, newLeadsLastMonth)),
        },
        qualifiedLeads: {
          value: qualifiedLeads,
          change: parseFloat(calcChange(qualifiedLeads, qualifiedLeadsLastMonth)),
        },
        totalCustomers: {
          value: totalCustomers,
          change: parseFloat(calcChange(totalCustomers, totalCustomersLastMonth)),
        },
        activeDeals: {
          value: activeDeals,
          change: parseFloat(calcChange(activeDeals, activeDealsLastMonth)),
        },
        revenueGenerated: {
          value: revenueGenerated,
          change: parseFloat(calcChange(revenueGenerated, revenueLastMonth)),
        },
        conversionRate: {
          value: parseFloat(conversionRate),
          change: parseFloat(calcChange(parseFloat(conversionRate), parseFloat(conversionRateLastMonth))),
        },
        pendingFollowUps: {
          value: pendingFollowUps,
          change: parseFloat(calcChange(pendingFollowUps, pendingFollowUpsLastMonth)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard chart data
// @route   GET /api/dashboard/charts
exports.getCharts = async (req, res, next) => {
  try {
    const now = new Date();

    // --- Leads over time (last 12 months) ---
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const leadsOverTime = await Lead.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill missing months
    const leadsOverTimeFormatted = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = leadsOverTime.find(
        (l) => l._id.year === year && l._id.month === month
      );
      leadsOverTimeFormatted.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year,
        count: found ? found.count : 0,
      });
    }

    // --- Revenue performance (last 12 months) ---
    const revenuePerformance = await Deal.aggregate([
      {
        $match: {
          stage: 'Won',
          actualCloseDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$actualCloseDate' },
            month: { $month: '$actualCloseDate' },
          },
          revenue: { $sum: '$value' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const revenuePerformanceFormatted = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = revenuePerformance.find(
        (r) => r._id.year === year && r._id.month === month
      );
      revenuePerformanceFormatted.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year,
        revenue: found ? found.revenue : 0,
      });
    }

    // --- Lead sources ---
    const leadSources = await Lead.aggregate([
      { $group: { _id: '$leadSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Sales funnel (lead status counts) ---
    const salesFunnel = await Lead.aggregate([
      { $group: { _id: '$leadStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Deal status (deal stage counts) ---
    const dealStatus = await Deal.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // --- Monthly sales (last 6 months of won deal values) ---
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlySalesRaw = await Deal.aggregate([
      {
        $match: {
          stage: 'Won',
          actualCloseDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$actualCloseDate' },
            month: { $month: '$actualCloseDate' },
          },
          total: { $sum: '$value' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = monthlySalesRaw.find(
        (s) => s._id.year === year && s._id.month === month
      );
      monthlySales.push({
        month: d.toLocaleString('default', { month: 'short' }),
        year,
        total: found ? found.total : 0,
        count: found ? found.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        leadsOverTime: leadsOverTimeFormatted,
        revenuePerformance: revenuePerformanceFormatted,
        leadSources: leadSources.map((s) => ({
          source: s._id,
          count: s.count,
        })),
        salesFunnel: salesFunnel.map((s) => ({
          status: s._id,
          count: s.count,
        })),
        dealStatus: dealStatus.map((s) => ({
          stage: s._id,
          count: s.count,
        })),
        monthlySales,
      },
    });
  } catch (error) {
    next(error);
  }
};
