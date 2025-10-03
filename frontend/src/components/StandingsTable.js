import React, { useState, useEffect } from 'react';

const StandingsTable = ({ teams = [], onTeamClick }) => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDivision, setSelectedDivision] = useState('all');
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        loadSeasons();
    }, []);

    useEffect(() => {
        if (selectedSeason) {
            loadStandings();
        }
    }, [selectedSeason]);

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
            }
        } catch (error) {
            console.error('Error loading seasons:', error);
        }
    };

    const loadStandings = async () => {
        try {
            const url = selectedSeason 
                ? `${BACKEND_URL}/api/league/standings?season_id=${selectedSeason}`
                : `${BACKEND_URL}/api/league/standings`;
            const response = await fetch(url);
            const data = await response.json();
            setStandings(data.standings || []);
        } catch (error) {
            console.error('Error loading standings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStandings = selectedDivision === 'all'
        ? standings
        : standings.filter(team => team.division === selectedDivision);

    const divisions = ['all', ...new Set(standings.map(t => t.division).filter(Boolean))];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading standings...</div>
            </div>
        );
    }

    if (standings.length === 0) {
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

    return (
        <div className="space-y-6">
            {/* Season & Division Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800">League Standings</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Season Selector */}
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
                    
                    {/* Division Filter */}
                    <select
                        value={selectedDivision}
                        onChange={(e) => setSelectedDivision(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {divisions.map(div => (
                            <option key={div} value={div}>
                                {div === 'all' ? 'All Divisions' : `${div} Division`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Standings Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                            {filteredStandings.map((team, index) => (
                                <tr
                                    key={team.team_id}
                                    onClick={() => onTeamClick && onTeamClick(team.team_id)}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                                index === 2 ? 'bg-orange-400 text-orange-900' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {team.rank}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">{team.team_name}</div>
                                            {team.division && (
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

            {/* Legend */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
