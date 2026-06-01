"use client";
import { useState, useEffect } from 'react';

export default function RegistrationsTab() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/registrations');
      const data = await res.json();
      if (data.data) {
        setRegistrations(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      reg.teamName.toLowerCase().includes(lowerQuery) ||
      reg.contactEmail.toLowerCase().includes(lowerQuery) ||
      reg.players?.some((p: any) => p.username?.toLowerCase().includes(lowerQuery) || p.gameId?.toLowerCase().includes(lowerQuery))
    );
  });

  const [actionMsg, setActionMsg] = useState('');

  const handleAction = async (id: string, status: string, reg: any) => {
    if (!confirm(`Are you sure you want to ${status} this registration?`)) return;
    setActionMsg('');
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, teamName: reg.teamName, logoUrl: reg.logoUrl, lineupImageUrl: reg.lineupImageUrl, players: reg.players })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMsg(`✅ ${reg.teamName} has been ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully!`);
        fetchRegistrations();
      } else {
        setActionMsg(`❌ Failed to ${status.toLowerCase()} ${reg.teamName}: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setActionMsg(`❌ Network error while updating ${reg.teamName}: ${e.message}`);
    }
  };

  const handleDelete = async (id: string, status: string, teamName: string) => {
    const msg = status === 'APPROVED'
      ? `Permanently delete this APPROVED registration?\n\n⚠️ WARNING: This will permanently delete the Team "${teamName}" and all of its players from the system so the leader can resubmit.`
      : 'Permanently delete this registration record?';

    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRegistrations();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to delete'));
      }
    } catch (e) {
      alert('Error deleting registration');
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('⚠️ CRITICAL WARNING: Are you sure you want to delete ALL registration history? This will permanently wipe all pending and approved registration records. It will NOT delete actual teams or players already in the database.')) return;
    try {
      const res = await fetch('/api/registrations', { method: 'DELETE' });
      if (res.ok) {
        fetchRegistrations();
        setActionMsg('✅ Registration history cleared successfully.');
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to clear history'));
      }
    } catch (e) {
      alert('Error clearing registration history');
    }
  };

  if (loading) return <div className="text-gray-400">Loading registrations...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-mln-green pl-3 flex justify-between items-center">
        <span>Pending Registrations ({filteredRegistrations.length})</span>
        <div className="flex items-center gap-4">
          <button onClick={fetchRegistrations} className="text-xs font-bold text-mln-green hover:underline uppercase tracking-widest">Refresh</button>
          {registrations.length > 0 && (
            <button 
              onClick={handleClearHistory} 
              className="text-xs font-bold text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded hover:bg-red-500/20 uppercase tracking-widest transition-colors"
            >
              Delete All History
            </button>
          )}
        </div>
      </h2>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search by team name, contact email, player IGN, or Game ID..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border-color rounded-xl px-4 py-3 text-white focus:outline-none focus:border-mln-green transition-colors text-sm"
        />
      </div>

      {actionMsg && (
        <div className={`rounded-xl p-4 mb-4 font-bold text-sm border ${actionMsg.startsWith('✅') ? 'bg-mln-green/10 text-mln-green border-mln-green/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
          {actionMsg}
          <button onClick={() => setActionMsg('')} className="ml-4 text-xs opacity-60 hover:opacity-100">✕ Dismiss</button>
        </div>
      )}

      {filteredRegistrations.length === 0 ? (
        <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500">
          No team registrations found matching your search.
        </div>
      ) : (
        filteredRegistrations.map(reg => (
          <div key={reg.id} className="bg-surface border border-border-color rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 pb-4 border-b border-border-color">
              <div className="flex items-center gap-4 flex-wrap">
                {reg.logoUrl ? (
                  <img src={reg.logoUrl} alt={reg.teamName} className="w-16 h-16 rounded-lg object-contain bg-background border border-border-color/40" title="Squad Logo" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center text-[10px] font-bold text-gray-500 border border-border-color/40">NO LOGO</div>
                )}
                {reg.lineupImageUrl ? (
                  <a href={reg.lineupImageUrl} target="_blank" rel="noopener noreferrer" className="block relative group">
                    <img src={reg.lineupImageUrl} alt={`${reg.teamName} Lineup`} className="w-24 h-16 rounded-lg object-cover bg-background border border-border-color/40 hover:opacity-80 transition-opacity" title="Squad Lineup Photo (Click to zoom)" />
                    <span className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-white">Lineup 🔍</span>
                  </a>
                ) : (
                  <div className="w-24 h-16 rounded-lg bg-background flex items-center justify-center text-[10px] font-bold text-gray-500 border border-border-color/40">NO LINEUP PIC</div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-white uppercase">{reg.teamName}</h3>
                  {reg.tournament && (
                    <div className="text-xs font-bold bg-mln-green/10 text-mln-green border border-mln-green/30 px-2 py-1 rounded inline-block mt-2 uppercase tracking-widest">
                      Target: {reg.tournament.name}
                    </div>
                  )}
                  <div className="text-sm text-gray-400 mt-2">Contact: {reg.contactEmail}</div>
                  <div className="text-xs font-bold mt-1">
                    Status: <span className={reg.status === 'PENDING' ? 'text-yellow-400' : reg.status === 'APPROVED' ? 'text-mln-green' : 'text-red-400'}>{reg.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {reg.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleAction(reg.id, 'APPROVED', reg)} className="bg-mln-green text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-mln-green-dark transition-colors shadow-lg shadow-mln-green/20">Approve & Add</button>
                    <button onClick={() => handleAction(reg.id, 'REJECTED', reg)} className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-500/20 transition-colors">Reject</button>
                  </>
                )}
                {reg.status === 'APPROVED' && (
                  <button 
                    onClick={() => handleAction(reg.id, 'APPROVED', reg)} 
                    className="bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors"
                    title="If players failed to add previously due to a bug, click this to retry adding them to the team."
                  >
                    ↻ Force Sync Roster
                  </button>
                )}
                <button onClick={() => handleDelete(reg.id, reg.status, reg.teamName)} className="bg-background border border-border-color text-gray-400 px-3 py-2 rounded-lg hover:text-white hover:bg-red-500/10 hover:border-red-500/30 transition-colors" title="Delete Registration Record">🗑️</button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Player Roster ({reg.players?.length || 0})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {reg.players?.map((p: any, i: number) => (
                  <div key={i} className="bg-background border border-border-color rounded-lg p-3 relative">
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-gray-600">P{i+1}</span>
                    {p.pictureUrl && (
                      <img src={p.pictureUrl} alt={p.username} className="w-10 h-10 rounded-lg object-cover mb-2 border border-border-color" />
                    )}
                    <div className="font-bold text-white mb-0.5">{p.username || 'No IGN'}</div>
                    {p.gameId && (
                      <div className="text-[9px] text-mln-green font-black uppercase tracking-widest mb-1">ID: {p.gameId}</div>
                    )}
                    <div className="text-[10px] text-gray-400 mb-2">{p.realName || '-'}</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-mln-green border border-border-color">{p.role || 'Unassigned'}</span>
                      <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-gray-300 border border-border-color">{p.rank || '-'}</span>
                      {p.state && <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-gray-400 border border-border-color">{p.state}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
