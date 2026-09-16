import React, { useState } from 'react';
import axios from 'axios';

export default function DepositModal({ isOpen, onClose, userId, refreshUserData }) {
  const [method, setMethod] = useState('bKash');
  const [amountBDT, setAmountBDT] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await axios.post('https://deshifreelance.onrender.com/api/payments/deposit', {
        userId,
        method,
        amountBDT,
        accountNumber,
        trxId
      });
      setMsg(res.data.message);
      setAmountBDT('');
      setAccountNumber('');
      setTrxId('');
      if (refreshUserData) refreshUserData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Deposit failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 text-white shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✕</button>
        <h2 className="text-xl font-bold mb-2 text-emerald-400">+ Deposit Funds</h2>
        
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs mb-4 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Admin Number:</span>
            <span className="font-mono text-emerald-400 font-bold">01774460656</span>
          </div>
          <p className="text-slate-300">Supported: bKash, Nagad, Rocket (Send Money / Cash-In)</p>
        </div>

        {msg && <div className="p-3 mb-4 text-xs rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Payment Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5">
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Sender Mobile Number</label>
            <input type="text" required placeholder="017XXXXXXXX" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Amount (BDT ৳)</label>
            <input type="number" min="100" required placeholder="e.g. 500" value={amountBDT} onChange={(e) => setAmountBDT(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Transaction ID (TrxID)</label>
            <input type="text" required placeholder="e.g. 9J87X1K2LQ" value={trxId} onChange={(e) => setTrxId(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 font-mono" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg mt-2">
            {loading ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
