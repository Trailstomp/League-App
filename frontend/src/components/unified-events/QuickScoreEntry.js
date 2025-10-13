import React, { useState, useEffect } from 'react';

const QuickScoreEntry = ({ event, onSubmit, onCancel }) => {
    const [scores, setScores] = useState({
        home_team: { id: '', name: '', score: 0 },
        away_team: { id: '', name: '', score: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Initialize team data when component mounts
    useEffect(() => {
        if (event && event.teams && event.teams.length >= 2) {
            // For regular games, use the two teams
            if (event.type === 'regular_game' && event.teams.length === 2) {
                setScores({
                    home_team: { 
                        id: event.teams[0], 
                        name: getTeamName(event.teams[0]), 
                        score: 0 
                    },
                    away_team: { 
                        id: event.teams[1], 
                        name: getTeamName(event.teams[1]), 
                        score: 0 
                    }
                });
            }
        }
    }, [event]);

    const getTeamName = (teamId) => {
        // Get team name from teams prop
        const team = teams?.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const handleScoreChange = (team, value) => {
        const numValue = parseInt(value) || 0;
        setScores(prev => ({
            ...prev,
            [team]: {
                ...prev[team],
                score: Math.max(0, numValue) // Ensure non-negative scores
            }
        }));
        setError(''); // Clear error when user makes changes
    };

    const handleTeamChange = (team, teamId) => {
        setScores(prev => ({
            ...prev,
            [team]: {
                ...prev[team],
                id: teamId,
                name: getTeamName(teamId)
            }
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!scores.home_team.id || !scores.away_team.id) {
            setError('Please select both teams');
            return;
        }

        if (scores.home_team.id === scores.away_team.id) {
            setError('Teams cannot play against themselves');
            return;
        }

        if (scores.home_team.score === scores.away_team.score) {
            setError('Games cannot end in a tie. Please enter a decisive score.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const scoreData = {
                home_team: scores.home_team,
                away_team: scores.away_team,
                final_score: `${scores.home_team.score}-${scores.away_team.score}`,
                winner: scores.home_team.score > scores.away_team.score ? scores.home_team : scores.away_team,
                entry_type: 'quick_score',
                entry_time: new Date().toISOString()
            };

            await onSubmit(scoreData);
        } catch (err) {
            setError(err.message || 'Failed to submit scores');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreAdjustment = (team, adjustment) => {
        setScores(prev => ({
            ...prev,
            [team]: {
                ...prev[team],
                score: Math.max(0, prev[team].score + adjustment)
            }
        }));
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Score Entry</h2>
                    <p className="text-gray-600">{event.title}</p>
                    <div className="text-sm text-gray-500 mt-1">
                        📅 {event.date} • 🕒 {event.time} • 📍 {event.location}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600">❌</span>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}

                {/* Score Entry */}
                <div className="bg-white rounded-lg shadow-lg border p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {/* Home Team */}
                        <div className="text-center">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Home Team
                                </label>
                                {event.type === 'regular_game' ? (
                                    <div className="text-lg font-semibold text-gray-900">
                                        {scores.home_team.name}
                                    </div>
                                ) : (
                                    <select
                                        value={scores.home_team.id}
                                        onChange={(e) => handleTeamChange('home_team', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Team</option>
                                        {event.teams?.map(teamId => (
                                            <option key={teamId} value={teamId}>
                                                {getTeamName(teamId)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Score Controls */}
                            <div className="space-y-4">
                                <div className="text-6xl font-bold text-blue-600">
                                    {scores.home_team.score}
                                </div>
                                
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => handleScoreAdjustment('home_team', -1)}
                                        className="w-12 h-12 bg-red-100 text-red-600 rounded-full hover:bg-red-200 font-bold text-xl"
                                        disabled={scores.home_team.score <= 0}
                                    >
                                        −
                                    </button>
                                    <button
                                        onClick={() => handleScoreAdjustment('home_team', 1)}
                                        className="w-12 h-12 bg-green-100 text-green-600 rounded-full hover:bg-green-200 font-bold text-xl"
                                    >
                                        +
                                    </button>
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    value={scores.home_team.score}
                                    onChange={(e) => handleScoreChange('home_team', e.target.value)}
                                    className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* VS Divider */}
                        <div className="text-center">
                            <div className="text-4xl font-bold text-gray-400 mb-4">VS</div>
                            <div className="text-lg text-gray-600">
                                {scores.home_team.score > scores.away_team.score && scores.home_team.name && (
                                    <div className="text-green-600 font-medium">
                                        {scores.home_team.name} leads
                                    </div>
                                )}
                                {scores.away_team.score > scores.home_team.score && scores.away_team.name && (
                                    <div className="text-green-600 font-medium">
                                        {scores.away_team.name} leads
                                    </div>
                                )}
                                {scores.home_team.score === scores.away_team.score && (
                                    <div className="text-yellow-600 font-medium">
                                        Tied
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="text-center">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Away Team
                                </label>
                                {event.type === 'regular_game' ? (
                                    <div className="text-lg font-semibold text-gray-900">
                                        {scores.away_team.name}
                                    </div>
                                ) : (
                                    <select
                                        value={scores.away_team.id}
                                        onChange={(e) => handleTeamChange('away_team', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Team</option>
                                        {event.teams?.filter(teamId => teamId !== scores.home_team.id).map(teamId => (
                                            <option key={teamId} value={teamId}>
                                                {getTeamName(teamId)}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Score Controls */}
                            <div className="space-y-4">
                                <div className="text-6xl font-bold text-red-600">
                                    {scores.away_team.score}
                                </div>
                                
                                <div className="flex justify-center gap-2">
                                    <button
                                        onClick={() => handleScoreAdjustment('away_team', -1)}
                                        className="w-12 h-12 bg-red-100 text-red-600 rounded-full hover:bg-red-200 font-bold text-xl"
                                        disabled={scores.away_team.score <= 0}
                                    >
                                        −
                                    </button>
                                    <button
                                        onClick={() => handleScoreAdjustment('away_team', 1)}
                                        className="w-12 h-12 bg-green-100 text-green-600 rounded-full hover:bg-green-200 font-bold text-xl"
                                    >
                                        +
                                    </button>
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    value={scores.away_team.score}
                                    onChange={(e) => handleScoreChange('away_team', e.target.value)}
                                    className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t">
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setScores({
                                    home_team: { ...scores.home_team, score: 0 },
                                    away_team: { ...scores.away_team, score: 0 }
                                })}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                            >
                                🔄 Reset Scores
                            </button>
                            
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : '✅ Submit Final Score'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Quick Entry Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use the + and - buttons for quick adjustments</li>
                        <li>• Type directly in the score boxes for exact values</li>
                        <li>• Games cannot end in ties - ensure one team has more points</li>
                        <li>• Final scores will automatically update team standings</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default QuickScoreEntry;