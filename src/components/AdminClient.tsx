"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import NewsTab from './admin/NewsTab';
import StaffTab from './admin/StaffTab';
import TournamentsTab from './admin/TournamentsTab';
import TeamsTab from './admin/TeamsTab';
import PlayersTab from './admin/PlayersTab';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];
const HEROES = ["Aamon","Akai","Aldous","Alice","Alpha","Alucard","Angela","Argus","Arlott","Atlas","Aulus","Aurora","Badang","Balmond","Bane","Barats","Baxia","Beatrix","Belerick","Benedetta","Brody","Bruno","Carmilla","Cecilion","Chang'e","Chip","Chou","Cici","Claude","Clint","Cyclops","Diggie","Dyrroth","Edith","Esmeralda","Estes","Eudora","Fanny","Faramis","Floryn","Franco","Fredrinn","Freya","Gatotkaca","Gloo","Gord","Granger","Grock","Guinevere","Gusion","Hanabi","Hanzo","Harith","Harley","Hayabusa","Helcurt","Hilda","Hylos","Irithel","Ixia","Jawhead","Johnson","Joy","Julian","Kadita","Kagura","Kaja","Kalea","Karina","Karrie","Khaleed","Khufra","Kimmy","Lancelot","Lapu-Lapu","Layla","Leomord","Lesley","Ling","Lolita","Lukas","Lunox","Luo Yi","Lylia","Marcel","Martis","Masha","Mathilda","Melissa","Minotaur","Minsitthar","Miya","Moskov","Nana","Natalia","Natan","Nolan","Novaria","Obsidia","Odette","Paquito","Pharsa","Phoveus","Popol and Kupa","Rafaela","Roger","Ruby","Saber","Selena","Silvanna","Sora","Sun","Suyou","Terizla","Thamuz","Tigreal","Uranus","Vale","Valentina","Valir","Vexana","Wanwan","X.Borg","Xavier","Yi Sun-shin","Yin","Yu Zhong","Yve","Zetian","Zhask","Zhuxin","Zilong"];

function emptyPick() {
  return { hero: '', playerUsername: '', role: '', kills: '', deaths: '', assists: '', gold: '', damage: '', savages: '0', maniacs: '0' };
}

type TabType = 'dashboard' | 'add' | 'tournaments' | 'teams' | 'players' | 'news' | 'staff' | 'settings';

function groupGamesIntoSeries(gamesList: any[]) {
  const seriesMap: Record<string, {
    id: string;
    tournamentId: string;
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
        tournamentId: game.tournamentId,
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

function getSeriesStatus(s: any) {
  const count = s.games.length;
  if (s.boFormat === 1) {
    return { completed: count >= 1, message: 'Complete' };
  }
  if (s.boFormat === 2) {
    if (count < 2) return { completed: false, message: `Needs ${2 - count} more game(s)` };
    return { completed: true, message: 'Complete' };
  }
  if (s.boFormat === 3) {
    if (s.score1 === 2 || s.score2 === 2) return { completed: true, message: 'Complete' };
    return { completed: false, message: `Needs more games (currently ${s.score1}:${s.score2})` };
  }
  if (s.boFormat === 5) {
    if (s.score1 === 3 || s.score2 === 3) return { completed: true, message: 'Complete' };
    return { completed: false, message: `Needs more games (currently ${s.score1}:${s.score2})` };
  }
  if (s.boFormat === 7) {
    if (s.score1 === 4 || s.score2 === 4) return { completed: true, message: 'Complete' };
    return { completed: false, message: `Needs more games (currently ${s.score1}:${s.score2})` };
  }
  return { completed: false, message: 'Unknown Format' };
}

export default function AdminClient({ session, tournaments, teams, recentGames, posts, staffUsers, players }: any) {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>('dashboard');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const adminSeriesList = groupGamesIntoSeries(recentGames);

  const startNextGameInSeries = (s: any) => {
    setTournamentId(s.tournamentId);
    setWeek(String(s.week));
    setTeam1Id(s.team1Id);
    setTeam2Id(s.team2Id);
    setBoFormat(String(s.boFormat));
    setGameNumber(String(s.games.length + 1));
    setDate(s.date || new Date().toISOString().split('T')[0]);
    setTab('add');
  };

  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id || '');
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [winner, setWinner] = useState('');
  const [week, setWeek] = useState('1');
  const [gameNumber, setGameNumber] = useState('1');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [boFormat, setBoFormat] = useState('1');
  const [duration, setDuration] = useState('15:00');
  const [bans1, setBans1] = useState(['', '', '', '', '']);
  const [bans2, setBans2] = useState(['', '', '', '', '']);
  const [picks1, setPicks1] = useState(Array(5).fill(null).map(emptyPick));
  const [picks2, setPicks2] = useState(Array(5).fill(null).map(emptyPick));

  const resetForm = () => {
    setTeam1Id(''); setTeam2Id(''); setWinner(''); setWeek('1'); setGameNumber('1');
    setBoFormat('1'); setDuration('15:00');
    setDate(new Date().toISOString().split('T')[0]);
    setBans1(['','','','','']); setBans2(['','','','','']);
    setPicks1(Array(5).fill(null).map(emptyPick)); setPicks2(Array(5).fill(null).map(emptyPick));
    setMsg('');
  };

  const handleSave = async () => {
    if (!team1Id || !team2Id) { setMsg('Select both teams'); return; }
    if (team1Id === team2Id) { setMsg('Teams must be different'); return; }
    if (!winner) { setMsg('Select a winner'); return; }
    setSaving(true); setMsg('');
    const bans = [
      ...bans1.filter(h => h.trim()).map((h, i) => ({ team: 'team1', hero: h, banOrder: i + 1 })),
      ...bans2.filter(h => h.trim()).map((h, i) => ({ team: 'team2', hero: h, banOrder: i + 1 })),
    ];
    const picks = [
      ...picks1.filter(p => p.hero.trim()).map((p, i) => ({ team: 'team1', ...p, pickOrder: i + 1 })),
      ...picks2.filter(p => p.hero.trim()).map((p, i) => ({ team: 'team2', ...p, pickOrder: i + 1 })),
    ];
    try {
      const res = await fetch('/api/games', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId, team1Id, team2Id, winner, week, gameNumber, date, boFormat, duration, bans, picks }),
      });
      const data = await res.json();
      if (data.success) { setMsg('✓ Game saved!'); resetForm(); router.refresh(); setTimeout(() => setTab('dashboard'), 1500); }
      else { setMsg('Error: ' + data.error); }
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this game?')) return;
    await fetch(`/api/games/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const team1Name = teams.find((t: any) => t.id === team1Id)?.name || 'Team 1';
  const team2Name = teams.find((t: any) => t.id === team2Id)?.name || 'Team 2';

  const tabs: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: '📊 Dashboard' },
    { key: 'add', label: '➕ Games' },
    { key: 'tournaments', label: '🏆 Tournaments' },
    { key: 'teams', label: '🛡️ Teams' },
    { key: 'players', label: '🎮 Players' },
    { key: 'news', label: '📰 News' },
    { key: 'staff', label: '👥 Staff' },
    { key: 'settings', label: '⚙ Settings' },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border-color mb-8 gap-4 pb-2 md:pb-0">
        <div className="flex overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-5 py-4 font-bold uppercase tracking-wider text-sm transition-colors whitespace-nowrap ${tab === t.key ? 'text-mln-green border-b-2 border-mln-green bg-surface' : 'text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 px-6 md:px-0">
          <span className="text-xs text-gray-400">Signed in as <strong className="text-white">{session?.user?.name || session?.user?.email}</strong></span>
          <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && (
        <div>
          <div className="bg-gradient-to-r from-surface to-background border border-border-color rounded-xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[100px] font-black text-mln-green/5 tracking-wider pointer-events-none">MLN</div>
            <div className="text-xs text-mln-green font-bold uppercase tracking-[4px] mb-2">Mobile Legends Nigeria · Admin</div>
            <div className="text-3xl font-black text-white uppercase tracking-wider mb-4">Season Stats Dashboard</div>
            <div className="flex gap-8 flex-wrap">
              <div className="text-center"><div className="text-4xl font-black text-mln-green">{recentGames.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Games</div></div>
              <div className="w-px bg-border-color"></div>
              <div className="text-center"><div className="text-4xl font-black text-mln-green">{teams.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Teams</div></div>
              <div className="w-px bg-border-color"></div>
              <div className="text-center"><div className="text-4xl font-black text-mln-green">{tournaments.length}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Tournaments</div></div>
              <div className="w-px bg-border-color"></div>
              <div className="text-center"><div className="text-4xl font-black text-mln-green">{posts?.length || 0}</div><div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Posts</div></div>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Match Series & Completion Validation</h3>
          <div className="space-y-4 mb-8">
            {adminSeriesList.length === 0 ? (
              <div className="bg-surface border border-border-color rounded-xl p-8 text-center text-gray-500">No match series found. Add a game to begin!</div>
            ) : adminSeriesList.map((s: any) => {
              const status = getSeriesStatus(s);
              return (
                <div key={s.id} className="bg-surface border border-border-color rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 px-2 py-0.5 rounded text-xs font-bold font-mono">W{s.week}</span>
                      <span className="text-xs text-gray-500 font-bold uppercase">BO{s.boFormat} Series</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${status.completed ? 'bg-mln-green/20 text-mln-green' : 'bg-red-500/20 text-red-400'}`}>
                        {status.message}
                      </span>
                    </div>
                    <div className="text-lg font-black text-white">
                      {s.team1.name} <span className="text-mln-green font-mono">{s.score1} : {s.score2}</span> {s.team2.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Logged Games: {s.games.map((g: any) => `Game ${g.gameNumber}`).join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!status.completed && (
                      <button onClick={() => startNextGameInSeries(s)} className="bg-mln-green hover:bg-mln-green-dark text-black px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition-colors">
                        + Add Game {s.games.length + 1}
                      </button>
                    )}
                    <button onClick={() => {
                      if(confirm('Delete all games in this series?')) {
                        s.games.forEach(async (g: any) => {
                          await fetch(`/api/games/${g.id}`, { method: 'DELETE' });
                        });
                        setTimeout(() => router.refresh(), 1000);
                      }
                    }} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors">
                      Delete Series
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">All Individual Game Entries</h3>
          <div className="bg-background border border-border-color rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-surface text-xs uppercase text-white">
                <tr><th className="px-6 py-4">Week</th><th className="px-6 py-4">Game #</th><th className="px-6 py-4">Team 1</th><th className="px-6 py-4 text-center">VS</th><th className="px-6 py-4">Team 2</th><th className="px-6 py-4">Winner</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {recentGames.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No games yet. Click &quot;Add Game&quot; to start!</td></tr>
                ) : recentGames.map((g: any) => (
                  <tr key={g.id} className="border-b border-border-color hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4"><span className="bg-yellow-600/20 text-yellow-400 border border-yellow-600/40 px-2 py-0.5 rounded text-xs font-bold">W{g.week}</span></td>
                    <td className="px-6 py-4 font-mono font-bold text-white text-xs">Game {g.gameNumber} (BO{g.boFormat})</td>
                    <td className={`px-6 py-4 font-bold ${g.winner === 'team1' ? 'text-mln-green' : 'text-white'}`}>{g.team1.name}</td>
                    <td className="px-6 py-4 text-center text-gray-600">vs</td>
                    <td className={`px-6 py-4 font-bold ${g.winner === 'team2' ? 'text-mln-green' : 'text-white'}`}>{g.team2.name}</td>
                    <td className="px-6 py-4 text-mln-green font-bold">{g.winner === 'team1' ? g.team1.name : g.winner === 'team2' ? g.team2.name : 'TBD'}</td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDelete(g.id)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD GAME TAB */}
      {tab === 'add' && (
        <div className="space-y-6">
          <div className="bg-surface border border-mln-green/30 rounded-xl p-6 shadow-[0_0_20px_rgba(0,200,83,0.1)]">
            <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-3">How to Enter a Game</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[['01','Set week, game number, date and select both teams'],['02','Enter all 5 bans for each team'],['03','Fill in hero, username, role, K/D/A/Gold/DMG'],['04','Select winner and click Save']].map(([n,t]) => (
                <div key={n} className="bg-background border-l-2 border-mln-green rounded p-3">
                  <span className="text-mln-green text-xl font-black block mb-1">{n}</span>
                  <span className="text-gray-300 text-sm">{t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border-color rounded-xl p-6">
            <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Match Info</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Tournament</label><select value={tournamentId} onChange={e => setTournamentId(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none">{tournaments.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Week</label><input type="number" min="1" value={week} onChange={e => setWeek(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Game #</label><input type="number" min="1" max="7" value={gameNumber} onChange={e => setGameNumber(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">BO Format</label><select value={boFormat} onChange={e => setBoFormat(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="1">BO1</option><option value="2">BO2</option><option value="3">BO3</option><option value="5">BO5</option><option value="7">BO7</option></select></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Duration</label><input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 15:30" className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Team 1</label><select value={team1Id} onChange={e => setTeam1Id(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="">Select Team 1</option>{teams.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Team 2</label><select value={team2Id} onChange={e => setTeam2Id(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="">Select Team 2</option>{teams.map((t:any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Winner</label><select value={winner} onChange={e => setWinner(e.target.value)} className="w-full bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none"><option value="">Select Winner</option><option value="none">None (Upcoming / Draw)</option><option value="team1">{team1Name}</option><option value="team2">{team2Name}</option></select></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BanSection label={`Bans · ${team1Name}`} bans={bans1} setBans={setBans1} />
            <BanSection label={`Bans · ${team2Name}`} bans={bans2} setBans={setBans2} />
          </div>
          <div className="grid grid-cols-1 gap-6">
            <PickSection label={`Picks · ${team1Name}`} picks={picks1} setPicks={setPicks1} />
            <PickSection label={`Picks · ${team2Name}`} picks={picks2} setPicks={setPicks2} />
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={handleSave} disabled={saving} className="bg-mln-green hover:bg-mln-green-dark text-black px-8 py-3 rounded font-bold tracking-widest uppercase transition-all disabled:opacity-50">{saving ? 'SAVING...' : 'SAVE GAME'}</button>
            <button onClick={resetForm} className="border border-border-color text-gray-400 hover:text-white hover:border-mln-green px-6 py-3 rounded font-bold tracking-widest uppercase transition-all">Clear</button>
            {msg && <span className={`text-sm font-bold ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
          </div>
        </div>
      )}

      {/* NEWS TAB */}
      {tab === 'news' && <NewsTab posts={posts || []} />}

      {/* STAFF TAB */}
      {tab === 'staff' && <StaffTab staffUsers={staffUsers || []} currentEmail={session?.user?.email || ''} />}

      {/* TOURNAMENTS TAB */}
      {tab === 'tournaments' && <TournamentsTab tournaments={tournaments || []} />}

      {/* TEAMS TAB */}
      {tab === 'teams' && <TeamsTab teams={teams || []} />}

      {/* PLAYERS TAB */}
      {tab === 'players' && <PlayersTab players={players || []} teams={teams || []} />}

      {/* SETTINGS TAB */}
      {tab === 'settings' && <SettingsTab tournaments={tournaments} />}
    </div>
  );
}

function SettingsTab({ tournaments }: { tournaments: any[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');

  const updateBanner = async (id: string, url: string) => {
    const res = await fetch(`/api/tournaments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerUrl: url }),
    });
    const data = await res.json();
    if (data.success) { setMsg('✓ Updated!'); router.refresh(); }
    else setMsg('Error: ' + data.error);
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-mln-green rounded-full"></span>Settings
      </h3>
      <div className="space-y-6">
        <div className="bg-surface border border-border-color rounded-xl p-6">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Tournament Banners</div>
          <p className="text-gray-400 text-sm mb-4">Set a banner image URL for each tournament. This image will show on tournament cards.</p>
          {tournaments.map((t: any) => (
            <TournamentBannerRow key={t.id} tournament={t} onSave={updateBanner} />
          ))}
          {msg && <span className={`text-sm font-bold mt-2 block ${msg.startsWith('✓') ? 'text-mln-green' : 'text-red-400'}`}>{msg}</span>}
        </div>
        <div className="bg-surface border border-border-color rounded-xl p-6">
          <div className="text-xs text-mln-green font-bold uppercase tracking-[3px] mb-4">Platform Info</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500 block text-xs uppercase mb-1">Platform</span><span className="text-white font-bold">Mobile Legends Nigeria</span></div>
            <div><span className="text-gray-500 block text-xs uppercase mb-1">Version</span><span className="text-white font-bold">2.0.0</span></div>
            <div><span className="text-gray-500 block text-xs uppercase mb-1">Framework</span><span className="text-white font-bold">Next.js 16</span></div>
            <div><span className="text-gray-500 block text-xs uppercase mb-1">Database</span><span className="text-white font-bold">PostgreSQL (Supabase)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TournamentBannerRow({ tournament, onSave }: { tournament: any; onSave: (id: string, url: string) => void }) {
  const [url, setUrl] = useState(tournament.bannerUrl || '');
  return (
    <div className="flex gap-3 items-center mb-3">
      <span className="text-white font-bold text-sm min-w-[180px]">{tournament.name}</span>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... banner image URL" className="flex-1 bg-background border border-border-color rounded px-3 py-2 text-white text-sm focus:border-mln-green outline-none" />
      <button onClick={() => onSave(tournament.id, url)} className="bg-mln-green hover:bg-mln-green-dark text-black px-4 py-2 rounded font-bold text-xs uppercase tracking-wider">Save</button>
    </div>
  );
}

function BanSection({ label, bans, setBans }: { label: string; bans: string[]; setBans: (b: string[]) => void }) {
  return (
    <div className="bg-surface border border-border-color rounded-xl p-6">
      <div className="text-xs text-red-400 font-bold uppercase tracking-[3px] mb-3">{label} · 5 Bans</div>
      <div className="grid grid-cols-5 gap-2">
        {bans.map((ban, i) => (
          <input key={i} list="hero-list" placeholder={`Ban ${i+1}`} value={ban}
            onChange={e => { const nb = [...bans]; nb[i] = e.target.value; setBans(nb); }}
            className="w-full bg-background border border-border-color rounded px-2 py-2 text-white text-xs focus:border-red-400 outline-none placeholder:text-gray-600"
          />
        ))}
      </div>
      <HeroDatalist />
    </div>
  );
}

function PickSection({ label, picks, setPicks }: { label: string; picks: any[]; setPicks: (p: any[]) => void }) {
  const updatePick = (i: number, field: string, value: string) => {
    const np = [...picks]; np[i] = { ...np[i], [field]: value }; setPicks(np);
  };
  return (
    <div className="bg-surface border border-border-color rounded-xl p-6">
      <div className="text-xs text-cyan-400 font-bold uppercase tracking-[3px] mb-3">{label}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold hidden md:grid grid-cols-12 gap-1.5 px-2">
        <div className="col-span-2">Hero</div>
        <div className="col-span-2">Username</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-1 text-center">K</div>
        <div className="col-span-1 text-center">D</div>
        <div className="col-span-1 text-center">A</div>
        <div className="col-span-1 text-center">Gold</div>
        <div className="col-span-1 text-center">DMG</div>
        <div className="col-span-1 text-center">Sav</div>
        <div className="col-span-1 text-center">Man</div>
      </div>
      <div className="space-y-2">
        {picks.map((p, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-1.5 bg-background/50 p-2 md:p-0 rounded md:bg-transparent">
            <div className="col-span-2">
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Hero</label>
              <input list="hero-list" placeholder="Hero" value={p.hero} onChange={e => updatePick(i,'hero',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs focus:border-mln-green outline-none placeholder:text-gray-600" />
            </div>
            <div className="col-span-2">
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Username</label>
              <input placeholder="Username" value={p.playerUsername} onChange={e => updatePick(i,'playerUsername',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs focus:border-mln-green outline-none placeholder:text-gray-600" />
            </div>
            <div className="col-span-2">
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Role</label>
              <select value={p.role} onChange={e => updatePick(i,'role',e.target.value)} className="w-full bg-background border border-border-color rounded px-1 py-1.5 text-white text-xs focus:border-mln-green outline-none"><option value="">Role</option>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Kills</label>
              <input placeholder="K" inputMode="numeric" value={p.kills} onChange={e => updatePick(i,'kills',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-mln-green outline-none placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Deaths</label>
              <input placeholder="D" inputMode="numeric" value={p.deaths} onChange={e => updatePick(i,'deaths',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-red-400 outline-none placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Assists</label>
              <input placeholder="A" inputMode="numeric" value={p.assists} onChange={e => updatePick(i,'assists',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-cyan-400 outline-none placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Gold</label>
              <input placeholder="Gold" inputMode="numeric" value={p.gold} onChange={e => updatePick(i,'gold',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-yellow-400 outline-none placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Damage</label>
              <input placeholder="DMG" inputMode="numeric" value={p.damage} onChange={e => updatePick(i,'damage',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-yellow-400 outline-none placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Savages</label>
              <input placeholder="Sav" inputMode="numeric" value={p.savages} onChange={e => updatePick(i,'savages',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-yellow-400 outline-none placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block md:hidden text-[9px] text-gray-500 uppercase font-bold mb-0.5">Maniacs</label>
              <input placeholder="Man" inputMode="numeric" value={p.maniacs} onChange={e => updatePick(i,'maniacs',e.target.value)} className="w-full bg-background border border-border-color rounded px-2 py-1.5 text-white text-xs text-center focus:border-yellow-400 outline-none placeholder:text-gray-600" />
            </div>
          </div>
        ))}
      </div>
      <HeroDatalist />
    </div>
  );
}

function HeroDatalist() {
  return <datalist id="hero-list">{HEROES.map(h => <option key={h} value={h} />)}</datalist>;
}
