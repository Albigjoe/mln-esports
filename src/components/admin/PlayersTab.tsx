"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X } from 'lucide-react';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];
const RANKS = ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Honor', 'Mythical Glory', 'Mythical Immortal'];

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function PlayersTab({ players, teams }: { players: any[], teams: any[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', gameId: '', realName: '', teamId: '', role: '', rank: '', state: '', pictureUrl: '' });
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState('');
  const [picError, setPicError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm({ username: '', gameId: '', realName: '', teamId: '', role: '', rank: '', state: '', pictureUrl: '' });
    setPicFile(null);
    setPicPreview('');
    setPicError('');
  };

  const handleEdit = (player: any) => {
    setEditingId(player.id);
    setForm({
      username:   player.username,
      gameId:     player.gameId     || '',
      realName:   player.realName   || '',
      teamId:     player.teamId     || '',
      role:       player.role       || '',
      rank:       player.rank       || '',
      state:      player.state      || '',
      pictureUrl: player.pictureUrl || ''
    });
    setPicFile(null);
    setPicPreview(player.pictureUrl || '');
    setPicError('');
    setMsg('');
  };

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
    if (!form.username.trim()) return setMsg('Username is required.');
    setSaving(true); setMsg('');
    try {
      let pictureUrl = form.pictureUrl;
      if (picFile) {
        setUploading(true);
        pictureUrl = await uploadFile(picFile, 'players');
        setUploading(false);
      }
      const url = editingId ? `/api/players/${editingId}` : '/api/players';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pictureUrl, teamId: form.teamId || null })
      });
      if (res.ok) {
        setMsg('✓ Player saved!');
        resetForm();
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to save player.');
      }
    } catch {
      setMsg('Network error.');
    }
    setSaving(false);
    setUploading(false);
  };

  const handleDelete = async (player: any) => {
    if (!confirm(`Delete player "${player.username}"? This cannot be undone.`)) return;
    setDeletingId(player.id);
    try {
      const res = await fetch(`/api/players/${player.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg(`✓ Player "${player.username}" deleted.`);
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to delete player.');
      }
    } catch {
      setMsg('Network error.');
    }
    setDeletingId(null);
  };

  const filteredPlayers = players.filter(p =>
    p.username.toLowerCase().includes(search.toLowerCase()) ||
    p.realName?.toLowerCase().includes(search.toLowerCase()) ||
    p.gameId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-color rounded-xl p-6">
        <h3 className="text-lg font-black text-white uppercase mb-5">{editingId ? 'Edit Player' : 'Add New Player'}</h3>

        {/* Picture Upload */}
        <div className="flex items-start gap-5 mb-5">
          <div className="flex-shrink-0">
            <label className="cursor-pointer group block">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-background overflow-hidden flex items-center justify-center transition-colors relative">
                {picPreview
                  ? <img src={picPreview} alt="" className="w-full h-full object-cover" />
                  : <Camera size={22} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                }
                {picPreview && (
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setPicFile(null); setPicPreview(''); setForm(f => ({ ...f, pictureUrl: '' })); }}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={e => e.target.files?.[0] && handlePicFile(e.target.files[0])}
              />
            </label>
            <p className="text-[9px] text-gray-500 font-bold uppercase text-center mt-1">Photo<br/>Max 2MB</p>
          </div>

          <div className="flex-1">
            {picError && (
              <div className={`text-[10px] font-bold px-3 py-2 rounded-lg mb-3 border flex items-center gap-1.5 ${picError.includes('⚠️') ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                {picError}
              </div>
            )}
            <p className="text-[10px] text-gray-500 mt-1">Click the box to upload a player photo.<br/>JPG, PNG, or WEBP · 1:1 ratio recommended · Max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">In-Game Username *</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Game ID (MLBB)</label>
            <input type="text" value={form.gameId} onChange={e => setForm({ ...form, gameId: e.target.value })} placeholder="e.g. 123456789" className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Real Name</label>
            <input type="text" value={form.realName} onChange={e => setForm({ ...form, realName: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team</label>
            <select value={form.teamId} onChange={e => setForm({ ...form, teamId: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green">
              <option value="">No Team (Free Agent)</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Main Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green">
              <option value="">Select Role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rank</label>
            <select value={form.rank} onChange={e => setForm({ ...form, rank: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green">
              <option value="">Select Rank</option>
              {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State / Region</label>
            <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="e.g. Lagos" className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
        </div>

        {msg && <div className={`text-xs font-bold uppercase mb-4 ${msg.includes('error') || msg.includes('Failed') ? 'text-red-400' : 'text-mln-green'}`}>{msg}</div>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || uploading} className="bg-mln-green text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider disabled:opacity-60">
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Player'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="bg-background border border-border-color text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border-color rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-color">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username, name or Game ID..." className="w-full max-w-sm bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green text-sm" />
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-background text-xs uppercase text-white border-b border-border-color sticky top-0">
              <tr>
                <th className="px-4 py-3">Pic</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Game ID</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/60">
              {filteredPlayers.map(p => (
                <tr key={p.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    {p.pictureUrl
                      ? <img src={p.pictureUrl} alt={p.username} className="w-9 h-9 rounded-lg object-cover" />
                      : <div className="w-9 h-9 rounded-lg bg-background border border-border-color flex items-center justify-center text-[11px] font-black text-gray-500">{p.username[0]?.toUpperCase()}</div>
                    }
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    <div>{p.username}</div>
                    {p.realName && !p.realName.startsWith('admin:') && (
                      <div className="text-[10px] text-gray-500 font-normal">{p.realName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.gameId
                      ? <span className="text-mln-green font-black text-xs">{p.gameId}</span>
                      : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">{p.team?.name || <span className="text-gray-600">Free Agent</span>}</td>
                  <td className="px-4 py-3">{p.role || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(p)} className="text-mln-green hover:underline uppercase font-bold text-xs">Edit</button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="text-red-400 hover:text-red-300 hover:underline uppercase font-bold text-xs disabled:opacity-40"
                      >
                        {deletingId === p.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
