const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientName: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailWorkflow',
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailCampaign',
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Failed', 'Unsubscribed'],
      default: 'Sent',
      index: true,
    },
    providerMessageId: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    events: [
      {
        event: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
    openedAt: {
      type: Date,
    },
    clickedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ recipientEmail: 1, workflow: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);

