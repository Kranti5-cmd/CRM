const express = require('express');
const router = express.Router();
const {
  getTeam,
  getMember,
  updateMember,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getTeam);
router.get('/:id', getMember);
router.put('/:id', authorize('Admin', 'Manager'), updateMember);

module.exports = router;
