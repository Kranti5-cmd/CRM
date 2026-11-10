const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.put('/read-all', markAllRead);
router.patch('/mark-all-read', markAllRead);
router.put('/mark-all-read', markAllRead);
router.patch('/:id/read', markRead);
router.put('/:id/read', markRead);

module.exports = router;
