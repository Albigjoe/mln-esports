'use client';

import { useState } from 'react';
import {
  User, Trophy, ShieldCheck, Settings, Upload, Star,
  Swords, MapPin, BadgeCheck, Clock, AlertCircle,
  Edit3, Save, X, Camera
} from 'lucide-react';

const MOCK_PROFILE = {
  username: 'PhantomX_NG',
  realName: 'Alawaye Joseph',
  state: 'Lagos',
  rank: 'Mythic',
  role: 'CAPTAIN',
  teamName: 'Phantom Esports',
  kycStatus: 'PENDING',
  pictureUrl: null,
  joinedAt: '2026-01-15T00:00:00Z',
  stats: { games: 84, wins: 59, kills: 1243, assists: 876, savages: 12, mvps: 23 },
  tournaments: [
    { id: 't1', name: 'MLN Lagos Cup S1', placement: '🥇 1st', prize: '₦50,000', date: '2026-04-10' },
    { id: 't2', name: 'National Qualifier Q2', placement: '🥈 2nd', prize: '₦25,000', date: '2026-03-01' },
    { id: 't3', name: 'Community Cup March', placement: '🥉 3rd', prize: '₦10,000', date: '2026-03-20' },
  ],
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: <User size={16} /> },
  { id: 'history', label: 'History', icon: <Trophy size={16} /> },
  { id: 'kyc', label: 'KYC', icon: <ShieldCheck size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

const kycStatusStyle: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  UNVERIFIED: { label: 'Unverified', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: <AlertCircle size={14} /> },
  PENDING:    { label: 'Pending Review', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10', icon: <Clock size={14} /> },
  VERIFIED:   { label: 'Verified', color: 'text-mln-green border-mln-green/30 bg-mln-green/10', icon: <BadgeCheck size={14} /> },
};

export default function ProfilePage() {
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('Lagos-based MLBB player. Captain of Phantom Esports. Playing since S1. MVP of MLN Lagos Cup 2026. Book a scrim 👑');
  const [kycForm, setKycForm] = useState({ idType: 'NIN', idNumber: '', idImageUrl: '' });
  const [kycSubmitted, setKycSubmitted] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ email: 'alawaye@example.com', notifications: true, privacy: false });

  const p = MOCK_PROFILE;
  const wr = Math.round((p.stats.wins / p.stats.games) * 100);
  const kda = ((p.stats.kills + p.stats.assists) / Math.max(1, p.stats.games)).toFixed(1);
  const kyc = kycStatusStyle[p.kycStatus];

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKycSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Profile Hero */}
        <div className="relative rounded-2xl overflow-hidden bg-surface border border-border-color mb-6">
          {/* Banner */}
          <div className="h-36 bg-gradient-to-r from-mln-green/20 via-black to-mln-green/10 relative">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('/rnk-vs-astral.jpeg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
          </div>

          {/* Avatar + Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-background border-4 border-surface flex items-center justify-center text-4xl font-black text-mln-green shadow-xl">
                  {p.username[0]}
                </div>
                <button className="absolute bottom-1 right-1 w-7 h-7 bg-mln-green rounded-full flex items-center justify-center shadow-lg hover:bg-mln-green-dark transition-colors">
                  <Camera size={12} className="text-black" />
                </button>
              </div>

              <div className="flex-1 mt-2 sm:mt-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-white uppercase tracking-tight">{p.username}</h1>
                  {p.kycStatus === 'VERIFIED' && <BadgeCheck size={20} className="text-mln-green" />}
                  <span className="text-[10px] bg-mln-green/10 border border-mln-green/30 text-mln-green font-black uppercase tracking-widest px-2 py-0.5 rounded-full">{p.rank}</span>
                  <span className="text-[10px] bg-white/5 border border-border-color text-gray-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">{p.role}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><MapPin size={13} /> {p.state}</span>
                  <span className="flex items-center gap-1"><Trophy size={13} /> {p.teamName}</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> Joined {new Date(p.joinedAt).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* KYC Badge */}
              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest border px-3 py-1.5 rounded-full shrink-0 ${kyc.color}`}>
                {kyc.icon} {kyc.label}
              </div>
            </div>

            {/* Bio */}
            {editing ? (
              <div className="flex gap-2">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={2}
                  className="flex-1 bg-background border border-mln-green rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
                />
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditing(false)} className="p-2 bg-mln-green hover:bg-mln-green-dark text-black rounded-lg transition-colors"><Save size={16} /></button>
                  <button onClick={() => setEditing(false)} className="p-2 bg-background border border-border-color text-gray-400 hover:text-white rounded-lg transition-colors"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-gray-400 text-sm flex-1">{bio}</p>
                <button onClick={() => setEditing(true)} className="shrink-0 text-gray-600 hover:text-mln-green transition-colors mt-0.5">
                  <Edit3 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface border border-border-color rounded-xl p-1 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-1 justify-center ${
                tab === t.id ? 'bg-mln-green text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Games Played', value: p.stats.games, icon: <Swords size={20} />, color: 'text-white' },
              { label: 'Win Rate', value: `${wr}%`, icon: <Trophy size={20} />, color: 'text-mln-green' },
              { label: 'Avg KDA', value: kda, icon: <Star size={20} />, color: 'text-yellow-400' },
              { label: 'MVPs', value: p.stats.mvps, icon: <BadgeCheck size={20} />, color: 'text-mln-green' },
              { label: 'Total Kills', value: p.stats.kills.toLocaleString(), icon: <Swords size={20} />, color: 'text-red-400' },
              { label: 'Assists', value: p.stats.assists.toLocaleString(), icon: <Star size={20} />, color: 'text-blue-400' },
              { label: 'Savages', value: p.stats.savages, icon: <Zap />, color: 'text-mln-green' },
              { label: 'Total Wins', value: p.stats.wins, icon: <Trophy size={20} />, color: 'text-yellow-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface border border-border-color rounded-xl p-5 hover:border-mln-green/40 transition-colors">
                <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
                <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-3">
            {p.tournaments.map(t => (
              <div key={t.id} className="bg-surface border border-border-color rounded-xl p-5 flex items-center gap-5 hover:border-mln-green/40 transition-colors">
                <div className="text-3xl shrink-0">{t.placement.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="font-black text-white text-lg">{t.name}</div>
                  <div className="text-sm text-gray-400">{t.placement.split(' ').slice(1).join(' ')} · {new Date(t.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-mln-green font-black text-xl">{t.prize}</div>
                  <div className="text-xs text-gray-600 uppercase tracking-widest">Prize</div>
                </div>
              </div>
            ))}
            {p.tournaments.length === 0 && (
              <div className="bg-surface border border-border-color rounded-xl p-12 text-center">
                <Trophy className="mx-auto text-gray-700 mb-4" size={48} />
                <p className="text-gray-500">No tournament history yet. Register for your first event!</p>
              </div>
            )}
          </div>
        )}

        {tab === 'kyc' && (
          <div className="max-w-xl mx-auto">
            {kycSubmitted ? (
              <div className="bg-surface border border-mln-green/30 rounded-2xl p-10 text-center">
                <BadgeCheck className="mx-auto text-mln-green mb-4" size={56} />
                <h2 className="text-2xl font-black text-white mb-2">Documents Submitted!</h2>
                <p className="text-gray-400">Your KYC documents are under review. We will notify you within 24–48 hours.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border-color rounded-2xl p-6">
                <h2 className="text-xl font-black text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck size={22} className="text-mln-green" /> KYC Verification
                </h2>
                <p className="text-gray-400 text-sm mb-6">Verify your identity to unlock prize withdrawals and high-value tournament entry.</p>

                <form onSubmit={handleKycSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">ID Type</label>
                    <select
                      value={kycForm.idType}
                      onChange={e => setKycForm({...kycForm, idType: e.target.value})}
                      className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-4 text-white font-bold outline-none transition-colors"
                    >
                      <option value="NIN">NIN (National Identity Number)</option>
                      <option value="BVN">BVN (Bank Verification Number)</option>
                      <option value="PASSPORT">International Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">ID Number</label>
                    <input
                      type="text"
                      required
                      value={kycForm.idNumber}
                      onChange={e => setKycForm({...kycForm, idNumber: e.target.value})}
                      placeholder="Enter your ID number"
                      className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-4 text-white font-bold outline-none transition-colors placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Upload ID Document</label>
                    <label className="flex flex-col items-center justify-center gap-3 bg-background border-2 border-dashed border-border-color hover:border-mln-green rounded-xl p-8 cursor-pointer transition-colors group">
                      <Upload size={32} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                      <span className="text-gray-500 text-sm group-hover:text-white transition-colors">Click to upload document image</span>
                      <span className="text-xs text-gray-700">PNG, JPG up to 5MB</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => setKycForm({...kycForm, idImageUrl: e.target.files?.[0]?.name || ''})} />
                    </label>
                    {kycForm.idImageUrl && <p className="text-xs text-mln-green mt-2">✓ {kycForm.idImageUrl}</p>}
                  </div>

                  <div className="bg-mln-green/5 border border-mln-green/20 rounded-xl p-4 text-xs text-gray-400">
                    🔒 Your documents are encrypted and only used for identity verification. We comply with Nigerian data protection regulations (NDPR).
                  </div>

                  <button type="submit" className="w-full bg-mln-green hover:bg-mln-green-dark text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,200,83,0.2)]">
                    Submit for Verification
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <Settings size={20} className="text-mln-green" /> Account Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Email Address</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={e => setSettingsForm({...settingsForm, email: e.target.value})}
                    className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-4 text-white font-bold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-4 text-white font-bold outline-none transition-colors placeholder-gray-600"
                  />
                </div>

                {/* Toggles */}
                {[
                  { key: 'notifications', label: 'Match & Tournament Notifications', desc: 'Get notified about match results, registrations and reminders' },
                  { key: 'privacy', label: 'Private Profile', desc: 'Hide your stats and history from non-teammates' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between bg-background border border-border-color rounded-xl p-4">
                    <div>
                      <div className="text-white font-bold text-sm">{label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                    <button
                      onClick={() => setSettingsForm(f => ({...f, [key]: !f[key as keyof typeof f]}))}
                      className={`w-12 h-6 rounded-full transition-all relative ${settingsForm[key as keyof typeof settingsForm] ? 'bg-mln-green' : 'bg-border-color'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settingsForm[key as keyof typeof settingsForm] ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                ))}

                <button className="w-full bg-mln-green hover:bg-mln-green-dark text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-surface border border-red-500/20 rounded-2xl p-6">
              <h3 className="text-red-400 font-black uppercase tracking-wider text-sm mb-3">Danger Zone</h3>
              <button className="w-full border border-red-500/30 hover:border-red-400 text-red-400 hover:text-red-300 font-bold uppercase tracking-widest py-3 rounded-lg text-sm transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Zap({ ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
