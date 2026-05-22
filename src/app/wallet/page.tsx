'use client';

import { useState } from 'react';
import {
  Trophy, Clock, CheckCircle2, ShieldCheck, Zap, Copy, RefreshCw,
  Award, Flame, TrendingUp, Users, Target
} from 'lucide-react';

const MOCK_POINTS_HISTORY = [
  { id: 'tx1', type: 'TOURNAMENT_WIN', amount: 1500, status: 'SUCCESS', reference: 'TRN-WIN-LGS1', source: 'MLN Lagos Cup S1', createdAt: '2026-05-20T10:30:00Z' },
  { id: 'tx2', type: 'ENTRY_FEE', amount: -200, status: 'SUCCESS', reference: 'REG-TRN-002', source: 'National Qualifiers Entry', createdAt: '2026-05-21T14:00:00Z' },
  { id: 'tx3', type: 'SCRIM_BONUS', amount: 50, status: 'SUCCESS', reference: 'SCR-OPP-PHTX', source: 'Scrim Win vs Team Phantom', createdAt: '2026-05-22T09:00:00Z' },
  { id: 'tx4', type: 'DAILY_QUEST', amount: 20, status: 'SUCCESS', reference: 'QST-DAY-22', source: 'Daily MVP Quest Cleared', createdAt: '2026-05-22T11:00:00Z' },
];

const POINTS_BALANCE = 3450;
const RANK_LEVEL = 12;
const PROGRESS_TO_NEXT = 65; // %

const txTypeLabel: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TOURNAMENT_WIN: { label: 'Tournament Prize', icon: <Trophy size={16} />,        color: 'text-yellow-400' },
  ENTRY_FEE:      { label: 'Tournament Entry', icon: <Target size={16} />,        color: 'text-red-400' },
  SCRIM_BONUS:    { label: 'Scrim Match RP',   icon: <Users size={16} />,         color: 'text-mln-green' },
  DAILY_QUEST:    { label: 'Daily Quest Clear',icon: <Flame size={16} />,         color: 'text-blue-400' },
};

export default function RewardsPage() {
  const [copied, setCopied] = useState(false);

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
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">E-Sports Rewards Hub</span>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-3">
            <Award className="text-mln-green animate-pulse" size={36} />
            Rewards & RP
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Side: Points Panel & Rank Level */}
          <div className="lg:col-span-1 space-y-4">

            {/* Points Summary Card */}
            <div className="relative overflow-hidden bg-surface border border-border-color rounded-2xl p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-mln-green/5 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Rank Points (RP)</span>
                <button className="text-gray-600 hover:text-mln-green transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="text-5xl font-black text-white mb-2 flex items-baseline gap-2">
                <span className="text-mln-green">{POINTS_BALANCE.toLocaleString()}</span>
                <span className="text-sm font-bold text-gray-500">RP</span>
              </div>
              
              {/* Level Progress */}
              <div className="mt-6 pt-4 border-t border-border-color/50">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="text-gray-400">Level {RANK_LEVEL} Elite</span>
                  <span className="text-mln-green">Level {RANK_LEVEL + 1}</span>
                </div>
                <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border-color">
                  <div className="bg-mln-green h-full rounded-full transition-all duration-1000" style={{ width: `${PROGRESS_TO_NEXT}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-2">Earn 550 more RP to level up and unlock exclusive tournament divisions.</div>
              </div>
            </div>

            {/* Leaderboard Standing */}
            <div className="bg-surface border border-border-color rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={20} className="text-mln-green" />
                <span className="font-bold text-white text-sm uppercase tracking-wider">National Standing</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background border border-border-color rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-white">#14</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">Lagos State</div>
                </div>
                <div className="bg-background border border-border-color rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-white">#112</div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-1">National rank</div>
                </div>
              </div>
            </div>

            {/* Profile Verification status */}
            <div className="bg-surface border border-mln-green/10 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={18} className="text-mln-green" />
                <span className="font-bold text-white text-sm uppercase tracking-wider">Tournament Eligibility</span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Profile verification (KYC status) is required to register for national cash prize events. 
              </p>
              <a href="/profile?tab=kyc" className="block text-center bg-background hover:bg-surface-hover border border-border-color hover:border-mln-green text-gray-300 text-xs font-bold uppercase tracking-widest py-3 rounded-lg mt-4 transition-all">
                Check Eligibility status →
              </a>
            </div>
          </div>

          {/* Right Side: RP Ledger Points Flow */}
          <div className="lg:col-span-2 space-y-4">

            {/* Reward System Info Header */}
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={20} className="text-mln-green" />
                MLN Point System
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                We've disabled monetary transactions. Player wallets operate purely on **Rank Points (RP)** and rewards accumulated from competitive performance. Use your RP to join premium lobbies and track your ranking stats.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-background border border-border-color p-3 rounded-xl flex items-center gap-3">
                  <Trophy size={16} className="text-yellow-400" />
                  <div>
                    <div className="font-bold text-white">Wins</div>
                    <div className="text-gray-500">Earn RP on match victories</div>
                  </div>
                </div>
                <div className="bg-background border border-border-color p-3 rounded-xl flex items-center gap-3">
                  <Flame size={16} className="text-red-400" />
                  <div>
                    <div className="font-bold text-white">Tournaments</div>
                    <div className="text-gray-500">Earn up to 2,000 RP per win</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RP Transactions History */}
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <Clock size={20} className="text-mln-green" />
                RP Ledger History
              </h2>

              <div className="space-y-3">
                {MOCK_POINTS_HISTORY.map(tx => {
                  const meta = txTypeLabel[tx.type] || { label: tx.type, icon: null, color: 'text-white' };
                  return (
                    <div key={tx.id} className="flex items-center gap-4 bg-background border border-border-color rounded-xl p-4 hover:border-mln-green/40 transition-colors group">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-surface border border-border-color ${meta.color}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm">{meta.label}</div>
                        <div className="text-xs text-gray-500 font-semibold mt-0.5 truncate">{tx.source}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{new Date(tx.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-black ${tx.amount > 0 ? 'text-mln-green' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} RP
                        </div>
                        <div className="flex items-center gap-1.5 justify-end mt-1 text-[10px] text-gray-500 font-mono">
                          <span>{tx.reference}</span>
                          <button
                            onClick={() => handleCopy(tx.reference)}
                            className="text-gray-700 hover:text-mln-green transition-colors opacity-0 group-hover:opacity-100"
                          >
                            {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
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
