const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  method: { type: String, enum: ['bKash', 'Nagad', 'Rocket'], required: true },
  amountBDT: { type: Number, required: true },
  accountNumber: { type: String, required: true }, // bKash/Nagad number used by worker or employer
  trxId: { type: String, default: null }, // Required for deposits, auto-generated or updated for withdrawals
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);
