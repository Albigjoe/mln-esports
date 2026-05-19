"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamsTab({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const handleCreate = async () => {
    if (!name) { setMsg('Name is required'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Team created!');
        setName(''); setLogoUrl(''); setShowForm(false); router.refresh();
      } else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          Teams ({teams.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
          {showForm ? 'Cancel' : '+ New Team'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-mln-green/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Create Team</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reap N Kill" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Logo URL (Optional)</label><input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="/rnk-logo.jpg or https://..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={handleCreate} disabled={saving} className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
            {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {teams.map((t: any) => (
          <div key={t.id} className="bg-surface border border-border-color rounded-xl p-4 text-center hover:border-mln-green transition-colors">
            <div className="w-16 h-16 mx-auto bg-background rounded-full border border-border-color mb-3 flex items-center justify-center overflow-hidden">
              {t.logoUrl ? <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" /> : <span className="text-gray-500 font-bold text-xl">{t.name.charAt(0)}</span>}
            </div>
            <h4 className="text-white font-bold text-sm truncate">{t.name}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}
