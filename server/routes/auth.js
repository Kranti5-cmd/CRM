const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister } = require('../middleware/validate');

router.post('/register', validateRegister, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);

module.exports = router;
