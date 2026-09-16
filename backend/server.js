const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
app.use(express.json());
app.use(cors());

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Connect to MongoDB Atlas Cloud Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ SUCCESS: DeshiFreelance Cloud Database Connected!'))
  .catch(err => console.error('❌ ERROR: Database Connection Failed:', err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Serve Frontend Home Page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
