"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamsTab({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleEdit = (team: any) => {
    setEditingId(team.id);
    setForm({ name: team.name, logoUrl: team.logoUrl || '' });
    setMsg('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setMsg('Team name is required.');
    setSaving(true); setMsg('');
    try {
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Team saved!');
        setEditingId(null);
        setForm({ name: '', logoUrl: '' });
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to save team.');
      }
    } catch {
      setMsg('Network error.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-color rounded-xl p-6">
        <h3 className="text-lg font-black text-white uppercase mb-4">{editingId ? 'Edit Team' : 'Add New Team'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Logo URL</label>
            <input type="text" value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
        </div>
        {msg && <div className="text-mln-green text-xs font-bold uppercase mb-4">{msg}</div>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="bg-mln-green text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider">{saving ? 'Saving...' : 'Save Team'}</button>
          {editingId && <button onClick={() => { setEditingId(null); setForm({ name: '', logoUrl: '' }); }} className="bg-background border border-border-color text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider">Cancel</button>}
        </div>
      </div>

      <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-background text-xs uppercase text-white border-b border-border-color">
            <tr>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/60">
            {teams.map(t => (
              <tr key={t.id} className="hover:bg-background/50">
                <td className="px-4 py-3">
                  {t.logoUrl ? <img src={t.logoUrl} alt={t.name} className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-background border border-border-color flex items-center justify-center text-[10px]">NO LOGO</div>}
                </td>
                <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleEdit(t)} className="text-mln-green hover:underline uppercase font-bold text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
