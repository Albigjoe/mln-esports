"use client";
import { useState } from 'react';
import { getHeroImage, getPlayerImage } from '@/lib/utils';
import Link from 'next/link';
import BracketViewer from '@/components/admin/BracketViewer';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];

function scoreClr(v: number) { return v >= 8.5 ? 'text-mln-green' : v >= 6.0 ? 'text-white' : 'text-red-400'; }
function kpClr(v: number) { return v >= 70 ? 'text-mln-green' : v >= 50 ? 'text-white' : 'text-gray-500'; }
function kdaClr(v: number) { return v >= 5 ? 'text-mln-green' : v >= 3 ? 'text-white' : 'text-red-400'; }
function wrClr(v: number) { return v >= 60 ? 'text-mln-green' : v <= 40 ? 'text-red-400' : 'text-white'; }

function playerStats(games: any[]) {
  const p: Record<string, any> = {};
  games.forEach(g => {
    const tk1 = (g.picks || []).filter((pk: any) => pk.team === 'team1').reduce((s: number, pk: any) => s + (pk.kills || 0), 0);
    const tk2 = (g.picks || []).filter((pk: any) => pk.team === 'team2').reduce((s: number, pk: any) => s + (pk.kills || 0), 0);
    
    (g.picks || []).forEach((pk: any) => {
      if (!pk.playerUsername) return;
      const tn = pk.team === 'team1' ? g.team1.name : g.team2.name;
      const teamKills = pk.team === 'team1' ? tk1 : tk2;
      const key = pk.playerUsername.toLowerCase() + '|' + (tn || '');
      
      if (!p[key]) {
        p[key] = {
          player: pk.playerUsername,
          team: tn || '',
          role: pk.role || '',
          hero: pk.hero || '',
          g: 0, k: 0, d: 0, a: 0, gold: 0, dmg: 0, w: 0, score: 0, kpTotal: 0, heroes: {}, roles: {}
        };
      }
      p[key].g++;
      p[key].k += pk.kills || 0;
      p[key].d += pk.deaths || 0;
      p[key].a += pk.assists || 0;
      p[key].gold += pk.gold || 0;
      p[key].dmg += pk.damage || 0;
      
      if (pk.team === g.winner) p[key].w++;
      
      if (pk.hero) {
        p[key].heroes[pk.hero] = (p[key].heroes[pk.hero] || 0) + 1;
        if (!p[key].hero) p[key].hero = pk.hero;
      }
      if (pk.role) {
        p[key].roles[pk.role] = (p[key].roles[pk.role] || 0) + 1;
        if (!p[key].role) p[key].role = pk.role;
      }
      
      const k = pk.kills || 0, d = pk.deaths || 0, a = pk.assists || 0;
      const kp = teamKills > 0 ? Math.round((k + a) / teamKills * 100) : 0;
      p[key].score += pk.mvpScore || 0;
      p[key].kpTotal += kp;
    });
  });
  
  return Object.values(p).map((s: any) => {
    const gamesCount = Math.max(s.g, 1);
    return {
      ...s,
      kda: +(s.d > 0 ? (s.k + s.a) / s.d : s.k + s.a).toFixed(2),
      avgK: +(s.k / gamesCount).toFixed(1),
      avgD: +(s.d / gamesCount).toFixed(1),
      avgA: +(s.a / gamesCount).toFixed(1),
      avgGold: Math.round(s.gold / gamesCount),
      avgDmg: Math.round(s.dmg / gamesCount),
      avgKP: Math.round(s.kpTotal / gamesCount),
      avgScore: +(s.score / gamesCount).toFixed(1),
      wr: Math.round(s.w / gamesCount * 100),
      top: Object.entries(s.heroes).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'None',
      role: Object.entries(s.roles).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'Unknown',
    };
  });
}

function groupGamesIntoSeries(gamesList: any[]) {
  const seriesMap: Record<string, {
    id: string;
    week: number;
    team1: any;
    team2: any;
    team1Id: string;
    team2Id: string;
    boFormat: number;
    date: string;
    games: any[];
    score1: number;
    score2: number;
    createdAt: Date;
  }> = {};

  const sortedGames = [...gamesList].sort((a, b) => a.gameNumber - b.gameNumber);

  sortedGames.forEach(game => {
    const tKey = [game.team1Id, game.team2Id].sort().join('-');
    const seriesKey = `${game.tournamentId || 'default'}-${game.week}-${tKey}-${game.boFormat}`;

    if (!seriesMap[seriesKey]) {
      seriesMap[seriesKey] = {
        id: game.id,
        week: game.week,
        team1: game.team1,
        team2: game.team2,
        team1Id: game.team1Id,
        team2Id: game.team2Id,
        boFormat: game.boFormat,
        date: game.date,
        games: [],
        score1: 0,
        score2: 0,
        createdAt: new Date(game.createdAt)
      };
    }

    const series = seriesMap[seriesKey];
    series.games.push(game);

    if (game.winner === 'team1') {
      if (game.team1Id === series.team1Id) {
        series.score1++;
      } else {
        series.score2++;
      }
    } else if (game.winner === 'team2') {
      if (game.team2Id === series.team2Id) {
        series.score2++;
      } else {
        series.score1++;
      }
    }
  });

  return Object.values(seriesMap).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function isCompleted(s: any) {
  if (s.boFormat === 1) return s.games.length >= 1;
  if (s.boFormat === 2) return s.games.length >= 2;
  if (s.boFormat === 3) return s.score1 === 2 || s.score2 === 2;
  if (s.boFormat === 5) return s.score1 === 3 || s.score2 === 3;
  if (s.boFormat === 7) return s.score1 === 4 || s.score2 === 4;
  return false;
}

export default function TournamentTabs({ tournament, games, teams, players = [], bracketMatches = [] }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortField, setSortField] = useState('avgScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const seriesList = groupGamesIntoSeries(games);
  const ps = playerStats(games);
  const filteredPlayers = roleFilter === 'all' ? ps : ps.filter((p: any) => p.role === roleFilter);
  const sortedPlayers = [...filteredPlayers].sort((a: any, b: any) => {
    const v1 = a[sortField];
    const v2 = b[sortField];
    if (sortDir === 'desc') {
      return v2 - v1;
    } else {
      return v1 - v2;
    }
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Best Player per Role for Overview
  const bestPlayers = ROLES.map(role => {
    const list = ps.filter((p: any) => p.role === role);
    const sorted = [...list].sort((a, b) => b.avgScore - a.avgScore);
    return { role, mvp: sorted[0] || null };
  });

  // Calculate leading team
  const leadingTeam = () => {
    const tw: Record<string, number> = {};
    seriesList.forEach((s: any) => {
      const isComp = isCompleted(s);
      if (isComp) {
        if (s.score1 > s.score2) {
          tw[s.team1.name] = (tw[s.team1.name] || 0) + 1;
        } else if (s.score2 > s.score1) {
          tw[s.team2.name] = (tw[s.team2.name] || 0) + 1;
        }
      }
    });
    const sorted = Object.entries(tw).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : '—';
  };

  return (
    <div className="w-full">
      {/* Navigation Tabs */}
      <div className="flex border-b border-border-color mb-8 overflow-x-auto gap-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'leaderboard', label: 'Player Leaderboard' },
          { id: 'matches', label: 'Matches' },
          { id: 'teams', label: 'Teams' },
          { id: 'stats', label: 'Hero Stats' },
          { id: 'bracket', label: 'Bracket' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-bold uppercase tracking-wider text-sm transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'text-mln-green border-b-2 border-mln-green bg-surface' : 'text-gray-400 hover:text-white hover:bg-surface-hover'
            }`}>{tab.label}</button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Dynamic Banner */}
            <div className="dash-hero relative overflow-hidden bg-gradient-to-br from-surface to-background border border-border-color p-8 rounded-2xl shadow-lg">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[140px] font-black text-mln-green/5 tracking-widest pointer-events-none select-none">AFL</div>
              <div className="relative z-10">
                <div className="text-xs text-mln-green font-bold uppercase tracking-[4px] mb-2">AFL Nigeria · Official stats</div>
                <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider mb-6">{tournament.name}</h2>
                <div className="flex gap-6 md:gap-12 flex-wrap">
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono">{seriesList.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Total Series</div></div>
                  <div className="w-px bg-border-color hidden md:block"></div>
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono">{teams.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Teams</div></div>
                  <div className="w-px bg-border-color hidden md:block"></div>
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono">{ps.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Active Players</div></div>
                  <div className="w-px bg-border-color hidden md:block"></div>
                  <div className="text-center"><div className="text-4xl font-black text-mln-green font-mono text-xl md:text-2xl pt-2">{leadingTeam()}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Leader</div></div>
                </div>
              </div>
            </div>

            {/* Role MVPs */}
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Best Player per Role</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {bestPlayers.map(({ role, mvp }) => (
                  <div key={role} className="bg-surface border border-border-color rounded-xl p-4 text-center hover:border-mln-green/40 transition-colors flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="text-[10px] text-mln-green font-bold uppercase tracking-[2px] mb-2">{role}</div>
                      {mvp ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-border-color overflow-hidden shrink-0">
                              <img src={getPlayerImage(mvp.player, players)} alt={mvp.player} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <Link href={`/players/${mvp.player}`} className="text-lg font-black text-white line-clamp-1 leading-none hover:text-mln-green transition-colors">{mvp.player}</Link>
                              {(() => {
                                const teamId = teams.find((t: any) => t.name.toLowerCase() === mvp.team.toLowerCase())?.id;
                                return teamId ? (
                                  <Link href={`/teams/${teamId}`} className="text-[10px] text-gray-400 hover:text-mln-green mt-1 line-clamp-1 font-bold uppercase tracking-widest block">{mvp.team}</Link>
                                ) : (
                                  <div className="text-[10px] text-gray-400 mt-1 line-clamp-1 font-bold uppercase tracking-widest">{mvp.team}</div>
                                );
                              })()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500 text-sm py-4">No data</div>
                      )}
                    </div>
                    {mvp && (
                      <div className="mt-4 pt-4 border-t border-border-color/60">
                        <div className="text-3xl font-black text-mln-green font-mono leading-none">{mvp.avgScore}</div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Avg Score</div>
                        <div className="text-[10px] text-gray-400 mt-2">{mvp.avgKP}% KP · {mvp.g} GP</div>
                        <span className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[9px] font-bold px-2 py-0.5 rounded mt-2 uppercase">{mvp.role}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Match Series Log */}
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Recent Match Series Log</h3>
              {seriesList.length === 0 ? (
                <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500">No match series recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {seriesList.slice(0, 5).map((s: any) => {
                    const isComp = isCompleted(s);
                    return (
                      <div key={s.id} className="bg-surface border border-border-color hover:border-mln-green/30 transition-colors rounded-xl overflow-hidden p-6 flex flex-col items-center gap-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                          <div className="flex-1 text-center md:text-right">
                            <Link href={`/teams/${s.team1Id}`} className={`font-black text-xl block md:inline hover:text-mln-green transition-colors ${isComp && s.score1 > s.score2 ? 'text-mln-green' : 'text-white'}`}>{s.team1.name}</Link>
                            {isComp && s.score1 > s.score2 && <span className="ml-0 md:ml-3 mt-2 md:mt-0 inline-block text-[10px] bg-mln-green text-black px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">WINNER</span>}
                          </div>
                          
                          <div className="flex flex-col items-center justify-center text-center">
                            <span className="text-xs bg-surface-hover border border-border-color/60 px-3 py-1 rounded-full text-yellow-400 font-bold font-mono">Week {s.week} · BO{s.boFormat}</span>
                            <div className="text-3xl font-black text-white font-mono mt-2 tracking-widest">{s.score1} : {s.score2}</div>
                            <span className="text-gray-500 text-[10px] mt-1 font-bold font-mono uppercase tracking-wider">{isComp ? 'Completed' : 'In Progress'}</span>
                          </div>

                          <div className="flex-1 text-center md:text-left">
                            {isComp && s.score2 > s.score1 && <span className="mr-0 md:mr-3 mt-2 md:mt-0 inline-block text-[10px] bg-mln-green text-black px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">WINNER</span>}
                            <Link href={`/teams/${s.team2Id}`} className={`font-black text-xl block md:inline hover:text-mln-green transition-colors ${isComp && s.score2 > s.score1 ? 'text-mln-green' : 'text-white'}`}>{s.team2.name}</Link>
                          </div>
                        </div>

                        {/* Series individual games */}
                        <div className="w-full border-t border-border-color/60 pt-4 mt-2">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 font-mono">Games in Series:</div>
                          <div className="flex flex-wrap gap-2">
                            {s.games.map((g: any) => (
                              <Link href={`/matches/${g.id}`} key={g.id} className="bg-background border border-border-color hover:border-mln-green/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all">
                                <span className="text-mln-green font-bold">Game {g.gameNumber}</span>
                                <span className="text-gray-500 font-medium">({g.duration || 'N/A'})</span>
                                <span className="text-[10px] bg-surface px-1.5 py-0.5 rounded text-gray-400 font-bold uppercase">
                                  {g.winner === 'team1' ? 'Winner: ' + g.team1.name : g.winner === 'team2' ? 'Winner: ' + g.team2.name : 'TBD'}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLAYER LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Aggregated Player Performance</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {['all', ...ROLES].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border whitespace-nowrap ${
                      roleFilter === r ? 'bg-mln-green text-black border-mln-green' : 'bg-surface text-gray-400 border-border-color hover:text-white'
                    }`}>{r === 'all' ? 'All Roles' : r}</button>
                ))}
              </div>
            </div>

            {sortedPlayers.length === 0 ? (
              <div className="bg-surface border border-border-color rounded-xl p-12 text-center text-gray-500">No players found. Enter games with stats to see them here!</div>
            ) : (
              <div className="bg-surface border border-border-color rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-400 min-w-[600px]">
                    <thead className="bg-background text-[11px] uppercase text-white border-b border-border-color">
                      <tr>
                        <th className="px-3 md:px-6 py-4 text-center font-bold">Rank</th>
                        <th className="px-3 md:px-6 py-4 cursor-pointer hover:text-mln-green" onClick={() => toggleSort('player')}>Player {sortField === 'player' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 hidden sm:table-cell">Team</th>
                        <th className="px-4 py-4 hidden md:table-cell">Role</th>
                        <th className="px-2 md:px-6 py-4 text-center cursor-pointer hover:text-mln-green" onClick={() => toggleSort('g')}>GP {sortField === 'g' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-2 md:px-6 py-4 text-center cursor-pointer hover:text-mln-green" onClick={() => toggleSort('avgScore')}>Score {sortField === 'avgScore' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden sm:table-cell" onClick={() => toggleSort('avgKP')}>KP% {sortField === 'avgKP' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-2 md:px-6 py-4 text-center cursor-pointer hover:text-mln-green" onClick={() => toggleSort('kda')}>KDA {sortField === 'kda' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center hidden md:table-cell">Avg K/D/A</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden md:table-cell" onClick={() => toggleSort('avgDmg')}>Avg DMG {sortField === 'avgDmg' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden lg:table-cell" onClick={() => toggleSort('avgGold')}>Avg Gold {sortField === 'avgGold' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 text-center cursor-pointer hover:text-mln-green hidden sm:table-cell" onClick={() => toggleSort('wr')}>Win Rate {sortField === 'wr' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                        <th className="px-4 py-4 hidden sm:table-cell">Top Hero</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/60">
                      {sortedPlayers.map((p: any, i: number) => {
                        const rankBadge = (rank: number) => {
                          if (rank === 1) return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs font-black">#1</span>;
                          if (rank === 2) return <span className="bg-slate-300/10 text-slate-300 border border-slate-300/30 px-2 py-0.5 rounded text-xs font-black">#2</span>;
                          if (rank === 3) return <span className="bg-amber-600/10 text-amber-500 border border-amber-600/30 px-2 py-0.5 rounded text-xs font-black">#3</span>;
                          return <span className="text-gray-500 font-mono text-xs font-bold">#{rank}</span>;
                        };
                        return (
                          <tr key={p.player + '|' + p.team} className="hover:bg-surface-hover/40 transition-colors">
                            <td className="px-3 md:px-6 py-4 text-center">
                              {rankBadge(i + 1)}
                            </td>
                            <td className="px-3 md:px-6 py-4 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full border border-border-color overflow-hidden shrink-0 hidden md:block">
                                <img src={getPlayerImage(p.player, players)} alt={p.player} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <Link href={`/players/${p.player}`} className="font-black text-white text-sm md:text-base hover:text-mln-green transition-colors">{p.player}</Link>
                                {(() => {
                                  const teamId = teams.find((t: any) => t.name.toLowerCase() === p.team.toLowerCase())?.id;
                                  return teamId ? (
                                    <Link href={`/teams/${teamId}`} className="block sm:hidden text-[10px] text-gray-500 hover:text-mln-green font-bold mt-0.5">{p.team}</Link>
                                  ) : (
                                    <div className="block sm:hidden text-[10px] text-gray-500 font-bold mt-0.5">{p.team}</div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-gray-300 font-semibold hidden sm:table-cell">
                              {(() => {
                                const teamId = teams.find((t: any) => t.name.toLowerCase() === p.team.toLowerCase())?.id;
                                return teamId ? (
                                  <Link href={`/teams/${teamId}`} className="hover:text-mln-green transition-colors">{p.team}</Link>
                                ) : p.team;
                              })()}
                            </td>
                            <td className="px-4 py-4 hidden md:table-cell">
                              <span className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">{p.role}</span>
                            </td>
                            <td className="px-2 md:px-6 py-4 text-center font-mono text-xs md:text-sm">{p.g}</td>
                            <td className={`px-2 md:px-6 py-4 text-center font-mono font-black text-sm md:text-base ${scoreClr(p.avgScore)}`}>{p.avgScore}</td>
                            <td className={`px-4 py-4 text-center font-mono font-bold hidden sm:table-cell ${kpClr(p.avgKP)}`}>{p.avgKP}%</td>
                            <td className={`px-2 md:px-6 py-4 text-center font-mono font-bold text-xs md:text-sm ${kdaClr(p.kda)}`}>{p.kda}</td>
                            <td className="px-4 py-4 text-center font-mono text-xs hidden md:table-cell">
                              <span className="text-mln-green font-bold">{p.avgK}</span>
                              <span className="text-gray-600 mx-0.5">/</span>
                              <span className="text-red-400 font-bold">{p.avgD}</span>
                              <span className="text-gray-600 mx-0.5">/</span>
                              <span className="text-cyan-400 font-bold">{p.avgA}</span>
                            </td>
                            <td className="px-4 py-4 text-center font-mono text-yellow-400 font-bold hidden md:table-cell">{p.avgDmg > 0 ? (p.avgDmg / 1000).toFixed(0) + 'K' : '-'}</td>
                            <td className="px-4 py-4 text-center font-mono text-gray-300 hidden lg:table-cell">{p.avgGold > 0 ? p.avgGold.toLocaleString() : '-'}</td>
                            <td className={`px-4 py-4 text-center font-mono font-bold hidden sm:table-cell ${wrClr(p.wr)}`}>{p.wr}%</td>
                            <td className="px-4 py-4 font-semibold text-white hidden sm:table-cell">{p.top}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MATCHES LOG TAB */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Match Series & Game Details</h3>
            {seriesList.length === 0 ? (
              <p className="text-gray-400">No match series recorded yet.</p>
            ) : (
              seriesList.map((s: any) => {
                const isComp = isCompleted(s);
                return (
                  <div key={s.id} className="bg-surface border border-border-color rounded-xl overflow-hidden shadow-lg p-6 space-y-6">
                    {/* Series Header Card */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border-color/60">
                      <div className="flex-1 text-center md:text-right">
                        <Link href={`/teams/${s.team1Id}`} className={`text-2xl font-black hover:text-mln-green transition-colors uppercase ${isComp && s.score1 > s.score2 ? 'text-mln-green' : 'text-white'}`}>{s.team1.name}</Link>
                        {isComp && s.score1 > s.score2 && <span className="text-[10px] bg-mln-green/20 text-mln-green border border-mln-green/40 px-2 py-0.5 rounded font-bold mt-2 md:mt-0 md:ml-3 inline-block">SERIES WINNER</span>}
                      </div>
                      
                      <div className="flex flex-col items-center justify-center text-center shrink-0 px-6 py-2 bg-background border border-border-color rounded-xl min-w-[140px]">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Week {s.week} · BO{s.boFormat}</span>
                        <div className="text-3xl font-black text-white font-mono mt-1">{s.score1} : {s.score2}</div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded mt-1.5 ${isComp ? 'bg-mln-green/10 text-mln-green' : 'bg-yellow-500/10 text-yellow-400'}`}>
                          {isComp ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <div className="flex-1 text-center md:text-left">
                        <Link href={`/teams/${s.team2Id}`} className={`text-2xl font-black hover:text-mln-green transition-colors uppercase ${isComp && s.score2 > s.score1 ? 'text-mln-green' : 'text-white'}`}>{s.team2.name}</Link>
                        {isComp && s.score2 > s.score1 && <span className="text-[10px] bg-mln-green/20 text-mln-green border border-mln-green/40 px-2 py-0.5 rounded font-bold mt-2 md:mt-0 md:mr-3 inline-block">SERIES WINNER</span>}
                      </div>
                    </div>

                    {/* Games Inside Series */}
                    <div className="space-y-4">
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">Series Games:</div>
                      {s.games.map((g: any) => {
                        const t1Picks = (g.picks || []).filter((p: any) => p.team === 'team1');
                        const t2Picks = (g.picks || []).filter((p: any) => p.team === 'team2');
                        const t1Bans = (g.bans || []).filter((b: any) => b.team === 'team1');
                        const t2Bans = (g.bans || []).filter((b: any) => b.team === 'team2');
                        return (
                          <div key={g.id} className="bg-background/40 border border-border-color/80 rounded-lg overflow-hidden">
                            {/* Game Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-background border-b border-border-color text-xs gap-3">
                              <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                                <span className="text-yellow-400 font-bold uppercase tracking-wider font-mono">Game {g.gameNumber}</span>
                                <span className="text-gray-500 font-mono">Duration: {g.duration || 'N/A'}</span>
                                {g.date && <span className="text-gray-500 font-mono">{g.date}</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-gray-400">Winner: <strong className="text-mln-green uppercase font-mono">{g.winner === 'team1' ? g.team1.name : g.winner === 'team2' ? g.team2.name : 'TBD'}</strong></span>
                                <Link href={`/matches/${g.id}`} className="text-xs bg-mln-green/10 text-mln-green px-3 py-1.5 rounded-md hover:bg-mln-green hover:text-black transition-all uppercase font-bold tracking-wider font-mono text-center">
                                  Scoreboard &rarr;
                                </Link>
                              </div>
                            </div>

                            {/* Picks & Bans Mini View */}
                            {(t1Bans.length > 0 || t2Bans.length > 0 || t1Picks.length > 0 || t2Picks.length > 0) && (
                              <div className="flex flex-col md:grid md:grid-cols-2 gap-6 p-5 text-xs">
                                <div className="space-y-3">
                                  {t1Bans.length > 0 && (
                                    <div>
                                      <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2 border-b border-red-500/20 pb-1">Bans &middot; {g.team1.name}</div>
                                      <div className="flex flex-wrap gap-2">
                                        {t1Bans.map((b: any) => (
                                          <div key={b.id} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 pr-3 rounded-md overflow-hidden shadow-sm">
                                            <img referrerPolicy="no-referrer" src={getHeroImage(b.hero)} alt={b.hero} className="w-6 h-6 object-cover" />
                                            <span className="scale-95 font-medium truncate max-w-[100px]">{b.hero}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {t1Picks.length > 0 && (
                                    <div>
                                      <div className="text-[10px] text-mln-green font-bold uppercase tracking-widest mb-2 border-b border-mln-green/20 pb-1">Picks &middot; {g.team1.name}</div>
                                      <div className="flex flex-wrap gap-2">
                                        {t1Picks.map((p: any) => (
                                          <div key={p.id} className="flex items-center gap-1.5 bg-mln-green/10 border border-mln-green/30 text-mln-green pr-3 rounded-md overflow-hidden shadow-sm">
                                            <img referrerPolicy="no-referrer" src={getHeroImage(p.hero)} alt={p.hero} className="w-6 h-6 object-cover" />
                                            <span className="scale-95 font-medium truncate max-w-[150px]">{p.hero}{p.playerUsername ? ` (${p.playerUsername})` : ''}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {t2Bans.length > 0 && (
                                    <div>
                                      <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-2 border-b border-red-500/20 pb-1">Bans &middot; {g.team2.name}</div>
                                      <div className="flex flex-wrap gap-2">
                                        {t2Bans.map((b: any) => (
                                          <div key={b.id} className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 pr-3 rounded-md overflow-hidden shadow-sm">
                                            <img referrerPolicy="no-referrer" src={getHeroImage(b.hero)} alt={b.hero} className="w-6 h-6 object-cover" />
                                            <span className="scale-95 font-medium truncate max-w-[100px]">{b.hero}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {t2Picks.length > 0 && (
                                    <div>
                                      <div className="text-[10px] text-mln-green font-bold uppercase tracking-widest mb-2 border-b border-mln-green/20 pb-1">Picks &middot; {g.team2.name}</div>
                                      <div className="flex flex-wrap gap-2">
                                        {t2Picks.map((p: any) => (
                                          <div key={p.id} className="flex items-center gap-1.5 bg-mln-green/10 border border-mln-green/30 text-mln-green pr-3 rounded-md overflow-hidden shadow-sm">
                                            <img referrerPolicy="no-referrer" src={getHeroImage(p.hero)} alt={p.hero} className="w-6 h-6 object-cover" />
                                            <span className="scale-95 font-medium truncate max-w-[150px]">{p.hero}{p.playerUsername ? ` (${p.playerUsername})` : ''}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PARTICIPATING TEAMS TAB */}
        {activeTab === 'teams' && (
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6 border-l-4 border-mln-green pl-3">Participating Teams ({teams.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {teams.map((team: any) => (
                <Link href={`/teams/${team.id}`} key={team.id} className="bg-surface border border-border-color rounded-xl p-6 text-center hover:border-mln-green/30 hover:scale-[1.02] transition-all duration-300 block">
                  <div className="w-20 h-20 mx-auto bg-background rounded-full border border-border-color flex items-center justify-center mb-4 overflow-hidden relative shadow-inner">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">AFL</span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-white line-clamp-1 hover:text-mln-green transition-colors">{team.name}</h4>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">AFL Nigeria Season</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* HERO STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Hero Pick & Ban Statistics</h3>
            {games.length === 0 ? (
              <p className="text-gray-400">No game data yet.</p>
            ) : (
              <HeroStatsTable games={games} />
            )}
          </div>
        )}

        {/* BRACKET TAB */}
        {activeTab === 'bracket' && (
          <div className="w-full">
            {(() => {
              const showChallonge = tournament?.id === 'cmpbswve2000170oqkuet2sva' || tournament?.name?.toLowerCase().includes('afl');
              
              if (showChallonge) {
                return (
                  <div className="w-full rounded-2xl overflow-hidden shadow-2xl bg-surface border border-border-color h-[700px] md:h-[900px] relative mt-2">
                    <iframe 
                      src={`https://challonge.com/${tournament?.challongeId || 'i8rknz8z'}/module?multiplier=1.0&match_width_multiplier=1.0&show_standings=1&theme=1`} 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="auto" 
                      allowTransparency={true} 
                      className="absolute inset-0 w-full h-full"
                    ></iframe>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Tournament Brackets & Fixtures</h3>
                  </div>
                  <div className="bg-surface border border-border-color rounded-2xl overflow-x-auto shadow-2xl p-6 min-h-[400px]">
                    {bracketMatches.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">Bracket has not been generated for this tournament yet.</div>
                    ) : (
                      <BracketViewer matches={bracketMatches} isAdmin={false} />
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroStatsTable({ games }: { games: any[] }) {
  const [sortKey, setSortKey] = useState<string>('presence');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const heroMap: Record<string, { picks: number; bans: number; wins: number }> = {};
  games.forEach((g: any) => {
    (g.bans || []).forEach((b: any) => {
      if (!b.hero) return;
      if (!heroMap[b.hero]) heroMap[b.hero] = { picks: 0, bans: 0, wins: 0 };
      heroMap[b.hero].bans++;
    });
    (g.picks || []).forEach((p: any) => {
      if (!p.hero) return;
      if (!heroMap[p.hero]) heroMap[p.hero] = { picks: 0, bans: 0, wins: 0 };
      heroMap[p.hero].picks++;
      if (p.team === g.winner) heroMap[p.hero].wins++;
    });
  });
  
  const gamesWithDraft = games.filter(g => g.picks?.length > 0 || g.bans?.length > 0).length;
  const validGamesCount = Math.max(gamesWithDraft, 1);

  const heroes = Object.entries(heroMap).map(([hero, s]) => ({
    hero, ...s,
    wr: s.picks > 0 ? Math.round(s.wins / s.picks * 100) : 0,
    presence: Math.round((s.picks + s.bans) / validGamesCount * 100),
  }));

  const sortedHeroes = [...heroes].sort((a: any, b: any) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortTh = ({ col, label, className = '' }: { col: string; label: string; className?: string }) => (
    <th
      className={`px-2 md:px-6 py-4 cursor-pointer select-none hover:text-mln-green transition-colors ${className}`}
      onClick={() => toggleSort(col)}
    >
      <div className="flex items-center gap-1 justify-center sm:justify-start">
        {label}
        <span className="text-[10px] opacity-60">
          {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
        </span>
      </div>
    </th>
  );

  if (heroes.length === 0) return <p className="text-gray-400">No hero data yet.</p>;

  return (
    <div className="bg-surface border border-border-color rounded-2xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm text-gray-400 min-w-[600px]">
          <thead className="bg-background text-xs uppercase text-white border-b border-border-color">
            <tr>
              <SortTh col="hero" label="Hero" />
              <SortTh col="picks" label="Picks" className="text-center" />
              <SortTh col="bans" label="Bans" className="text-center" />
              <SortTh col="wins" label="Wins" className="text-center hidden sm:table-cell" />
              <SortTh col="wr" label="Win Rate" className="text-center" />
              <SortTh col="presence" label="Presence" className="text-center hidden md:table-cell" />
              <th className="px-4 py-4 hidden sm:table-cell">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/60">
            {sortedHeroes.map(h => {
              const mb = h.bans >= 3;
              const mp = h.picks >= 3 && h.wr >= 60;
              return (
                <tr key={h.hero} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="px-3 md:px-6 py-4 flex items-center gap-3">
                    <img referrerPolicy="no-referrer" src={getHeroImage(h.hero)} alt={h.hero} className="w-8 h-8 rounded-md border border-border-color object-cover hidden sm:block" />
                    <span className="font-black text-white text-sm md:text-base">{h.hero}</span>
                  </td>
                  <td className="px-2 md:px-6 py-4 text-center text-mln-green font-bold font-mono text-sm md:text-base">{h.picks}</td>
                  <td className="px-2 md:px-6 py-4 text-center text-red-400 font-bold font-mono text-sm md:text-base">{h.bans}</td>
                  <td className="px-4 py-4 text-center font-mono hidden sm:table-cell">{h.wins}</td>
                  <td className={`px-2 md:px-6 py-4 text-center font-mono font-black text-sm md:text-base ${h.picks > 0 ? (h.wr >= 60 ? 'text-mln-green' : h.wr <= 40 ? 'text-red-400' : 'text-white') : 'text-gray-500'}`}>
                    {h.picks > 0 ? h.wr + '%' : 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-20 bg-border-color rounded-full h-2"><div className="bg-mln-green h-2 rounded-full shadow-[0_0_8px_rgba(0,200,83,0.5)]" style={{ width: `${Math.min(h.presence, 100)}%` }}></div></div>
                      <span className="text-xs font-mono font-bold text-gray-300">{h.presence}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    {mb && <span className="inline-block bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase mr-1">Must Ban</span>}
                    {mp && <span className="inline-block bg-mln-green/10 border border-mln-green/30 text-mln-green text-[10px] font-bold px-2 py-0.5 rounded uppercase">Must Pick</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
