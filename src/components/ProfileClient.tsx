'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  User, Trophy, ShieldCheck, Settings, Star,
  Swords, MapPin, BadgeCheck, Clock, AlertCircle,
  Edit3, Save, X, Camera, Trash2, Plus, LogOut, Shield,
  Search, Check, ThumbsUp, ThumbsDown, Users
} from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const MLBB_RANKS = [
  'Warrior','Elite','Master','Grandmaster','Epic','Legend','Mythic','Mythical Honor','Mythical Glory','Mythical Immortal'
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
  picks?: any[];
  freeAgents?: any[];
  allTeams?: any[];
  pendingRequests?: any[];
  myRequests?: any[];
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

export default function ProfileClient({
  adminEmail,
  adminName,
  adminRole,
  player,
  picks,
  freeAgents = [],
  allTeams = [],
  pendingRequests = [],
  myRequests = []
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'details' | 'squad'>('details');
  const [team, setTeam] = useState<any>(player?.team || null);

  useEffect(() => {
    setTeam(player?.team || null);
  }, [player?.team]);

  const isOwner = team && team.ownerEmail === adminEmail;

  // Active state lists sync
  const [activePendingRequests, setActivePendingRequests] = useState<any[]>(pendingRequests);
  const [activeMyRequests, setActiveMyRequests] = useState<any[]>(myRequests);

  useEffect(() => {
    setActivePendingRequests(pendingRequests);
  }, [pendingRequests]);

  useEffect(() => {
    setActiveMyRequests(myRequests);
  }, [myRequests]);

  // Player photo upload state
  const [updatingPhotoId, setUpdatingPhotoId] = useState<string | null>(null);

  const handlePlayerPhotoFile = async (playerId: string, file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid format. Only JPG, PNG, or WEBP accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum 5MB allowed.');
      return;
    }

    setUpdatingPhotoId(playerId);
    try {
      const photoUrl = await uploadFile(file, 'players');

      const res = await fetch(`/api/teams/${team.id}/manage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, pictureUrl: photoUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map((pl: any) =>
              pl.id === playerId ? { ...pl, pictureUrl: photoUrl } : pl
            )
          };
        });
        router.refresh();
      } else {
        alert(data.error || 'Failed to update player photo');
      }
    } catch (err) {
      alert('Network error updating player photo');
    }
    setUpdatingPhotoId(null);
  };

  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const handleRoleChange = async (playerId: string, newRole: string) => {
    setUpdatingRoleId(playerId);
    try {
      const res = await fetch(`/api/teams/${team.id}/manage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map((pl: any) =>
              pl.id === playerId ? { ...pl, role: newRole } : pl
            )
          };
        });
        router.refresh();
      } else {
        alert(data.error || 'Failed to update player role');
      }
    } catch (err) {
      alert('Network error updating player role');
    }
    setUpdatingRoleId(null);
  };

  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [editPlayerForm, setEditPlayerForm] = useState({ username: '', gameId: '' });

  const handleSavePlayerDetails = async (playerId: string) => {
    if (!editPlayerForm.username.trim() || editPlayerForm.username.trim().length < 2) {
      alert('In-Game Username must be at least 2 characters');
      return;
    }
    if (!editPlayerForm.gameId.trim()) {
      alert('Game ID is required');
      return;
    }

    setSavingPlayerId(playerId);
    try {
      const res = await fetch(`/api/teams/${team.id}/manage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          username: editPlayerForm.username.trim(),
          gameId: editPlayerForm.gameId.trim()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            players: prev.players.map((pl: any) =>
              pl.id === playerId ? { ...pl, username: data.player.username, gameId: data.player.gameId } : pl
            )
          };
        });
        setEditingPlayerId(null);
        router.refresh();
      } else {
        alert(data.error || 'Failed to update player details');
      }
    } catch (err) {
      alert('Network error updating player details');
    }
    setSavingPlayerId(null);
  };

  // Recruiting a player from free agents list directly
  const [recruitingPlayerId, setRecruitingPlayerId] = useState<string | null>(null);
  const [freeAgentQuery, setFreeAgentQuery] = useState('');

  const handleRecruitPlayer = async (pAgent: any) => {
    setRecruitingPlayerId(pAgent.id);
    try {
      const res = await fetch(`/api/teams/${team.id}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: pAgent.username,
          gameId: pAgent.gameId,
          realName: pAgent.realName || '',
          role: pAgent.role || 'PLAYER',
          rank: pAgent.rank || 'Mythic',
          state: pAgent.state || 'Lagos',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeam((prev: any) => {
          if (!prev) return null;
          const players = [...prev.players];
          if (!players.some(p => p.id === data.player.id)) {
            players.push(data.player);
          }
          return { ...prev, players };
        });
        router.refresh();
        alert(`Successfully added ${pAgent.username} to your squad!`);
      } else {
        alert(data.error || 'Failed to recruit player');
      }
    } catch {
      alert('Network error recruiting player');
    }
    setRecruitingPlayerId(null);
  };

  // Player applying to join a squad
  const [applyingTeamId, setApplyingTeamId] = useState<string | null>(null);
  const [squadSearchQuery, setSquadSearchQuery] = useState('');

  const handleApplyToSquad = async (teamId: string) => {
    setApplyingTeamId(teamId);
    try {
      const res = await fetch('/api/teams/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveMyRequests(prev => [data.request, ...prev]);
        alert('Application submitted successfully! The team captain will review it.');
        router.refresh();
      } else {
        alert(data.error || 'Failed to submit application.');
      }
    } catch {
      alert('Network error submitting application.');
    }
    setApplyingTeamId(null);
  };

  // Captain resolving a join request
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);

  const handleResolveJoinRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (action === 'accept' && !confirm('Are you sure you want to accept this player into your squad?')) return;

    setResolvingRequestId(requestId);
    try {
      const res = await fetch('/api/teams/apply', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        // Remove from pending list
        setActivePendingRequests(prev => prev.filter(r => r.id !== requestId));
        if (action === 'accept') {
          alert('Player successfully added to your squad!');
          // Force refresh team details
          router.refresh();
        } else {
          alert('Application declined.');
        }
      } else {
        alert(data.error || 'Failed to resolve request.');
      }
    } catch {
      alert('Network error resolving request.');
    }
    setResolvingRequestId(null);
  };

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
    if (file.size > 5 * 1024 * 1024) {
      setTeamLogoError('File too large. Maximum 5MB allowed.');
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
    if (file.size > 5 * 1024 * 1024) {
      setPicError('File too large. Maximum 5MB allowed.');
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
    } catch (e: any) {
      console.error('Error saving profile:', e);
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
                <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end shrink-0">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-mln-green border border-border-color hover:border-mln-green/50 px-3 py-2 rounded-lg transition-all uppercase tracking-wider cursor-pointer relative z-10"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: '/admin/login' })}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 text-xs font-bold text-red-400 hover:text-white border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all uppercase tracking-wider"
                  >
                    <LogOut size={13} /> Logout
                  </button>
                </div>
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
                    <p className="text-[10px] text-gray-500 leading-snug">Click thumbnail to upload a profile picture. JPG/PNG/WEBP up to 5MB. Square ratio recommended.</p>
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
          <div className="space-y-6">
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Swords size={16} className="text-mln-green" /> Your Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Username',  value: player.username },
                  { label: 'Game ID',   value: player.gameId || '—' },
                  { label: 'Real Name', value: player.realName && !player.realName.startsWith('admin:') ? player.realName : '—' },
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

            {/* Statistics & Performance Card */}
            <div className="bg-surface border border-border-color rounded-2xl p-6">
              <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-l-4 border-mln-green pl-3">
                📊 Statistics & Performance
              </h2>
              {(() => {
                const totalMatches = picks?.length || 0;
                let wins = 0;
                let totalKills = 0;
                let totalDeaths = 0;
                let totalAssists = 0;
                let totalMvps = 0;
                const heroStats: Record<string, { matches: number, wins: number, kills: number, deaths: number, assists: number }> = {};

                picks?.forEach(p => {
                  const isWin = p.game.winner === p.team;
                  if (isWin) wins++;
                  if (p.isMvp) totalMvps++;
                  totalKills += p.kills;
                  totalDeaths += p.deaths;
                  totalAssists += p.assists;

                  if (!heroStats[p.hero]) {
                    heroStats[p.hero] = { matches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
                  }
                  heroStats[p.hero].matches++;
                  if (isWin) heroStats[p.hero].wins++;
                  heroStats[p.hero].kills += p.kills;
                  heroStats[p.hero].deaths += p.deaths;
                  heroStats[p.hero].assists += p.assists;
                });

                const overallWr = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : "0.0";
                const overallKdaRatio = totalDeaths === 0 && totalMatches > 0 ? (totalKills + totalAssists) : totalDeaths === 0 ? 0 : ((totalKills + totalAssists) / totalDeaths);
                const overallKda = overallKdaRatio.toFixed(2);

                const topHeroes = Object.entries(heroStats)
                  .sort((a, b) => b[1].matches - a[1].matches)
                  .slice(0, 3)
                  .map(([hero, stats]) => ({
                    hero,
                    matches: stats.matches,
                    wr: ((stats.wins / stats.matches) * 100).toFixed(1),
                    kda: stats.deaths === 0 ? (stats.kills + stats.assists).toFixed(2) : ((stats.kills + stats.assists) / stats.deaths).toFixed(2)
                  }));

                if (totalMatches > 0) {
                  return (
                    <div className="space-y-6">
                      {/* Grid stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-background border border-border-color rounded-xl p-4 text-center">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Win Rate</div>
                          <div className="text-xl font-black text-mln-green">{overallWr}%</div>
                        </div>
                        <div className="bg-background border border-border-color rounded-xl p-4 text-center">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">KDA Ratio</div>
                          <div className="text-xl font-black text-white">{overallKda}</div>
                        </div>
                        <div className="bg-background border border-border-color rounded-xl p-4 text-center">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Matches Played</div>
                          <div className="text-xl font-black text-white">{totalMatches}</div>
                        </div>
                        <div className="bg-background border border-border-color rounded-xl p-4 text-center">
                          <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1">MVP Awards</div>
                          <div className="text-xl font-black text-yellow-400">{totalMvps}</div>
                        </div>
                      </div>

                      {/* Top Heroes List */}
                      {topHeroes.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-3">Top Signature Heroes</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {topHeroes.map((th: any, idx: number) => (
                              <div key={idx} className="bg-background border border-border-color/60 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                  <div className="font-bold text-white uppercase text-xs tracking-wider">{th.hero}</div>
                                  <div className="text-[9px] text-gray-500 font-bold uppercase mt-1">{th.matches} Matches</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-black text-mln-green text-xs">{th.wr}% WR</div>
                                  <div className="text-[10px] text-gray-500 font-bold">{th.kda} KDA</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div className="bg-background border border-border-color rounded-xl p-8 text-center">
                    <div className="text-3xl mb-3">🎮</div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">No Match Stats Recorded</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Your match history, win rates, and KDA ratios will sync here automatically once tournament admins report matches featuring your in-game username (<span className="text-mln-green font-bold">{player.username}</span>).
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Explore Active Squads — only for free agents (no team) */}
            {!team && (
              <div className="bg-surface border border-border-color rounded-2xl p-6">
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2 border-l-4 border-mln-green pl-3">
                  <Users size={16} className="text-mln-green" /> Explore Active Squads
                </h2>
                <p className="text-xs text-gray-500 mb-5 pl-5">
                  You're currently a <span className="text-yellow-500 font-bold">Free Agent</span>. Browse the squads below and apply to join one. The squad captain will review your application.
                </p>

                {/* Squad Search */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={squadSearchQuery}
                    onChange={e => setSquadSearchQuery(e.target.value)}
                    placeholder="Search squads by name..."
                    className="w-full bg-background border border-border-color rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-mln-green transition-colors placeholder-gray-600"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>

                {/* Squad Directory */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {(() => {
                    const q = squadSearchQuery.toLowerCase().trim();
                    const filtered = allTeams.filter((t: any) =>
                      t.name.toLowerCase().includes(q)
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="bg-background border border-border-color rounded-xl p-8 text-center">
                          <div className="text-3xl mb-2">🔍</div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                            {q ? 'No squads match your search.' : 'No active squads available right now.'}
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((sq: any) => {
                      const hasPending = activeMyRequests.some(
                        (r: any) => r.teamId === sq.id && r.status === 'PENDING'
                      );
                      const wasDeclined = activeMyRequests.some(
                        (r: any) => r.teamId === sq.id && r.status === 'DECLINED'
                      );

                      return (
                        <div
                          key={sq.id}
                          className="bg-background border border-border-color/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-mln-green/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {sq.logoUrl ? (
                              <img
                                src={sq.logoUrl}
                                alt={sq.name}
                                className="w-14 h-14 rounded-xl object-cover border border-border-color bg-surface shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-mln-green/10 border border-border-color flex items-center justify-center text-xl font-black text-mln-green uppercase shrink-0">
                                {sq.name.substring(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-black text-white uppercase text-sm tracking-tight truncate">{sq.name}</div>
                              <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">
                                {sq.players?.length || 0} Members
                              </div>
                              {sq.ownerEmail && (
                                <div className="text-[9px] text-gray-600 mt-0.5 truncate">
                                  Captain: {sq.ownerEmail}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 w-full sm:w-auto">
                            {hasPending ? (
                              <button
                                disabled
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-bold uppercase tracking-wider text-[10px] px-4 py-2.5 rounded-xl cursor-not-allowed"
                              >
                                <Clock size={12} /> Applied (Pending)
                              </button>
                            ) : wasDeclined ? (
                              <button
                                onClick={() => handleApplyToSquad(sq.id)}
                                disabled={applyingTeamId === sq.id}
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-background border border-border-color hover:border-mln-green/50 text-gray-400 hover:text-mln-green font-bold uppercase tracking-wider text-[10px] px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                              >
                                {applyingTeamId === sq.id ? 'Applying...' : '↻ Re-Apply'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApplyToSquad(sq.id)}
                                disabled={applyingTeamId === sq.id}
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-mln-green/10 hover:bg-mln-green border border-mln-green/20 hover:border-transparent text-mln-green hover:text-black font-bold uppercase tracking-wider text-[10px] px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                              >
                                <Shield size={12} />
                                {applyingTeamId === sq.id ? 'Applying...' : 'Apply to Squad'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Show player's sent applications summary */}
                {activeMyRequests.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-border-color">
                    <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Clock size={10} /> Your Applications ({activeMyRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {activeMyRequests.map((req: any) => (
                        <div key={req.id} className="bg-background border border-border-color/60 rounded-lg p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-white uppercase truncate">{req.team?.name || 'Unknown Squad'}</span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            req.status === 'PENDING'
                              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                              : req.status === 'ACCEPTED'
                              ? 'bg-mln-green/10 border-mln-green/30 text-mln-green'
                              : 'bg-red-500/10 border-red-500/30 text-red-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
                      className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors disabled:opacity-50 cursor-pointer relative z-10"
                    >
                      {savingTeam ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => { setEditingTeam(false); setTeamLogoError(''); setTeamLogoPreview(team?.logoUrl || ''); }}
                      className="bg-background border border-border-color text-white px-6 py-2 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors cursor-pointer relative z-10"
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
                        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-mln-green border border-border-color hover:border-mln-green/50 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer relative z-10"
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

            {/* Captain Requests Inbox */}
            {isOwner && activePendingRequests.length > 0 && (
              <div className="bg-surface border border-yellow-500/30 p-5 rounded-2xl space-y-4 shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-4 border-yellow-500 pl-3 flex items-center gap-1.5 animate-pulse">
                  📥 Pending Join Requests ({activePendingRequests.length})
                </h3>
                <p className="text-xs text-gray-400">The following players have applied to join your squad. Review their details and accept or decline their applications.</p>
                
                <div className="space-y-3">
                  {activePendingRequests.map((req: any) => (
                    <div key={req.id} className="bg-background border border-border-color p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        {req.player.pictureUrl ? (
                          <img src={req.player.pictureUrl} alt="" className="w-12 h-12 rounded-xl object-cover bg-surface shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-500 text-lg uppercase shrink-0">
                            {req.player.username.substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white uppercase text-sm">{req.player.username}</span>
                            <span className="text-[8px] bg-yellow-500/20 text-yellow-500 font-bold px-1.5 py-0.5 rounded">PENDING</span>
                          </div>
                          <div className="text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">
                            {req.player.role || 'PLAYER'} • {req.player.rank || 'Mythic'} • {req.player.state || 'Lagos'}
                          </div>
                          {req.player.gameId && (
                            <div className="text-[9px] text-mln-green font-bold tracking-widest mt-1">
                              ID: {req.player.gameId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleResolveJoinRequest(req.id, 'accept')}
                          disabled={resolvingRequestId === req.id}
                          className="flex-1 sm:flex-initial bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <ThumbsUp size={12} /> Accept
                        </button>
                        <button
                          onClick={() => handleResolveJoinRequest(req.id, 'decline')}
                          disabled={resolvingRequestId === req.id}
                          className="flex-1 sm:flex-initial bg-background border border-border-color hover:bg-red-500/10 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <ThumbsDown size={12} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

                  {/* SEARCH AND RECRUIT FREE AGENTS */}
                  <div className="bg-background border border-border-color p-4 rounded-xl space-y-3">
                    <h5 className="text-[10px] text-mln-green font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Search size={10} /> Search Free Agents (Players without Squads)
                    </h5>
                    
                    <div className="relative">
                      <input 
                        type="text" 
                        value={freeAgentQuery}
                        onChange={e => setFreeAgentQuery(e.target.value)}
                        placeholder="Search by IGN, Game ID, Rank..." 
                        className="w-full bg-surface border border-border-color rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-mln-green"
                      />
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>

                    {/* Results list */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(() => {
                        const query = freeAgentQuery.toLowerCase().trim();
                        const filtered = freeAgents.filter((fa: any) => 
                          fa.username.toLowerCase().includes(query) ||
                          fa.gameId?.includes(query) ||
                          fa.rank.toLowerCase().includes(query) ||
                          fa.state.toLowerCase().includes(query)
                        );
                        
                        const items = query ? filtered : freeAgents.slice(0, 3); // show top 3 suggestions when search is empty
                        
                        if (items.length === 0) {
                          return <div className="text-[10px] text-gray-500 text-center py-2">No unlinked free agents found matching your query.</div>;
                        }

                        return items.map((fa: any) => (
                          <div key={fa.id} className="bg-surface/50 border border-border-color/60 p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {fa.pictureUrl ? (
                                <img src={fa.pictureUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-mln-green/10 flex items-center justify-center font-bold text-[10px] text-mln-green uppercase shrink-0">
                                  {fa.username.substring(0, 2)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate uppercase">{fa.username}</div>
                                <div className="text-[8px] text-gray-500 uppercase font-black truncate mt-0.5">
                                  {fa.rank} • {fa.state} {fa.gameId && `• ID: ${fa.gameId}`}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={recruitingPlayerId === fa.id}
                              onClick={() => handleRecruitPlayer(fa)}
                              className="bg-mln-green/10 hover:bg-mln-green border border-mln-green/20 hover:border-transparent text-mln-green hover:text-black font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              {recruitingPlayerId === fa.id ? 'Adding...' : 'Recruit'}
                            </button>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="text-center py-1">
                    <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">— OR ADD PLAYER MANUALLY —</span>
                  </div>

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
                        {isOwner ? (
                          <label className="cursor-pointer group relative block w-12 h-12 rounded-xl overflow-hidden border border-border-color bg-background shrink-0 select-none">
                            {p.pictureUrl ? (
                              <img
                                src={p.pictureUrl}
                                alt={p.username}
                                className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                              />
                            ) : (
                              <div className="w-full h-full bg-mln-green/10 flex items-center justify-center text-lg font-black text-mln-green uppercase group-hover:opacity-40 transition-opacity">
                                {p.username.substring(0, 2)}
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera size={14} className="text-mln-green" />
                            </div>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              className="hidden"
                              disabled={updatingPhotoId === p.id}
                              onChange={e => e.target.files?.[0] && handlePlayerPhotoFile(p.id, e.target.files[0])}
                            />
                            {updatingPhotoId === p.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-[8px] text-mln-green font-bold uppercase animate-pulse">
                                ...
                              </div>
                            )}
                          </label>
                        ) : (
                          p.pictureUrl ? (
                            <img
                              src={p.pictureUrl}
                              alt={p.username}
                              className="w-12 h-12 rounded-xl object-cover border border-border-color bg-background shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-mln-green/10 border border-border-color flex items-center justify-center text-lg font-black text-mln-green uppercase shrink-0">
                              {p.username.substring(0, 2)}
                            </div>
                          )
                        )}
                        {editingPlayerId === p.id ? (
                          <div className="space-y-2 py-1">
                            <div>
                              <label className="block text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-1">In-Game Username</label>
                              <input 
                                type="text"
                                value={editPlayerForm.username}
                                onChange={e => setEditPlayerForm(f => ({ ...f, username: e.target.value }))}
                                className="bg-background border border-border-color rounded px-2 py-1 text-xs text-white outline-none focus:border-mln-green w-full font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-1">Game ID</label>
                              <input 
                                type="text"
                                value={editPlayerForm.gameId}
                                onChange={e => setEditPlayerForm(f => ({ ...f, gameId: e.target.value }))}
                                className="bg-background border border-border-color rounded px-2 py-1 text-xs text-white outline-none focus:border-mln-green w-full font-bold"
                              />
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button
                                type="button"
                                disabled={savingPlayerId === p.id}
                                onClick={() => handleSavePlayerDetails(p.id)}
                                className="bg-mln-green hover:bg-white text-black px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                              >
                                {savingPlayerId === p.id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPlayerId(null)}
                                className="bg-background border border-border-color text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-white text-sm uppercase">{p.username}</span>
                              {isCurrentPlayer && (
                                <span className="text-[8px] bg-mln-green/20 text-mln-green font-bold px-1.5 py-0.5 rounded">You</span>
                              )}
                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPlayerId(p.id);
                                    setEditPlayerForm({ username: p.username, gameId: p.gameId || '' });
                                  }}
                                  className="text-gray-500 hover:text-mln-green transition-colors p-1"
                                  title="Edit player details"
                                >
                                  <Edit3 size={11} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">
                              {isOwner ? (
                                <select 
                                  value={p.role} 
                                  disabled={updatingRoleId === p.id}
                                  onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                  className="bg-background border border-border-color rounded px-1 py-0.5 text-white outline-none focus:border-mln-green disabled:opacity-50"
                                >
                                  {PLAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              ) : (
                                <span>{p.role}</span>
                              )}
                              <span>• {p.rank}</span>
                            </div>
                            {p.gameId && (
                              <div className="text-[9px] text-mln-green font-bold tracking-widest mt-1">
                                ID: {p.gameId}
                              </div>
                            )}
                          </div>
                        )}
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
