const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  githubUsername: { type: String, default: '' },
  leetcodeUsername: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
