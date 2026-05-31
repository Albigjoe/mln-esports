"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TournamentManager({ t, teams, onBack }: { t: any, teams: any[], onBack: () => void }) {
  const router = useRouter();
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch participants for this tournament
  const loadData = async () => {
    setLoading(true);
    const res = await fetch(`/api/tournaments/${t.id}/participants`);
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants || []);
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

  return (
    <div>
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
              const isEnrolled = participants.find(p => p.teamId === team.id);
              return (
                <div key={team.id} className="flex items-center justify-between p-3 bg-background border border-border-color rounded-lg">
                  <div className="font-bold text-white uppercase text-sm">{team.name}</div>
                  <button 
                    onClick={() => toggleTeam(team.id)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      isEnrolled ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-mln-green/20 text-mln-green hover:bg-mln-green/40'
                    }`}
                  >
                    {isEnrolled ? 'Remove' : 'Enroll'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

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
          <button className="w-full bg-mln-green hover:bg-mln-green-dark text-black font-black uppercase tracking-widest py-3 rounded-lg transition-colors">
            Generate Bracket
          </button>
        </div>
      </div>
    </div>
  );
}
