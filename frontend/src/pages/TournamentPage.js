import React, { useState, useEffect } from 'react';
import { Trophy, GitBranch, List, Eye, CalendarDays } from 'lucide-react';

// ─── CONSTANTS ───
const MATCH_H = 68;
const SLOT_GAP = 18;
const SLOT_BASE = MATCH_H + SLOT_GAP;
const ROUND_W = 220;
const CONN_W = 44;
const LINE_W = 2;

const TournamentPage = ({ events, teams, currentUser, onNavigate, setEvents }) => {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [bracketData, setBracketData] = useState(null);
    const [activeTab, setActiveTab] = useState('bracket');

    useEffect(() => {
        const tournamentEvents = events.filter(event => event.type === 'tournament');
        setTournaments(tournamentEvents);
        if (tournamentEvents.length > 0 && !selectedTournament) {
            setSelectedTournament(tournamentEvents[0]);
        }
    }, [events, selectedTournament]);

    useEffect(() => {
        if (selectedTournament) {
            const initial = selectedTournament.bracket || {
                teams: [], rounds: [], format: 'single-elimination',
                minGames: 1, firstPlaceBye: false, seedingMethod: 'manual'
            };
            if (selectedTournament.teams && selectedTournament.teams.length > 0 && initial.teams.length === 0) {
                initial.teams = selectedTournament.teams.map(team => ({
                    id: team.id || team.teamId, name: team.name || team.teamName
                }));
            }
            setBracketData(initial);
        }
    }, [selectedTournament]);

    const getTeamLogo = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team?.style?.logoUrl;
    };

    // ─── MATCH CARD (spectator-only, no editing) ───
    const SpectatorMatchCard = ({ match }) => {
        const completed = match.status === 'completed';
        const t1Won = completed && match.winner?.id === match.team1?.id;
        const t2Won = completed && match.winner?.id === match.team2?.id;

        if (!match.team1 && !match.team2) {
            return (
                <div className="w-full rounded-md border border-dashed border-white/10" style={{ height: MATCH_H }}>
                    <div className="h-full flex items-center justify-center text-white/20 text-xs tracking-wide">AWAITING</div>
                </div>
            );
        }

        const TeamRow = ({ team, score, won, pos }) => (
            <div className={`flex items-center gap-2 px-3 transition-colors ${
                won ? 'bg-emerald-500/15' : ''
            } ${pos === 'top' ? 'rounded-t-md' : 'rounded-b-md'}`}
                style={{ height: MATCH_H / 2 }}>
                {team ? (
                    <>
                        <span className="text-[10px] font-mono text-white/25 w-3 text-right shrink-0">{team.seed || ''}</span>
                        {getTeamLogo(team.id) ? (
                            <img src={getTeamLogo(team.id)} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        ) : (
                            <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                                style={{ backgroundColor: 'var(--primary-color, #3b82f6)', color: '#fff', opacity: 0.5 }}>
                                {team.name?.[0]}
                            </div>
                        )}
                        <span className={`text-sm truncate flex-1 ${won ? 'text-emerald-300 font-semibold' : 'text-white/70'}`}>{team.name}</span>
                    </>
                ) : (
                    <span className="text-xs text-white/20 italic ml-8">TBD</span>
                )}
                <span className={`ml-auto text-sm font-bold min-w-[24px] text-center shrink-0 ${won ? 'text-emerald-300' : 'text-white/40'}`}>
                    {score !== null && score !== undefined ? score : '-'}
                </span>
            </div>
        );

        return (
            <div className={`w-full rounded-md overflow-hidden border transition-all ${
                completed ? 'border-emerald-500/25' : 'border-white/10'
            }`} style={{ height: MATCH_H, background: 'rgba(255,255,255,0.03)' }}
                data-testid={`spectator-match-${match.id}`}>
                <TeamRow team={match.team1} score={match.score1} won={t1Won} pos="top" />
                <div className="h-px bg-white/8" />
                <TeamRow team={match.team2} score={match.score2} won={t2Won} pos="bottom" />
            </div>
        );
    };

    // ─── CONNECTOR ───
    const Connector = ({ slotH }) => {
        const c = 'var(--primary-color, rgba(100,140,255,0.2))';
        return (
            <div style={{ height: slotH * 2, display: 'flex', width: CONN_W }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: slotH / 2, bottom: slotH / 2, left: -2, right: 0,
                        borderTop: `${LINE_W}px solid ${c}`, borderBottom: `${LINE_W}px solid ${c}`,
                        borderRight: `${LINE_W}px solid ${c}`, borderTopRightRadius: 3, borderBottomRightRadius: 3,
                    }} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: `${LINE_W}px solid ${c}` }} />
                </div>
            </div>
        );
    };

    // ─── CHAMPION ───
    const ChampionBadge = ({ rounds }) => {
        const champion = rounds[rounds.length - 1]?.matches?.[0]?.winner;
        const h = SLOT_BASE * Math.pow(2, rounds.length - 1);
        return (
            <div style={{ minWidth: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: h }}>
                <div className={`text-center py-4 px-3 rounded-lg border-2 transition-all ${
                    champion ? 'border-amber-400/30 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.1)]' : 'border-white/8 bg-white/[0.02]'
                }`} style={{ marginLeft: -2 }} data-testid="spectator-champion">
                    <Trophy className={`mx-auto mb-1.5 ${champion ? 'text-amber-400' : 'text-white/10'}`} size={24} />
                    {champion ? (
                        <>
                            <div className="text-amber-400/70 text-[9px] uppercase tracking-[0.2em] mb-0.5">Champion</div>
                            <div className="text-white font-bold text-sm">{champion.name}</div>
                        </>
                    ) : (
                        <div className="text-white/15 text-[10px]">TBD</div>
                    )}
                </div>
            </div>
        );
    };

    // ─── EMPTY STATE ───
    if (tournaments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20" style={{ background: '#0b0f19', minHeight: '60vh' }}>
                <CalendarDays className="mb-4 text-white/10" size={48} />
                <h2 className="text-xl font-bold text-white/60 mb-2">No Tournaments</h2>
                <p className="text-white/30 text-sm mb-6">No tournament events are currently scheduled.</p>
                <button
                    onClick={() => onNavigate('events')}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: 'var(--primary-color, #3b82f6)' }}
                    data-testid="go-to-events-btn"
                >
                    Go to Events
                </button>
            </div>
        );
    }

    return (
        <div style={{ background: '#0b0f19', minHeight: '80vh' }}>
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-white" data-testid="tournament-page-title">Tournament Brackets</h1>
                        {selectedTournament && (
                            <p className="text-xs text-white/35 mt-1">{selectedTournament.title || selectedTournament.name}</p>
                        )}
                    </div>
                    {tournaments.length > 1 && (
                        <select
                            value={selectedTournament?.id || ''}
                            onChange={(e) => setSelectedTournament(tournaments.find(t => t.id === e.target.value))}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-white/70"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                            data-testid="tournament-selector"
                        >
                            {tournaments.map(t => (
                                <option key={t.id} value={t.id}>{t.title || t.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {selectedTournament && bracketData && (
                <>
                    {/* Tabs */}
                    <div className="border-b border-white/10 px-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <div className="max-w-7xl mx-auto flex gap-6">
                            <button
                                onClick={() => setActiveTab('bracket')}
                                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'bracket' ? 'border-current text-white' : 'border-transparent text-white/30 hover:text-white/50'
                                }`}
                                style={activeTab === 'bracket' ? { borderColor: 'var(--primary-color, #3b82f6)' } : {}}
                                data-testid="spectator-tab-bracket"
                            >
                                <GitBranch size={14} /> Bracket
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'results' ? 'border-current text-white' : 'border-transparent text-white/30 hover:text-white/50'
                                }`}
                                style={activeTab === 'results' ? { borderColor: 'var(--primary-color, #3b82f6)' } : {}}
                                data-testid="spectator-tab-results"
                            >
                                <List size={14} /> Results
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {bracketData.rounds && bracketData.rounds.length > 0 ? (
                        <>
                            {activeTab === 'bracket' && (
                                <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                    <div className="p-6 inline-block min-w-max">
                                        {/* Round headers */}
                                        <div className="flex mb-4">
                                            {bracketData.rounds.map((round, ri) => (
                                                <React.Fragment key={`h-${ri}`}>
                                                    <div style={{ width: ROUND_W }} className="text-center">
                                                        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30">
                                                            {round.name}
                                                        </span>
                                                    </div>
                                                    {ri < bracketData.rounds.length - 1 && <div style={{ width: CONN_W }} />}
                                                </React.Fragment>
                                            ))}
                                            <div style={{ width: 130 }} className="text-center">
                                                <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-amber-400/40">Champion</span>
                                            </div>
                                        </div>

                                        {/* Bracket body */}
                                        <div className="flex" style={{ height: (bracketData.rounds[0]?.matches?.length || 1) * SLOT_BASE }}>
                                            {bracketData.rounds.map((round, ri) => (
                                                <React.Fragment key={`r-${ri}`}>
                                                    <div style={{ width: ROUND_W }}>
                                                        {round.matches.map((match, mi) => (
                                                            <div key={match.id} className="flex items-center px-1"
                                                                style={{ height: SLOT_BASE * Math.pow(2, ri) }}>
                                                                <SpectatorMatchCard match={match} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {ri < bracketData.rounds.length - 1 && (
                                                        <div>
                                                            {Array.from({ length: Math.floor(round.matches.length / 2) }).map((_, gi) => (
                                                                <Connector key={`c-${ri}-${gi}`} slotH={SLOT_BASE * Math.pow(2, ri)} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                            <ChampionBadge rounds={bracketData.rounds} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'results' && (
                                <div className="p-6 max-w-4xl mx-auto space-y-2">
                                    {bracketData.rounds.flatMap((round, ri) =>
                                        round.matches.filter(m => m.team1 && m.team2).map((match, mi) => {
                                            const completed = match.status === 'completed';
                                            const t1Won = completed && match.winner?.id === match.team1?.id;
                                            const t2Won = completed && match.winner?.id === match.team2?.id;
                                            return (
                                                <div key={match.id} className={`rounded-lg border overflow-hidden ${
                                                    completed ? 'border-emerald-500/15' : 'border-white/8'
                                                }`} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                    <div className="flex items-center gap-4 px-5 py-3">
                                                        <div className="w-20 text-center shrink-0">
                                                            <div className="text-[9px] uppercase tracking-wider text-white/25">{round.name}</div>
                                                            <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full ${
                                                                completed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/25'
                                                            }`}>
                                                                {completed ? 'Final' : 'Pending'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 flex items-center gap-3">
                                                            <span className={`flex-1 text-right text-sm ${t1Won ? 'text-emerald-300 font-semibold' : 'text-white/60'}`}>
                                                                {match.team1?.name}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <span className={`text-lg font-bold min-w-[24px] text-center ${t1Won ? 'text-emerald-300' : 'text-white/40'}`}>
                                                                    {match.score1 ?? '-'}
                                                                </span>
                                                                <span className="text-white/10">:</span>
                                                                <span className={`text-lg font-bold min-w-[24px] text-center ${t2Won ? 'text-emerald-300' : 'text-white/40'}`}>
                                                                    {match.score2 ?? '-'}
                                                                </span>
                                                            </div>
                                                            <span className={`flex-1 text-left text-sm ${t2Won ? 'text-emerald-300 font-semibold' : 'text-white/60'}`}>
                                                                {match.team2?.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20">
                            <GitBranch className="mb-4 text-white/10" size={48} />
                            <h3 className="text-lg font-medium text-white/50 mb-2">Bracket Not Set Up</h3>
                            <p className="text-white/25 text-sm mb-6">The bracket hasn't been created yet.</p>
                            <button
                                onClick={() => onNavigate('admin')}
                                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                                style={{ background: 'var(--primary-color, #3b82f6)' }}
                            >
                                Go to Admin Panel
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TournamentPage;
