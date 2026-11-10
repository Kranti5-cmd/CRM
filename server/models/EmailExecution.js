const mongoose = require('mongoose');

const emailExecutionSchema = new mongoose.Schema(
  {
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailWorkflow',
      required: true,
      index: true,
    },
    triggerEvent: {
      type: String,
      required: true,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Queued', 'Processing', 'Delivered', 'Sent', 'Failed', 'Skipped_Consent', 'Skipped_Duplicate'],
      default: 'Queued',
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    providerMessageId: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
      default: '',
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
      index: true,
    },
    executedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailExecutionSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('EmailExecution', emailExecutionSchema);

