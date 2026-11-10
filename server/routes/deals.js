const express = require('express');
const router = express.Router();
const {
  getDeals,
  getDeal,
  createDeal,
  updateDeal,
  updateStage,
  deleteDeal,
} = require('../controllers/dealController');
const { protect } = require('../middleware/auth');
const { validateDeal } = require('../middleware/validate');

router.use(protect);

router.route('/').get(getDeals).post(validateDeal, createDeal);
router.route('/:id').get(getDeal).put(updateDeal).delete(deleteDeal);
router.patch('/:id/stage', updateStage);

module.exports = router;
