const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker', 'employer'], default: 'worker' },
  balanceBDT: { type: Number, default: 0 },
  mobileWallet: {
    provider: { type: String, enum: ['bKash', 'Nagad', 'Rocket', ''] },
    accountNumber: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
