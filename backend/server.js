const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas Cloud Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ SUCCESS: DeshiFreelance Cloud Database Connected!'))
  .catch(err => console.error('❌ ERROR: Database Connection Failed:', err));

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('DeshiFreelance API Backend Operational');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
