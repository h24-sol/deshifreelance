const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Note: Ensure you pass your auth/admin middleware here in production
// const { protect, adminProtect } = require('../middleware/authMiddleware');

// 1. POST: Employer Deposit Request
router.post('/deposit', async (req, res) => {
  try {
    const { userId, method, amountBDT, trxId, accountNumber } = req.body;

    if (!userId || !amountBDT || !trxId || !accountNumber) {
      return res.status(400).json({ message: 'All fields (Amount, Method, Account Number, TrxID) are required.' });
    }

    if (Number(amountBDT) < 10) {
      return res.status(400).json({ message: 'Minimum deposit amount is ৳10 BDT.' });
    }

    // Prevent duplicate TrxID reuse across the platform
    const existingTrx = await Transaction.findOne({ trxId: trxId.trim() });
    if (existingTrx) {
      return res.status(400).json({ message: 'This Transaction ID (TrxID) has already been submitted.' });
    }

    const newTransaction = new Transaction({
      userId,
      type: 'deposit',
      method,
      amountBDT: Number(amountBDT),
      accountNumber: accountNumber.trim(),
      trxId: trxId.trim(),
      status: 'pending'
    });

    await newTransaction.save();
    res.status(201).json({ message: 'Deposit request submitted successfully! Awaiting verification.', transaction: newTransaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST: Worker Withdraw Request (Atomic balance lock to prevent double-spending)
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, method, amountBDT, accountNumber } = req.body;
    const withdrawAmount = Number(amountBDT);

    if (!userId || !accountNumber || !withdrawAmount) {
      return res.status(400).json({ message: 'User ID, Mobile Number, and Amount are required.' });
    }

    if (withdrawAmount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ৳100 BDT.' });
    }

    // Atomic Balance Deduction: Only succeeds if user balance is >= withdrawAmount
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, balanceBDT: { $gte: withdrawAmount } },
      { $inc: { balanceBDT: -withdrawAmount } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ message: 'Insufficient balance to process withdrawal.' });
    }

    const newTransaction = new Transaction({
      userId,
      type: 'withdraw',
      method,
      amountBDT: withdrawAmount,
      accountNumber: accountNumber.trim(),
      status: 'pending'
    });

    await newTransaction.save();
    res.status(201).json({ message: 'Withdrawal request submitted! Processing via admin.', transaction: newTransaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. POST: Admin Approve/Reject Payment or Automated Webhook Hook
router.post('/verify-transaction', async (req, res) => {
  try {
    const { transactionId, status } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status status. Use approved or rejected.' });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found or already processed.' });
    }

    transaction.status = status;
    await transaction.save();

    if (transaction.type === 'deposit' && status === 'approved') {
      // Add funds to employer account upon successful verification
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { balanceBDT: transaction.amountBDT }
      });
    } else if (transaction.type === 'withdraw' && status === 'rejected') {
      // Return deducted balance back to worker if withdrawal request was rejected
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { balanceBDT: transaction.amountBDT }
      });
    }

    res.json({ message: `Transaction has been successfully ${status}.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
