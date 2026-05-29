"use client";
import { useState, useEffect } from 'react';

export default function RegistrationsTab() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAction = async (id: string, status: string, reg: any) => {
    if (!confirm(`Are you sure you want to ${status} this registration?`)) return;
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, teamName: reg.teamName, logoUrl: reg.logoUrl, players: reg.players })
      });
      if (res.ok) fetchRegistrations();
    } catch (e) {
      alert('Error updating registration');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this registration record?')) return;
    try {
      await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      fetchRegistrations();
    } catch (e) {
      alert('Error deleting registration');
    }
  };

  if (loading) return <div className="text-gray-400">Loading registrations...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-mln-green pl-3 flex justify-between items-center">
        <span>Pending Registrations ({registrations.length})</span>
        <button onClick={fetchRegistrations} className="text-xs font-bold text-mln-green hover:underline uppercase tracking-widest">Refresh</button>
      </h2>

      {registrations.length === 0 ? (
        <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500">
          No team registrations found.
        </div>
      ) : (
        registrations.map(reg => (
          <div key={reg.id} className="bg-surface border border-border-color rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6 pb-4 border-b border-border-color">
              <div className="flex items-center gap-4">
                {reg.logoUrl ? (
                  <img src={reg.logoUrl} alt={reg.teamName} className="w-16 h-16 rounded-lg object-contain bg-background" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-background flex items-center justify-center text-xs font-bold text-gray-500">NO LOGO</div>
                )}
                <div>
                  <h3 className="text-2xl font-black text-white uppercase">{reg.teamName}</h3>
                  <div className="text-sm text-gray-400 mt-1">Contact: {reg.contactEmail}</div>
                  <div className="text-xs font-bold mt-1">
                    Status: <span className={reg.status === 'PENDING' ? 'text-yellow-400' : reg.status === 'APPROVED' ? 'text-mln-green' : 'text-red-400'}>{reg.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                {reg.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleAction(reg.id, 'APPROVED', reg)} className="bg-mln-green text-black px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs">Approve & Add</button>
                    <button onClick={() => handleAction(reg.id, 'REJECTED', reg)} className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-red-500/20">Reject</button>
                  </>
                )}
                <button onClick={() => handleDelete(reg.id)} className="bg-background border border-border-color text-gray-400 px-3 py-2 rounded-lg hover:text-white transition-colors">🗑️</button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Player Roster ({reg.players?.length || 0})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {reg.players?.map((p: any, i: number) => (
                  <div key={i} className="bg-background border border-border-color rounded-lg p-3 relative">
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-gray-600">P{i+1}</span>
                    <div className="font-bold text-white mb-1">{p.username || 'No IGN'}</div>
                    <div className="text-[10px] text-gray-400 mb-2">{p.realName || '-'}</div>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-mln-green border border-border-color">{p.role || 'Unassigned'}</span>
                      <span className="bg-surface px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider text-gray-300 border border-border-color">{p.rank || '-'}</span>
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
