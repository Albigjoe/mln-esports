"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffTab({ staffUsers, currentEmail }: { staffUsers: any[]; currentEmail: string }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');

  const handleCreate = async () => {
    if (!name || !email || !password) { setMsg('All fields required'); return; }
    if (password.length < 6) { setMsg('Password must be at least 6 characters'); return; }
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('✓ Staff member added!');
        setName(''); setEmail(''); setPassword(''); setRole('staff'); setShowForm(false);
        router.refresh();
      } else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string, userEmail: string) => {
    if (userEmail === currentEmail) { alert("You can't delete your own account!"); return; }
    if (!confirm(`Remove ${userEmail} from staff?`)) return;
    await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          Staff Members ({staffUsers.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors">
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-mln-green/30 rounded-xl p-6 mb-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Add New Staff Member</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@mln.gg" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={handleCreate} disabled={saving} className="bg-mln-green hover:bg-mln-green-dark text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50">
              {saving ? 'Adding...' : 'Add Staff'}
            </button>
            {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffUsers.map((u: any) => (
          <div key={u.id} className="bg-surface border border-border-color rounded-xl p-5 hover:border-mln-green/30 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-mln-green/20 border border-mln-green/40 flex items-center justify-center text-mln-green font-bold">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'}`}>
                {u.role}
              </span>
            </div>
            <h4 className="text-white font-bold">{u.name}</h4>
            <p className="text-gray-500 text-xs mb-3">{u.email}</p>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 text-[10px]">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
              {u.email !== currentEmail && (
                <button onClick={() => handleDelete(u.id, u.email)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
