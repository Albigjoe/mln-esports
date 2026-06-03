"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Upload } from 'lucide-react';

const CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'recap', label: 'Match Recap' },
];

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function NewsTab({ posts }: { posts: any[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('news');
  const [imageUrl, setImageUrl] = useState('');
  const [published, setPublished] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setExcerpt('');
    setCategory('news');
    setImageUrl('');
    setPublished(true);
    setImageFile(null);
    setImagePreview('');
    setImageError('');
    setMsg('');
  };

  const handleImageFile = (file: File) => {
    setImageError('');
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Invalid format. Only JPG, PNG, or WEBP accepted.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageError('File too large. Maximum 2MB allowed.');
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImageFile(file);
      setImagePreview(img.src);
    };
  };

  const handleSave = async () => {
    if (!title || !content) { setMsg('Title and content required'); return; }
    setSaving(true); setMsg('');
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        setUploading(true);
        finalImageUrl = await uploadFile(imageFile, 'posts');
        setUploading(false);
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, excerpt, category, imageUrl: finalImageUrl, published }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Post created!'); resetForm(); setShowForm(false); router.refresh();
      } else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await fetch(`/api/posts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !current }),
    });
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          News & Blog Posts ({posts.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-mln-green/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Create New Post</div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Status</label>
                  <select value={published ? 'true' : 'false'} onChange={e => setPublished(e.target.value === 'true')} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">
                    <option value="true">Published</option>
                    <option value="false">Draft</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Featured Image Upload */}
            <div className="flex items-start gap-5 p-4 bg-background rounded-xl border border-border-color">
              <div className="flex-shrink-0">
                <label className="cursor-pointer group block">
                  <div className="w-36 h-20 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-surface overflow-hidden flex items-center justify-center transition-colors relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Upload size={22} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                    )}
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setImageFile(null); setImagePreview(''); setImageUrl(''); }}
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
                    onChange={e => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  />
                </label>
                <p className="text-[9px] text-gray-500 font-bold uppercase text-center mt-1">Image (Max 2MB)</p>
              </div>

              <div className="flex-1">
                {imageError && (
                  <div className="text-[10px] font-bold px-3 py-2 rounded-lg mb-3 bg-red-400/10 text-red-400 border border-red-400/20">
                    {imageError}
                  </div>
                )}
                <p className="text-[10px] text-gray-500">Click the box to upload a featured image.<br/>JPG, PNG, or WEBP · Landscape ratio recommended · Max 2MB.</p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Excerpt (short summary)</label>
              <input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief summary..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Content</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Write your article..." className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none resize-y" />
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={handleSave} disabled={saving || uploading} className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                {uploading ? 'Uploading Image...' : saving ? 'Saving...' : 'Publish Post'}
              </button>
              {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="bg-background border border-border-color rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400 min-w-[600px]">
          <thead className="bg-surface text-xs uppercase text-white">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No posts yet. Click &quot;+ New Post&quot; to create one!</td></tr>
            ) : (
              posts.map((p: any) => (
                <tr key={p.id} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 text-white font-semibold max-w-[250px] truncate">{p.title}</td>
                  <td className="px-6 py-4"><span className="bg-mln-green/10 text-mln-green border border-mln-green/30 px-2 py-0.5 rounded text-xs font-bold uppercase">{p.category}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => togglePublish(p.id, p.published)} className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${p.published ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>
                      {p.published ? 'Live' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
