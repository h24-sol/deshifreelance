const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// 1. POST: Employer Deposit Request
router.post('/deposit', async (req, res) => {
  try {
    const { userId, method, amountBDT, trxId, accountNumber } = req.body;

    if (!trxId || !amountBDT) {
      return res.status(400).json({ message: 'Amount and Transaction ID are required.' });
    }

    const existingTrx = await Transaction.findOne({ trxId });
    if (existingTrx) {
      return res.status(400).json({ message: 'This Transaction ID (TrxID) has already been submitted.' });
    }

    const newTransaction = new Transaction({
      userId,
      type: 'deposit',
      method,
      amountBDT: Number(amountBDT),
      accountNumber,
      trxId: trxId.trim(),
      status: 'pending'
    });

    await newTransaction.save();
    res.status(201).json({ message: 'Deposit request submitted successfully! Awaiting approval.', transaction: newTransaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. POST: Worker Withdraw Request
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, method, amountBDT, accountNumber } = req.body;
    const withdrawAmount = Number(amountBDT);

    if (withdrawAmount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is ৳100 BDT.' });
    }

    const user = await User.findById(userId);
    if (!user || user.balanceBDT < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient balance to process withdrawal.' });
    }

    // Deduct user balance immediately to lock funds in escrow/pending
    user.balanceBDT -= withdrawAmount;
    await user.save();

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

// 3. POST: Admin Approve/Reject Payment (Or Gmail Parser Webhook)
router.post('/verify-transaction', async (req, res) => {
  try {
    const { transactionId, status } = req.body; // status: 'approved' or 'rejected'
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found.' });
    }

    transaction.status = status;
    await transaction.save();

    if (transaction.type === 'deposit' && status === 'approved') {
      // Add funds to employer account
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { balanceBDT: transaction.amountBDT }
      });
    } else if (transaction.type === 'withdraw' && status === 'rejected') {
      // Refund balance to worker account if withdrawal is rejected
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { balanceBDT: transaction.amountBDT }
      });
    }

    res.json({ message: `Transaction ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
