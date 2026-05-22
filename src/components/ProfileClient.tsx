'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Trophy, ShieldCheck, Settings, Star,
  Swords, MapPin, BadgeCheck, Clock, AlertCircle,
  Edit3, Save, X
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const MLBB_RANKS = [
  'Warrior','Elite','Master','Grandmaster','Epic','Legend','Mythic','Mythical Glory',
];

const PLAYER_ROLES = ['PLAYER','CAPTAIN','COACH','ANALYST','MANAGER'];

type Player = {
  id: string;
  username: string;
  realName: string | null;
  role: string;
  state: string;
  rank: string;
  pictureUrl: string | null;
  team?: { name: string } | null;
  createdAt?: string;
};

type Props = {
  adminEmail: string;
  adminName: string;
  adminRole: string;
  player: Player | null;
};

export default function ProfileClient({ adminEmail, adminName, adminRole, player }: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(!player); // auto-open edit if no player yet
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');

  const [form, setForm] = useState({
    username:  player?.username  || '',
    realName:  player?.realName  || '',
    state:     player?.state     || 'Lagos',
    rank:      player?.rank      || 'Epic',
    role:      player?.role      || 'PLAYER',
  });

  const handleSave = async () => {
    if (!form.username.trim()) {
      setMsg('Username is required.'); setMsgType('err'); return;
    }
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Profile saved!'); setMsgType('ok');
        setEditing(false);
        router.refresh();
      } else {
        setMsg(data.error || 'Failed to save.'); setMsgType('err');
      }
    } catch {
      setMsg('Network error. Please try again.'); setMsgType('err');
    }
    setSaving(false);
  };

  const initial = (player?.username || adminName || adminEmail)[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="bg-surface border border-border-color rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-mln-green/20 via-black to-mln-green/10" />

          <div className="px-6 pb-6 -mt-10">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-5">
              <div className="w-20 h-20 rounded-2xl bg-mln-green/10 border-4 border-surface flex items-center justify-center text-3xl font-black text-mln-green shadow-xl shrink-0">
                {initial}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-black text-white uppercase tracking-tight">
                    {player?.username || adminName || 'Set up your profile'}
                  </h1>
                  {player && (
                    <span className="text-[10px] bg-mln-green/10 border border-mln-green/30 text-mln-green font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      {player.rank}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1"><User size={12} /> {adminEmail}</span>
                  {player?.state && <span className="flex items-center gap-1"><MapPin size={12} /> {player.state}</span>}
                  {player?.team && <span className="flex items-center gap-1"><Trophy size={12} /> {player.team.name}</span>}
                  <span className="text-xs font-bold text-gray-500 uppercase">{adminRole}</span>
                </div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="shrink-0 flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-mln-green border border-border-color hover:border-mln-green/50 px-3 py-2 rounded-lg transition-all uppercase tracking-wider"
                >
                  <Edit3 size={13} /> Edit
                </button>
              )}
            </div>

            {!player && !editing && (
              <p className="text-gray-500 text-sm">No player profile set up yet. Click Edit to get started.</p>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="bg-surface border border-mln-green/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,200,83,0.08)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 size={18} className="text-mln-green" />
                {player ? 'Edit Profile' : 'Create Profile'}
              </h2>
              {player && (
                <button onClick={() => { setEditing(false); setMsg(''); }} className="text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">
                  In-Game Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="e.g. PhantomX_NG"
                  className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-3 text-white font-bold outline-none transition-colors placeholder-gray-600"
                />
              </div>

              {/* Real Name */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Real Name (Optional)</label>
                <input
                  type="text"
                  value={form.realName}
                  onChange={e => setForm(f => ({ ...f, realName: e.target.value }))}
                  placeholder="e.g. Joseph Alawaye"
                  className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-3 text-white outline-none transition-colors placeholder-gray-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* State */}
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">State</label>
                  <select
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-3 text-white font-bold outline-none transition-colors"
                  >
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Rank */}
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">MLBB Rank</label>
                  <select
                    value={form.rank}
                    onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
                    className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-3 text-white font-bold outline-none transition-colors"
                  >
                    {MLBB_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Team Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-3 text-white font-bold outline-none transition-colors"
                  >
                    {PLAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Message */}
              {msg && (
                <div className={`text-sm font-bold px-4 py-3 rounded-lg ${msgType === 'ok' ? 'bg-mln-green/10 border border-mln-green/30 text-mln-green' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                  {msg}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-mln-green hover:bg-mln-green-dark disabled:opacity-50 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,200,83,0.2)] flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Stats Card (only if player has real game data) */}
        {player && !editing && (
          <div className="bg-surface border border-border-color rounded-2xl p-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Swords size={16} className="text-mln-green" /> Your Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Username',  value: player.username },
                { label: 'Real Name', value: player.realName || '—' },
                { label: 'State',     value: player.state },
                { label: 'MLBB Rank', value: player.rank },
                { label: 'Role',      value: player.role },
                { label: 'Team',      value: player.team?.name || 'No team yet' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background border border-border-color rounded-xl p-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
                  <div className="font-black text-white text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="bg-mln-green/5 border border-mln-green/20 rounded-xl p-4 text-xs text-gray-400">
          <strong className="text-mln-green">Note:</strong> Game stats (picks, KDA, wins) are tracked automatically once your username matches what the admin enters during match reporting. Make sure your username is exactly as used in-game.
        </div>
      </div>
    </div>
  );
}
