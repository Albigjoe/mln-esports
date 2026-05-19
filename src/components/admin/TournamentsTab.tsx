"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TournamentsTab({ tournaments }: { tournaments: any[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bannerUrl, setBannerUrl] = useState('');

  const handleCreate = async () => {
    if (!name || !startDate) { setMsg('Name and start date required'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, startDate: new Date(startDate).toISOString(), bannerUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Tournament created!');
        setName(''); setBannerUrl(''); setShowForm(false); router.refresh();
      } else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const updateBanner = async (id: string, url: string) => {
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl: url }),
    });
    if ((await res.json()).success) { router.refresh(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          Tournaments ({tournaments.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
          {showForm ? 'Cancel' : '+ New Tournament'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-mln-green/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Create Tournament</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AFL Season 2" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Banner URL (Optional)</label><input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="/afl-banner.png or https://..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
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
            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Games</th><th className="px-6 py-4">Banner URL</th></tr>
          </thead>
          <tbody>
            {tournaments.map((t: any) => (
              <tr key={t.id} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>{t.status}</span></td>
                <td className="px-6 py-4">{t._count?.games || 0}</td>
                <td className="px-6 py-4">
                  <input defaultValue={t.bannerUrl || ''} onBlur={e => e.target.value !== t.bannerUrl && updateBanner(t.id, e.target.value)} placeholder="Image URL..." className="w-full max-w-[200px] bg-surface border border-border-color rounded px-2 py-1 text-xs text-white focus:border-mln-green outline-none" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
