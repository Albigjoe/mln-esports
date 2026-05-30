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

  // Search and view states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'staff' | 'players'>('all');

  // State for admin manual password reset
  const [resetResult, setResetResult] = useState<{ name: string; email: string; tempPw: string } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleResetPassword = async (id: string, userName: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${userName} (${userEmail})?\nA new temporary password will be generated.`)) return;
    setResettingId(id);
    setCopied(false);
    try {
      const res = await fetch('/api/auth/admin-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetResult({
          name: userName,
          email: userEmail,
          tempPw: data.tempPassword,
        });
      } else {
        alert(data.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    }
    setResettingId(null);
  };

  const handleCopy = () => {
    if (!resetResult) return;
    navigator.clipboard.writeText(resetResult.tempPw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter & split accounts
  const filteredUsers = staffUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const staffAndAdmins = filteredUsers.filter(u => u.role === 'admin' || u.role === 'staff');
  const playerAccounts = filteredUsers.filter(u => u.role !== 'admin' && u.role !== 'staff');

  return (
    <div className="relative space-y-6">
      {/* Password Reset Modal */}
      {resetResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface border border-mln-green/40 p-8 rounded-2xl max-w-md w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-mln-green to-cyan-400"></div>
            
            <div className="text-3xl text-mln-green mb-3">🔑</div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Password Reset Successful</h3>
            
            <p className="text-gray-400 text-sm mb-6">
              A temporary password has been generated for <strong className="text-white font-semibold">{resetResult.name}</strong> ({resetResult.email}).
            </p>

            <div className="bg-background border border-border-color rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
              <span className="font-mono text-lg font-black text-white tracking-wider select-all">{resetResult.tempPw}</span>
              <button 
                onClick={handleCopy}
                className="bg-mln-green/10 hover:bg-mln-green/20 border border-mln-green/30 text-mln-green px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <p className="text-xs text-yellow-500/80 mb-6 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
              ⚠️ Share this temporary password with them. They should log in and change their password in their profile settings.
            </p>

            <button 
              onClick={() => setResetResult(null)}
              className="w-full bg-mln-green hover:bg-mln-green-dark text-black py-3 rounded-xl font-bold tracking-widest uppercase transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-6 bg-mln-green rounded-full"></span>
          User Accounts ({staffUsers.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider transition-colors shrink-0 self-start sm:self-auto">
          {showForm ? 'Cancel' : '+ Add Staff'}
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-mln-green/30 rounded-xl p-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
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

      {/* Modern Search Input with integrated Search Action Label */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-surface border border-border-color/60 p-4 rounded-2xl">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search accounts by name or email..." 
            className="w-full bg-background border border-border-color rounded-xl pl-10 pr-10 py-3 text-white outline-none focus:border-mln-green text-sm"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm font-bold w-6 h-6 flex items-center justify-center bg-surface border border-border-color rounded-full"
            >
              ×
            </button>
          )}
        </div>
        
        {/* Toggle Filters */}
        <div className="flex gap-1 bg-background/50 border border-border-color/60 p-1.5 rounded-xl self-start sm:self-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'staff', label: 'Staff & Admin' },
            { key: 'players', label: 'Players' }
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setActiveSubTab(opt.key as any)}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors ${
                activeSubTab === opt.key 
                  ? 'bg-mln-green text-black' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts List Container */}
      <div className="space-y-8">
        
        {/* SECTION 1: STAFF & ADMIN ACCOUNTS */}
        {(activeSubTab === 'all' || activeSubTab === 'staff') && (
          <div>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-[3px] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Staff & Admins ({staffAndAdmins.length})
            </h4>
            
            {staffAndAdmins.length === 0 ? (
              <div className="bg-surface border border-border-color rounded-xl p-6 text-center text-gray-500 text-sm">
                No staff or admin accounts found matching search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffAndAdmins.map((u: any) => (
                  <AccountCard 
                    key={u.id} 
                    user={u} 
                    currentEmail={currentEmail} 
                    resettingId={resettingId}
                    onResetPassword={handleResetPassword}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: PLAYER & CAPTAIN ACCOUNTS */}
        {(activeSubTab === 'all' || activeSubTab === 'players') && (
          <div>
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-[3px] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mln-green"></span>
              Player Accounts ({playerAccounts.length})
            </h4>
            
            {playerAccounts.length === 0 ? (
              <div className="bg-surface border border-border-color rounded-xl p-6 text-center text-gray-500 text-sm">
                No player accounts found matching search.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerAccounts.map((u: any) => (
                  <AccountCard 
                    key={u.id} 
                    user={u} 
                    currentEmail={currentEmail} 
                    resettingId={resettingId}
                    onResetPassword={handleResetPassword}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function AccountCard({ 
  user, 
  currentEmail, 
  resettingId, 
  onResetPassword, 
  onDelete 
}: { 
  user: any; 
  currentEmail: string; 
  resettingId: string | null; 
  onResetPassword: (id: string, name: string, email: string) => void;
  onDelete: (id: string, email: string) => void;
}) {
  return (
    <div className="bg-surface border border-border-color rounded-xl p-5 hover:border-mln-green/30 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-full bg-mln-green/20 border border-mln-green/40 flex items-center justify-center text-mln-green font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            user.role === 'admin' 
              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' 
              : user.role === 'staff'
              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              : 'bg-green-500/15 text-mln-green border border-mln-green/30'
          }`}>
            {user.role}
          </span>
        </div>
        <h4 className="text-white font-bold">{user.name}</h4>
        <p className="text-gray-500 text-xs mb-3">{user.email}</p>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-color/40">
        <span className="text-gray-600 text-[10px]">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-3">
          {user.email !== currentEmail && (
            <button 
              onClick={() => onResetPassword(user.id, user.name, user.email)} 
              disabled={resettingId === user.id}
              className="text-mln-green hover:text-mln-green-light text-xs font-bold uppercase disabled:opacity-50"
            >
              {resettingId === user.id ? 'Resetting...' : 'Reset PW'}
            </button>
          )}
          {user.email !== currentEmail && (
            <button onClick={() => onDelete(user.id, user.email)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Remove</button>
          )}
        </div>
      </div>
    </div>
  );
}
