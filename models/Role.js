const mongoose = require('mongoose');
const RoleSchema = new mongoose.Schema({
  roleId: String,
  roleName: String
});
module.exports = mongoose.model('Role', RoleSchema);