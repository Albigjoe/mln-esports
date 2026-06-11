"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Upload } from 'lucide-react';
import TournamentManager from './TournamentManager';

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function TournamentsTab({ tournaments, teams }: { tournaments: any[], teams: any[] }) {
  const router = useRouter();
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [format, setFormat] = useState('SINGLE_ELIMINATION');
  const [registrationStatus, setRegistrationStatus] = useState('OPEN');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTBDDate, setIsTBDDate] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerError, setBannerError] = useState('');
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoError, setLogoError] = useState('');
  
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setName('');
    setStatus('upcoming');
    setFormat('SINGLE_ELIMINATION');
    setRegistrationStatus('OPEN');
    setStartDate(new Date().toISOString().split('T')[0]);
    setIsTBDDate(false);
    setBannerUrl('');
    setBannerFile(null);
    setBannerPreview('');
    setBannerError('');
    setLogoUrl('');
    setLogoFile(null);
    setLogoPreview('');
    setLogoError('');
    setMsg('');
  };

  const handleBannerFile = (file: File) => {
    setBannerError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setBannerError('Invalid format. Only JPG, PNG, or WEBP accepted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setBannerError('File too large. Maximum 2MB allowed.');
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setBannerFile(file);
      setBannerPreview(img.src);
    };
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
      setLogoFile(file);
      setLogoPreview(img.src);
    };
  };

  const handleCreate = async () => {
    if (!name) { setMsg('Name is required'); return; }
    if (!isTBDDate && !startDate) { setMsg('Start date is required'); return; }
    setSaving(true); setMsg('');
    try {
      let finalBannerUrl = bannerUrl;
      let finalLogoUrl = logoUrl;
      
      if (bannerFile || logoFile) {
        setUploading(true);
        if (bannerFile) finalBannerUrl = await uploadFile(bannerFile, 'tournaments');
        if (logoFile) finalLogoUrl = await uploadFile(logoFile, 'tournaments');
        setUploading(false);
      }

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          status, 
          startDate: isTBDDate ? '1970-01-01T00:00:00.000Z' : new Date(startDate).toISOString(), 
          bannerUrl: finalBannerUrl, 
          logoUrl: finalLogoUrl, 
          format, 
          registrationStatus 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Tournament created!');
        resetForm();
        setShowForm(false);
        router.refresh();
      } else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
    setUploading(false);
  };

  const updateBanner = async (id: string, url: string) => {
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl: url }),
    });
    if ((await res.json()).success) { router.refresh(); }
  };

  if (selectedTournament) {
    return <TournamentManager t={selectedTournament} teams={teams} onBack={() => setSelectedTournament(null)} />;
  }

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {/* Tournament Banner Upload */}
            <div className="flex items-start gap-4 bg-background border border-border-color p-4 rounded-xl">
              <div className="flex-shrink-0">
                <label className="cursor-pointer group block">
                  <div className="w-24 h-14 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-surface overflow-hidden flex items-center justify-center transition-colors relative">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={18} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                    )}
                    {bannerPreview && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setBannerFile(null); setBannerPreview(''); setBannerUrl(''); }}
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
                    onChange={e => e.target.files?.[0] && handleBannerFile(e.target.files[0])}
                  />
                </label>
              </div>

              <div className="flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 text-mln-green">Banner</p>
                {bannerError && (
                  <div className="text-[9px] font-bold px-2 py-1 rounded-lg mb-1 bg-red-400/10 text-red-400 border border-red-400/20">
                    {bannerError}
                  </div>
                )}
                <p className="text-[9px] text-gray-500 leading-tight">16:9 widescreen recommended.<br/>Max 2MB.</p>
              </div>
            </div>

            {/* Tournament Logo Upload */}
            <div className="flex items-start gap-4 bg-background border border-border-color p-4 rounded-xl">
              <div className="flex-shrink-0">
                <label className="cursor-pointer group block">
                  <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-surface overflow-hidden flex items-center justify-center transition-colors relative">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Upload size={18} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                    )}
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setLogoFile(null); setLogoPreview(''); setLogoUrl(''); }}
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
              </div>

              <div className="flex-1">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 text-mln-green">Logo</p>
                {logoError && (
                  <div className="text-[9px] font-bold px-2 py-1 rounded-lg mb-1 bg-red-400/10 text-red-400 border border-red-400/20">
                    {logoError}
                  </div>
                )}
                <p className="text-[9px] text-gray-500 leading-tight">1:1 square recommended.<br/>Max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AFL Season 2" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold">Start Date</label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-400 hover:text-white select-none">
                  <input 
                    type="checkbox" 
                    checked={isTBDDate} 
                    onChange={e => setIsTBDDate(e.target.checked)} 
                    className="rounded bg-background border-gray-700 text-mln-green focus:ring-0 focus:ring-offset-0" 
                  />
                  <span>TBD</span>
                </label>
              </div>
              <input 
                type="date" 
                value={isTBDDate ? '' : startDate} 
                disabled={isTBDDate} 
                onChange={e => setStartDate(e.target.value)} 
                className={`w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none ${isTBDDate ? 'opacity-40 cursor-not-allowed' : ''}`} 
              />
            </div>
            
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Format</label>
              <select value={format} onChange={e => setFormat(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">
                <option value="SINGLE_ELIMINATION">Single Elimination</option>
                <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                <option value="ROUND_ROBIN">Round Robin (Groups)</option>
                <option value="SWISS">Swiss Stage</option>
                <option value="TWO_STAGE">Two-Stage (Groups &rarr; Knockout)</option>
                <option value="TBD">To Be Decided (TBD)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Tournament State</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Registration</label>
              <select value={registrationStatus} onChange={e => setRegistrationStatus(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="OPEN">Open</option><option value="CLOSED">Closed</option></select>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={handleCreate} disabled={saving || uploading} className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
              {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Create'}
            </button>
            {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
          </div>
        </div>
      )}

      <div className="bg-background border border-border-color rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400 min-w-[800px]">
          <thead className="bg-surface text-xs uppercase text-white">
            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Games</th><th className="px-6 py-4">Banner</th></tr>
          </thead>
          <tbody>
            {tournaments.map((t: any) => (
              <tr key={t.id} className="border-b border-border-color hover:bg-surface-hover transition-colors cursor-pointer" onClick={() => setSelectedTournament(t)}>
                <td className="px-6 py-4">
                  <div className="font-bold text-white text-base">{t.name}</div>
                  <div className="text-[10px] text-mln-green uppercase font-black tracking-widest mt-1">{t.format?.replace('_', ' ')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${t.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>{t.status}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${t.registrationStatus === 'OPEN' ? 'bg-mln-green/20 text-mln-green' : 'bg-orange-500/20 text-orange-400'}`}>Reg: {t.registrationStatus || 'OPEN'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{t._count?.games || 0}</td>
                <td className="px-6 py-4">
                  {t.bannerUrl ? (
                    <img src={t.bannerUrl} alt={t.name} className="w-24 h-12 rounded object-cover border border-border-color" />
                  ) : (
                    <span className="text-gray-600 text-xs">— No Banner —</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
