"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AwardsTab({ awards, players, teams }: { awards: any[]; players: any[]; teams: any[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title) { setMsg('Title is required'); return; }
    setSaving(true); setMsg('');
    const res = await fetch('/api/awards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, season, playerId: playerId || null, teamId: teamId || null }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg('✓ Award created!');
      setTitle(''); setDescription(''); setSeason(''); setPlayerId(''); setTeamId('');
      router.refresh();
    } else {
      setMsg('Error: ' + data.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this award?')) return;
    await fetch(`/api/awards/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const AWARD_ICONS: Record<string, string> = {
    'Champion': '🏆', 'MVP': '⭐', 'Best Roamer': '🛡️', 'Best Jungler': '🌿',
    'Top Fragger': '⚔️', 'Finals MVP': '👑', 'Best Support': '💚', 'Iron Player': '🔱',
  };
  const getIcon = (title: string) => {
    for (const [key, icon] of Object.entries(AWARD_ICONS)) {
      if (title.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return '🎖️';
  };

  return (
    <div className="space-y-8">
      {/* Create Award */}
      <div className="bg-surface border border-border-color rounded-xl p-6">
        <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Create New Award</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Award Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Season 1 Champion" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Season / Tournament</label>
            <input value={season} onChange={e => setSeason(e.target.value)} placeholder="e.g. Season 1, MLN Open 2025" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Award Player (optional)</label>
            <select value={playerId} onChange={e => setPlayerId(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">
              <option value="">— No Player —</option>
              {players.map((p: any) => <option key={p.id} value={p.id}>{p.username}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Award Team (optional)</label>
            <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">
              <option value="">— No Team —</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleCreate} disabled={saving} className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2.5 rounded font-bold uppercase tracking-widest text-sm transition-all disabled:opacity-50">
            {saving ? 'Saving...' : '+ Create Award'}
          </button>
          {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
        </div>
      </div>

      {/* All Awards */}
      <div>
        <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">All Awards ({awards.length})</h3>
        {awards.length === 0 ? (
          <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500">No awards created yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awards.map((a: any) => (
              <div key={a.id} className="bg-surface border border-border-color rounded-xl p-5 relative group">
                <button onClick={() => handleDelete(a.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-all">
                  Delete
                </button>
                <div className="text-3xl mb-2">{getIcon(a.title)}</div>
                <div className="font-black text-white text-lg leading-tight mb-1">{a.title}</div>
                {a.season && <div className="text-[10px] text-mln-green font-bold uppercase tracking-widest mb-2">{a.season}</div>}
                {a.description && <div className="text-xs text-gray-400 mb-3">{a.description}</div>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {a.player && (
                    <span className="bg-mln-green/10 border border-mln-green/30 text-mln-green text-xs font-bold px-2 py-0.5 rounded">
                      👤 {a.player.username}
                    </span>
                  )}
                  {a.team && (
                    <span className="bg-white/5 border border-border-color text-gray-300 text-xs font-bold px-2 py-0.5 rounded">
                      🛡️ {a.team.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
