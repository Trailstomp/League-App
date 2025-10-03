import React, { useState, useEffect } from 'react';

const StandingsTable = ({ teams = [], onTeamClick }) => {
    const [standings, setStandings] = useState([]);
    const [standingsByDivision, setStandingsByDivision] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDivision, setSelectedDivision] = useState('all');
    const [selectedLeague, setSelectedLeague] = useState('main_league');
    const [viewMode, setViewMode] = useState('divisions'); // 'divisions' or 'overall'
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [leagues, setLeagues] = useState([]);
    const [divisions, setDivisions] = useState([]);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        loadLeagues();
        loadSeasons();
    }, []);

    useEffect(() => {
        if (selectedLeague) {
            loadDivisions();
        }
    }, [selectedLeague]);

    useEffect(() => {
        if (selectedSeason) {
            loadStandings();
        }
    }, [selectedSeason, selectedLeague, selectedDivision, viewMode]);

    const loadLeagues = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/leagues`);
            const data = await response.json();
            setLeagues(data.leagues || []);
            
            // Set main league as default if available
            const mainLeague = data.leagues.find(l => l.id === 'main_league');
            if (mainLeague) {
                setSelectedLeague(mainLeague.id);
            } else if (data.leagues.length > 0) {
                setSelectedLeague(data.leagues[0].id);
            }
        } catch (error) {
            console.error('Error loading leagues:', error);
        }
    };

    const loadDivisions = async () => {
        if (!selectedLeague) return;
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/leagues/${selectedLeague}/divisions`);
            const data = await response.json();
            setDivisions(data.divisions || []);
        } catch (error) {
            console.error('Error loading divisions:', error);
        }
    };

    const loadSeasons = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/seasons`);
            const data = await response.json();
            setSeasons(data.seasons || []);
            
            // Set active season as default
            const activeSeason = data.seasons.find(s => s.is_active);
            if (activeSeason) {
                setSelectedSeason(activeSeason.id);
            } else if (data.seasons.length > 0) {
                setSelectedSeason(data.seasons[0].id);
            } else {
                // No seasons exist yet, still load standings without filter
                setSelectedSeason('all');
                loadStandings();
            }
        } catch (error) {
            console.error('Error loading seasons:', error);
            // On error, load standings without filter
            setSelectedSeason('all');
            loadStandings();
        }
    };

    const loadStandings = async () => {
        try {
            setLoading(true);
            
            if (viewMode === 'divisions') {
                // Load standings grouped by divisions
                const url = `${BACKEND_URL}/api/leagues/${selectedLeague}/standings${selectedSeason && selectedSeason !== 'all' ? `?season_id=${selectedSeason}` : ''}`;
                const response = await fetch(url);
                const data = await response.json();
                setStandingsByDivision(data.standings_by_division || {});
                setStandings([]); // Clear overall standings
            } else {
                // Load overall standings
                let url = `${BACKEND_URL}/api/league/standings?league_id=${selectedLeague}`;
                if (selectedDivision && selectedDivision !== 'all') {
                    url += `&division_id=${selectedDivision}`;
                }
                if (selectedSeason && selectedSeason !== 'all') {
                    url += `&season_id=${selectedSeason}`;
                }
                
                const response = await fetch(url);
                const data = await response.json();
                setStandings(data.standings || []);
                setStandingsByDivision({}); // Clear division standings
            }
        } catch (error) {
            console.error('Error loading standings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle data for display based on view mode
    const getDisplayData = () => {
        if (viewMode === 'divisions' && Object.keys(standingsByDivision).length > 0) {
            return { byDivision: true, data: standingsByDivision };
        } else if (standings.length > 0) {
            const filtered = selectedDivision === 'all'
                ? standings
                : standings.filter(team => team.division_id === selectedDivision || team.division === selectedDivision);
            return { byDivision: false, data: filtered };
        }
        return { byDivision: false, data: [] };
    };

    const displayData = getDisplayData();
    const availableDivisions = ['all', ...divisions.map(d => d.id)];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading standings...</div>
            </div>
        );
    }

    if (!displayData.data || (Array.isArray(displayData.data) && displayData.data.length === 0) || 
        (!Array.isArray(displayData.data) && Object.keys(displayData.data).length === 0)) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Standings Yet</h3>
                <p className="text-gray-500">Game stats haven't been entered yet. Start tracking games to see standings!</p>
            </div>
        );
    }

    const renderStandingsTable = (teams, title = null) => (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            {title && (
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-3">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Team</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">GP</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">W</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">L</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">T</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">GF</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">GA</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">GD</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">PTS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {teams.map((team, index) => (
                            <tr
                                key={team.team_id}
                                onClick={() => onTeamClick && onTeamClick(team.team_id)}
                                className="hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                            (team.division_rank || team.rank) === 1 ? 'bg-yellow-400 text-yellow-900' :
                                            (team.division_rank || team.rank) === 2 ? 'bg-gray-300 text-gray-700' :
                                            (team.division_rank || team.rank) === 3 ? 'bg-orange-400 text-orange-900' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {team.division_rank || team.rank}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-semibold text-gray-900">{team.team_name}</div>
                                        {team.division && !title && (
                                            <div className="text-sm text-gray-500">{team.division}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-700">{team.games_played}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-semibold text-green-600">{team.wins}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-semibold text-red-600">{team.losses}</span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-700">{team.ties}</td>
                                <td className="px-6 py-4 text-center text-gray-700">{team.goals_for}</td>
                                <td className="px-6 py-4 text-center text-gray-700">{team.goals_against}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`font-semibold ${
                                        team.goal_diff > 0 ? 'text-green-600' :
                                        team.goal_diff < 0 ? 'text-red-600' :
                                        'text-gray-600'
                                    }`}>
                                        {team.goal_diff > 0 ? '+' : ''}{team.goal_diff}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-3 py-1 bg-blue-600 text-white font-bold rounded-full">
                                        {team.points}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">League Standings</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* League Selector */}
                    {leagues.length > 1 && (
                        <select
                            value={selectedLeague}
                            onChange={(e) => setSelectedLeague(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {leagues.map(league => (
                                <option key={league.id} value={league.id}>
                                    {league.name}
                                </option>
                            ))}
                        </select>
                    )}
                    
                    {/* View Mode Toggle */}
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="divisions">By Division</option>
                        <option value="overall">Overall</option>
                    </select>
                    
                    {/* Division Filter (only in overall mode) */}
                    {viewMode === 'overall' && divisions.length > 0 && (
                        <select
                            value={selectedDivision}
                            onChange={(e) => setSelectedDivision(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="all">All Divisions</option>
                            {divisions.map(div => (
                                <option key={div.id} value={div.id}>
                                    {div.name}
                                </option>
                            ))}
                        </select>
                    )}
                    
                    {/* Season Selector */}
                    {seasons.length > 0 && (
                        <select
                            value={selectedSeason || ''}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            {seasons.map(season => (
                                <option key={season.id} value={season.id}>
                                    {season.name} {season.is_active ? '(Current)' : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Standings Display */}
            {displayData.byDivision ? (
                // Division-based view
                <div className="space-y-6">
                    {Object.entries(displayData.data).sort(([,a], [,b]) => (a.level || 0) - (b.level || 0)).map(([divisionName, divisionData]) => (
                        <div key={divisionName}>
                            {renderStandingsTable(divisionData.teams, divisionData.division_name)}
                        </div>
                    ))}
                </div>
            ) : (
                // Overall view
                renderStandingsTable(displayData.data)
            )}

            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><strong>GP:</strong> Games Played</div>
                    <div><strong>W:</strong> Wins</div>
                    <div><strong>L:</strong> Losses</div>
                    <div><strong>T:</strong> Ties</div>
                    <div><strong>GF:</strong> Goals For</div>
                    <div><strong>GA:</strong> Goals Against</div>
                    <div><strong>GD:</strong> Goal Differential</div>
                    <div><strong>PTS:</strong> Points (W=2, T=1, L=0)</div>
                </div>
            </div>
        </div>
    );
};

export default StandingsTable;
