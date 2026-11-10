const express = require('express');
const router = express.Router();
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { validateContact } = require('../middleware/validate');

router.use(protect);

router.route('/').get(getContacts).post(validateContact, createContact);
router.route('/:id').get(getContact).put(updateContact).delete(deleteContact);

module.exports = router;
