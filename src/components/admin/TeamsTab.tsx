"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Edit, CheckSquare, Square, Upload, X, Camera } from 'lucide-react';

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function TeamsTab({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', logoUrl: '', ownerEmail: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoError, setLogoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', logoUrl: '', ownerEmail: '' });
    setLogoFile(null);
    setLogoPreview('');
    setLogoError('');
    setMsg('');
  };

  const handleEdit = (team: any) => {
    setEditingId(team.id);
    setForm({ name: team.name, logoUrl: team.logoUrl || '', ownerEmail: team.ownerEmail || '' });
    setLogoFile(null);
    setLogoPreview(team.logoUrl || '');
    setLogoError('');
    setMsg('');
  };

  const handleLogoFile = (file: File) => {
    setLogoError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Invalid format. Only JPG, PNG, or WEBP accepted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('File too large. Maximum 2MB allowed.');
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio < 0.9 || ratio > 1.1) {
        setLogoError('⚠️ Recommended: Use a 1:1 square image (200×200px) for best results.');
      }
      setLogoFile(file);
      setLogoPreview(img.src);
    };
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setMsg('Team name is required.');
    setSaving(true); setMsg('');
    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        setUploading(true);
        logoUrl = await uploadFile(logoFile, 'teams');
        setUploading(false);
      }
      const url = editingId ? `/api/teams/${editingId}` : '/api/teams';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, logoUrl, ownerEmail: form.ownerEmail || null })
      });
      if (res.ok) {
        setMsg('Team saved!');
        resetForm();
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to save team.');
      }
    } catch {
      setMsg('Network error.');
    }
    setSaving(false);
    setUploading(false);
  };

  const handleDelete = async (options: { id?: string; ids?: string[]; deleteAll?: boolean }) => {
    let confirmMsg = 'Are you sure you want to delete this team?';
    if (options.deleteAll) {
      confirmMsg = '⚠️ CRITICAL WARNING: Are you absolutely sure you want to delete ALL teams? This will permanently wipe all teams and delete all associated matches, picks, and bans from the database!';
    } else if (options.ids) {
      confirmMsg = `Are you sure you want to delete the ${options.ids.length} selected team(s)?`;
    }

    if (!window.confirm(confirmMsg)) return;

    setDeleting(true);
    setMsg('');
    try {
      const res = await fetch('/api/teams', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      if (res.ok) {
        setMsg(options.deleteAll ? 'Successfully wiped all teams!' : 'Successfully deleted team(s)!');
        setSelectedIds([]);
        router.refresh();
      } else {
        const data = await res.json();
        setMsg(data.error || 'Failed to delete team(s).');
      }
    } catch {
      setMsg('Network error.');
    }
    setDeleting(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === teams.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(teams.map(t => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Save / Edit form */}
      <div className="bg-surface border border-border-color rounded-xl p-6">
        <h3 className="text-lg font-black text-white uppercase mb-4">{editingId ? 'Edit Team' : 'Add New Team'}</h3>

        {/* Squad Logo Upload */}
        <div className="flex items-start gap-5 mb-5">
          <div className="flex-shrink-0">
            <label className="cursor-pointer group block">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-background overflow-hidden flex items-center justify-center transition-colors relative">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={22} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                )}
                {logoPreview && (
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setLogoFile(null); setLogoPreview(''); setForm(f => ({ ...f, logoUrl: '' })); }}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleLogoFile(e.target.files[0])}
              />
            </label>
            <p className="text-[9px] text-gray-500 font-bold uppercase text-center mt-1">Logo<br/>Max 2MB</p>
          </div>

          <div className="flex-1">
            {logoError && (
              <div className={`text-[10px] font-bold px-3 py-2 rounded-lg mb-3 border flex items-center gap-1.5 ${logoError.includes('⚠️') ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                {logoError}
              </div>
            )}
            <p className="text-[10px] text-gray-500">Click the box to upload a team logo.<br/>JPG, PNG, or WEBP · 1:1 square ratio recommended · Max 2MB.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Email</label>
            <input type="email" placeholder="Optional" value={form.ownerEmail} onChange={e => setForm({ ...form, ownerEmail: e.target.value })} className="w-full bg-background border border-border-color rounded-lg px-3 py-2 text-white outline-none focus:border-mln-green" />
          </div>
        </div>

        {msg && <div className={`text-xs font-bold uppercase mb-4 ${msg.includes('error') || msg.includes('Failed') ? 'text-red-400' : 'text-mln-green'}`}>{msg}</div>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || uploading} className="bg-mln-green text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider disabled:opacity-60">
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Team'}
          </button>
          {editingId && <button onClick={resetForm} className="bg-background border border-border-color text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider">Cancel</button>}
        </div>
      </div>

      {/* Global Actions Area */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center p-4 bg-background border border-border-color rounded-xl">
        <div>
          <h4 className="text-sm font-black text-white uppercase">Team Database Actions</h4>
          <p className="text-xs text-gray-500 mt-0.5">Manage existing teams, clear rosters, or perform bulk deletion.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => handleDelete({ ids: selectedIds })}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-colors"
            >
              <Trash2 size={14} />
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => handleDelete({ deleteAll: true })}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-950/40 hover:bg-red-950 border border-red-500/30 hover:border-red-500 text-red-400 px-3 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-colors"
          >
            <AlertTriangle size={14} className="text-red-500" />
            Delete All Teams
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-surface border border-border-color rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-background text-xs uppercase text-white border-b border-border-color">
            <tr>
              <th className="px-4 py-3 w-12">
                <button onClick={toggleSelectAll} className="text-gray-500 hover:text-white transition-colors">
                  {selectedIds.length === teams.length && teams.length > 0 ? (
                    <CheckSquare size={16} className="text-mln-green" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th className="px-4 py-3">Logo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Players Count</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/60">
            {teams.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No teams registered in the database.
                </td>
              </tr>
            ) : (
              teams.map(t => {
                const isSelected = selectedIds.includes(t.id);
                return (
                  <tr key={t.id} className={`transition-colors ${isSelected ? 'bg-mln-green/5 hover:bg-mln-green/10' : 'hover:bg-background/50'}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(t.id)} className="text-gray-500 hover:text-white transition-colors">
                        {isSelected ? (
                          <CheckSquare size={16} className="text-mln-green" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.name} className="w-8 h-8 rounded-lg object-cover border border-border-color" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-background border border-border-color flex items-center justify-center text-[8px] font-black text-gray-600">NO LOGO</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-500">
                      {t.players?.length || 0} Player(s)
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(t)}
                          className="flex items-center gap-1 text-mln-green hover:underline uppercase font-bold text-xs bg-mln-green/10 hover:bg-mln-green/20 px-2.5 py-1 rounded"
                        >
                          <Edit size={10} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete({ id: t.id })}
                          disabled={deleting}
                          className="flex items-center gap-1 text-red-400 hover:underline uppercase font-bold text-xs bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded"
                        >
                          <Trash2 size={10} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
