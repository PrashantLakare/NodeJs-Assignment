const mongoose = require('mongoose');
const LoginStatusSchema = new mongoose.Schema({
  loginStatusId: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  loginTime: { type: Date, default: () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in ms
    return new Date(now.getTime() + istOffset);
  }},
  // dateTime: Date,
  ipAddress: { type: String },
  userAgent: { type: String }
});
module.exports = mongoose.model('LoginStatus', LoginStatusSchema);