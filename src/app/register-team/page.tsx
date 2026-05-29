"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Upload, X, Check, ChevronDown, Plus, Minus, Trophy, Users, Camera } from 'lucide-react';

const ROLES = ['Roamer', 'Gold Lane', 'Jungle', 'Exp Lane', 'Mid Lane'];
const RANKS = ['Epic', 'Legend', 'Mythic', 'Mythical Honor', 'Mythical Glory', 'Mythical Immortal'];

type Tournament = { id: string; name: string; status: string; startDate: string };
type TeamSuggestion = { id: string; name: string; logoUrl?: string };

async function uploadFile(file: File, folder: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const res = await fetch('/api/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function RegisterTeamPage() {
  const [step, setStep] = useState(1);

  // Team info state
  const [teamQuery, setTeamQuery] = useState('');
  const [teamSuggestions, setTeamSuggestions] = useState<TeamSuggestion[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamSuggestion | null>(null);
  const [isNewTeam, setIsNewTeam] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tournament state
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);

  // Contact & meta
  const [contactEmail, setContactEmail] = useState('');
  const [lineupImageUrl, setLineupImageUrl] = useState('');

  // Players
  const [players, setPlayers] = useState(
    Array.from({ length: 5 }, () => ({
      username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '', pictureFile: null as File | null, picturePreview: '', pictureError: ''
    }))
  );

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch tournaments on mount
  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(d => setTournaments(d.tournaments || []));
  }, []);

  // Team autocomplete
  const fetchTeamSuggestions = useCallback((q: string) => {
    if (!q.trim()) { setTeamSuggestions([]); setShowSuggestions(false); return; }
    fetch(`/api/teams?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => {
        setTeamSuggestions(d.teams || []);
        setShowSuggestions(true);
      });
  }, []);

  const handleTeamQueryChange = (val: string) => {
    setTeamQuery(val);
    setSelectedTeam(null);
    setIsNewTeam(false);
    setLogoError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTeamSuggestions(val), 300);
  };

  const selectExistingTeam = (team: TeamSuggestion) => {
    setSelectedTeam(team);
    setTeamQuery(team.name);
    setIsNewTeam(false);
    setShowSuggestions(false);
    setLogoPreview(team.logoUrl || '');
    setLogoError('');
  };

  const selectNewTeam = () => {
    setSelectedTeam(null);
    setIsNewTeam(true);
    setShowSuggestions(false);
    setLogoError('');
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Logo file handler
  const handleLogoFile = (file: File) => {
    setLogoError('');
    
    // Check format (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Invalid format. Only JPG, PNG, or WEBP images are accepted.');
      setLogoFile(null);
      setLogoPreview('');
      return;
    }
    
    // Check size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setLogoError('File too large. Maximum file size allowed is 2MB.');
      setLogoFile(null);
      setLogoPreview('');
      return;
    }
    
    // Check dimensions / aspect ratio
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const isSquare = Math.abs(width - height) < 5 || (width / height >= 0.95 && width / height <= 1.05);
      
      if (!isSquare) {
        setLogoError('Recommended: Use a 1:1 square image (e.g. 200x200px) for best results.');
      }
      
      setLogoFile(file);
      setLogoPreview(img.src);
    };
  };

  // Player field change
  const handlePlayerChange = (index: number, field: string, value: string) => {
    setPlayers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  // Player picture file
  const handlePlayerPicFile = (index: number, file: File) => {
    const updatePlayer = (props: Partial<typeof players[0]>) => {
      setPlayers(prev => prev.map((p, i) => i === index ? { ...p, ...props } : p));
    };

    updatePlayer({ pictureError: '' });

    // Check format (JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      updatePlayer({
        pictureError: 'Invalid format. Only JPG, PNG, or WEBP images are accepted.',
        pictureFile: null,
        picturePreview: ''
      });
      return;
    }

    // Check size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      updatePlayer({
        pictureError: 'File too large. Maximum file size allowed is 2MB.',
        pictureFile: null,
        picturePreview: ''
      });
      return;
    }

    // Check dimensions / aspect ratio
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const isSquare = Math.abs(width - height) < 5 || (width / height >= 0.95 && width / height <= 1.05);

      updatePlayer({
        pictureFile: file,
        picturePreview: img.src,
        pictureError: isSquare ? '' : 'Recommended: Use a 1:1 square image (e.g. 200x200px) for best results.'
      });
    };
  };

  const addPlayer = () => {
    setPlayers(prev => [...prev, { username: '', realName: '', role: '', rank: 'Mythic', state: '', pictureUrl: '', pictureFile: null, picturePreview: '', pictureError: '' }]);
  };

  const removePlayer = (index: number) => {
    if (players.length <= 5) return;
    setPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTournament = (id: string) => {
    setSelectedTournaments(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const submitRegistration = async () => {
    const teamName = isNewTeam ? teamQuery.trim() : selectedTeam?.name || teamQuery.trim();
    if (!teamName) return setMsg('Please enter or select a squad name.');
    if (!contactEmail) return setMsg('Contact email is required.');
    if (selectedTournaments.length === 0) return setMsg('Please select at least one tournament you are registering for.');
    for (let i = 0; i < players.length; i++) {
      if (!players[i].username) return setMsg(`Player ${i + 1} is missing an In-Game Username.`);
      if (players[i].pictureError && !players[i].pictureError.includes('Recommended')) {
        return setMsg(`Player ${i + 1} has a picture upload error: ${players[i].pictureError}`);
      }
    }

    setLoading(true); setMsg('');
    try {
      let logoUrl = selectedTeam?.logoUrl || '';

      // Upload logo if new team with file
      if (isNewTeam && logoFile) {
        setLogoUploading(true);
        logoUrl = await uploadFile(logoFile, 'teams');
        setLogoUploading(false);
      }

      // Upload player pictures
      const processedPlayers = await Promise.all(players.map(async (p) => {
        let pictureUrl = p.pictureUrl;
        if (p.pictureFile) {
          pictureUrl = await uploadFile(p.pictureFile, 'players');
        }
        return { username: p.username, realName: p.realName, role: p.role, rank: p.rank, state: p.state, pictureUrl };
      }));

      const res = await fetch('/api/register-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          logoUrl,
          lineupImageUrl,
          contactEmail,
          players: processedPlayers,
          tournamentIds: selectedTournaments,
          isExistingTeam: !isNewTeam && !!selectedTeam,
          existingTeamId: selectedTeam?.id || null,
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setMsg(data.error || 'Failed to submit registration.');
      }
    } catch (e) {
      setMsg('Network error occurred. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-surface border border-mln-green rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_40px_rgba(0,200,83,0.15)]">
          <div className="w-20 h-20 bg-mln-green/10 text-mln-green rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Registration Submitted!</h2>
          <p className="text-gray-400 mb-8">Your squad roster has been submitted for review. We will reach out to <span className="text-mln-green font-bold">{contactEmail}</span> shortly.</p>
          <Link href="/" className="inline-block bg-mln-green text-black px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Step indicators
  const steps = ['Squad Info', 'Tournament', 'Players'];

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:py-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-[10px] text-mln-green font-bold uppercase tracking-[4px]">MLN Esports</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight mt-1 mb-2">
            Squad Registration
          </h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Squad leaders — register your team and roster for any MLN tournament.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${step === i + 1 ? 'opacity-100' : step > i + 1 ? 'opacity-70' : 'opacity-30'} transition-opacity`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${step > i + 1 ? 'bg-mln-green border-mln-green text-black' : step === i + 1 ? 'border-mln-green text-mln-green' : 'border-gray-700 text-gray-500'}`}>
                  {step > i + 1 ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${step === i + 1 ? 'text-white' : 'text-gray-500'}`}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 sm:w-12 ${step > i + 1 ? 'bg-mln-green' : 'bg-gray-700'} transition-colors`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-surface border border-border-color rounded-2xl p-5 sm:p-8">

          {/* ========== STEP 1: SQUAD INFO ========== */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider mb-4 border-l-4 border-mln-green pl-3">Step 1: Squad Information</h2>

              {/* Team Search / Autocomplete */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Squad / Team Name *</label>
                <div className="relative" ref={suggestionsRef}>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={teamQuery}
                      onChange={e => handleTeamQueryChange(e.target.value)}
                      onFocus={() => teamQuery && setShowSuggestions(true)}
                      placeholder="Search your squad or type new name..."
                      className="w-full bg-background border border-border-color rounded-xl pl-9 pr-4 py-3 text-white focus:border-mln-green outline-none text-sm transition-colors"
                    />
                    {selectedTeam && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-mln-green">
                        <Check size={16} />
                      </div>
                    )}
                  </div>

                  {/* Dropdown suggestions */}
                  {showSuggestions && (
                    <div className="absolute z-50 mt-1 w-full bg-surface border border-border-color rounded-xl overflow-hidden shadow-xl">
                      {teamSuggestions.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-border-color">Existing Squads</div>
                          {teamSuggestions.map(team => (
                            <button
                              key={team.id}
                              onClick={() => selectExistingTeam(team)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-background border border-border-color overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {team.logoUrl
                                  ? <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                                  : <span className="text-xs font-black text-gray-600">{team.name.substring(0, 2).toUpperCase()}</span>
                                }
                              </div>
                              <span className="text-white font-bold text-sm">{team.name}</span>
                              <span className="ml-auto text-[10px] text-mln-green font-bold uppercase">Select</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Option to register as new */}
                      {teamQuery.trim().length >= 2 && (
                        <button
                          onClick={selectNewTeam}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover border-t border-border-color transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-mln-green/10 border border-mln-green/30 flex items-center justify-center flex-shrink-0">
                            <Plus size={14} className="text-mln-green" />
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">Register as new squad: <span className="text-mln-green">"{teamQuery}"</span></p>
                            <p className="text-[10px] text-gray-500">This squad isn't in our database yet</p>
                          </div>
                        </button>
                      )}
                      {teamSuggestions.length === 0 && teamQuery.trim().length < 2 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">Type at least 2 characters to search...</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selection status */}
                {selectedTeam && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-mln-green font-bold">
                    <Check size={12} /> Existing squad selected — your players will be linked to this team
                  </div>
                )}
                {isNewTeam && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400 font-bold">
                    <Plus size={12} /> New squad — please upload your squad logo below
                  </div>
                )}
              </div>

              {/* Logo upload (only for new teams) */}
              {isNewTeam && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Squad Logo *</label>
                  <label className="flex items-center gap-4 cursor-pointer group">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-background overflow-hidden flex-shrink-0 flex items-center justify-center transition-colors">
                      {logoPreview
                        ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                        : <Upload size={20} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                      }
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{logoPreview ? 'Change Logo' : 'Upload Squad Logo'}</p>
                      <p className="text-gray-500 text-xs mt-0.5">JPG, PNG, or WEBP — max 2MB (recommended: 1:1 ratio, 200x200px)</p>
                    </div>
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={e => e.target.files?.[0] && handleLogoFile(e.target.files[0])} />
                  </label>
                  {logoError && (
                    <p className={`text-xs font-bold px-3 py-1.5 rounded-lg inline-block ${logoError.includes('Recommended') ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`}>
                      {logoError.includes('Recommended') ? '⚠️ ' : '❌ '} {logoError}
                    </p>
                  )}
                </div>
              )}

              {/* Existing team — show their current logo */}
              {selectedTeam && logoPreview && (
                <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-mln-green/20">
                  <img src={logoPreview} alt={selectedTeam.name} className="w-14 h-14 rounded-xl object-cover border border-border-color" />
                  <div>
                    <p className="text-white font-black text-sm">{selectedTeam.name}</p>
                    <p className="text-gray-500 text-xs">Registered squad — logo on file</p>
                  </div>
                </div>
              )}

              {/* Contact email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Leader Contact Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-background border border-border-color rounded-xl px-4 py-3 text-white focus:border-mln-green outline-none text-sm transition-colors"
                />
              </div>

              {msg && <p className="text-red-400 text-center font-bold text-sm bg-red-400/10 py-3 px-4 rounded-xl">{msg}</p>}

              <button
                onClick={() => {
                  const teamName = isNewTeam ? teamQuery.trim() : selectedTeam?.name || teamQuery.trim();
                  if (!teamName) return setMsg('Please enter or select your squad name.');
                  if (isNewTeam && !logoFile) return setMsg('Please upload a squad logo for your new team.');
                  if (isNewTeam && logoError && !logoError.includes('Recommended')) return setMsg('Please resolve the logo upload error before proceeding.');
                  if (!contactEmail) return setMsg('Please enter your contact email.');
                  setMsg('');
                  setStep(2);
                }}
                className="w-full bg-mln-green text-black px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-colors text-sm sm:text-base"
              >
                Continue → Select Tournament
              </button>
            </div>
          )}

          {/* ========== STEP 2: TOURNAMENT SELECTION ========== */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Step 2: Select Tournament</h2>
                <button onClick={() => setStep(1)} className="text-gray-400 text-xs font-bold uppercase hover:text-white transition-colors">← Back</button>
              </div>
              <p className="text-gray-400 text-sm">Which tournament(s) are you registering your squad for?</p>

              {tournaments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Trophy size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-bold text-sm">No tournaments available right now.</p>
                  <p className="text-xs mt-1">Check back soon or contact the admins.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tournaments.map(t => {
                    const selected = selectedTournaments.includes(t.id);
                    const date = new Date(t.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTournament(t.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${selected ? 'border-mln-green bg-mln-green/10 shadow-[0_0_20px_rgba(0,200,83,0.1)]' : 'border-border-color bg-background hover:border-gray-600'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-mln-green border-mln-green' : 'border-gray-600'}`}>
                              {selected && <Check size={12} className="text-black" />}
                            </div>
                            <div>
                              <p className="text-white font-black text-sm">{t.name}</p>
                              <p className="text-gray-500 text-xs mt-0.5">Starts {date}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${t.status === 'ongoing' ? 'bg-mln-green/20 text-mln-green' : t.status === 'upcoming' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                            {t.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTournaments.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-mln-green font-bold">
                  <Check size={12} /> {selectedTournaments.length} tournament{selectedTournaments.length > 1 ? 's' : ''} selected
                </div>
              )}

              {msg && <p className="text-red-400 text-center font-bold text-sm bg-red-400/10 py-3 px-4 rounded-xl">{msg}</p>}

              <button
                onClick={() => {
                  if (selectedTournaments.length === 0) return setMsg('Please select at least one tournament.');
                  setMsg('');
                  setStep(3);
                }}
                className="w-full bg-mln-green text-black px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-white transition-colors text-sm sm:text-base"
              >
                Continue → Player Lineup
              </button>
            </div>
          )}

          {/* ========== STEP 3: PLAYER LINEUP ========== */}
          {step === 3 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider border-l-4 border-mln-green pl-3">Step 3: Player Lineup</h2>
                <button onClick={() => setStep(2)} className="text-gray-400 text-xs font-bold uppercase hover:text-white transition-colors">← Back</button>
              </div>

              <div className="space-y-6">
                {players.map((p, i) => (
                  <div key={i} className="bg-background border border-border-color rounded-xl p-4 sm:p-5 relative">
                    <div className="absolute top-0 right-0 bg-surface border-l border-b border-border-color text-gray-400 text-[10px] font-black px-3 py-1 rounded-bl-xl rounded-tr-xl tracking-widest">
                      {i === 0 ? 'CAPTAIN' : `PLAYER ${i + 1}`}
                    </div>

                    <div className="flex items-start gap-4 mt-2 mb-4">
                      {/* Player picture upload */}
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <label className="cursor-pointer group">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-dashed border-gray-700 group-hover:border-mln-green bg-surface overflow-hidden flex items-center justify-center transition-colors">
                            {p.picturePreview
                              ? <img src={p.picturePreview} alt="" className="w-full h-full object-cover" />
                              : <Camera size={20} className="text-gray-600 group-hover:text-mln-green transition-colors" />
                            }
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handlePlayerPicFile(i, e.target.files[0])}
                          />
                        </label>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-1 text-center">Max 2MB</span>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">In-Game Name (IGN) *</label>
                          <input
                            type="text"
                            value={p.username}
                            onChange={e => handlePlayerChange(i, 'username', e.target.value)}
                            placeholder="Your in-game username"
                            className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">Real Name</label>
                          <input
                            type="text"
                            value={p.realName}
                            onChange={e => handlePlayerChange(i, 'realName', e.target.value)}
                            placeholder="Optional"
                            className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {p.pictureError && (
                      <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg mb-4 border flex items-center gap-1.5 ${p.pictureError.includes('Recommended') ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                        <span>{p.pictureError.includes('Recommended') ? '⚠️' : '❌'}</span>
                        <span>{p.pictureError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">Main Role</label>
                        <select value={p.role} onChange={e => handlePlayerChange(i, 'role', e.target.value)} className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm">
                          <option value="">Select Role</option>
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">Rank</label>
                        <select value={p.rank} onChange={e => handlePlayerChange(i, 'rank', e.target.value)} className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm">
                          {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wider">State / Region</label>
                        <input
                          type="text"
                          value={p.state}
                          onChange={e => handlePlayerChange(i, 'state', e.target.value)}
                          placeholder="e.g. Lagos"
                          className="w-full bg-surface border border-border-color rounded-lg px-3 py-2 text-white focus:border-mln-green outline-none text-sm transition-colors"
                        />
                      </div>
                    </div>

                    {i >= 5 && (
                      <div className="mt-4 text-right">
                        <button onClick={() => removePlayer(i)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase flex items-center gap-1 ml-auto transition-colors">
                          <Minus size={12} /> Remove Player
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={addPlayer}
                  className="w-full border border-dashed border-gray-600 text-gray-400 hover:text-mln-green hover:border-mln-green px-6 py-3 rounded-xl font-bold uppercase text-sm tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Substitute Player
                </button>
              </div>

              {msg && <p className="text-red-400 text-center font-bold text-sm mt-4 bg-red-400/10 py-3 px-4 rounded-xl">{msg}</p>}

              <button
                onClick={submitRegistration}
                disabled={loading}
                className="w-full bg-mln-green text-black px-6 py-4 rounded-xl font-black uppercase tracking-widest mt-6 hover:bg-white transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Submitting Registration...
                  </span>
                ) : 'Submit Squad Roster ✓'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
