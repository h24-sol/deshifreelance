import React, { useState } from 'react';
import axios from 'axios';

export default function WithdrawModal({ isOpen, onClose, userId, userBalance, refreshUserData }) {
  const [method, setMethod] = useState('bKash');
  const [amountBDT, setAmountBDT] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const res = await axios.post('https://deshifreelance.onrender.com/api/payments/withdraw', {
        userId,
        method,
        amountBDT,
        accountNumber
      });
      setMsg(res.data.message);
      setAmountBDT('');
      setAccountNumber('');
      if (refreshUserData) refreshUserData();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Withdrawal request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 text-white shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✕</button>
        <h2 className="text-xl font-bold mb-2 text-rose-400">Withdraw Earnings</h2>
        <p className="text-xs text-slate-400 mb-4">Available Balance: <span className="text-emerald-400 font-bold">৳{userBalance} BDT</span></p>

        {msg && <div className="p-3 mb-4 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Receive Payment Via</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5">
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Your Personal Mobile Number</label>
            <input type="text" required placeholder="017XXXXXXXX" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Withdraw Amount (Min ৳100)</label>
            <input type="number" min="100" max={userBalance} required placeholder="e.g. 300" value={amountBDT} onChange={(e) => setAmountBDT(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg mt-2">
            {loading ? 'Processing...' : 'Request Cashout'}
          </button>
        </form>
      </div>
    </div>
  );
}
