const express = require('express');
const router = express.Router();
const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketStats,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getTicketStats);
router.route('/').get(getTickets).post(createTicket);
router.route('/:id').get(getTicket).put(updateTicket).delete(deleteTicket);

module.exports = router;

