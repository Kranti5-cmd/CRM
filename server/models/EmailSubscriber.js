const mongoose = require('mongoose');

const emailSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    lists: {
      type: [String],
      default: ['Arshith Boot Camp Students'],
      index: true,
    },
    hasConsent: {
      type: Boolean,
      default: true,
    },
    consentDate: {
      type: Date,
      default: Date.now,
    },
    isUnsubscribed: {
      type: Boolean,
      default: false,
      index: true,
    },
    unsubscribedAt: {
      type: Date,
    },
    unsubscribeReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailSubscriber', emailSubscriberSchema);

