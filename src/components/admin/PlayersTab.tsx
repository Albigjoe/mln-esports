"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];
const RANKS = ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Honor', 'Mythical Glory', 'Mythical Immortal'];

export default function PlayersTab({ players, teams }: { players: any[], teams: any[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', realName: '', teamId: '', role: '', rank: '', state: '', pictureUrl: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

  const handleEdit = (player: any) => {
    setEditingId(player.id);
    setForm({
      username: player.username,
      realName: player.realName || '',
      teamId: player.teamId || '',
      role: player.role || '',
      rank: player.rank || '',
      state: player.state || '',
      pictureUrl: player.pictureUrl || ''
    });
    setMsg('');
  };

  const handleSave = async () => {
    if (!form.username.trim()) return setMsg('Username is required.');
    setSaving(true); setMsg('');
    try {
      const url = editingId ? `/api/players/${editingId}` : '/api/players';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, teamId: form.teamId || null })
      });
      if (res.ok) {
        setMsg('Player saved!');
        setEditingId(null);
        setForm({ username: '', realName: '', teamId: '', role: '', rank: '', state: '', pictureUrl: '' });
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to save player.');
      }
    } catch {
      setMsg('Network error.');
    }
    setSaving(false);
  };

  const filteredPlayers = players.filter(p => p.username.toLowerCase().includes(search.toLowerCase()) || p.realName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-color rounded-xl p-6">
        <h3 className="text-lg font-black text-white uppercase mb-4">{editingId ? 'Edit Player' : 'Add New Player'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">In-Game Username *</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Real Name / Auth Email</label>
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
            <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="e.g. Lagos" className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Picture URL</label>
            <input type="text" value={form.pictureUrl} onChange={e => setForm({ ...form, pictureUrl: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
        </div>
        {msg && <div className={`text-xs font-bold uppercase mb-4 ${msg.includes('error') || msg.includes('Failed') ? 'text-red-400' : 'text-mln-green'}`}>{msg}</div>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="bg-mln-green text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider">{saving ? 'Saving...' : 'Save Player'}</button>
          {editingId && <button onClick={() => { setEditingId(null); setForm({ username: '', realName: '', teamId: '', role: '', rank: '', state: '', pictureUrl: '' }); }} className="bg-background border border-border-color text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider">Cancel</button>}
        </div>
      </div>

      <div className="bg-surface border border-border-color rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-color">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players..." className="w-full max-w-sm bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green text-sm" />
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-background text-xs uppercase text-white border-b border-border-color sticky top-0">
              <tr>
                <th className="px-4 py-3">Pic</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/60">
              {filteredPlayers.map(p => (
                <tr key={p.id} className="hover:bg-background/50">
                  <td className="px-4 py-3">
                    {p.pictureUrl ? <img src={p.pictureUrl} alt={p.username} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-background border border-border-color flex items-center justify-center text-[10px]">{p.username[0].toUpperCase()}</div>}
                  </td>
                  <td className="px-4 py-3 font-bold text-white flex flex-col">
                    <span>{p.username}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{p.realName}</span>
                  </td>
                  <td className="px-4 py-3">{p.team?.name || <span className="text-gray-600">Free Agent</span>}</td>
                  <td className="px-4 py-3">{p.role || '-'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(p)} className="text-mln-green hover:underline uppercase font-bold text-xs">Edit</button>
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
