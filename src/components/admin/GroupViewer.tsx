"use client";
import React from 'react';

export default function GroupViewer({ matches, onMatchClick }: { matches: any[], onMatchClick: (m: any) => void }) {
  // Group matches by group (stage)
  const groupsMap = new Map<string, any[]>();
  matches.forEach(m => {
    if (!groupsMap.has(m.stage)) groupsMap.set(m.stage, []);
    groupsMap.get(m.stage)!.push(m);
  });

  const stages = Array.from(groupsMap.keys()).sort();

  return (
    <div className="flex flex-col gap-8 w-full">
      {stages.map(stage => {
        const groupMatches = groupsMap.get(stage)!;
        
        // Calculate standings
        const teamsMap = new Map<string, any>();
        groupMatches.forEach(m => {
          if (m.team1Id) {
            if (!teamsMap.has(m.team1Id)) teamsMap.set(m.team1Id, { id: m.team1Id, team: m.team1, wins: 0, losses: 0, points: 0, matchesPlayed: 0 });
          }
          if (m.team2Id) {
            if (!teamsMap.has(m.team2Id)) teamsMap.set(m.team2Id, { id: m.team2Id, team: m.team2, wins: 0, losses: 0, points: 0, matchesPlayed: 0 });
          }
          if (m.status === 'COMPLETED') {
            if (m.winnerId === m.team1Id) {
              teamsMap.get(m.team1Id)!.wins++;
              teamsMap.get(m.team1Id)!.points += 3;
              if (m.team2Id) teamsMap.get(m.team2Id)!.losses++;
            } else if (m.winnerId === m.team2Id) {
              teamsMap.get(m.team2Id)!.wins++;
              teamsMap.get(m.team2Id)!.points += 3;
              if (m.team1Id) teamsMap.get(m.team1Id)!.losses++;
            }
            if (m.team1Id) teamsMap.get(m.team1Id)!.matchesPlayed++;
            if (m.team2Id) teamsMap.get(m.team2Id)!.matchesPlayed++;
          }
        });

        const standings = Array.from(teamsMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);

        return (
          <div key={stage} className="bg-background border border-border-color p-4 rounded-xl">
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 border-l-4 border-mln-green pl-3">
              {stage.replace('_', ' ')}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Standings */}
              <div>
                <table className="w-full text-left text-sm text-gray-400 min-w-[600px]">
                  <thead className="bg-surface text-xs uppercase text-white border-b border-border-color">
                    <tr>
                      <th className="p-3">Rank</th>
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">W-L</th>
                      <th className="p-3 text-center">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((t, idx) => (
                      <tr key={t.id} className="border-b border-border-color hover:bg-surface/50">
                        <td className="p-3 font-bold text-white">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-surface rounded flex items-center justify-center overflow-hidden">
                              {t.team?.logoUrl ? <img src={t.team.logoUrl} className="w-full h-full object-contain"/> : null}
                            </div>
                            <span className="font-bold text-white uppercase">{t.team?.name || 'TBD'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-300">{t.wins} - {t.losses}</td>
                        <td className="p-3 text-center font-black text-mln-green">{t.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Matches List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {groupMatches.sort((a, b) => a.round - b.round || a.matchOrder - b.matchOrder).map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => onMatchClick(m)}
                    className="flex flex-col bg-surface border border-border-color rounded-lg overflow-hidden cursor-pointer hover:border-mln-green transition-colors"
                  >
                    <div className="bg-background text-[10px] text-center font-bold text-gray-500 uppercase py-1 border-b border-border-color">
                      Round {m.round} - Match {m.matchOrder}
                    </div>
                    <div className="flex justify-between items-center p-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`text-xs font-bold uppercase truncate ${m.winnerId === m.team1Id ? 'text-mln-green' : 'text-white'}`}>
                          {m.team1?.name || 'TBD'}
                        </span>
                      </div>
                      <div className="px-3 text-xs font-black text-gray-400 bg-background rounded">
                        {m.score1} : {m.score2}
                      </div>
                      <div className="flex items-center justify-end gap-2 flex-1">
                        <span className={`text-xs font-bold uppercase truncate ${m.winnerId === m.team2Id ? 'text-mln-green' : 'text-white'}`}>
                          {m.team2?.name || 'TBD'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
