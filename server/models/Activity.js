const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'call',
        'email',
        'meeting',
        'note',
        'task',
        'deal_update',
        'lead_update',
      ],
      required: [true, 'Activity type is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
    },
    relatedDeal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deal',
    },
    relatedContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
