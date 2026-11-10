const express = require('express');
const router = express.Router();
const bootcampController = require('../controllers/bootcampController');
const { protect } = require('../middleware/auth');

/**
 * Flexible Authenticator for Incoming Boot Camp Webhooks & System Sync
 * Accepts either:
 * 1. Header `X-Bootcamp-API-Key` matching process.env.BOOTCAMP_SYNC_KEY
 * 2. Standard Bearer JWT (protect middleware)
 */
const requireBootcampApiKeyOrAuth = (req, res, next) => {
  const apiKey = req.headers['x-bootcamp-api-key'] || req.headers['x-api-key'];
  const configuredKey = process.env.BOOTCAMP_SYNC_KEY || 'abc_sync_live_key_998877665544332211';

  if (apiKey && apiKey === configuredKey) {
    return next();
  }

  // Fallback to standard CRM user authentication
  return protect(req, res, next);
};

// 1. Real-time Student Registration Sync (Webhook & API)
router.post('/sync', requireBootcampApiKeyOrAuth, bootcampController.syncStudent);

// 2. Historical Batch Import
router.post('/batch-import', requireBootcampApiKeyOrAuth, bootcampController.batchImport);

// 3. Analytics & Stats for CRM Dashboard
router.get('/stats', protect, bootcampController.getStats);

// 4. Paginated & Filterable Student Directory
router.get('/students', protect, bootcampController.getStudents);

// 5. Follow-up Assignment & Scheduling
router.post('/follow-up', protect, bootcampController.scheduleFollowUp);

// 6. Srinu Daily Report (JSON)
router.get('/reports/daily', protect, bootcampController.getDailyReport);

// 7. Downloadable CSV Daily Report
router.get('/reports/download-csv', protect, bootcampController.downloadReportCSV);

// 8. Manual & Automated Brevo Email Workflow Dispatcher
router.post('/email/trigger', protect, bootcampController.triggerBrevoWorkflow);

// 9. Manual & Auto Live Sync from CodeLekho Supabase
router.post('/sync-supabase', protect, bootcampController.syncNowFromSupabase);

module.exports = router;

