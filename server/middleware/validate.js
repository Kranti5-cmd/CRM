const { body, validationResult } = require('express-validator');

// Process validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// User registration validation
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'Sales Representative'])
    .withMessage('Invalid role'),
  handleValidation,
];

// Lead creation validation
const validateLead = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('leadSource')
    .optional()
    .isIn([
      'Website',
      'Referral',
      'Social Media',
      'Cold Call',
      'Email Campaign',
      'Advertisement',
      'Trade Show',
      'Other',
    ])
    .withMessage('Invalid lead source'),
  body('leadStatus')
    .optional()
    .isIn([
      'New',
      'Contacted',
      'Qualified',
      'Proposal Sent',
      'Negotiation',
      'Converted',
      'Lost',
    ])
    .withMessage('Invalid lead status'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority'),
  body('value')
    .optional()
    .isNumeric()
    .withMessage('Value must be a number'),
  handleValidation,
];

// Contact creation validation
const validateContact = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  handleValidation,
];

// Deal creation validation
const validateDeal = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Deal title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('value')
    .notEmpty()
    .withMessage('Deal value is required')
    .isNumeric()
    .withMessage('Value must be a number')
    .custom((value) => value >= 0)
    .withMessage('Value cannot be negative'),
  body('stage')
    .optional()
    .isIn([
      'New Opportunity',
      'Qualification',
      'Proposal',
      'Negotiation',
      'Won',
      'Lost',
    ])
    .withMessage('Invalid deal stage'),
  body('probability')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Probability must be between 0 and 100'),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLead,
  validateContact,
  validateDeal,
  handleValidation,
};
