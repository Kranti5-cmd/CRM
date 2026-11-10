const mongoose = require('mongoose');

const emailWorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
    },
    triggerEvent: {
      type: String,
      required: [true, 'Trigger event is required'],
      enum: [
        'student_registered',
        'registration_confirmed',
        'course_enrolled',
        'payment_pending',
        'payment_completed',
        'course_starting_soon',
        'counselor_followup_needed',
        'student_inactive_7d',
        'course_completed',
        'feedback_request',
        'manual_trigger',
      ],
    },
    conditions: {
      requireConsent: { type: Boolean, default: true },
      minDaysSinceRegistration: { type: Number, default: 0 },
      paymentStatus: { type: String, default: 'Any' },
      courseName: { type: String, default: 'Any' },
    },
    delayHours: {
      type: Number,
      default: 0,
      min: 0,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    stats: {
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    lastTriggeredAt: {
      type: Date,
    },
    nextScheduledExecution: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailWorkflow', emailWorkflowSchema);

