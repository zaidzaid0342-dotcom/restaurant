const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','customer'], default: 'customer' }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
