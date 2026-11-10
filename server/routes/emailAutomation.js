const express = require('express');
const router = express.Router();
const emailAutomationController = require('../controllers/emailAutomationController');
const { protect } = require('../middleware/auth');

// 1. Dashboard Stats
router.get('/dashboard-stats', protect, emailAutomationController.getDashboardStats);

// 2. Workflows
router.get('/workflows', protect, emailAutomationController.getWorkflows);
router.post('/workflows', protect, emailAutomationController.createWorkflow);
router.get('/workflows/:id/details', protect, emailAutomationController.getWorkflowDetails);
router.get('/workflows/:id/executions', protect, emailAutomationController.getWorkflowExecutions);
router.put('/workflows/:id', protect, emailAutomationController.updateWorkflow);
router.patch('/workflows/:id/toggle', protect, emailAutomationController.toggleWorkflow);
router.delete('/workflows/:id', protect, emailAutomationController.deleteWorkflow);
router.post('/workflows/:workflowId/trigger', protect, emailAutomationController.triggerWorkflowForRecipient);
router.post('/events/trigger', protect, emailAutomationController.triggerLifecycleEvent);

// 3. Templates
router.get('/templates', protect, emailAutomationController.getTemplates);
router.post('/templates', protect, emailAutomationController.createTemplate);
router.get('/templates/:id', protect, emailAutomationController.getTemplateById);
router.put('/templates/:id', protect, emailAutomationController.updateTemplate);
router.delete('/templates/:id', protect, emailAutomationController.deleteTemplate);
router.post('/templates/test-email', protect, emailAutomationController.sendTestEmail);

// 4. Campaigns
router.get('/campaigns', protect, emailAutomationController.getCampaigns);
router.post('/campaigns', protect, emailAutomationController.createCampaign);
router.post('/campaigns/:id/send', protect, emailAutomationController.sendCampaignNow);
router.delete('/campaigns/:id', protect, emailAutomationController.deleteCampaign);

// 5. Contacts & Lists
router.get('/subscribers', protect, emailAutomationController.getSubscribers);
router.patch('/subscribers/:id/toggle-consent', protect, emailAutomationController.toggleSubscriberConsent);

// 6. Delivery Logs & Daily Reports
router.get('/logs', protect, emailAutomationController.getEmailLogs);
router.get('/reports/daily', protect, emailAutomationController.getDailyAutomationReport);
router.get('/reports/export-csv', protect, emailAutomationController.exportReportCSV);

// 7. Brevo Webhook (Public callback endpoint)
router.post('/webhook/brevo', emailAutomationController.handleBrevoWebhook);

module.exports = router;

