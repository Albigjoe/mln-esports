"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PlayersTab({ players }: { players: any[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [username, setUsername] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [realName, setRealName] = useState('');

  const handleCreate = async () => {
    if (!username) { setMsg('Username is required'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pictureUrl, realName }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Player created!');
        setUsername(''); setPictureUrl(''); setRealName(''); setShowForm(false); router.refresh();
      } else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const updatePicture = async (id: string, url: string) => {
    const res = await fetch(`/api/players/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pictureUrl: url }),
    });
    if ((await res.json()).success) { router.refresh(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          Player Database ({players.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
          {showForm ? 'Cancel' : '+ New Player'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-mln-green/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Create Player Profile</div>
          <p className="text-gray-400 text-sm mb-4">Add a player so their picture appears on the stats pages when this username is typed in a game pick.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">In-Game Name</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. Panda" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Real Name (Optional)</label><input value={realName} onChange={e => setRealName(e.target.value)} placeholder="e.g. John Doe" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Picture URL</label><input value={pictureUrl} onChange={e => setPictureUrl(e.target.value)} placeholder="/panda.png or https://..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={handleCreate} disabled={saving} className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
            {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
          </div>
        </div>
      )}

      <div className="bg-background border border-border-color rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-surface text-xs uppercase text-white">
            <tr><th className="px-6 py-4">Player</th><th className="px-6 py-4">Real Name</th><th className="px-6 py-4">Picture URL</th></tr>
          </thead>
          <tbody>
            {players.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No players added yet.</td></tr>
            ) : players.map((p: any) => (
              <tr key={p.id} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4 font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-surface border border-border-color flex items-center justify-center">
                    {p.pictureUrl ? <img src={p.pictureUrl} alt={p.username} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-500">{p.username.charAt(0)}</span>}
                  </div>
                  {p.username}
                </td>
                <td className="px-6 py-4">{p.realName || '-'}</td>
                <td className="px-6 py-4">
                  <input defaultValue={p.pictureUrl || ''} onBlur={e => e.target.value !== p.pictureUrl && updatePicture(p.id, e.target.value)} placeholder="Image URL..." className="w-full max-w-[300px] bg-surface border border-border-color rounded px-2 py-1 text-xs text-white focus:border-mln-green outline-none" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
