"use client";
import React, { useState } from 'react';

interface MatchDetails {
  id: string;
  score1: number;
  score2: number;
  winnerId: string | null;
  status: string;
  team1: any;
  team2: any;
  team1Id: string | null;
  team2Id: string | null;
  tournamentId: string;
  round: number;
  matchOrder: number;
  isBye: boolean;
}

export default function BracketViewer({ matches, isAdmin = false, onMatchUpdated }: { matches: any[], isAdmin?: boolean, onMatchUpdated?: () => void }) {
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winnerId, setWinnerId] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  if (!matches || matches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-bold border border-dashed border-gray-700 rounded-xl">
        Bracket not generated yet.
      </div>
    );
  }

  // Group matches by round
  const roundsMap = new Map<number, any[]>();
  matches.forEach(m => {
    if (!roundsMap.has(m.round)) {
      roundsMap.set(m.round, []);
    }
    roundsMap.get(m.round)!.push(m);
  });

  const rounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  const handleMatchClick = (m: any) => {
    if (!isAdmin) return;
    if (m.isBye) return; // Can't edit BYE matches manually
    setSelectedMatch(m);
    setScore1(m.score1 || 0);
    setScore2(m.score2 || 0);
    setWinnerId(m.winnerId || '');
  };

  const handleSaveMatch = async () => {
    if (!selectedMatch) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedMatch.tournamentId}/bracket`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          score1,
          score2,
          winnerId: winnerId || null,
          status: winnerId ? 'COMPLETED' : 'ONGOING'
        })
      });
      if (res.ok) {
        setSelectedMatch(null);
        if (onMatchUpdated) onMatchUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update match');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating match');
    }
    setUpdating(false);
  };

  return (
    <>
      <div className="flex gap-12 overflow-x-auto py-8 px-4 bracket-container min-w-full">
        {rounds.map(roundNumber => {
          const roundMatches = roundsMap.get(roundNumber)!.sort((a, b) => a.matchOrder - b.matchOrder);
          return (
            <div key={`round-${roundNumber}`} className="flex flex-col justify-around gap-6 relative min-w-[250px]">
              {/* Round Header */}
              <div className="absolute -top-8 left-0 right-0 text-center text-xs font-black text-mln-green uppercase tracking-widest">
                {roundNumber === rounds.length ? 'Final' : `Round ${roundNumber}`}
              </div>

              {roundMatches.map((m: any, idx: number) => {
                const clickable = isAdmin && !m.isBye && (m.team1Id || m.team2Id);
                return (
                  <div 
                    key={m.id} 
                    onClick={() => handleMatchClick(m)}
                    className={`bg-background border ${clickable ? 'border-mln-green hover:border-mln-green hover:shadow-mln-green/20 cursor-pointer' : 'border-border-color'} rounded-lg overflow-hidden flex flex-col relative w-full shadow-lg shadow-black/20 transition-all`}
                  >
                    
                    {/* Connectors (CSS pseudo-elements would be better, but we do basic borders for now) */}
                    {roundNumber < rounds.length && (
                      <div className="absolute -right-6 top-1/2 w-6 border-t border-border-color border-2" />
                    )}

                    {/* Top Team */}
                    <div className={`flex items-center justify-between p-2 border-b border-border-color ${m.winnerId === m.team1Id ? 'bg-mln-green/10' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-surface rounded flex items-center justify-center overflow-hidden">
                          {m.team1?.logoUrl ? <img src={m.team1.logoUrl} alt="" className="w-full h-full object-contain" /> : <div className="text-[8px] text-gray-500">TBD</div>}
                        </div>
                        <span className={`text-xs font-bold uppercase truncate max-w-[140px] ${m.winnerId === m.team1Id ? 'text-mln-green' : m.team1 ? 'text-white' : 'text-gray-600'}`}>
                          {m.team1?.name || (m.isBye ? 'BYE' : 'TBD')}
                        </span>
                      </div>
                      {(m.score1 > 0 || m.status === 'COMPLETED') && <span className="text-xs font-bold text-gray-400">{m.score1}</span>}
                    </div>

                    {/* Bottom Team */}
                    <div className={`flex items-center justify-between p-2 ${m.winnerId === m.team2Id ? 'bg-mln-green/10' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-surface rounded flex items-center justify-center overflow-hidden">
                          {m.team2?.logoUrl ? <img src={m.team2.logoUrl} alt="" className="w-full h-full object-contain" /> : <div className="text-[8px] text-gray-500">TBD</div>}
                        </div>
                        <span className={`text-xs font-bold uppercase truncate max-w-[140px] ${m.winnerId === m.team2Id ? 'text-mln-green' : m.team2 ? 'text-white' : 'text-gray-600'}`}>
                          {m.team2?.name || (m.isBye ? 'BYE' : 'TBD')}
                        </span>
                      </div>
                      {(m.score2 > 0 || m.status === 'COMPLETED') && <span className="text-xs font-bold text-gray-400">{m.score2}</span>}
                    </div>
                    
                    {/* Status */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface text-[8px] font-black uppercase px-1 rounded text-gray-500 border border-border-color">
                      {m.status === 'COMPLETED' ? 'END' : m.status === 'PENDING' ? 'VS' : m.status}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* MATCH EDIT MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border-color rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-black uppercase text-white mb-6">Update Match Result</h3>
            
            <div className="space-y-6">
              {/* Team 1 Score */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase">{selectedMatch.team1?.name || 'TBD'}</span>
                <input 
                  type="number" 
                  min="0"
                  value={score1}
                  onChange={e => setScore1(parseInt(e.target.value) || 0)}
                  className="bg-surface border border-border-color text-white px-3 py-2 rounded w-24 text-center font-bold"
                />
              </div>

              <div className="text-center text-gray-500 font-bold uppercase text-sm">VS</div>

              {/* Team 2 Score */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase">{selectedMatch.team2?.name || 'TBD'}</span>
                <input 
                  type="number" 
                  min="0"
                  value={score2}
                  onChange={e => setScore2(parseInt(e.target.value) || 0)}
                  className="bg-surface border border-border-color text-white px-3 py-2 rounded w-24 text-center font-bold"
                />
              </div>

              {/* Winner Selection */}
              <div className="pt-4 border-t border-border-color">
                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Declare Winner</label>
                <select 
                  value={winnerId}
                  onChange={e => setWinnerId(e.target.value)}
                  className="w-full bg-surface border border-border-color text-white px-4 py-2 rounded font-bold uppercase"
                >
                  <option value="">-- No Winner Yet --</option>
                  {selectedMatch.team1 && <option value={selectedMatch.team1.id}>{selectedMatch.team1.name}</option>}
                  {selectedMatch.team2 && <option value={selectedMatch.team2.id}>{selectedMatch.team2.name}</option>}
                </select>
                <p className="text-[10px] text-gray-500 mt-2">
                  Setting a winner will automatically advance them to the next round.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 bg-surface border border-border-color text-white py-2 rounded font-bold uppercase hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveMatch}
                  disabled={updating}
                  className="flex-1 bg-mln-green hover:bg-mln-green-dark text-black py-2 rounded font-bold uppercase transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Result'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
