import { Camera, X, Upload } from 'lucide-react';

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function TournamentsTab({ tournaments }: { tournaments: any[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  const [name, setName] = useState('');
  const [status, setStatus] = useState('upcoming');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bannerUrl, setBannerUrl] = useState('');

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setName('');
    setStatus('upcoming');
    setStartDate(new Date().toISOString().split('T')[0]);
    setBannerUrl('');
    setBannerFile(null);
    setBannerPreview('');
    setBannerError('');
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

  const handleCreate = async () => {
    if (!name || !startDate) { setMsg('Name and start date required'); return; }
    setSaving(true); setMsg('');
    try {
      let finalBannerUrl = bannerUrl;
      if (bannerFile) {
        setUploading(true);
        finalBannerUrl = await uploadFile(bannerFile, 'tournaments');
        setUploading(false);
      }

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status, startDate: new Date(startDate).toISOString(), bannerUrl: finalBannerUrl }),
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

          {/* Tournament Banner Upload */}
          <div className="flex items-start gap-5 mb-5">
            <div className="flex-shrink-0">
              <label className="cursor-pointer group block">
                <div className="w-36 h-20 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-background overflow-hidden flex items-center justify-center transition-colors relative">
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={22} className="text-gray-600 group-hover:text-mln-green transition-colors" />
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
              <p className="text-[9px] text-gray-500 font-bold uppercase text-center mt-1">Banner (Max 2MB)</p>
            </div>

            <div className="flex-1">
              {bannerError && (
                <div className="text-[10px] font-bold px-3 py-2 rounded-lg mb-3 bg-red-400/10 text-red-400 border border-red-400/20">
                  {bannerError}
                </div>
              )}
              <p className="text-[10px] text-gray-500">Click the box to upload a tournament banner.<br/>JPG, PNG, or WEBP · 16:9 widescreen recommended · Max 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. AFL Season 2" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option></select></div>
            <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
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
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-surface text-xs uppercase text-white">
            <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Games</th><th className="px-6 py-4">Banner</th></tr>
          </thead>
          <tbody>
            {tournaments.map((t: any) => (
              <tr key={t.id} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.status === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-gray-300'}`}>{t.status}</span></td>
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
