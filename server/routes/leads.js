const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');
const { validateLead } = require('../middleware/validate');

router.use(protect);

router.route('/').get(getLeads).post(validateLead, createLead);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);

module.exports = router;
