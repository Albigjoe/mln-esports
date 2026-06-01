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
          {/* BRACKET GENERATION PANEL */}
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-mln-green pl-2">
              Bracket Generation
            </h4>
            <div className="bg-background border border-border-color rounded-lg p-4 mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-2 font-bold">Format: <span className="text-mln-green">{t.format}</span></div>
              <p className="text-xs text-gray-500">
                When all teams are enrolled, click Generate Bracket to automatically build the knockout tree and match structure.
                This will overwrite any existing pending brackets for this tournament.
              </p>
            </div>
            <button 
              onClick={handleGenerateBracket}
              disabled={generating || participants.length < 2}
              className={`w-full font-black uppercase tracking-widest py-3 rounded-lg transition-colors ${generating || participants.length < 2 ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-mln-green hover:bg-mln-green-dark text-black'}`}
            >
              {generating ? 'Generating...' : 'Generate Bracket'}
            </button>
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
              <button onClick={handleRestart} className="w-full text-xs font-bold uppercase tracking-wider py-2 rounded border bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20">
                ⚠️ Clear Bracket & Restart
              </button>
              <button onClick={handleDelete} className="w-full text-xs font-bold uppercase tracking-wider py-2 rounded border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20">
                🚨 Delete Tournament
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BRACKET VIEWER */}
      <div className="bg-surface border border-border-color rounded-xl p-6 overflow-x-auto">
        <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 border-l-2 border-mln-green pl-2">
          Current Bracket
        </h4>
        <BracketViewer matches={matches} isAdmin={true} onMatchUpdated={loadData} />
      </div>
    </div>
  );
}
