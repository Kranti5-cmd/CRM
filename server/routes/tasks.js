const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getOverdue,
  markComplete,
  getDailySummary,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Special routes must come before /:id
router.get('/overdue', getOverdue);
router.get('/daily-summary', getDailySummary);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);
router.patch('/:id/complete', markComplete);

module.exports = router;
