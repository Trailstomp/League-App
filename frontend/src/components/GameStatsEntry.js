import React, { useState, useEffect } from 'react';

const GameStatsEntry = ({ event, teams = [], players = [], currentUser, onClose }) => {
    const [gameStats, setGameStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedHomeTeam, setSelectedHomeTeam] = useState(null);
    const [selectedAwayTeam, setSelectedAwayTeam] = useState(null);
    const [homeRoster, setHomeRoster] = useState([]);
    const [awayRoster, setAwayRoster] = useState([]);
    const [isLive, setIsLive] = useState(false);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        loadExistingStats();
        // Auto-save every 30 seconds when live
        const interval = setInterval(() => {
            if (isLive && gameStats) {
                saveStats(false); // Silent save
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [isLive]);

    const loadExistingStats = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${event.id}/game-stats`);
            const data = await response.json();
            
            if (data.status === 'success' && data.stats) {
                setGameStats(data.stats);
                setIsLive(data.stats.is_live || false);
                
                // Set teams from existing stats
                const homeTeam = teams.find(t => t.id === data.stats.home_team.team_id);
                const awayTeam = data.stats.away_team ? teams.find(t => t.id === data.stats.away_team.team_id) : null;
                setSelectedHomeTeam(homeTeam);
                setSelectedAwayTeam(awayTeam);
                
                // Set rosters
                if (homeTeam) loadRoster(homeTeam.id, 'home');
                if (awayTeam) loadRoster(awayTeam.id, 'away');
            } else {
                // Initialize new game stats
                initializeNewStats();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            initializeNewStats();
        } finally {
            setLoading(false);
        }
    };

    const initializeNewStats = () => {
        // Try to get teams from event
        let homeTeam = null;
        let awayTeam = null;
        
        if (event.teamIds && event.teamIds.length > 0) {
            homeTeam = teams.find(t => t.id === event.teamIds[0]);
            if (event.teamIds.length > 1) {
                awayTeam = teams.find(t => t.id === event.teamIds[1]);
            }
        }
        
        setSelectedHomeTeam(homeTeam);
        setSelectedAwayTeam(awayTeam);
        
        if (homeTeam) loadRoster(homeTeam.id, 'home');
        if (awayTeam) loadRoster(awayTeam.id, 'away');
        
        setGameStats({
            event_id: event.id,
            game_date: event.date,
            status: 'in_progress',
            home_team: {
                team_id: homeTeam?.id || '',
                team_name: homeTeam?.name || '',
                goals_for: 0,
                goals_against: 0,
                result: 'pending',
                players: [],
                goalies: []
            },
            away_team: awayTeam ? {
                team_id: awayTeam.id,
                team_name: awayTeam.name,
                goals_for: 0,
                goals_against: 0,
                result: 'pending',
                players: [],
                goalies: []
            } : null,
            entered_by: currentUser?.id || 'unknown',
            is_live: false
        });
    };

    const loadRoster = async (teamId, side) => {
        // Get players for this team
        const teamPlayers = players.filter(p => p.teamId === teamId);
        
        // Get RSVPs for this event
        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${event.id}/rsvps`);
            const rsvpData = await response.json();
            const acceptedIds = rsvpData.rsvps
                ?.filter(r => r.response === 'yes')
                .map(r => r.user_id) || [];
            
            // Mark who accepted
            const rosterWithRSVP = teamPlayers.map(p => ({
                ...p,
                hasAccepted: acceptedIds.includes(p.id)
            }));
            
            if (side === 'home') {
                setHomeRoster(rosterWithRSVP);
            } else {
                setAwayRoster(rosterWithRSVP);
            }
        } catch (error) {
            console.error('Error loading roster:', error);
            if (side === 'home') {
                setHomeRoster(teamPlayers);
            } else {
                setAwayRoster(teamPlayers);
            }
        }
    };

    const handleTeamChange = (teamId, side) => {
        const team = teams.find(t => t.id === teamId);
        if (side === 'home') {
            setSelectedHomeTeam(team);
            loadRoster(teamId, 'home');
            setGameStats({
                ...gameStats,
                home_team: {
                    ...gameStats.home_team,
                    team_id: team.id,
                    team_name: team.name
                }
            });
        } else {
            setSelectedAwayTeam(team);
            loadRoster(teamId, 'away');
            setGameStats({
                ...gameStats,
                away_team: {
                    team_id: team.id,
                    team_name: team.name,
                    goals_for: 0,
                    goals_against: 0,
                    result: 'pending',
                    players: [],
                    goalies: []
                }
            });
        }
    };

    const addPlayerToStats = (player, side) => {
        const teamKey = side === 'home' ? 'home_team' : 'away_team';
        const playerStats = {
            player_id: player.id,
            player_name: player.name,
            jersey_number: player.jerseyNumber,
            position: player.position,
            shots: 0,
            goals: 0,
            ground_balls: 0,
            was_present: true
        };
        
        setGameStats({
            ...gameStats,
            [teamKey]: {
                ...gameStats[teamKey],
                players: [...gameStats[teamKey].players, playerStats]
            }
        });
    };

    const addGoalieToStats = (player, side) => {
        const teamKey = side === 'home' ? 'home_team' : 'away_team';
        const goalieStats = {
            player_id: player.id,
            player_name: player.name,
            jersey_number: player.jerseyNumber,
            periods_played: [],
            minutes_played: 0,
            shots_on_goal: 0,
            saves: 0,
            goals_allowed: 0
        };
        
        setGameStats({
            ...gameStats,
            [teamKey]: {
                ...gameStats[teamKey],
                goalies: [...gameStats[teamKey].goalies, goalieStats]
            }
        });
    };

    const updatePlayerStat = (playerId, stat, value, side) => {
        const teamKey = side === 'home' ? 'home_team' : 'away_team';
        const updatedPlayers = gameStats[teamKey].players.map(p =>
            p.player_id === playerId ? { ...p, [stat]: parseInt(value) || 0 } : p
        );
        
        setGameStats({
            ...gameStats,
            [teamKey]: {
                ...gameStats[teamKey],
                players: updatedPlayers
            }
        });
        
        // Auto-calculate team totals
        calculateTeamTotals(side);
    };

    const updateGoalieStat = (playerId, stat, value, side) => {
        const teamKey = side === 'home' ? 'home_team' : 'away_team';
        const updatedGoalies = gameStats[teamKey].goalies.map(g =>
            g.player_id === playerId ? { ...g, [stat]: value } : g
        );
        
        setGameStats({
            ...gameStats,
            [teamKey]: {
                ...gameStats[teamKey],
                goalies: updatedGoalies
            }
        });
    };

    const togglePeriod = (playerId, period, side) => {
        const teamKey = side === 'home' ? 'home_team' : 'away_team';
        const updatedGoalies = gameStats[teamKey].goalies.map(g => {
            if (g.player_id === playerId) {
                const periods = g.periods_played || [];
                const newPeriods = periods.includes(period)
                    ? periods.filter(p => p !== period)
                    : [...periods, period].sort();
                return { ...g, periods_played: newPeriods };
            }
            return g;
        });
        
        setGameStats({
            ...gameStats,
            [teamKey]: {
                ...gameStats[teamKey],
                goalies: updatedGoalies
            }
        });
    };

    const calculateTeamTotals = (side) => {
        const teamKey = side === 'home' ? 'home_team' : 'away_team';
        const players = gameStats[teamKey].players;
        const totalGoals = players.reduce((sum, p) => sum + (p.goals || 0), 0);
        
        const otherSide = side === 'home' ? 'away_team' : 'home_team';
        const opponentGoals = gameStats[otherSide]?.goals_for || 0;
        
        let result = 'pending';
        if (gameStats.status === 'final') {
            if (totalGoals > opponentGoals) result = 'win';
            else if (totalGoals < opponentGoals) result = 'loss';
            else result = 'tie';
        }
        
        setGameStats({
            ...gameStats,
            [teamKey]: {
                ...gameStats[teamKey],
                goals_for: totalGoals,
                goals_against: opponentGoals,
                result: result
            },
            [otherSide]: gameStats[otherSide] ? {
                ...gameStats[otherSide],
                goals_against: totalGoals,
                result: result === 'win' ? 'loss' : result === 'loss' ? 'win' : result
            } : null
        });
    };

    const saveStats = async (showNotification = true) => {
        setSaving(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/events/${event.id}/game-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...gameStats,
                    is_live: isLive
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success' && showNotification) {
                alert('Stats saved successfully!');
            }
        } catch (error) {
            console.error('Error saving stats:', error);
            if (showNotification) {
                alert('Error saving stats');
            }
        } finally {
            setSaving(false);
        }
    };

    const markFinal = async () => {
        if (window.confirm('Mark this game as final? This will update team standings.')) {
            calculateTeamTotals('home');
            if (gameStats.away_team) calculateTeamTotals('away');
            
            setGameStats({
                ...gameStats,
                status: 'final',
                is_live: false
            });
            
            // Save immediately
            await saveStats(true);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading stats...</div>;
    }

    if (!gameStats) {
        return <div className="p-8 text-center">Unable to load game stats</div>;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen px-4 py-8">
                <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{event.title}</h2>
                                <p className="text-blue-100">{event.date} • {event.location}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={isLive}
                                        onChange={(e) => setIsLive(e.target.checked)}
                                        className="w-5 h-5"
                                    />
                                    <span className="font-medium">🔴 Live</span>
                                </label>
                                <button
                                    onClick={onClose}
                                    className="text-white hover:text-gray-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Score Display */}
                    <div className="bg-gray-100 p-6 border-b">
                        <div className="flex items-center justify-center space-x-8">
                            <div className="text-center">
                                <div className="text-sm text-gray-600 mb-2">Home</div>
                                <div className="text-4xl font-bold text-blue-600">
                                    {gameStats.home_team.goals_for}
                                </div>
                                <div className="text-lg font-semibold mt-2">
                                    {gameStats.home_team.team_name}
                                </div>
                            </div>
                            <div className="text-2xl text-gray-400">vs</div>
                            <div className="text-center">
                                <div className="text-sm text-gray-600 mb-2">Away</div>
                                <div className="text-4xl font-bold text-red-600">
                                    {gameStats.away_team?.goals_for || 0}
                                </div>
                                <div className="text-lg font-semibold mt-2">
                                    {gameStats.away_team?.team_name || 'TBD'}
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                gameStats.status === 'final' ? 'bg-green-100 text-green-800' :
                                isLive ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'
                            }`}>
                                {gameStats.status === 'final' ? 'Final' : isLive ? 'Live' : 'In Progress'}
                            </span>
                        </div>
                    </div>

                    {/* Stats Entry */}
                    <div className="p-6 space-y-8">
                        {/* Home Team Stats */}
                        <div className="border-2 border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-blue-700">
                                    {gameStats.home_team.team_name || 'Home Team'}
                                </h3>
                                <select
                                    value={gameStats.home_team.team_id}
                                    onChange={(e) => handleTeamChange(e.target.value, 'home')}
                                    className="px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Select Team</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Add Players */}
                            <div className="mb-4 flex gap-2 flex-wrap">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const player = homeRoster.find(p => p.id === e.target.value);
                                            if (player) addPlayerToStats(player, 'home');
                                            e.target.value = '';
                                        }
                                    }}
                                    className="px-3 py-2 border rounded-lg"
                                >
                                    <option value="">+ Add Player</option>
                                    {homeRoster.filter(p => !gameStats.home_team.players.find(ps => ps.player_id === p.id)).map(player => (
                                        <option key={player.id} value={player.id}>
                                            {player.name} {player.hasAccepted ? '✓' : ''}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const player = homeRoster.find(p => p.id === e.target.value);
                                            if (player) addGoalieToStats(player, 'home');
                                            e.target.value = '';
                                        }
                                    }}
                                    className="px-3 py-2 border rounded-lg"
                                >
                                    <option value="">+ Add Goalie</option>
                                    {homeRoster.filter(p => !gameStats.home_team.goalies.find(gs => gs.player_id === p.id)).map(player => (
                                        <option key={player.id} value={player.id}>
                                            {player.name} {player.hasAccepted ? '✓' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Players Table */}
                            {gameStats.home_team.players.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold mb-2">Field Players</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-2 py-2 text-left">Player</th>
                                                    <th className="px-2 py-2 text-center">#</th>
                                                    <th className="px-2 py-2 text-center">Shots</th>
                                                    <th className="px-2 py-2 text-center">Goals</th>
                                                    <th className="px-2 py-2 text-center">GB</th>
                                                    <th className="px-2 py-2 text-center">Present</th>
                                                    <th className="px-2 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gameStats.home_team.players.map((player, idx) => (
                                                    <tr key={player.player_id} className="border-b hover:bg-gray-50">
                                                        <td className="px-2 py-2">{player.player_name}</td>
                                                        <td className="px-2 py-2 text-center">{player.jersey_number || '-'}</td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={player.shots}
                                                                onChange={(e) => updatePlayerStat(player.player_id, 'shots', e.target.value, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={player.goals}
                                                                onChange={(e) => updatePlayerStat(player.player_id, 'goals', e.target.value, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={player.ground_balls}
                                                                onChange={(e) => updatePlayerStat(player.player_id, 'ground_balls', e.target.value, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={player.was_present}
                                                                onChange={(e) => updatePlayerStat(player.player_id, 'was_present', e.target.checked, 'home')}
                                                                className="w-5 h-5"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <button
                                                                onClick={() => {
                                                                    setGameStats({
                                                                        ...gameStats,
                                                                        home_team: {
                                                                            ...gameStats.home_team,
                                                                            players: gameStats.home_team.players.filter(p => p.player_id !== player.player_id)
                                                                        }
                                                                    });
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                ×
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Goalies Table */}
                            {gameStats.home_team.goalies.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Goalies</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="px-2 py-2 text-left">Goalie</th>
                                                    <th className="px-2 py-2 text-center">#</th>
                                                    <th className="px-2 py-2 text-center">Periods</th>
                                                    <th className="px-2 py-2 text-center">Min</th>
                                                    <th className="px-2 py-2 text-center">SOG</th>
                                                    <th className="px-2 py-2 text-center">Saves</th>
                                                    <th className="px-2 py-2 text-center">GA</th>
                                                    <th className="px-2 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {gameStats.home_team.goalies.map((goalie) => (
                                                    <tr key={goalie.player_id} className="border-b hover:bg-gray-50">
                                                        <td className="px-2 py-2">{goalie.player_name}</td>
                                                        <td className="px-2 py-2 text-center">{goalie.jersey_number || '-'}</td>
                                                        <td className="px-2 py-2">
                                                            <div className="flex gap-1 justify-center">
                                                                {[1,2,3,4].map(period => (
                                                                    <button
                                                                        key={period}
                                                                        onClick={() => togglePeriod(goalie.player_id, period, 'home')}
                                                                        className={`w-8 h-8 rounded ${
                                                                            goalie.periods_played?.includes(period)
                                                                                ? 'bg-blue-600 text-white'
                                                                                : 'bg-gray-200'
                                                                        }`}
                                                                    >
                                                                        {period}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={goalie.minutes_played}
                                                                onChange={(e) => updateGoalieStat(goalie.player_id, 'minutes_played', parseInt(e.target.value) || 0, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={goalie.shots_on_goal}
                                                                onChange={(e) => updateGoalieStat(goalie.player_id, 'shots_on_goal', parseInt(e.target.value) || 0, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={goalie.saves}
                                                                onChange={(e) => updateGoalieStat(goalie.player_id, 'saves', parseInt(e.target.value) || 0, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={goalie.goals_allowed}
                                                                onChange={(e) => updateGoalieStat(goalie.player_id, 'goals_allowed', parseInt(e.target.value) || 0, 'home')}
                                                                className="w-16 px-2 py-1 border rounded text-center"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <button
                                                                onClick={() => {
                                                                    setGameStats({
                                                                        ...gameStats,
                                                                        home_team: {
                                                                            ...gameStats.home_team,
                                                                            goalies: gameStats.home_team.goalies.filter(g => g.player_id !== goalie.player_id)
                                                                        }
                                                                    });
                                                                }}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                ×
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Away Team Stats - Similar structure */}
                        {gameStats.away_team && (
                            <div className="border-2 border-red-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-red-700">
                                        {gameStats.away_team.team_name || 'Away Team'}
                                    </h3>
                                    <select
                                        value={gameStats.away_team.team_id}
                                        onChange={(e) => handleTeamChange(e.target.value, 'away')}
                                        className="px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Team</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Add Players */}
                                <div className="mb-4 flex gap-2 flex-wrap">
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const player = awayRoster.find(p => p.id === e.target.value);
                                                if (player) addPlayerToStats(player, 'away');
                                                e.target.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">+ Add Player</option>
                                        {awayRoster.filter(p => !gameStats.away_team.players.find(ps => ps.player_id === p.id)).map(player => (
                                            <option key={player.id} value={player.id}>
                                                {player.name} {player.hasAccepted ? '✓' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const player = awayRoster.find(p => p.id === e.target.value);
                                                if (player) addGoalieToStats(player, 'away');
                                                e.target.value = '';
                                            }
                                        }}
                                        className="px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">+ Add Goalie</option>
                                        {awayRoster.filter(p => !gameStats.away_team.goalies.find(gs => gs.player_id === p.id)).map(player => (
                                            <option key={player.id} value={player.id}>
                                                {player.name} {player.hasAccepted ? '✓' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Players & Goalies Tables - Same as home team */}
                                {gameStats.away_team.players.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-semibold mb-2">Field Players</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-2 py-2 text-left">Player</th>
                                                        <th className="px-2 py-2 text-center">#</th>
                                                        <th className="px-2 py-2 text-center">Shots</th>
                                                        <th className="px-2 py-2 text-center">Goals</th>
                                                        <th className="px-2 py-2 text-center">GB</th>
                                                        <th className="px-2 py-2 text-center">Present</th>
                                                        <th className="px-2 py-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gameStats.away_team.players.map((player) => (
                                                        <tr key={player.player_id} className="border-b hover:bg-gray-50">
                                                            <td className="px-2 py-2">{player.player_name}</td>
                                                            <td className="px-2 py-2 text-center">{player.jersey_number || '-'}</td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={player.shots}
                                                                    onChange={(e) => updatePlayerStat(player.player_id, 'shots', e.target.value, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={player.goals}
                                                                    onChange={(e) => updatePlayerStat(player.player_id, 'goals', e.target.value, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={player.ground_balls}
                                                                    onChange={(e) => updatePlayerStat(player.player_id, 'ground_balls', e.target.value, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={player.was_present}
                                                                    onChange={(e) => updatePlayerStat(player.player_id, 'was_present', e.target.checked, 'away')}
                                                                    className="w-5 h-5"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setGameStats({
                                                                            ...gameStats,
                                                                            away_team: {
                                                                                ...gameStats.away_team,
                                                                                players: gameStats.away_team.players.filter(p => p.player_id !== player.player_id)
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    ×
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Away Goalies Table */}
                                {gameStats.away_team.goalies.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Goalies</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-2 py-2 text-left">Goalie</th>
                                                        <th className="px-2 py-2 text-center">#</th>
                                                        <th className="px-2 py-2 text-center">Periods</th>
                                                        <th className="px-2 py-2 text-center">Min</th>
                                                        <th className="px-2 py-2 text-center">SOG</th>
                                                        <th className="px-2 py-2 text-center">Saves</th>
                                                        <th className="px-2 py-2 text-center">GA</th>
                                                        <th className="px-2 py-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {gameStats.away_team.goalies.map((goalie) => (
                                                        <tr key={goalie.player_id} className="border-b hover:bg-gray-50">
                                                            <td className="px-2 py-2">{goalie.player_name}</td>
                                                            <td className="px-2 py-2 text-center">{goalie.jersey_number || '-'}</td>
                                                            <td className="px-2 py-2">
                                                                <div className="flex gap-1 justify-center">
                                                                    {[1,2,3,4].map(period => (
                                                                        <button
                                                                            key={period}
                                                                            onClick={() => togglePeriod(goalie.player_id, period, 'away')}
                                                                            className={`w-8 h-8 rounded ${
                                                                                goalie.periods_played?.includes(period)
                                                                                    ? 'bg-red-600 text-white'
                                                                                    : 'bg-gray-200'
                                                                            }`}
                                                                        >
                                                                            {period}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={goalie.minutes_played}
                                                                    onChange={(e) => updateGoalieStat(goalie.player_id, 'minutes_played', parseInt(e.target.value) || 0, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={goalie.shots_on_goal}
                                                                    onChange={(e) => updateGoalieStat(goalie.player_id, 'shots_on_goal', parseInt(e.target.value) || 0, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={goalie.saves}
                                                                    onChange={(e) => updateGoalieStat(goalie.player_id, 'saves', parseInt(e.target.value) || 0, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={goalie.goals_allowed}
                                                                    onChange={(e) => updateGoalieStat(goalie.player_id, 'goals_allowed', parseInt(e.target.value) || 0, 'away')}
                                                                    className="w-16 px-2 py-1 border rounded text-center"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setGameStats({
                                                                            ...gameStats,
                                                                            away_team: {
                                                                                ...gameStats.away_team,
                                                                                goalies: gameStats.away_team.goalies.filter(g => g.player_id !== goalie.player_id)
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    ×
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-50 p-6 rounded-b-lg flex justify-between">
                        <button
                            onClick={() => saveStats(true)}
                            disabled={saving}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Stats'}
                        </button>
                        <button
                            onClick={markFinal}
                            disabled={gameStats.status === 'final'}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            Mark as Final
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameStatsEntry;
