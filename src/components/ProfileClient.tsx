'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Trophy, ShieldCheck, Settings, Star,
  Swords, MapPin, BadgeCheck, Clock, AlertCircle,
  Edit3, Save, X, Camera
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
  gameId: string | null;
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

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function ProfileClient({ adminEmail, adminName, adminRole, player }: Props) {
  const router = useRouter();

  const [editing, setEditing] = useState(!player); // auto-open edit if no player yet
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');

  const [form, setForm] = useState({
    username:  player?.username  || '',
    gameId:    player?.gameId    || '',
    realName:  player?.realName  || '',
    state:     player?.state     || 'Lagos',
    rank:      player?.rank      || 'Epic',
    role:      player?.role      || 'PLAYER',
    pictureUrl:player?.pictureUrl|| '',
  });

  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState(player?.pictureUrl || '');
  const [picError, setPicError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePicFile = (file: File) => {
    setPicError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPicError('Invalid format. Only JPG, PNG, or WEBP accepted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPicError('File too large. Maximum 2MB allowed.');
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio < 0.9 || ratio > 1.1) {
        setPicError('⚠️ Recommended: Use a 1:1 square image (200×200px) for best results.');
      }
      setPicFile(file);
      setPicPreview(img.src);
    };
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      setMsg('Username is required.'); setMsgType('err'); return;
    }
    if (!form.gameId.trim()) {
      setMsg('Game ID is required — this links your stats to your account.'); setMsgType('err'); return;
    }
    setSaving(true); setMsg('');
    try {
      let finalPicUrl = form.pictureUrl;
      if (picFile) {
        setUploading(true);
        finalPicUrl = await uploadFile(picFile, 'players');
        setUploading(false);
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pictureUrl: finalPicUrl }),
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
    setUploading(false);
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
              {player?.pictureUrl ? (
                <img
                  src={player.pictureUrl}
                  alt={player.username}
                  className="w-20 h-20 rounded-2xl border-4 border-surface object-cover shadow-xl shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-mln-green/10 border-4 border-surface flex items-center justify-center text-3xl font-black text-mln-green shadow-xl shrink-0">
                  {initial}
                </div>
              )}
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
              {/* Picture Upload */}
              <div className="flex items-start gap-4 p-3 bg-background rounded-xl border border-border-color">
                <div className="flex-shrink-0">
                  <label className="cursor-pointer group block">
                    <div className="w-16 h-16 rounded-xl border border-dashed border-gray-700 group-hover:border-mln-green bg-surface overflow-hidden flex items-center justify-center transition-colors relative">
                      {picPreview ? (
                        <img src={picPreview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={18} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                      )}
                      {picPreview && (
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setPicFile(null); setPicPreview(''); setForm(f => ({ ...f, pictureUrl: '' })); }}
                          className="absolute top-0.5 right-0.5 bg-black/80 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                        >
                          <X size={8} />
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handlePicFile(e.target.files[0])}
                    />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Profile Photo</span>
                  {picError ? (
                    <div className={`text-[9px] font-bold px-2 py-1 rounded bg-red-400/10 text-red-400 border border-red-400/20`}>
                      {picError}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 leading-snug">Click thumbnail to upload a profile picture. JPG/PNG/WEBP up to 2MB. Square ratio recommended.</p>
                  )}
                </div>
              </div>

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

              {/* Game ID */}
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">
                  Game ID (MLBB) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.gameId}
                  onChange={e => setForm(f => ({ ...f, gameId: e.target.value }))}
                  placeholder="e.g. 123456789"
                  className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-3 text-white font-bold outline-none transition-colors placeholder-gray-600"
                />
                <p className="text-[10px] text-gray-500 mt-1">Your unique MLBB numeric ID — this links your match stats to your account.</p>
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
                disabled={saving || uploading}
                className="w-full bg-mln-green hover:bg-mln-green-dark disabled:opacity-50 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,200,83,0.2)] flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {uploading ? 'Uploading Photo...' : saving ? 'Saving Profile...' : 'Save Profile'}
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
                { label: 'Game ID',   value: player.gameId || '—' },
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
