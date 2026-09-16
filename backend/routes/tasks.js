const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET ALL TASKS
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().populate('employer', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE TASK (Employer only)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, rewardBDT, workersNeeded } = req.body;

    const newTask = new Task({
      title,
      description,
      rewardBDT,
      workersNeeded,
      employer: req.user.id
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SUBMIT PROOF FOR TASK (Worker)
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { proofText } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.submissions.push({
      worker: req.user.id,
      proofText
    });

    await task.save();
    res.json({ message: 'Proof submitted successfully!', task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
