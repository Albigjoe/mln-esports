"use client";
import React, { useState } from 'react';
import GroupViewer from './GroupViewer';

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
  stage: string;
  createdAt?: string;
}

// Smart round label — mirrors Challonge's naming conventions
function getRoundLabel(roundNumber: number, totalRounds: number, stage: string): string {
  const fromEnd = totalRounds - roundNumber; // 0 = last round of this stage

  if (stage === 'GRAND_FINAL') return 'Grand Final';

  if (stage === 'LOSERS') {
    switch (fromEnd) {
      case 0: return 'Losers Final';
      case 1: return 'Losers Semis';
      default: return `Losers Round ${roundNumber}`;
    }
  }

  // Winners / single elimination
  switch (fromEnd) {
    case 0: return totalRounds === 1 ? 'Final' : 'Final';
    case 1: return 'Semifinals';
    case 2: return 'Quarterfinals';
    case 3: return 'Round of 16';
    case 4: return 'Round of 32';
    case 5: return 'Round of 64';
    default: return `Round ${roundNumber}`;
  }
}

export default function BracketViewer({
  matches,
  isAdmin = false,
  onMatchUpdated,
  participants = [],
}: {
  matches: any[];
  isAdmin?: boolean;
  onMatchUpdated?: () => void;
  participants?: any[];
}) {
  const [selectedMatch, setSelectedMatch] = useState<MatchDetails | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [winnerId, setWinnerId] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  // Build a seed map: teamId → seed number
  const seedMap = new Map<string, number>();
  participants.forEach((p: any) => {
    if (p.teamId && p.seed != null) seedMap.set(p.teamId, p.seed);
  });

  // Find all distinct stages
  const stages = Array.from(new Set(matches.map(m => m.stage || 'WINNERS')));
  const isGroupStage = stages.some(s => s.startsWith('GROUP'));
  const hasGrandFinal = stages.includes('GRAND_FINAL');

  React.useEffect(() => {
    if (stages.length > 0 && !activeTab) {
      if (isGroupStage) setActiveTab('GROUPS');
      else if (stages.includes('WINNERS')) setActiveTab('WINNERS');
      else setActiveTab(stages[0]);
    }
  }, [matches]);

  if (!matches || matches.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 font-bold border border-dashed border-gray-700 rounded-xl">
        Bracket not generated yet.
      </div>
    );
  }

  // Filter matches for current view
  const activeMatches =
    isGroupStage && activeTab === 'GROUPS'
      ? matches.filter(m => m.stage.startsWith('GROUP'))
      : matches.filter(m => (m.stage || 'WINNERS') === activeTab);

  // Group by round
  const roundsMap = new Map<number, any[]>();
  activeMatches.forEach(m => {
    if (!roundsMap.has(m.round)) roundsMap.set(m.round, []);
    roundsMap.get(m.round)!.push(m);
  });
  const rounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);
  const totalRounds = rounds.length;

  const handleMatchClick = (m: any) => {
    if (!isAdmin) return;
    if (m.isBye) return;
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
          status: winnerId ? 'COMPLETED' : 'ONGOING',
        }),
      });
      if (res.ok) {
        setSelectedMatch(null);
        if (onMatchUpdated) onMatchUpdated();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update match');
      }
    } catch (e) {
      alert('Error updating match');
    }
    setUpdating(false);
  };

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; key: string }[]>([]);

  React.useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      if (isGroupStage && activeTab === 'GROUPS') { setLines([]); return; }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines: any[] = [];

      activeMatches.forEach(m => {
        if (m.nextMatchId) {
          const el1 = document.getElementById(`match-${m.id}`);
          const el2 = document.getElementById(`match-${m.nextMatchId}`);
          if (el1 && el2) {
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            const scrollLeft = containerRef.current?.scrollLeft || 0;
            const scrollTop = containerRef.current?.scrollTop || 0;
            const x1 = r1.right - containerRect.left + scrollLeft;
            const y1 = r1.top + r1.height / 2 - containerRect.top + scrollTop;
            const x2 = r2.left - containerRect.left + scrollLeft;
            const y2 = r2.top + r2.height / 2 - containerRect.top + scrollTop;
            newLines.push({ x1, y1, x2, y2, key: m.id });
          }
        }
      });
      setLines(newLines);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    const timeout = setTimeout(updateLines, 80);
    return () => { window.removeEventListener('resize', updateLines); clearTimeout(timeout); };
  }, [activeMatches, roundsMap, activeTab]);

  // Stage tab order: GROUPS → WINNERS → LOSERS → GRAND_FINAL
  const stageOrder = ['GROUPS', 'WINNERS', 'LOSERS', 'GRAND_FINAL'];
  const sortedStages = [
    ...(isGroupStage ? ['GROUPS'] : []),
    ...stages.filter(s => !s.startsWith('GROUP')).sort((a, b) => stageOrder.indexOf(a) - stageOrder.indexOf(b))
  ];

  const stageLabel = (s: string) => {
    if (s === 'GROUPS') return 'Group Stage';
    if (s === 'WINNERS') return 'Winners Bracket';
    if (s === 'LOSERS') return 'Losers Bracket';
    if (s === 'GRAND_FINAL') return 'Grand Final';
    return s.replace('_', ' ');
  };

  return (
    <>
      {/* STAGE TABS */}
      {sortedStages.length > 1 && (
        <div className="flex gap-2 mb-6 border-b border-border-color pb-2 flex-wrap">
          {sortedStages.map(stage => (
            <button
              key={stage}
              onClick={() => setActiveTab(stage)}
              className={`text-sm font-bold uppercase tracking-widest px-5 py-2 rounded-lg transition-colors ${
                activeTab === stage
                  ? 'bg-mln-green text-black shadow-[0_0_12px_rgba(0,200,83,0.3)]'
                  : 'text-gray-400 hover:text-white hover:bg-surface-hover'
              }`}
            >
              {stageLabel(stage)}
            </button>
          ))}
        </div>
      )}

      {isGroupStage && activeTab === 'GROUPS' ? (
        <GroupViewer matches={activeMatches} onMatchClick={handleMatchClick} />
      ) : (
        <div ref={containerRef} className="flex gap-10 overflow-auto py-10 px-6 bracket-container min-w-full relative">
          {/* SVG connector lines */}
          <svg
            className="absolute top-0 left-0 pointer-events-none w-full h-full min-w-max min-h-max"
            style={{ zIndex: 0, overflow: 'visible' }}
          >
            {lines.map(l => {
              const midX = (l.x1 + l.x2) / 2;
              return (
                <path
                  key={l.key}
                  d={`M ${l.x1} ${l.y1} L ${midX} ${l.y1} L ${midX} ${l.y2} L ${l.x2} ${l.y2}`}
                  fill="none"
                  stroke="#00c853"
                  strokeWidth="1.5"
                  strokeOpacity="0.25"
                />
              );
            })}
          </svg>

          {rounds.map((roundNumber, roundIdx) => {
            const roundMatches = roundsMap.get(roundNumber)!.sort((a, b) => a.matchOrder - b.matchOrder);
            const label = getRoundLabel(roundNumber, totalRounds, activeTab);
            const isFinalRound = roundIdx === rounds.length - 1;

            return (
              <div key={`round-${roundNumber}`} className="flex flex-col justify-around gap-6 relative min-w-[260px] z-10">
                {/* Round Header */}
                <div className={`absolute -top-8 left-0 right-0 text-center text-[11px] font-black uppercase tracking-widest ${
                  isFinalRound ? 'text-yellow-400' : 'text-mln-green'
                }`}>
                  {label}
                </div>

                {roundMatches.map((m: any) => {
                  const clickable = isAdmin && !m.isBye && (m.team1Id || m.team2Id);
                  const isLive = m.status === 'ONGOING';
                  const isDone = m.status === 'COMPLETED';
                  const showScores = isLive || isDone;

                  // Seed numbers
                  const seed1 = m.team1Id ? seedMap.get(m.team1Id) : undefined;
                  const seed2 = m.team2Id ? seedMap.get(m.team2Id) : undefined;

                  return (
                    <div
                      id={`match-${m.id}`}
                      key={m.id}
                      onClick={() => handleMatchClick(m)}
                      className={`bg-background border rounded-xl overflow-hidden flex flex-col relative w-full shadow-lg transition-all ${
                        clickable
                          ? 'border-mln-green/40 hover:border-mln-green hover:shadow-mln-green/20 cursor-pointer'
                          : isFinalRound
                          ? 'border-yellow-500/30'
                          : 'border-border-color'
                      }`}
                    >
                      {/* LIVE badge */}
                      {isLive && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg tracking-widest animate-pulse z-20">
                          LIVE
                        </div>
                      )}

                      {/* Match number label */}
                      <div className="px-3 pt-2 pb-1 border-b border-border-color/40 flex items-center justify-between">
                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                          {m.isBye ? 'BYE' : `Match ${m.matchOrder}`}
                        </span>
                        {isDone && (
                          <span className="text-[9px] text-mln-green font-bold uppercase tracking-widest">FINAL</span>
                        )}
                        {isLive && (
                          <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">In Progress</span>
                        )}
                      </div>

                      {/* Team 1 row */}
                      <div className={`flex items-center justify-between px-3 py-2.5 border-b border-border-color/50 ${
                        m.winnerId && m.winnerId === m.team1Id ? 'bg-mln-green/10' : ''
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Seed */}
                          {seed1 != null && (
                            <span className="text-[9px] text-gray-600 font-black w-4 shrink-0 text-center">{seed1}</span>
                          )}
                          <div className="w-6 h-6 bg-surface rounded flex items-center justify-center overflow-hidden shrink-0">
                            {m.team1?.logoUrl
                              ? <img src={m.team1.logoUrl} alt="" className="w-full h-full object-contain" />
                              : <div className="text-[8px] text-gray-500 font-bold">{m.team1?.name?.substring(0, 2) || 'TBD'}</div>
                            }
                          </div>
                          <span className={`text-xs font-bold uppercase truncate max-w-[130px] ${
                            m.winnerId === m.team1Id ? 'text-mln-green' : m.team1 ? 'text-white' : 'text-gray-600'
                          }`}>
                            {m.team1?.name || (m.isBye ? 'BYE' : 'TBD')}
                          </span>
                          {m.winnerId === m.team1Id && (
                            <span className="text-mln-green text-xs ml-1 shrink-0">✓</span>
                          )}
                        </div>
                        {/* Score */}
                        <span className={`text-sm font-black font-mono ml-2 shrink-0 w-5 text-right ${
                          m.winnerId === m.team1Id ? 'text-mln-green' : 'text-gray-400'
                        }`}>
                          {showScores ? m.score1 : ''}
                        </span>
                      </div>

                      {/* VS divider */}
                      <div className="flex items-center justify-center h-0 relative">
                        <span className="absolute bg-surface border border-border-color text-[8px] font-black text-gray-500 px-1.5 py-0.5 rounded z-10">
                          VS
                        </span>
                      </div>

                      {/* Team 2 row */}
                      <div className={`flex items-center justify-between px-3 py-2.5 ${
                        m.winnerId && m.winnerId === m.team2Id ? 'bg-mln-green/10' : ''
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Seed */}
                          {seed2 != null && (
                            <span className="text-[9px] text-gray-600 font-black w-4 shrink-0 text-center">{seed2}</span>
                          )}
                          <div className="w-6 h-6 bg-surface rounded flex items-center justify-center overflow-hidden shrink-0">
                            {m.team2?.logoUrl
                              ? <img src={m.team2.logoUrl} alt="" className="w-full h-full object-contain" />
                              : <div className="text-[8px] text-gray-500 font-bold">{m.team2?.name?.substring(0, 2) || 'TBD'}</div>
                            }
                          </div>
                          <span className={`text-xs font-bold uppercase truncate max-w-[130px] ${
                            m.winnerId === m.team2Id ? 'text-mln-green' : m.team2 ? 'text-white' : 'text-gray-600'
                          }`}>
                            {m.team2?.name || (m.isBye ? 'BYE' : 'TBD')}
                          </span>
                          {m.winnerId === m.team2Id && (
                            <span className="text-mln-green text-xs ml-1 shrink-0">✓</span>
                          )}
                        </div>
                        {/* Score */}
                        <span className={`text-sm font-black font-mono ml-2 shrink-0 w-5 text-right ${
                          m.winnerId === m.team2Id ? 'text-mln-green' : 'text-gray-400'
                        }`}>
                          {showScores ? m.score2 : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* MATCH EDIT MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMatch(null)}>
          <div className="bg-background border border-border-color rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black uppercase text-white mb-1">Update Match Result</h3>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-wider">
              {getRoundLabel(selectedMatch.round, totalRounds, activeTab)} · Match {selectedMatch.matchOrder}
            </p>

            <div className="space-y-6">
              {/* Team 1 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedMatch.team1?.logoUrl && (
                    <img src={selectedMatch.team1.logoUrl} alt="" className="w-8 h-8 rounded object-contain" />
                  )}
                  <span className="font-bold text-white uppercase">{selectedMatch.team1?.name || 'TBD'}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={score1}
                  onChange={e => setScore1(parseInt(e.target.value) || 0)}
                  className="bg-surface border border-border-color text-white px-3 py-2 rounded w-20 text-center font-bold text-lg"
                />
              </div>

              <div className="text-center text-gray-500 font-bold uppercase text-sm tracking-widest">VS</div>

              {/* Team 2 */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {selectedMatch.team2?.logoUrl && (
                    <img src={selectedMatch.team2.logoUrl} alt="" className="w-8 h-8 rounded object-contain" />
                  )}
                  <span className="font-bold text-white uppercase">{selectedMatch.team2?.name || 'TBD'}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={score2}
                  onChange={e => setScore2(parseInt(e.target.value) || 0)}
                  className="bg-surface border border-border-color text-white px-3 py-2 rounded w-20 text-center font-bold text-lg"
                />
              </div>

              {/* Winner */}
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

              <div className="flex gap-4 pt-2">
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
