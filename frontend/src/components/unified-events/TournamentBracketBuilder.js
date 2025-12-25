import React, { useState, useEffect } from 'react';

const TournamentBracketBuilder = ({ event, teams, onUpdate, onBack, onLiveView, onLiveScore }) => {
    const [bracketData, setBracketData] = useState({
        format: 'single_elimination',
        seeding_method: 'league_rankings',
        teams: [],
        rounds: [],
        settings: {
            auto_advance: true,
            allow_editing: true
        }
    });

    const [selectedMatch, setSelectedMatch] = useState(null);
    const [showAddTeam, setShowAddTeam] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('bracket'); // 'bracket' or 'games-list'

    // Initialize bracket data from event
    useEffect(() => {
        if (event) {
            setBracketData(prev => ({
                ...prev,
                format: event.tournament_config?.format || 'single_elimination',
                seeding_method: event.tournament_config?.seeding_method || 'league_rankings',
                teams: event.teams?.map(teamId => ({
                    id: teamId,
                    name: getTeamName(teamId),
                    seed: 0
                })) || [],
                settings: {
                    auto_advance: event.tournament_config?.auto_advance !== false,
                    allow_editing: event.tournament_config?.allow_bracket_editing !== false
                }
            }));

            // Generate initial bracket if it doesn't exist
            if (event.teams && event.teams.length >= 4 && !event.bracket) {
                generateBracket(event.teams);
            } else if (event.bracket) {
                setBracketData(prev => ({ ...prev, rounds: event.bracket.rounds || [] }));
            }
        }
    }, [event]);

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
            id: teamId,
            name: getTeamName(teamId),
            seed: index + 1
        }));

        // Sort teams by seeding method
        if (bracketData.seeding_method === 'league_rankings') {
            // TODO: Sort by actual league standings
            teamList.sort((a, b) => a.seed - b.seed);
        }

        const rounds = [];
        let currentTeams = [...teamList];
        let roundNumber = 1;

        // Generate rounds for single elimination
        while (currentTeams.length > 1) {
            const matches = [];
            const matchesInRound = Math.floor(currentTeams.length / 2);

            for (let i = 0; i < matchesInRound; i++) {
                const team1 = currentTeams[i * 2];
                const team2 = currentTeams[i * 2 + 1];
                
                matches.push({
                    id: `round${roundNumber}_match${i + 1}`,
                    team1: team1 || null,
                    team2: team2 || null,
                    score1: null,
                    score2: null,
                    winner: null,
                    status: 'pending'
                });
            }

            rounds.push({
                round: roundNumber,
                name: getRoundName(roundNumber, rounds.length + 1),
                matches: matches
            });

            // Prepare teams for next round (winners will be populated later)
            currentTeams = new Array(matchesInRound).fill(null);
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
            const newRounds = [...prev.rounds];
            const match = newRounds[roundIndex].matches[matchIndex];
            
            match.score1 = parseInt(score1) || 0;
            match.score2 = parseInt(score2) || 0;
            
            // Determine winner
            if (score1 !== '' && score2 !== '') {
                if (match.score1 > match.score2) {
                    match.winner = match.team1;
                    match.status = 'completed';
                } else if (match.score2 > match.score1) {
                    match.winner = match.team2;
                    match.status = 'completed';
                } else {
                    match.winner = null;
                    match.status = 'tied'; // Handle ties
                }

                // Auto-advance winner if enabled
                if (prev.settings.auto_advance && match.winner && roundIndex < newRounds.length - 1) {
                    const nextRound = newRounds[roundIndex + 1];
                    const nextMatchIndex = Math.floor(matchIndex / 2);
                    const isFirstTeam = matchIndex % 2 === 0;

                    console.log('🏆 Auto-advancing winner:', match.winner.name, 'to next round');
                    console.log('📍 Next match details:', { roundIndex: roundIndex + 1, matchIndex: nextMatchIndex, isFirstTeam });

                    if (nextRound.matches[nextMatchIndex]) {
                        if (isFirstTeam) {
                            nextRound.matches[nextMatchIndex].team1 = { ...match.winner };
                            console.log('✅ Set as team1 in next match');
                        } else {
                            nextRound.matches[nextMatchIndex].team2 = { ...match.winner };
                            console.log('✅ Set as team2 in next match');
                        }
                    }
                }

                // Auto-save bracket after score update
                setTimeout(() => {
                    saveBracket();
                }, 100);
            }

            return { ...prev, rounds: newRounds };
        });
    };

    const addTeamToBracket = (teamId) => {
        if (!bracketData.teams.find(t => t.id === teamId)) {
            const newTeam = {
                id: teamId,
                name: getTeamName(teamId),
                seed: bracketData.teams.length + 1
            };

            setBracketData(prev => ({
                ...prev,
                teams: [...prev.teams, newTeam]
            }));

            // Regenerate bracket with new team count
            generateBracket([...bracketData.teams.map(t => t.id), teamId]);
        }
        setShowAddTeam(false);
    };

    const removeTeamFromBracket = (teamId) => {
        setBracketData(prev => {
            const newTeams = prev.teams.filter(t => t.id !== teamId);
            return { ...prev, teams: newTeams };
        });

        // Regenerate bracket without this team
        if (bracketData.teams.length > 4) {
            generateBracket(bracketData.teams.filter(t => t.id !== teamId).map(t => t.id));
        }
    };

    const saveBracket = async () => {
        try {
            setLoading(true);
            const updatedEvent = {
                bracket: bracketData,
                tournament_config: {
                    ...event.tournament_config,
                    auto_advance: bracketData.settings.auto_advance,
                    allow_bracket_editing: bracketData.settings.allow_editing
                }
            };

            await onUpdate(updatedEvent);
            console.log('✅ Bracket saved successfully');
        } catch (error) {
            console.error('❌ Error saving bracket:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get all matches as a flat list
    const getAllMatches = () => {
        const matches = [];
        bracketData.rounds.forEach((round, roundIndex) => {
            round.matches.forEach((match, matchIndex) => {
                matches.push({
                    ...match,
                    roundIndex,
                    matchIndex,
                    roundName: round.name
                });
            });
        });
        return matches;
    };

    // Helper function to get match status display
    const getMatchStatusDisplay = (match) => {
        if (match.status === 'completed') {
            return { text: 'Completed', color: 'bg-green-100 text-green-800' };
        } else if (match.score1 !== null || match.score2 !== null) {
            return { text: 'In Progress', color: 'bg-blue-100 text-blue-800' };
        } else {
            return { text: 'Pending', color: 'bg-gray-100 text-gray-800' };
        }
    };

    const MatchCard = ({ match, roundIndex, matchIndex }) => {
        const [editingScores, setEditingScores] = useState(false);
        const [tempScore1, setTempScore1] = useState(match.score1 || '');
        const [tempScore2, setTempScore2] = useState(match.score2 || '');

        const handleSaveScores = () => {
            updateMatchScore(roundIndex, matchIndex, tempScore1, tempScore2);
            setEditingScores(false);
        };

        return (
            <div className={`bg-white border-2 rounded-lg p-4 ${
                match.status === 'completed' ? 'border-green-300' : 
                match.status === 'tied' ? 'border-yellow-300' : 'border-gray-300'
            } hover:shadow-md transition-shadow`}>
                {/* Match Teams */}
                <div className="space-y-3">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {match.team1 ? (
                                <>
                                    {getTeamLogo(match.team1.id) && (
                                        <img
                                            src={getTeamLogo(match.team1.id)}
                                            alt={match.team1.name}
                                            className="w-6 h-6 object-cover rounded"
                                        />
                                    )}
                                    <span className={`font-medium ${
                                        match.winner?.id === match.team1.id ? 'text-green-600' : 'text-gray-800'
                                    }`}>
                                        {match.team1.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-gray-400 italic">TBD</span>
                            )}
                        </div>
                        
                        {editingScores ? (
                            <input
                                type="number"
                                value={tempScore1}
                                onChange={(e) => setTempScore1(e.target.value)}
                                className="w-16 px-2 py-1 text-center border rounded"
                                min="0"
                            />
                        ) : (
                            <span className="text-xl font-bold">
                                {match.score1 !== null ? match.score1 : '-'}
                            </span>
                        )}
                    </div>

                    {/* VS Divider */}
                    <div className="text-center text-gray-400 text-sm">VS</div>

                    {/* Team 2 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {match.team2 ? (
                                <>
                                    {getTeamLogo(match.team2.id) && (
                                        <img
                                            src={getTeamLogo(match.team2.id)}
                                            alt={match.team2.name}
                                            className="w-6 h-6 object-cover rounded"
                                        />
                                    )}
                                    <span className={`font-medium ${
                                        match.winner?.id === match.team2.id ? 'text-green-600' : 'text-gray-800'
                                    }`}>
                                        {match.team2.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-gray-400 italic">TBD</span>
                            )}
                        </div>
                        
                        {editingScores ? (
                            <input
                                type="number"
                                value={tempScore2}
                                onChange={(e) => setTempScore2(e.target.value)}
                                className="w-16 px-2 py-1 text-center border rounded"
                                min="0"
                            />
                        ) : (
                            <span className="text-xl font-bold">
                                {match.score2 !== null ? match.score2 : '-'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Match Actions */}
                {match.team1 && match.team2 && (
                    <div className="mt-4 pt-3 border-t space-y-2">
                        {editingScores ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveScores}
                                    className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                    ✅ Save
                                </button>
                                <button
                                    onClick={() => setEditingScores(false)}
                                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                    ❌
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setTempScore1(match.score1 || '');
                                            setTempScore2(match.score2 || '');
                                            setEditingScores(true);
                                        }}
                                        className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        ✏️ Quick Score
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onLiveScore) {
                                                onLiveScore(match, roundIndex, matchIndex);
                                            }
                                        }}
                                        className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                        title="Enter detailed live stats"
                                    >
                                        📊 Live Score
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (onLiveView) {
                                            onLiveView(match, roundIndex, matchIndex);
                                        }
                                    }}
                                    className="w-full px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                                    title="Watch this match live"
                                >
                                    🔴 Live View
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Winner Badge */}
                {match.winner && (
                    <div className="mt-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            🏆 Winner: {match.winner.name}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                        <p className="text-sm text-gray-600">
                            {bracketData.format === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'} Tournament
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowAddTeam(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                            ➕ Add Team
                        </button>
                        
                        <button
                            onClick={saveBracket}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : '💾 Save Bracket'}
                        </button>
                        
                        <button
                            onClick={onBack}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Tournament Info */}
            <div className="bg-blue-50 border-b px-6 py-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        <span>🏅 Teams: {bracketData.teams.length}</span>
                        <span>🎯 Format: {bracketData.format.replace('_', ' ')}</span>
                        <span>📊 Seeding: {bracketData.seeding_method.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={bracketData.settings.auto_advance}
                                onChange={(e) => setBracketData(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, auto_advance: e.target.checked }
                                }))}
                            />
                            <span>Auto-advance winners</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b">
                <div className="px-6">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('bracket')}
                            className={`py-3 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'bracket'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            🏆 Bracket View
                        </button>
                        <button
                            onClick={() => setActiveTab('games-list')}
                            className={`py-3 px-2 border-b-2 font-medium text-sm ${
                                activeTab === 'games-list'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            📋 Games List
                        </button>
                    </div>
                </div>
            </div>

            {/* Bracket Display */}
            <div className="flex-1 overflow-auto p-6">
                {bracketData.rounds.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-4">🏅</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bracket Generated</h3>
                        <p className="text-gray-600 mb-6">Add at least 4 teams to generate the tournament bracket</p>
                        <button
                            onClick={() => generateBracket(bracketData.teams.map(t => t.id))}
                            disabled={bracketData.teams.length < 4}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            Generate Bracket
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {bracketData.rounds.map((round, roundIndex) => (
                            <div key={round.round} className="space-y-4">
                                <h3 className="text-lg font-semibold text-center text-gray-800">
                                    {round.name}
                                </h3>
                                
                                <div className="grid gap-4" style={{
                                    gridTemplateColumns: `repeat(${Math.min(round.matches.length, 4)}, 1fr)`
                                }}>
                                    {round.matches.map((match, matchIndex) => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            roundIndex={roundIndex}
                                            matchIndex={matchIndex}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Team Modal */}
            {showAddTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Add Team to Tournament</h3>
                        
                        <div className="space-y-2 mb-4">
                            {teams?.filter(team => !bracketData.teams.find(t => t.id === team.id)).map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => addTeamToBracket(team.id)}
                                    className="w-full p-3 text-left border border-gray-200 rounded hover:bg-gray-50 flex items-center gap-3"
                                >
                                    {team.style?.logoUrl && (
                                        <img src={team.style.logoUrl} alt={team.name} className="w-8 h-8 object-cover rounded" />
                                    )}
                                    <div>
                                        <div className="font-medium">{team.name}</div>
                                        {team.division && <div className="text-sm text-gray-600">{team.division}</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowAddTeam(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentBracketBuilder;