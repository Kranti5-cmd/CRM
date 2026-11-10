const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: 120,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: [
        'Student Onboarding',
        'Course Notification',
        'Billing & Payment',
        'Student Engagement',
        'Marketing Campaign',
        'Feedback',
        'General',
      ],
      default: 'Student Onboarding',
    },
    htmlContent: {
      type: String,
      required: [true, 'HTML content is required'],
    },
    bodyText: {
      type: String,
      default: '',
    },
    variables: {
      type: [String],
      default: [
        'student_name',
        'student_email',
        'course_name',
        'registration_date',
        'payment_status',
        'course_start_date',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);

