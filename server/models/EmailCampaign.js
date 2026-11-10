const mongoose = require('mongoose');

const emailCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: 120,
    },
    subject: {
      type: String,
      required: [true, 'Campaign subject is required'],
      trim: true,
      maxlength: 200,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      required: [true, 'Email template is required'],
    },
    segment: {
      type: String,
      enum: [
        'Arshith Boot Camp Students',
        'New Registrations',
        'Interested Leads',
        'Converted Students',
        'Pending Payments',
        'Course Completed Students',
        'Marketing Subscribers',
        'All Students',
      ],
      default: 'Arshith Boot Camp Students',
    },
    status: {
      type: String,
      enum: ['Draft', 'Scheduled', 'In Progress', 'Sent', 'Cancelled'],
      default: 'Draft',
    },
    scheduledAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    stats: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailCampaign', emailCampaignSchema);

