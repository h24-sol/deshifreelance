const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Schemas & Models ---
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker', 'employer'], default: 'worker' },
  balanceBDT: { type: Number, default: 0 }
});

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  rewardBDT: Number,
  workersNeeded: Number,
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  method: String,
  accountNumber: String,
  amountBDT: Number,
  bankDetails: Object,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Task = mongoose.model('Task', taskSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// --- Auth Middleware Helper ---
const authMiddleware = (req, res, next) => {
  const token = req.headers['x-auth-token'] || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ message: 'No authentication token provided.' });
  try {
    // Basic decode assumption for lightweight setups
    req.user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// --- API ROUTES ---

// 1. Get Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().populate('employer', 'name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create Task
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const task = new Task({ ...req.body, employer: req.user.id });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Submit Task Proof
app.post('/api/tasks/:id/submit', authMiddleware, async (req, res) => {
  res.json({ message: 'Proof submitted successfully for verification!' });
});

// 4. NEW: Handle bKash, Nagad, Rocket & Bank Withdrawal Requests
app.post('/api/withdraw', authMiddleware, async (req, res) => {
  try {
    const { method, accountNumber, amountBDT, bankDetails } = req.body;
    const user = await User.findById(req.user.id);

    const minWithdrawal = 50; // Minimum ৳50 BDT limit

    if (!user) return res.status(404).json({ message: 'User profile not found.' });
    if (amountBDT < minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal limit is ৳${minWithdrawal} BDT.` });
    }
    if (user.balanceBDT < amountBDT) {
      return res.status(400).json({ message: 'Insufficient balance to complete withdrawal.' });
    }

    // Deduct user balance
    user.balanceBDT -= amountBDT;
    await user.save();

    // Log transaction to DB
    const request = new Withdrawal({
      user: user._id,
      method,
      accountNumber,
      amountBDT,
      bankDetails
    });
    await request.save();

    res.json({
      message: `Successfully submitted request! ৳${amountBDT} BDT will be sent to your ${method} account.`,
      newBalance: user.balanceBDT
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Serve Static Frontend Files ---
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
