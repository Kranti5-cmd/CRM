const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    leadSource: {
      type: String,
      enum: [
        'Website',
        'Referral',
        'Social Media',
        'Cold Call',
        'Email Campaign',
        'Advertisement',
        'Trade Show',
        'Arshith Boot Camp',
        'Other',
      ],
      default: 'Website',
    },
    leadStatus: {
      type: String,
      enum: [
        'New',
        'Contacted',
        'Qualified',
        'Proposal Sent',
        'Negotiation',
        'Converted',
        'Lost',
      ],
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    value: {
      type: Number,
      default: 0,
    },
    nextFollowUp: {
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
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    courseName: {
      type: String,
      trim: true,
      default: '',
    },
    registrationDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Free', 'N/A'],
      default: 'N/A',
    },
    registrationStatus: {
      type: String,
      enum: ['Enrolled', 'In Progress', 'Completed', 'Dropped', 'Pending', 'N/A'],
      default: 'N/A',
    },
  },
  { timestamps: true }
);

leadSchema.index({ fullName: 'text', email: 'text', companyName: 'text' });
leadSchema.index({ email: 1, courseName: 1 });
leadSchema.index({ studentId: 1 });

module.exports = mongoose.model('Lead', leadSchema);
