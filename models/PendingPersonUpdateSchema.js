const mongoose = require('mongoose');

const PendingPersonUpdateSchema = new mongoose.Schema({
  personId: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
  requestedBy: String, // userId
  oldData: Object,
  newData: Object,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  requestedAt: { type: Date, default: Date.now },
  reviewedAt: Date,
  reviewedBy: String, // admin userId
  rejectionReason: String
});

module.exports = mongoose.model('PendingPersonUpdate', PendingPersonUpdateSchema);
