const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  rewardBDT: { type: Number, required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workersNeeded: { type: Number, default: 1 },
  submissions: [{
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    proofText: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
