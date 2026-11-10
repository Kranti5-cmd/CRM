const express = require('express');
const router = express.Router();
const { getStats, getCharts } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getStats);
router.get('/charts', getCharts);

module.exports = router;
