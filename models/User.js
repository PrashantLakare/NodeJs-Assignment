const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  email: String,
  password: String,
  roleId: String
});
module.exports = mongoose.model('User', UserSchema);