const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['Follow-up', 'Meeting', 'Call', 'Email', 'Other'],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    assignedTo: {
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
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
