const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Complaint', 'Technical Issue', 'Billing', 'Service Request', 'General Inquiry'],
      default: 'Service Request',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);

