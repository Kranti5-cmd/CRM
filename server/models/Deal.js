const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: [0, 'Value cannot be negative'],
    },
    stage: {
      type: String,
      enum: [
        'New Opportunity',
        'Qualification',
        'Proposal',
        'Negotiation',
        'Won',
        'Lost',
      ],
      default: 'New Opportunity',
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    expectedCloseDate: {
      type: Date,
    },
    actualCloseDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deal', dealSchema);
