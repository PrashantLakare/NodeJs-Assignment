const mongoose = require('mongoose');
const PersonSchema = new mongoose.Schema({
  personalUniqueId: { type: String, default: null },
  firstName: String,
  middleName: String,
  lastName: String,
  userId: String,
  gender: String,
  dateOfBirth: Date,
  age: Number,
  address: {
    flatNumber: String,
    societyName: String,
    streetName: String,
    city: String,
    state: String,
    pinCode: String
  },
  phoneNumber: String,
  mobileNumber: String,
  physicalDisability: String,
  maritalStatus: String,
  educationStatus: String,
  birthSign: String,
  createdBy: String,
  profileApprovedByAdmin: { type: Boolean, default: false },
  updateApprovalPending: { type: Boolean, default: false },
});
module.exports = mongoose.model('Person', PersonSchema);
