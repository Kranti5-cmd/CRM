const express = require('express');
const router = express.Router();
const {
  getLeadReport,
  getSalesReport,
  getRevenueReport,
  getConversionReport,
  getEmployeeReport,
  exportCSV,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/leads', getLeadReport);
router.get('/sales', getSalesReport);
router.get('/revenue', getRevenueReport);
router.get('/conversions', getConversionReport);
router.get('/employees', getEmployeeReport);
router.get('/export', exportCSV);

module.exports = router;
