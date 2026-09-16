import React, { useState } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

export default function Navbar({ user, refreshUserData }) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-slate-950 font-extrabold p-2 rounded-lg text-lg">DF</div>
          <span className="font-bold text-xl">DeshiFreelance</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400 font-medium">{user?.role || 'boss (employer)'}</span>
          
          <div className="bg-slate-800 border border-slate-700 text-emerald-400 px-3 py-1.5 rounded-lg font-bold">
            ৳ {user?.balanceBDT || 0} BDT
          </div>

          {/* Deposit Button */}
          <button 
            onClick={() => setIsDepositOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition"
          >
            + Deposit
          </button>

          {/* Withdraw Button */}
          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-4 py-2 rounded-lg font-bold hover:bg-emerald-900/50 transition"
          >
            Withdraw
          </button>
          
          <button className="bg-rose-900/30 text-rose-400 border border-rose-800 px-3 py-2 rounded-lg hover:bg-rose-900/50">
            Logout
          </button>
        </div>
      </nav>

      {/* Modals */}
      <DepositModal 
        isOpen={isDepositOpen} 
        onClose={() => setIsDepositOpen(false)} 
        userId={user?._id}
        refreshUserData={refreshUserData}
      />

      <WithdrawModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
        userId={user?._id}
        userBalance={user?.balanceBDT || 0}
        refreshUserData={refreshUserData}
      />
    </>
  );
}
