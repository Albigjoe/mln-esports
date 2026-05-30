'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Trophy, ShieldCheck, Settings, Star,
  Swords, MapPin, BadgeCheck, Clock, AlertCircle,
  Edit3, Save, X, Camera, Trash2, Plus, LogOut, Shield
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

type TeamPlayer = {
  id: string;
  username: string;
  gameId: string | null;
  role: string;
  rank: string;
  state: string;
  pictureUrl: string | null;
  realName: string | null;
};

type Player = {
  id: string;
  username: string;
  gameId: string | null;
  realName: string | null;
  role: string;
  state: string;
  rank: string;
  pictureUrl: string | null;
  team?: {
    id: string;
    name: string;
    logoUrl: string | null;
    ownerEmail: string | null;
    players: TeamPlayer[];
  } | null;
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

  const [activeTab, setActiveTab] = useState<'details' | 'squad'>('details');
  const [team, setTeam] = useState<any>(player?.team || null);

  const isOwner = team && team.ownerEmail === adminEmail;

  // Team editing state
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: player?.team?.name || '',
    logoUrl: player?.team?.logoUrl || '',
  });
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null);
  const [teamLogoPreview, setTeamLogoPreview] = useState(player?.team?.logoUrl || '');
  const [teamLogoError, setTeamLogoError] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  // Roster add state
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addPlayerForm, setAddPlayerForm] = useState({
    username: '',
    gameId: '',
    realName: '',
    role: 'PLAYER',
    rank: 'Epic',
    state: 'Lagos',
  });
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [addPlayerError, setAddPlayerError] = useState('');

  const handleTeamLogoFile = (file: File) => {
    setTeamLogoError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setTeamLogoError('Invalid format. Only JPG, PNG, or WEBP accepted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setTeamLogoError('File too large. Maximum 2MB allowed.');
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setTeamLogoFile(file);
      setTeamLogoPreview(img.src);
    };
  };

  const handleSaveTeam = async () => {
    if (!teamForm.name.trim()) {
      setTeamLogoError('Squad name is required'); return;
    }
    setSavingTeam(true);
    try {
      let finalLogoUrl = teamForm.logoUrl;
      if (teamLogoFile) {
        finalLogoUrl = await uploadFile(teamLogoFile, 'teams');
      }

      const res = await fetch(`/api/teams/${team.id}/manage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamForm.name, logoUrl: finalLogoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam((prev: any) => prev ? { ...prev, name: data.team.name, logoUrl: data.team.logoUrl } : null);
        setEditingTeam(false);
        router.refresh();
      } else {
        setTeamLogoError(data.error || 'Failed to update squad');
      }
    } catch {
      setTeamLogoError('Network error updating squad');
    }
    setSavingTeam(false);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPlayerForm.username.trim() || !addPlayerForm.gameId.trim()) {
      setAddPlayerError('IGN and Game ID are required.'); return;
    }
    setAddingPlayer(true); setAddPlayerError('');
    try {
      const res = await fetch(`/api/teams/${team.id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addPlayerForm),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam((prev: any) => {
          if (!prev) return null;
          const players = [...prev.players];
          const idx = players.findIndex(p => p.username === data.player.username);
          if (idx > -1) {
            players[idx] = data.player;
          } else {
            players.push(data.player);
          }
          return { ...prev, players };
        });
        setAddPlayerForm({
          username: '',
          gameId: '',
          realName: '',
          role: 'PLAYER',
          rank: 'Epic',
          state: 'Lagos',
        });
        setShowAddPlayer(false);
        router.refresh();
      } else {
        setAddPlayerError(data.error || 'Failed to add player');
      }
    } catch {
      setAddPlayerError('Network error adding player');
    }
    setAddingPlayer(false);
  };

  const handleKickPlayer = async (playerId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove ${username} from the roster?`)) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/manage?playerId=${playerId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTeam((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.filter((p: any) => p.id !== playerId)
          };
        });
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove player');
      }
    } catch {
      alert('Network error removing player');
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this squad? You will need the squad captain to add you back.')) return;
    try {
      const res = await fetch(`/api/teams/${team.id}/manage?playerId=${player?.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTeam(null);
        setActiveTab('details');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to leave squad');
      }
    } catch {
      alert('Network error leaving squad');
    }
  };

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

        {/* Tabs Selection (only if player is in a team) */}
        {player && !editing && team && (
          <div className="flex gap-2 border-b border-border-color pb-px">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'details'
                  ? 'border-mln-green text-mln-green'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              My Details
            </button>
            <button
              onClick={() => setActiveTab('squad')}
              className={`pb-3 px-4 text-sm font-black uppercase tracking-wider border-b-2 transition-all ${
                activeTab === 'squad'
                  ? 'border-mln-green text-mln-green'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              My Squad
            </button>
          </div>
        )}

        {/* Details Tab Content */}
        {player && !editing && activeTab === 'details' && (
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
                { label: 'Team',      value: team?.name || 'No team yet' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-background border border-border-color rounded-xl p-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{label}</div>
                  <div className="font-black text-white text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Squad Tab Content */}
        {player && !editing && team && activeTab === 'squad' && (
          <div className="space-y-6">
            {/* Squad Header Card */}
            <div className="bg-surface border border-border-color rounded-2xl p-6 relative">
              {editingTeam ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-4 border-mln-green pl-3 mb-4">
                    Edit Squad Details
                  </h3>

                  {/* Logo Upload */}
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer group block">
                      <div className="w-16 h-16 rounded-xl border border-dashed border-gray-700 group-hover:border-mln-green bg-background overflow-hidden flex items-center justify-center transition-colors relative">
                        {teamLogoPreview ? (
                          <img src={teamLogoPreview} alt="Squad Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={18} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleTeamLogoFile(e.target.files[0])}
                      />
                    </label>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Squad Logo</span>
                      <p className="text-[10px] text-gray-500">Click avatar to upload new logo.</p>
                      {teamLogoError && <p className="text-red-400 text-xs mt-1 font-bold">{teamLogoError}</p>}
                    </div>
                  </div>

                  {/* Squad Name */}
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">
                      Squad Name
                    </label>
                    <input
                      type="text"
                      value={teamForm.name}
                      onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-4 py-3 text-white font-bold outline-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveTeam}
                      disabled={savingTeam}
                      className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors disabled:opacity-50"
                    >
                      {savingTeam ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => { setEditingTeam(false); setTeamLogoError(''); setTeamLogoPreview(team?.logoUrl || ''); }}
                      className="bg-background border border-border-color text-white px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
                  <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-20 h-20 rounded-2xl border border-border-color object-cover bg-background shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-mln-green/10 border border-border-color flex items-center justify-center text-3xl font-black text-mln-green uppercase shrink-0">
                        {team.name.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{team.name}</h2>
                        {isOwner ? (
                          <span className="text-[9px] bg-mln-green/10 border border-mln-green/30 text-mln-green font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Shield size={9} /> Captain
                          </span>
                        ) : (
                          <span className="text-[9px] bg-surface border border-border-color text-gray-400 font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Member
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Mobile Legends: Bang Bang Squad</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-2">
                        Owner: {team.ownerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex gap-2 w-full sm:w-auto justify-center">
                    {isOwner ? (
                      <button
                        onClick={() => { setTeamForm({ name: team.name, logoUrl: team.logoUrl || '' }); setEditingTeam(true); }}
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-mln-green border border-border-color hover:border-mln-green/50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider"
                      >
                        <Edit3 size={13} /> Edit Squad
                      </button>
                    ) : (
                      <button
                        onClick={handleLeaveTeam}
                        className="flex items-center gap-2 text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/30 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider"
                      >
                        <LogOut size={13} /> Leave Team
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Roster Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-4 border-mln-green pl-3">
                  Roster ({team.players?.length || 0})
                </h3>
                {isOwner && !showAddPlayer && (
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="flex items-center gap-1 bg-mln-green text-black px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-white transition-colors"
                  >
                    <Plus size={12} /> Add Player
                  </button>
                )}
              </div>

              {/* Add Player Form */}
              {isOwner && showAddPlayer && (
                <div className="bg-surface border border-mln-green/30 p-5 rounded-2xl space-y-4 animate-in fade-in-50 duration-200">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Add Player to Roster</h4>
                  
                  {addPlayerError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg font-bold">
                      {addPlayerError}
                    </div>
                  )}

                  <form onSubmit={handleAddPlayer} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">In-Game Username *</label>
                        <input
                          type="text"
                          required
                          value={addPlayerForm.username}
                          onChange={e => setAddPlayerForm(f => ({ ...f, username: e.target.value }))}
                          placeholder="IGN"
                          className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Game ID *</label>
                        <input
                          type="text"
                          required
                          value={addPlayerForm.gameId}
                          onChange={e => setAddPlayerForm(f => ({ ...f, gameId: e.target.value }))}
                          placeholder="e.g. 123456789"
                          className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Real Name</label>
                        <input
                          type="text"
                          value={addPlayerForm.realName}
                          onChange={e => setAddPlayerForm(f => ({ ...f, realName: e.target.value }))}
                          placeholder="Optional"
                          className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Role</label>
                        <select
                          value={addPlayerForm.role}
                          onChange={e => setAddPlayerForm(f => ({ ...f, role: e.target.value }))}
                          className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-2 text-sm text-white outline-none"
                        >
                          <option value="PLAYER">PLAYER</option>
                          <option value="CAPTAIN">CAPTAIN</option>
                          <option value="COACH">COACH</option>
                          <option value="ANALYST">ANALYST</option>
                          <option value="MANAGER">MANAGER</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] text-gray-400 uppercase tracking-widest font-bold mb-1">Rank</label>
                        <select
                          value={addPlayerForm.rank}
                          onChange={e => setAddPlayerForm(f => ({ ...f, rank: e.target.value }))}
                          className="w-full bg-background border border-border-color focus:border-mln-green rounded-lg px-3 py-2 text-sm text-white outline-none"
                        >
                          {MLBB_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={addingPlayer}
                        className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                      >
                        {addingPlayer ? 'Adding...' : 'Add Player'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddPlayer(false); setAddPlayerError(''); }}
                        className="bg-background border border-border-color text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Roster list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {team.players?.map((p: any) => {
                  const isCurrentPlayer = p.id === player?.id;

                  return (
                    <div key={p.id} className="bg-surface border border-border-color/60 rounded-xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {p.pictureUrl ? (
                          <img
                            src={p.pictureUrl}
                            alt={p.username}
                            className="w-12 h-12 rounded-xl object-cover border border-border-color bg-background shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-mln-green/10 border border-border-color flex items-center justify-center text-lg font-black text-mln-green uppercase shrink-0">
                            {p.username.substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm uppercase">{p.username}</span>
                            {isCurrentPlayer && (
                              <span className="text-[8px] bg-mln-green/20 text-mln-green font-bold px-1.5 py-0.5 rounded">You</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">
                            {p.role} • {p.rank}
                          </div>
                          {p.gameId && (
                            <div className="text-[9px] text-mln-green font-bold tracking-widest mt-1">
                              ID: {p.gameId}
                            </div>
                          )}
                        </div>
                      </div>

                      {isOwner && !isCurrentPlayer && (
                        <button
                          onClick={() => handleKickPlayer(p.id, p.username)}
                          className="text-gray-500 hover:text-red-400 p-2 transition-colors shrink-0"
                          title="Remove Player"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
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
