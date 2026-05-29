"use client";
import { useState } from 'react';
import Link from 'next/link';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];
const RANKS = ['Epic', 'Legend', 'Mythic', 'Mythical Honor', 'Mythical Glory', 'Mythical Immortal'];

export default function RegisterTeamPage() {
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [lineupImageUrl, setLineupImageUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [players, setPlayers] = useState([
    { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '' },
    { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '' },
    { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '' },
    { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '' },
    { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePlayerChange = (index: number, field: string, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    setPlayers([...players, { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '' }]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 5) return;
    const newPlayers = [...players];
    newPlayers.splice(index, 1);
    setPlayers(newPlayers);
  };

  const submitRegistration = async () => {
    if (!teamName || !contactEmail) return setMsg("Team Name and Contact Email are required.");
    for (let i = 0; i < players.length; i++) {
      if (!players[i].username) return setMsg(`Player ${i + 1} is missing an In-Game Username.`);
    }

    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/register-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, logoUrl, lineupImageUrl, contactEmail, players })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setMsg(data.error || 'Failed to submit registration.');
      }
    } catch (e) {
      setMsg('Network error occurred.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-surface border border-mln-green rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-mln-green/10 text-mln-green rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Registration Submitted</h2>
          <p className="text-gray-400 mb-8">Thank you! Your squad roster has been securely sent to the admins for review. We will reach out to {contactEmail} shortly.</p>
          <Link href="/" className="bg-mln-green text-black px-6 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-white transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">MLN Tournaments</span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-2">Squad Registration</h1>
          <p className="text-gray-400">Squad leaders, fill out this form to officially register your team and roster for any MLN tournament.</p>
        </div>

        <div className="bg-surface border border-border-color rounded-2xl p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Step 1: Team Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Squad / Team Name *</label>
                  <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Rio Grande" className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white focus:border-mln-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Leader Contact Email *</label>
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@example.com" className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white focus:border-mln-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Team Logo URL (Optional - leave blank if we have it)</label>
                  <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white focus:border-mln-green outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Squad Lineup / Roster Photo URL (Recommended)</label>
                  <input type="url" value={lineupImageUrl} onChange={e => setLineupImageUrl(e.target.value)} placeholder="https://... group picture link" className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white focus:border-mln-green outline-none" />
                </div>
              </div>
              <button onClick={() => { if (teamName && contactEmail) setStep(2); else setMsg("Please fill out Name and Email"); }} className="w-full bg-mln-green text-black px-6 py-4 rounded-xl font-bold uppercase tracking-widest mt-6 hover:bg-white transition-colors">
                Continue to Player Lineup →
              </button>
              {msg && <p className="text-red-400 text-center font-bold text-sm mt-4">{msg}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Step 2: Player Lineup</h2>
                <button onClick={() => setStep(1)} className="text-gray-400 text-sm font-bold uppercase hover:text-white">← Back</button>
              </div>

              <div className="space-y-8">
                {players.map((p, i) => (
                  <div key={i} className="bg-background border border-border-color rounded-xl p-4 md:p-6 relative">
                    <div className="absolute top-0 right-0 bg-border-color text-gray-400 text-xs font-black px-3 py-1 rounded-bl-xl rounded-tr-xl">
                      PLAYER {i + 1} {i === 0 && '(CAPTAIN)'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">In-Game Name (IGN) *</label>
                        <input type="text" value={p.username} onChange={e => handlePlayerChange(i, 'username', e.target.value)} className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Real Name</label>
                        <input type="text" value={p.realName} onChange={e => handlePlayerChange(i, 'realName', e.target.value)} className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Main Role</label>
                        <select value={p.role} onChange={e => handlePlayerChange(i, 'role', e.target.value)} className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm">
                          <option value="">Select Role</option>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Rank</label>
                        <select value={p.rank} onChange={e => handlePlayerChange(i, 'rank', e.target.value)} className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm">
                          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State / Region</label>
                        <input type="text" value={p.state} onChange={e => handlePlayerChange(i, 'state', e.target.value)} placeholder="e.g. Lagos" className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Player Picture URL</label>
                        <input type="url" value={p.pictureUrl} onChange={e => handlePlayerChange(i, 'pictureUrl', e.target.value)} placeholder="https://..." className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm" />
                      </div>
                    </div>
                    {i >= 5 && (
                      <div className="mt-4 text-right">
                        <button onClick={() => removePlayer(i)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Remove Player</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button onClick={addPlayer} className="bg-background border border-dashed border-gray-600 text-gray-400 hover:text-mln-green hover:border-mln-green px-6 py-3 rounded-xl font-bold uppercase text-sm tracking-wider w-full md:w-auto transition-colors">
                  + Add Substitute Player
                </button>
              </div>

              {msg && <p className="text-red-400 text-center font-bold text-sm mt-6">{msg}</p>}

              <button onClick={submitRegistration} disabled={loading} className="w-full bg-mln-green text-black px-6 py-4 rounded-xl font-bold uppercase tracking-widest mt-8 hover:bg-white transition-colors disabled:opacity-50">
                {loading ? 'Submitting Registration...' : 'Submit Squad Roster ✓'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
