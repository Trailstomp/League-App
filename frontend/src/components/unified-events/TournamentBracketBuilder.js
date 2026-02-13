import React, { useState, useEffect } from 'react';
import { Trophy, BarChart3, ChevronLeft, Plus, Save, Eye, Edit3, Check, X, List, GitBranch, Loader2, Zap } from 'lucide-react';

// ─── CONSTANTS ───
const MATCH_CARD_H = 72;
const SLOT_GAP = 20;
const SLOT_BASE = MATCH_CARD_H + SLOT_GAP;
const ROUND_W = 236;
const CONN_W = 48;
const LINE_W = 2;

const TournamentBracketBuilder = ({ event, teams, onUpdate, onBack, onLiveView, onLiveScore }) => {
    const [bracketData, setBracketData] = useState({
        format: 'single_elimination',
        seeding_method: 'league_rankings',
        teams: [],
        rounds: [],
        settings: { auto_advance: true, allow_editing: true }
    });
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('bracket');

    // ─── INIT ───
    useEffect(() => {
        if (event) {
            setBracketData(prev => ({
                ...prev,
                format: event.tournament_config?.format || 'single_elimination',
                seeding_method: event.tournament_config?.seeding_method || 'league_rankings',
                teams: event.teams?.map(teamId => ({
                    id: teamId, name: getTeamName(teamId), seed: 0
                })) || [],
                settings: {
                    auto_advance: event.tournament_config?.auto_advance !== false,
                    allow_editing: event.tournament_config?.allow_bracket_editing !== false
                }
            }));
            if (event.teams && event.teams.length >= 4 && !event.bracket) {
                generateBracket(event.teams);
            } else if (event.bracket) {
                setBracketData(prev => ({ ...prev, rounds: event.bracket.rounds || [] }));
            }
        }
    }, [event]);

    // ─── HELPERS ───
    const getTeamName = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const getTeamLogo = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team?.style?.logoUrl;
    };

    const generateBracket = (tournamentTeams) => {
        const teamList = tournamentTeams.map((teamId, index) => ({
            id: teamId, name: getTeamName(teamId), seed: index + 1
        }));
        if (bracketData.seeding_method === 'league_rankings') {
            teamList.sort((a, b) => a.seed - b.seed);
        }
        const rounds = [];
        let currentTeams = [...teamList];
        let roundNumber = 1;
        while (currentTeams.length > 1) {
            const matches = [];
            const count = Math.floor(currentTeams.length / 2);
            for (let i = 0; i < count; i++) {
                matches.push({
                    id: `round${roundNumber}_match${i + 1}`,
                    team1: currentTeams[i * 2] || null,
                    team2: currentTeams[i * 2 + 1] || null,
                    score1: null, score2: null, winner: null, status: 'pending'
                });
            }
            rounds.push({ round: roundNumber, name: getRoundName(roundNumber, rounds.length + 1), matches });
            currentTeams = new Array(count).fill(null);
            roundNumber++;
        }
        setBracketData(prev => ({ ...prev, rounds, teams: teamList }));
        return rounds;
    };

    const getRoundName = (roundNumber, totalRounds) => {
        const remaining = totalRounds - roundNumber + 1;
        if (remaining === 1) return 'Final';
        if (remaining === 2) return 'Semifinals';
        if (remaining === 3) return 'Quarterfinals';
        return `Round ${roundNumber}`;
    };

    const updateMatchScore = (roundIndex, matchIndex, score1, score2) => {
        setBracketData(prev => {
            const newRounds = JSON.parse(JSON.stringify(prev.rounds));
            const match = newRounds[roundIndex].matches[matchIndex];
            match.score1 = parseInt(score1) || 0;
            match.score2 = parseInt(score2) || 0;
            if (score1 !== '' && score2 !== '') {
                if (match.score1 > match.score2) {
                    match.winner = match.team1; match.status = 'completed';
                } else if (match.score2 > match.score1) {
                    match.winner = match.team2; match.status = 'completed';
                } else {
                    match.winner = null; match.status = 'tied';
                }
                if (prev.settings.auto_advance && match.winner && roundIndex < newRounds.length - 1) {
                    const nextRound = newRounds[roundIndex + 1];
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    const isFirst = matchIndex % 2 === 0;
                    if (nextRound.matches[nextMatchIndex]) {
                        if (isFirst) nextRound.matches[nextMatchIndex].team1 = { ...match.winner };
                        else nextRound.matches[nextMatchIndex].team2 = { ...match.winner };
                    }
                }
                setTimeout(() => saveBracket(), 100);
            }
            return { ...prev, rounds: newRounds };
        });
    };

    const addTeamToBracket = (teamId) => {
        if (!bracketData.teams.find(t => t.id === teamId)) {
            const newTeam = { id: teamId, name: getTeamName(teamId), seed: bracketData.teams.length + 1 };
            setBracketData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
            generateBracket([...bracketData.teams.map(t => t.id), teamId]);
        }
        setShowAddTeam(false);
    };

    const saveBracket = async () => {
        try {
            setLoading(true);
            await onUpdate({
                bracket: bracketData,
                tournament_config: {
                    ...event.tournament_config,
                    auto_advance: bracketData.settings.auto_advance,
                    allow_bracket_editing: bracketData.settings.allow_editing
                }
            });
        } catch (error) {
            console.error('Error saving bracket:', error);
        } finally {
            setLoading(false);
        }
    };

    const getAllMatches = () => {
        const matches = [];
        bracketData.rounds.forEach((round, ri) => {
            round.matches.forEach((match, mi) => {
                matches.push({ ...match, roundIndex: ri, matchIndex: mi, roundName: round.name });
            });
        });
        return matches;
    };

    // ─── BRACKET MATCH CARD ───
    const BracketMatchCard = ({ match, roundIndex, matchIndex, isLast }) => {
        const [editing, setEditing] = useState(false);
        const [s1, setS1] = useState(match.score1 ?? '');
        const [s2, setS2] = useState(match.score2 ?? '');

        useEffect(() => { setS1(match.score1 ?? ''); setS2(match.score2 ?? ''); }, [match.score1, match.score2]);

        const handleSave = () => {
            updateMatchScore(roundIndex, matchIndex, s1, s2);
            setEditing(false);
        };

        const completed = match.status === 'completed';
        const t1Won = completed && match.winner?.id === match.team1?.id;
        const t2Won = completed && match.winner?.id === match.team2?.id;

        if (!match.team1 && !match.team2) {
            return (
                <div
                    data-testid={`bracket-match-empty-${roundIndex}-${matchIndex}`}
                    className="w-full rounded-md border border-dashed border-white/10"
                    style={{ height: MATCH_CARD_H }}
                >
                    <div className="h-full flex items-center justify-center text-white/25 text-xs tracking-wide">
                        AWAITING TEAMS
                    </div>
                </div>
            );
        }

        const TeamRow = ({ team, score, tempScore, setTemp, won, pos }) => (
            <div
                className={`flex items-center gap-2 px-3 transition-all duration-200 ${
                    won ? 'bg-emerald-500/15' : 'bg-transparent'
                } ${pos === 'top' ? 'rounded-t-md' : 'rounded-b-md'}`}
                style={{ height: MATCH_CARD_H / 2 }}
            >
                {team ? (
                    <>
                        <span className="text-[10px] font-mono text-white/30 w-3 text-right shrink-0">
                            {team.seed || ''}
                        </span>
                        {getTeamLogo(team.id) ? (
                            <img src={getTeamLogo(team.id)} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                        ) : (
                            <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                                style={{ backgroundColor: 'var(--primary-color, #3b82f6)', color: '#fff', opacity: 0.7 }}>
                                {team.name?.[0]}
                            </div>
                        )}
                        <span className={`text-sm truncate flex-1 ${
                            won ? 'text-emerald-300 font-semibold' : 'text-white/80'
                        }`}>
                            {team.name}
                        </span>
                    </>
                ) : (
                    <span className="text-xs text-white/25 italic ml-8">TBD</span>
                )}
                <div className="ml-auto shrink-0 w-8 text-center">
                    {editing && team ? (
                        <input
                            type="number" min="0" value={tempScore}
                            onChange={(e) => setTemp(e.target.value)}
                            className="w-8 h-6 text-center text-sm rounded bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                            data-testid={`score-input-${pos}-${roundIndex}-${matchIndex}`}
                        />
                    ) : (
                        <span className={`text-sm font-bold ${won ? 'text-emerald-300' : 'text-white/50'}`}>
                            {score !== null && score !== undefined ? score : '-'}
                        </span>
                    )}
                </div>
            </div>
        );

        return (
            <div className="relative group" data-testid={`bracket-match-${roundIndex}-${matchIndex}`}>
                <div className={`w-full rounded-md overflow-hidden border transition-all duration-200 ${
                    completed ? 'border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                    : 'border-white/10 hover:border-white/20'
                }`} style={{ height: MATCH_CARD_H, background: 'rgba(255,255,255,0.04)' }}>
                    <TeamRow team={match.team1} score={match.score1} tempScore={s1} setTemp={setS1} won={t1Won} pos="top" />
                    <div className="h-px bg-white/10" />
                    <TeamRow team={match.team2} score={match.score2} tempScore={s2} setTemp={setS2} won={t2Won} pos="bottom" />
                </div>

                {/* Floating action bar on hover */}
                {match.team1 && match.team2 && (
                    <div className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 shadow-lg z-10 transition-all duration-200 ${
                        editing ? 'opacity-100 -bottom-9' : 'opacity-0 group-hover:opacity-100 -bottom-8 group-hover:-bottom-9'
                    }`} style={{ background: 'rgba(10,14,23,0.95)', backdropFilter: 'blur(8px)' }}>
                        {editing ? (
                            <>
                                <button onClick={handleSave} className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400" data-testid={`save-score-${roundIndex}-${matchIndex}`}>
                                    <Check size={14} />
                                </button>
                                <button onClick={() => setEditing(false)} className="p-1 rounded hover:bg-red-500/20 text-red-400">
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setS1(match.score1 ?? ''); setS2(match.score2 ?? ''); setEditing(true); }}
                                    className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white/90" title="Edit Score"
                                    data-testid={`edit-score-${roundIndex}-${matchIndex}`}>
                                    <Edit3 size={13} />
                                </button>
                                {onLiveScore && (
                                    <button onClick={() => onLiveScore(match, roundIndex, matchIndex)}
                                        className="p-1 rounded hover:bg-emerald-500/20 text-white/50 hover:text-emerald-400" title="Live Score"
                                        data-testid={`live-score-${roundIndex}-${matchIndex}`}>
                                        <BarChart3 size={13} />
                                    </button>
                                )}
                                {onLiveView && (
                                    <button onClick={() => onLiveView(match, roundIndex, matchIndex)}
                                        className="p-1 rounded hover:bg-rose-500/20 text-white/50 hover:text-rose-400" title="Watch Live"
                                        data-testid={`live-view-${roundIndex}-${matchIndex}`}>
                                        <Eye size={13} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ─── CONNECTOR LINES ───
    const ConnectorGroup = ({ slotH }) => {
        const c = 'var(--primary-color, rgba(100,140,255,0.25))';
        return (
            <div style={{ height: slotH * 2, display: 'flex', width: CONN_W }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: slotH / 2,
                        bottom: slotH / 2,
                        left: -2,
                        right: 0,
                        borderTop: `${LINE_W}px solid ${c}`,
                        borderBottom: `${LINE_W}px solid ${c}`,
                        borderRight: `${LINE_W}px solid ${c}`,
                        borderTopRightRadius: 3,
                        borderBottomRightRadius: 3,
                    }} />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: `${LINE_W}px solid ${c}` }} />
                </div>
            </div>
        );
    };

    // ─── CHAMPION BADGE ───
    const ChampionBadge = () => {
        const finalMatch = bracketData.rounds[bracketData.rounds.length - 1]?.matches?.[0];
        const champion = finalMatch?.winner;
        const h = SLOT_BASE * Math.pow(2, bracketData.rounds.length - 1);
        return (
            <div style={{ minWidth: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: h }}>
                <div className="relative" style={{ marginLeft: -2 }}>
                    {/* Entry line */}
                    <div style={{
                        position: 'absolute', left: -CONN_W / 2 + 2, top: '50%',
                        width: CONN_W / 2, borderTop: `${LINE_W}px solid var(--primary-color, rgba(100,140,255,0.25))`
                    }} />
                    <div className={`text-center py-5 px-4 rounded-lg border-2 transition-all duration-500 ${
                        champion
                            ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-amber-900/10 shadow-[0_0_30px_rgba(245,158,11,0.12)]'
                            : 'border-white/10 bg-white/[0.03]'
                    }`} data-testid="champion-badge">
                        <Trophy className={`mx-auto mb-2 transition-all duration-500 ${
                            champion ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'text-white/15'
                        }`} size={28} />
                        {champion ? (
                            <>
                                <div className="text-amber-400/80 text-[10px] uppercase tracking-[0.2em] font-medium mb-1">Champion</div>
                                <div className="text-white font-bold text-sm">{champion.name}</div>
                            </>
                        ) : (
                            <div className="text-white/20 text-xs">TBD</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ─── BRACKET VIEW ───
    const BracketView = () => {
        const rounds = bracketData.rounds;
        if (!rounds || rounds.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <GitBranch className="mb-4 text-white/15" size={48} />
                    <h3 className="text-lg font-medium text-white/60 mb-2">No Bracket Generated</h3>
                    <p className="text-white/30 text-sm mb-6">Add at least 4 teams to generate the bracket</p>
                    <button
                        onClick={() => generateBracket(bracketData.teams.map(t => t.id))}
                        disabled={bracketData.teams.length < 4}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                        style={{ background: 'var(--primary-color, #3b82f6)', color: '#fff' }}
                        data-testid="generate-bracket-btn"
                    >
                        Generate Bracket
                    </button>
                </div>
            );
        }

        const totalRounds = rounds.length;
        const firstRoundCount = rounds[0]?.matches?.length || 0;
        const totalHeight = firstRoundCount * SLOT_BASE;

        return (
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className="p-6 pb-16 inline-block min-w-max">
                    {/* Round headers */}
                    <div className="flex mb-5">
                        {rounds.map((round, ri) => (
                            <React.Fragment key={`h-${ri}`}>
                                <div style={{ width: ROUND_W }} className="text-center">
                                    <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/35">
                                        {round.name}
                                    </span>
                                </div>
                                {ri < totalRounds - 1 && <div style={{ width: CONN_W }} />}
                            </React.Fragment>
                        ))}
                        <div style={{ width: 140 }} className="text-center">
                            <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-amber-400/50">
                                Champion
                            </span>
                        </div>
                    </div>

                    {/* Bracket body */}
                    <div className="flex" style={{ height: totalHeight }}>
                        {rounds.map((round, ri) => (
                            <React.Fragment key={`r-${ri}`}>
                                {/* Round column */}
                                <div style={{ width: ROUND_W, height: totalHeight }}>
                                    {round.matches.map((match, mi) => {
                                        const slotH = SLOT_BASE * Math.pow(2, ri);
                                        return (
                                            <div
                                                key={match.id}
                                                className="flex items-center px-1"
                                                style={{ height: slotH }}
                                            >
                                                <BracketMatchCard
                                                    match={match}
                                                    roundIndex={ri}
                                                    matchIndex={mi}
                                                    isLast={ri === totalRounds - 1}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Connector column */}
                                {ri < totalRounds - 1 && (
                                    <div style={{ height: totalHeight }}>
                                        {Array.from({ length: Math.floor(round.matches.length / 2) }).map((_, gi) => (
                                            <ConnectorGroup key={`c-${ri}-${gi}`} slotH={SLOT_BASE * Math.pow(2, ri)} />
                                        ))}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                        <ChampionBadge />
                    </div>
                </div>
            </div>
        );
    };

    // ─── GAMES LIST VIEW ───
    const GamesListView = () => {
        const matches = getAllMatches();
        if (matches.length === 0) return <div className="text-center py-12 text-white/30">No matches yet</div>;

        return (
            <div className="overflow-auto p-6" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className="max-w-5xl mx-auto space-y-3">
                    {matches.map((match) => {
                        const completed = match.status === 'completed';
                        const t1Won = completed && match.winner?.id === match.team1?.id;
                        const t2Won = completed && match.winner?.id === match.team2?.id;
                        return (
                            <div
                                key={match.id}
                                className={`rounded-lg border overflow-hidden transition-all ${
                                    completed ? 'border-emerald-500/20' : 'border-white/10'
                                }`}
                                style={{ background: 'rgba(255,255,255,0.03)' }}
                                data-testid={`game-list-match-${match.roundIndex}-${match.matchIndex}`}
                            >
                                <div className="flex items-center gap-4 px-5 py-3">
                                    <div className="shrink-0 text-center w-24">
                                        <div className="text-[10px] uppercase tracking-wider text-white/30 font-medium">{match.roundName}</div>
                                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                            completed ? 'bg-emerald-500/15 text-emerald-400' :
                                            match.status === 'tied' ? 'bg-amber-500/15 text-amber-400' :
                                            'bg-white/5 text-white/30'
                                        }`}>
                                            {completed ? 'Final' : match.status === 'tied' ? 'Tied' : 'Pending'}
                                        </span>
                                    </div>

                                    <div className="flex-1 flex items-center gap-4">
                                        {/* Team 1 */}
                                        <div className={`flex-1 text-right flex items-center justify-end gap-2 ${t1Won ? 'text-emerald-300' : 'text-white/70'}`}>
                                            <span className={`text-sm ${t1Won ? 'font-semibold' : ''}`}>
                                                {match.team1?.name || <span className="text-white/25 italic">TBD</span>}
                                            </span>
                                            {match.team1 && getTeamLogo(match.team1.id) ? (
                                                <img src={getTeamLogo(match.team1.id)} className="w-6 h-6 rounded object-cover" alt="" />
                                            ) : match.team1 ? (
                                                <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                                                    style={{ backgroundColor: 'var(--primary-color, #3b82f6)', color: '#fff', opacity: 0.6 }}>
                                                    {match.team1.name?.[0]}
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Score */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-lg font-bold min-w-[28px] text-center ${t1Won ? 'text-emerald-300' : 'text-white/50'}`}>
                                                {match.score1 !== null ? match.score1 : '-'}
                                            </span>
                                            <span className="text-white/15 text-xs">:</span>
                                            <span className={`text-lg font-bold min-w-[28px] text-center ${t2Won ? 'text-emerald-300' : 'text-white/50'}`}>
                                                {match.score2 !== null ? match.score2 : '-'}
                                            </span>
                                        </div>

                                        {/* Team 2 */}
                                        <div className={`flex-1 text-left flex items-center gap-2 ${t2Won ? 'text-emerald-300' : 'text-white/70'}`}>
                                            {match.team2 && getTeamLogo(match.team2.id) ? (
                                                <img src={getTeamLogo(match.team2.id)} className="w-6 h-6 rounded object-cover" alt="" />
                                            ) : match.team2 ? (
                                                <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                                                    style={{ backgroundColor: 'var(--primary-color, #3b82f6)', color: '#fff', opacity: 0.6 }}>
                                                    {match.team2.name?.[0]}
                                                </div>
                                            ) : null}
                                            <span className={`text-sm ${t2Won ? 'font-semibold' : ''}`}>
                                                {match.team2?.name || <span className="text-white/25 italic">TBD</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="shrink-0 flex items-center gap-1">
                                        {match.team1 && match.team2 && (
                                            <>
                                                {onLiveScore && (
                                                    <button
                                                        onClick={() => onLiveScore(match, match.roundIndex, match.matchIndex)}
                                                        className="p-1.5 rounded hover:bg-emerald-500/20 text-white/40 hover:text-emerald-400 transition-colors"
                                                        title="Live Score"
                                                    >
                                                        <BarChart3 size={14} />
                                                    </button>
                                                )}
                                                {onLiveView && (
                                                    <button
                                                        onClick={() => onLiveView(match, match.roundIndex, match.matchIndex)}
                                                        className="p-1.5 rounded hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                                                        title="Watch Live"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ─── MAIN RENDER ───
    return (
        <div className="flex-1 flex flex-col" style={{ background: '#0b0f19' }}>
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors" data-testid="bracket-back-btn">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-white" data-testid="tournament-title">{event.title}</h2>
                            <p className="text-xs text-white/40 mt-0.5">
                                {bracketData.format === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'}
                                <span className="mx-2 text-white/15">|</span>
                                {bracketData.teams.length} Teams
                                <span className="mx-2 text-white/15">|</span>
                                {bracketData.rounds.length} Rounds
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/50 cursor-pointer hover:bg-white/8 transition-colors">
                            <input
                                type="checkbox"
                                checked={bracketData.settings.auto_advance}
                                onChange={(e) => setBracketData(prev => ({
                                    ...prev, settings: { ...prev.settings, auto_advance: e.target.checked }
                                }))}
                                className="accent-emerald-500"
                            />
                            <Zap size={12} className="text-amber-400" />
                            Auto-advance
                        </label>
                        <button
                            onClick={() => setShowAddTeam(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                            data-testid="add-team-btn"
                        >
                            <Plus size={14} /> Add Team
                        </button>
                        <button
                            onClick={saveBracket}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-40"
                            style={{ background: 'var(--primary-color, #3b82f6)' }}
                            data-testid="save-bracket-btn"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="border-b border-white/10 px-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('bracket')}
                        className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'bracket'
                                ? 'border-current text-white'
                                : 'border-transparent text-white/35 hover:text-white/60'
                        }`}
                        style={activeTab === 'bracket' ? { borderColor: 'var(--primary-color, #3b82f6)' } : {}}
                        data-testid="tab-bracket"
                    >
                        <GitBranch size={15} /> Bracket
                    </button>
                    <button
                        onClick={() => setActiveTab('games-list')}
                        className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'games-list'
                                ? 'border-current text-white'
                                : 'border-transparent text-white/35 hover:text-white/60'
                        }`}
                        style={activeTab === 'games-list' ? { borderColor: 'var(--primary-color, #3b82f6)' } : {}}
                        data-testid="tab-games-list"
                    >
                        <List size={15} /> Games List
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {activeTab === 'bracket' ? <BracketView /> : <GamesListView />}
            </div>

            {/* Add Team Modal */}
            {showAddTeam && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" data-testid="add-team-modal">
                    <div className="rounded-xl border border-white/10 w-96 max-h-[80vh] overflow-hidden shadow-2xl" style={{ background: '#141822' }}>
                        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Add Team to Tournament</h3>
                            <button onClick={() => setShowAddTeam(false)} className="p-1 rounded hover:bg-white/10 text-white/40">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 max-h-72 overflow-y-auto space-y-1">
                            {teams?.filter(team => !bracketData.teams.find(t => t.id === team.id)).map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => addTeamToBracket(team.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                                    data-testid={`add-team-option-${team.id}`}
                                >
                                    {team.style?.logoUrl ? (
                                        <img src={team.style.logoUrl} alt="" className="w-8 h-8 rounded object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: 'var(--primary-color, #3b82f6)', color: '#fff', opacity: 0.6 }}>
                                            {team.name?.[0]}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-white/80">{team.name}</div>
                                        {team.division && <div className="text-xs text-white/30">{team.division}</div>}
                                    </div>
                                </button>
                            )) || (
                                <div className="text-center py-6 text-white/30 text-sm">No available teams</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentBracketBuilder;
