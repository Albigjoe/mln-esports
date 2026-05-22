'use client';

import { useState } from 'react';
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle2,
  XCircle, ShieldCheck, CreditCard, Trophy, Zap, Copy, RefreshCw
} from 'lucide-react';

const MOCK_TRANSACTIONS = [
  { id: 'tx1', type: 'DEPOSIT', amount: 5000, status: 'SUCCESS', reference: 'PAY-001-ABC', gateway: 'PAYSTACK', createdAt: '2026-05-20T10:30:00Z' },
  { id: 'tx2', type: 'ENTRY_FEE', amount: -1500, status: 'SUCCESS', reference: 'REG-TRN-001', gateway: 'WALLET_LEDGER', createdAt: '2026-05-21T14:00:00Z' },
  { id: 'tx3', type: 'PRIZE_CLAIM', amount: 10000, status: 'SUCCESS', reference: 'PRIZE-TRN-001', gateway: 'PAYSTACK', createdAt: '2026-05-22T09:00:00Z' },
  { id: 'tx4', type: 'WITHDRAW', amount: -3000, status: 'PENDING', reference: 'WD-002-XYZ', gateway: 'FLUTTERWAVE', createdAt: '2026-05-22T11:00:00Z' },
];

const BALANCE = 10500;

const txTypeLabel: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  DEPOSIT:     { label: 'Deposit',      icon: <ArrowDownLeft size={16} />, color: 'text-mln-green' },
  ENTRY_FEE:  { label: 'Entry Fee',    icon: <Trophy size={16} />,        color: 'text-yellow-400' },
  PRIZE_CLAIM:{ label: 'Prize Won',    icon: <Zap size={16} />,           color: 'text-mln-green' },
  WITHDRAW:   { label: 'Withdraw',     icon: <ArrowUpRight size={16} />,  color: 'text-red-400' },
};

const statusBadge: Record<string, string> = {
  SUCCESS: 'bg-mln-green/10 text-mln-green border border-mln-green/30',
  PENDING: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  FAILED:  'bg-red-500/10 text-red-400 border border-red-500/30',
};

export default function WalletPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const quickAmounts = [500, 1000, 2000, 5000];

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 100) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    alert(`Paystack checkout will open for ₦${parseFloat(amount).toLocaleString()}.\n\nIntegrate your Paystack public key to go live.`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">My Finances</span>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-3">
            <Wallet className="text-mln-green" size={36} />
            Wallet
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Balance + Actions */}
          <div className="lg:col-span-1 space-y-4">

            {/* Balance Card */}
            <div className="relative overflow-hidden bg-surface border border-border-color rounded-2xl p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-mln-green/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Balance</span>
                <button className="text-gray-600 hover:text-mln-green transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="text-5xl font-black text-white mb-1">
                ₦<span className="text-mln-green">{BALANCE.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Nigerian Naira (NGN)</div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'deposit' ? 'bg-mln-green text-black' : 'bg-background border border-border-color text-gray-400 hover:border-mln-green hover:text-white'}`}
                >
                  <ArrowDownLeft size={16} /> Deposit
                </button>
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'withdraw' ? 'bg-mln-green text-black' : 'bg-background border border-border-color text-gray-400 hover:border-mln-green hover:text-white'}`}
                >
                  <ArrowUpRight size={16} /> Withdraw
                </button>
              </div>
            </div>

            {/* KYC Status Card */}
            <div className="bg-surface border border-yellow-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={20} className="text-yellow-400" />
                <span className="font-bold text-white text-sm uppercase tracking-wider">KYC Verification</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                <Clock size={12} /> Pending
              </div>
              <p className="text-gray-400 text-xs mb-4">Complete verification to unlock withdrawals and prize claims above ₦10,000.</p>
              <a href="/profile?tab=kyc" className="block text-center bg-background border border-yellow-500/40 hover:border-yellow-400 text-yellow-400 text-xs font-bold uppercase tracking-widest py-3 rounded-lg transition-colors">
                Complete KYC →
              </a>
            </div>
          </div>

          {/* Right: Deposit/Withdraw Form + Transactions */}
          <div className="lg:col-span-2 space-y-4">

            {/* Deposit / Withdraw Form */}
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-mln-green" />
                {activeTab === 'deposit' ? 'Fund Your Wallet' : 'Withdraw Funds'}
              </h2>

              {activeTab === 'deposit' ? (
                <form onSubmit={handleDeposit} className="space-y-5">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Quick Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setAmount(q.toString())}
                          className={`py-2 rounded-lg text-sm font-bold transition-all border ${amount === q.toString() ? 'bg-mln-green text-black border-mln-green' : 'bg-background border-border-color text-gray-400 hover:border-mln-green hover:text-white'}`}
                        >
                          ₦{q.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                      Custom Amount (NGN)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mln-green font-black text-lg">₦</span>
                      <input
                        type="number"
                        min="100"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg pl-10 pr-4 py-4 text-white text-lg font-bold outline-none transition-colors placeholder-gray-600"
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Minimum deposit: ₦100</p>
                  </div>

                  <div className="bg-background border border-border-color rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Amount</span>
                      <span>₦{amount ? parseFloat(amount).toLocaleString() : '0'}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Gateway Fee (1.5%)</span>
                      <span>₦{amount ? (parseFloat(amount) * 0.015).toFixed(2) : '0'}</span>
                    </div>
                    <div className="h-px bg-border-color" />
                    <div className="flex justify-between text-white font-black">
                      <span>Total Charged</span>
                      <span className="text-mln-green">₦{amount ? (parseFloat(amount) * 1.015).toFixed(2) : '0'}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !amount}
                    className="w-full bg-mln-green hover:bg-mln-green-dark disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,200,83,0.25)] hover:shadow-[0_0_30px_rgba(0,200,83,0.4)] text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={16} className="animate-spin" /> Processing...
                      </span>
                    ) : (
                      'Pay with Paystack →'
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="0123456789"
                      className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-4 text-white font-bold outline-none transition-colors placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Bank Name</label>
                    <select className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-4 text-white font-bold outline-none transition-colors">
                      <option>Select Bank...</option>
                      <option>GTBank</option>
                      <option>Access Bank</option>
                      <option>First Bank</option>
                      <option>Zenith Bank</option>
                      <option>UBA</option>
                      <option>Opay</option>
                      <option>Palmpay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Amount (NGN)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mln-green font-black text-lg">₦</span>
                      <input
                        type="number"
                        placeholder="Minimum ₦500"
                        className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg pl-10 pr-4 py-4 text-white text-lg font-bold outline-none transition-colors placeholder-gray-600"
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/30 rounded-xl p-4 text-xs text-yellow-400">
                    ⚠️ KYC verification required for withdrawals. Processing takes 1–2 business days.
                  </div>
                  <button className="w-full bg-mln-green hover:bg-mln-green-dark text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all text-sm">
                    Request Withdrawal
                  </button>
                </div>
              )}
            </div>

            {/* Transaction History */}
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock size={20} className="text-mln-green" />
                Transaction History
              </h2>

              <div className="space-y-3">
                {MOCK_TRANSACTIONS.map(tx => {
                  const meta = txTypeLabel[tx.type] || { label: tx.type, icon: null, color: 'text-white' };
                  return (
                    <div key={tx.id} className="flex items-center gap-4 bg-background border border-border-color rounded-xl p-4 hover:border-mln-green/40 transition-colors group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-surface border border-border-color ${meta.color}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm">{meta.label}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-600 font-mono truncate">{tx.reference}</span>
                          <button
                            onClick={() => handleCopy(tx.reference)}
                            className="text-gray-700 hover:text-mln-green transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-black ${tx.amount > 0 ? 'text-mln-green' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}₦{Math.abs(tx.amount).toLocaleString()}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusBadge[tx.status]}`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
