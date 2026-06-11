"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BracketViewer from './BracketViewer';

export default function TournamentManager({ t, teams, onBack }: { t: any, teams: any[], onBack: () => void }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [editName, setEditName] = useState(t.name);
  const [editFormat, setEditFormat] = useState(t.format || 'SINGLE_ELIMINATION');
  const [editStartDate, setEditStartDate] = useState(t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '');
  const [editIsTBDDate, setEditIsTBDDate] = useState(t.startDate ? new Date(t.startDate).getFullYear() <= 1970 : true);
  const [updatingDetails, setUpdatingDetails] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const handleUpdateDetails = async () => {
    if (!editName.trim()) { setEditMsg('Name is required'); return; }
    if (!editIsTBDDate && !editStartDate) { setEditMsg('Start date is required'); return; }
    setUpdatingDetails(true); setEditMsg('');
    try {
      const res = await fetch(`/api/tournaments/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          format: editFormat,
          startDate: editIsTBDDate ? '1970-01-01T00:00:00.000Z' : new Date(editStartDate).toISOString()
        })
      });
      if (res.ok) {
        setEditMsg('✓ Details updated!');
        window.location.reload();
      } else {
        const data = await res.json();
        setEditMsg('Error: ' + data.error);
      }
    } catch (e: any) {
      setEditMsg('Error: ' + e.message);
    }
    setUpdatingDetails(false);
  };

  // Fetch participants for this tournament
  const loadData = async () => {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${t.id}/participants`);
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants || []);
    }

    const bRes = await fetch(`/api/tournaments/${t.id}/bracket`);
    if (bRes.ok) {
      const bData = await bRes.json();
      setMatches(bData.matches || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [t.id]);

  const toggleTeam = async (teamId: string) => {
    const isEnrolled = participants.find(p => p.teamId === teamId);
    if (isEnrolled) {
      await fetch(`/api/tournaments/${t.id}/participants?teamId=${teamId}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/tournaments/${t.id}/participants`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }) 
      });
    }
    loadData();
  };

  const handleGenerateBracket = async () => {
    if (!confirm('Are you sure? This will delete the current bracket and regenerate it based on currently enrolled teams.')) return;
    setGenerating(true);
    const res = await fetch(`/api/tournaments/${t.id}/bracket`, { method: 'POST' });
    if (res.ok) {
      alert('Bracket generated successfully!');
      loadData();
    } else {
      const data = await res.json();
      alert(`Error: ${data.error}`);
    }
    setGenerating(false);
  };

  const handleUpdateSeed = async (teamId: string, seed: string) => {
    await fetch(`/api/tournaments/${t.id}/participants`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, seed })
    });
    loadData();
  };

  const updateStatus = async (status: string) => {
    if (!confirm(`Are you sure you want to mark tournament as ${status}?`)) return;
    const res = await fetch(`/api/tournaments/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { alert('Status updated!'); window.location.reload(); } else alert('Failed to update status');
  };

  const updateRegistration = async (registrationStatus: string) => {
    if (!confirm(`Are you sure you want to ${registrationStatus === 'CLOSED' ? 'close' : 'open'} registration?`)) return;
    const res = await fetch(`/api/tournaments/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registrationStatus }) });
    if (res.ok) { alert('Registration updated!'); window.location.reload(); } else alert('Failed to update registration');
  };

  const handleRestart = async () => {
    if (!confirm('WARNING: This will CLEAR all brackets and matches permanently, but keep the teams enrolled. Are you sure?')) return;
    const res = await fetch(`/api/tournaments/${t.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restart' }) });
    if (res.ok) { alert('Tournament restarted successfully.'); loadData(); } else alert('Failed to restart');
  };

  const handleDelete = async () => {
    if (!confirm('CRITICAL WARNING: This will permanently delete the ENTIRE tournament from the database. This cannot be undone. Are you sure?')) return;
    if (!confirm('Are you ABSOLUTELY sure? All matches and data will be lost.')) return;
    const res = await fetch(`/api/tournaments/${t.id}`, { method: 'DELETE' });
    if (res.ok) { alert('Tournament deleted.'); window.location.reload(); } else alert('Failed to delete tournament');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white">&larr; Back</button>
        <h3 className="text-xl font-bold text-white uppercase tracking-wider">
          Manage: <span className="text-mln-green">{t.name}</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ENROLLMENT PANEL */}
        <div className="bg-surface border border-border-color rounded-xl p-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-mln-green pl-2">
            Enroll Teams ({participants.length})
          </h4>
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {teams.map(team => {
              const enrolled = participants.find(p => p.teamId === team.id);
              return (
                <div key={team.id} className="flex items-center justify-between p-3 bg-background border border-border-color rounded-lg">
                  <div className="font-bold text-white uppercase text-sm">{team.name}</div>
                  <div className="flex items-center gap-2">
                    {enrolled && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Seed</span>
                        <input 
                          type="number" 
                          min="1"
                          placeholder="-"
                          value={enrolled.seed || ''}
                          onChange={(e) => handleUpdateSeed(team.id, e.target.value)}
                          className="w-12 bg-surface border border-border-color rounded px-1.5 py-1 text-center text-xs font-bold text-white outline-none focus:border-mln-green"
                        />
                      </div>
                    )}
                    <button 
                      onClick={() => toggleTeam(team.id)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        enrolled ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-mln-green/20 text-mln-green hover:bg-mln-green/40'
                      }`}
                    >
                      {enrolled ? 'Remove' : 'Enroll'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN CONTROLS */}
        <div className="space-y-6">
          {/* EDIT DETAILS PANEL */}
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-mln-green pl-2">
              Edit Details
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Tournament Name</label>
                <input 
                  type="text" 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-xs focus:border-mln-green outline-none" 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold">Start Date</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-400 hover:text-white select-none">
                    <input 
                      type="checkbox" 
                      checked={editIsTBDDate} 
                      onChange={e => setEditIsTBDDate(e.target.checked)} 
                      className="rounded bg-background border-gray-700 text-mln-green focus:ring-0 focus:ring-offset-0" 
                    />
                    <span>TBD</span>
                  </label>
                </div>
                <input 
                  type="date" 
                  value={editIsTBDDate ? '' : editStartDate} 
                  disabled={editIsTBDDate} 
                  onChange={e => setEditStartDate(e.target.value)} 
                  className={`w-full bg-background border border-border-color rounded px-3 py-2 text-white text-xs focus:border-mln-green outline-none ${editIsTBDDate ? 'opacity-40 cursor-not-allowed' : ''}`} 
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Format</label>
                <select 
                  value={editFormat} 
                  onChange={e => setEditFormat(e.target.value)} 
                  className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-xs focus:border-mln-green outline-none"
                >
                  <option value="SINGLE_ELIMINATION">Single Elimination</option>
                  <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                  <option value="ROUND_ROBIN">Round Robin (Groups)</option>
                  <option value="SWISS">Swiss Stage</option>
                  <option value="TWO_STAGE">Two-Stage (Groups &rarr; Knockout)</option>
                  <option value="TBD">To Be Decided (TBD)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={handleUpdateDetails} 
                  disabled={updatingDetails} 
                  className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {updatingDetails ? 'Saving...' : 'Save Details'}
                </button>
                {editMsg && <span className={`text-xs font-bold ${editMsg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{editMsg}</span>}
              </div>
            </div>
          </div>

          {/* LIFECYCLE CONTROLS PANEL */}
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-mln-green pl-2">
              Lifecycle Controls
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => updateRegistration(t.registrationStatus === 'OPEN' ? 'CLOSED' : 'OPEN')} className={`text-xs font-bold uppercase tracking-wider py-2 rounded border ${t.registrationStatus === 'OPEN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' : 'bg-mln-green/10 text-mln-green border-mln-green/30 hover:bg-mln-green/20'}`}>
                {t.registrationStatus === 'OPEN' ? 'Close Reg' : 'Open Reg'}
              </button>
              {t.status !== 'completed' && <button onClick={() => updateStatus('completed')} className="text-xs font-bold uppercase tracking-wider py-2 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20">Mark Completed</button>}
              {t.status === 'completed' && <button onClick={() => updateStatus('upcoming')} className="text-xs font-bold uppercase tracking-wider py-2 rounded border bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20">Mark Upcoming</button>}
              {t.status !== 'cancelled' && <button onClick={() => updateStatus('cancelled')} className="text-xs font-bold uppercase tracking-wider py-2 rounded border bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-gray-500/20">Mark Cancelled</button>}
            </div>
            
            <div className="border-t border-border-color pt-4 mt-2 space-y-3">
              <button onClick={handleDelete} className="w-full text-xs font-bold uppercase tracking-wider py-2 rounded border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20">
                🚨 Delete Tournament
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
