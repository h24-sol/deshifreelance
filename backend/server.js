const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
// IMPORTANT: Make sure to replace <db_password> with your actual MongoDB database password!
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://manisprogrammer_db_user:<db_password>@deshifreelance-db.6oigaje.mongodb.net/deshifreelance?appName=deshifreelance-db&retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// --- SCHEMAS & MODELS ---
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

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const token = req.headers['x-auth-token'] || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
  if (!token) return res.status(401).json({ message: 'No authentication token provided.' });
  try {
    req.user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// --- AUTHENTICATION ROUTES ---

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists.' });

    user = new User({ name, email, password, role: role || 'worker', balanceBDT: 0 });
    await user.save();

    res.json({ message: 'Registration successful! Please log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    const payload = JSON.stringify({ id: user._id, role: user.role });
    const token = 'header.' + Buffer.from(payload).toString('base64') + '.signature';

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balanceBDT: user.balanceBDT
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- MICROTASK & WITHDRAWAL ROUTES ---

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().populate('employer', 'name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const task = new Task({ ...req.body, employer: req.user.id });
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tasks/:id/submit', authMiddleware, async (req, res) => {
  res.json({ message: 'Proof submitted successfully for verification!' });
});

app.post('/api/withdraw', authMiddleware, async (req, res) => {
  try {
    const { method, accountNumber, amountBDT, bankDetails } = req.body;
    const user = await User.findById(req.user.id);
    const minWithdrawal = 50;

    if (!user) return res.status(404).json({ message: 'User profile not found.' });
    if (amountBDT < minWithdrawal) return res.status(400).json({ message: `Minimum withdrawal limit is ৳${minWithdrawal} BDT.` });
    if (user.balanceBDT < amountBDT) return res.status(400).json({ message: 'Insufficient balance to complete withdrawal.' });

    user.balanceBDT -= amountBDT;
    await user.save();

    const request = new Withdrawal({ user: user._id, method, accountNumber, amountBDT, bankDetails });
    await request.save();

    res.json({ message: `Submitted! ৳${amountBDT} BDT will be sent to your ${method} account.`, newBalance: user.balanceBDT });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- STATIC FILE SERVING & FALLBACK ROUTE ---
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found.' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
