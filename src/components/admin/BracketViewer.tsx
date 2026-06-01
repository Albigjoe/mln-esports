"use client";
import React from 'react';

export default function BracketViewer({ matches }: { matches: any[] }) {
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

  return (
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
              // We'll calculate simple flex lines via CSS if needed, but for now we rely on pure flex layout
              return (
                <div key={m.id} className="bg-background border border-border-color rounded-lg overflow-hidden flex flex-col relative w-full shadow-lg shadow-black/20">
                  
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
                    {m.score1 > 0 && <span className="text-xs font-bold text-gray-400">{m.score1}</span>}
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
                    {m.score2 > 0 && <span className="text-xs font-bold text-gray-400">{m.score2}</span>}
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
  );
}
