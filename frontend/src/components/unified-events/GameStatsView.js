import React, { useState, useEffect } from 'react';

const GameStatsView = ({ eventId, teams = [], compact = false }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('box');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    useEffect(() => {
        if (!eventId) return;
        const load = async () => {
            setLoading(true);
            try {
                // Try game_stats first
                const r = await fetch(`${backendUrl}/api/events/${eventId}/game-stats`);
                if (r.ok) {
                    const data = await r.json();
                    if (data.stats) { setStats(data.stats); setLoading(false); return; }
                }
                // Fall back to event inline scores
                const er = await fetch(`${backendUrl}/api/unified-events/${eventId}`);
                if (er.ok) {
                    const event = await er.json();
                    if (event.scores) {
                        setStats({ ...event.scores, event_id: eventId, from_event: true });
                    }
                }
            } catch (e) { console.error('Error loading game stats:', e); }
            setLoading(false);
        };
        load();
    }, [eventId, backendUrl]);

    if (loading) return <div className="text-center py-6 text-sm text-slate-400">Loading stats...</div>;
    if (!stats) return <div className="text-center py-6 text-sm text-slate-400">No game stats available</div>;

    const homeTeam = stats.home_team || {};
    const awayTeam = stats.away_team || {};
    const homeInfo = teams.find(t => t.id === homeTeam.team_id || t.id === homeTeam.id) || {};
    const awayInfo = teams.find(t => t.id === awayTeam.team_id || t.id === awayTeam.id) || {};
    const homePlayers = homeTeam.players || [];
    const awayPlayers = awayTeam.players || [];
    const gameEvents = stats.game_events || stats.gameEvents || [];

    const calcPoints = (p) => ((p.goals || p.stats?.goals || 0) * 2) + (p.assists || p.stats?.assists || 0);
    const getStat = (p, key) => p[key] ?? p.stats?.[key] ?? 0;

    // Calculate "on field when scored" / "on field when scored on" from game events
    const calcOnFieldStats = (players, teamKey, isHome) => {
        const onFieldMap = {};
        players.forEach(p => {
            const pid = p.player_id || p.id;
            onFieldMap[pid] = { forGoals: 0, againstGoals: 0 };
        });

        const scoringKey = isHome ? 'home_team' : 'away_team';
        const defendingKey = isHome ? 'away_team' : 'home_team';

        gameEvents.forEach(evt => {
            if (evt.type !== 'goal' || !evt.metadata?.playersOnField) return;
            const pof = evt.metadata.playersOnField;
            // If this team was the scoring team
            if (pof.scoringTeamKey === scoringKey && pof.scoring) {
                pof.scoring.forEach(pid => {
                    if (onFieldMap[pid]) onFieldMap[pid].forGoals += 1;
                });
            }
            // If this team was the defending team (scored on)
            if (pof.defendingTeamKey === scoringKey && pof.defending) {
                pof.defending.forEach(pid => {
                    if (onFieldMap[pid]) onFieldMap[pid].againstGoals += 1;
                });
            }
            // Also check the reverse: if this team is the defending side
            if (pof.scoringTeamKey === defendingKey && pof.defending) {
                pof.defending.forEach(pid => {
                    if (onFieldMap[pid]) onFieldMap[pid].againstGoals += 1;
                });
            }
            if (pof.defendingTeamKey === defendingKey && pof.scoring) {
                pof.scoring.forEach(pid => {
                    if (onFieldMap[pid]) onFieldMap[pid].forGoals += 1;
                });
            }
        });
        return onFieldMap;
    };

    const hasOnFieldData = gameEvents.some(e => e.type === 'goal' && e.metadata?.playersOnField);

    const PlayerStatsTable = ({ players, teamName, teamColor, isHome }) => {
        if (!players.length) return <div className="text-xs text-slate-400 py-2">No player stats</div>;
        const sorted = [...players].sort((a, b) => calcPoints(b) - calcPoints(a));
        const onFieldMap = hasOnFieldData ? calcOnFieldStats(players, teamName, isHome) : null;
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-xs" data-testid={`stats-table-${teamName}`}>
                    <thead>
                        <tr className="border-b" style={{ backgroundColor: `${teamColor || '#3b82f6'}15` }}>
                            <th className="text-left px-2 py-1.5 font-semibold text-slate-700">#</th>
                            <th className="text-left px-2 py-1.5 font-semibold text-slate-700">Player</th>
                            <th className="text-center px-1.5 py-1.5 font-semibold text-slate-700">Goals</th>
                            <th className="text-center px-1.5 py-1.5 font-semibold text-slate-700">Assists</th>
                            <th className="text-center px-1.5 py-1.5 font-semibold text-indigo-600">Pts</th>
                            <th className="text-center px-1.5 py-1.5 font-semibold text-slate-700">Shots</th>
                            {hasOnFieldData && (
                                <>
                                    <th className="text-center px-1.5 py-1.5 font-semibold text-green-700" title="On field when team scored">OF+</th>
                                    <th className="text-center px-1.5 py-1.5 font-semibold text-red-700" title="On field when scored on">OF-</th>
                                </>
                            )}
                            <th className="text-center px-1.5 py-1.5 font-semibold text-slate-700 hidden sm:table-cell">Faceoffs</th>
                            <th className="text-center px-1.5 py-1.5 font-semibold text-slate-700 hidden sm:table-cell">Ground Balls</th>
                            <th className="text-center px-1.5 py-1.5 font-semibold text-slate-700">Pen Min</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sorted.map((p, i) => {
                            const pid = p.player_id || p.id;
                            const ofStats = onFieldMap?.[pid];
                            return (
                                <tr key={pid || i} className="hover:bg-slate-50">
                                    <td className="px-2 py-1.5 text-slate-500">{p.jersey_number || p.number || '-'}</td>
                                    <td className="px-2 py-1.5 font-medium text-slate-800">{p.player_name || p.name || 'Unknown'}</td>
                                    <td className="text-center px-1.5 py-1.5 font-semibold text-green-700">{getStat(p, 'goals')}</td>
                                    <td className="text-center px-1.5 py-1.5 text-blue-600">{getStat(p, 'assists')}</td>
                                    <td className="text-center px-1.5 py-1.5 font-bold text-indigo-600">{calcPoints(p)}</td>
                                    <td className="text-center px-1.5 py-1.5 text-slate-600">{getStat(p, 'shots')}</td>
                                    {hasOnFieldData && (
                                        <>
                                            <td className="text-center px-1.5 py-1.5 font-semibold text-green-700">{ofStats?.forGoals || 0}</td>
                                            <td className="text-center px-1.5 py-1.5 font-semibold text-red-700">{ofStats?.againstGoals || 0}</td>
                                        </>
                                    )}
                                    <td className="text-center px-1.5 py-1.5 text-slate-600 hidden sm:table-cell">{getStat(p, 'faceoffs')}</td>
                                    <td className="text-center px-1.5 py-1.5 text-slate-600 hidden sm:table-cell">{getStat(p, 'groundBalls') || getStat(p, 'ground_balls')}</td>
                                    <td className="text-center px-1.5 py-1.5 text-red-600">{getStat(p, 'penalties')}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-3" data-testid="game-stats-view">
            {/* Score Header */}
            <div className="bg-slate-800 text-white rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {homeInfo.style?.logoUrl && <img src={homeInfo.style.logoUrl} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />}
                        <span className="font-semibold text-sm truncate">{homeTeam.name || homeInfo.name || 'Home'}</span>
                    </div>
                    <div className="flex items-center gap-3 px-4">
                        <span className="text-2xl font-bold">{homeTeam.score ?? homeTeam.goals_for ?? '-'}</span>
                        <span className="text-slate-400 text-sm">-</span>
                        <span className="text-2xl font-bold">{awayTeam.score ?? awayTeam.goals_for ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="font-semibold text-sm truncate">{awayTeam.name || awayInfo.name || 'Away'}</span>
                        {awayInfo.style?.logoUrl && <img src={awayInfo.style.logoUrl} alt="" className="w-8 h-8 rounded-full object-contain bg-white" />}
                    </div>
                </div>
                <div className="text-center text-xs text-slate-400 mt-1">
                    {stats.status === 'final' ? 'FINAL' : stats.status?.toUpperCase() || ''}
                </div>
            </div>

            {/* Tabs */}
            {!compact && (
                <div className="flex border-b border-slate-200">
                    {[{ key: 'box', label: 'Box Score' }, { key: 'log', label: 'Game Log' }].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                                activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                            data-testid={`stats-tab-${tab.key}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Box Score */}
            {(compact || activeTab === 'box') && (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 px-1" style={{ color: homeInfo.style?.primaryColor }}>
                            {homeTeam.name || homeInfo.name || 'Home Team'}
                        </h4>
                        <PlayerStatsTable players={homePlayers} teamName="home" teamColor={homeInfo.style?.primaryColor} isHome={true} />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 px-1" style={{ color: awayInfo.style?.primaryColor }}>
                            {awayTeam.name || awayInfo.name || 'Away Team'}
                        </h4>
                        <PlayerStatsTable players={awayPlayers} teamName="away" teamColor={awayInfo.style?.primaryColor} isHome={false} />
                    </div>
                </div>
            )}

            {/* Game Log */}
            {!compact && activeTab === 'log' && (
                <div className="space-y-1" data-testid="game-event-log">
                    {gameEvents.length === 0 ? (
                        <div className="text-center py-6 text-sm text-slate-400">No game events recorded</div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto">
                            {[...gameEvents].reverse().map((evt, i) => (
                                <div key={i} className="flex items-start gap-2 px-2 py-1.5 text-xs border-b border-slate-50 hover:bg-slate-50">
                                    <span className="text-slate-400 w-12 flex-shrink-0 text-right">{evt.time || evt.timestamp || ''}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${
                                        evt.type === 'goal' ? 'bg-green-100 text-green-700' :
                                        evt.type === 'penalty' || evt.type === 'penalty_start' ? 'bg-red-100 text-red-700' :
                                        evt.type === 'save' || evt.type === 'shot_saved' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {evt.type?.replace('_', ' ') || 'event'}
                                    </span>
                                    <span className="text-slate-700">{evt.description || evt.text || evt.message || ''}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameStatsView;
