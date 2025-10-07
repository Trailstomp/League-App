import React, { useState, useEffect } from 'react';

const TournamentPage = ({ events, teams, currentUser, onNavigate, setEvents }) => {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [bracketData, setBracketData] = useState(null);

    // Filter tournament events from all events
    useEffect(() => {
        const tournamentEvents = events.filter(event => event.type === 'tournament');
        setTournaments(tournamentEvents);
        
        // Auto-select first tournament if available
        if (tournamentEvents.length > 0 && !selectedTournament) {
            setSelectedTournament(tournamentEvents[0]);
        }
    }, [events, selectedTournament]);

    // Load tournament bracket data
    useEffect(() => {
        if (selectedTournament) {
            // Initialize bracket data
            const initialBracket = selectedTournament.bracket || {
                teams: [],
                rounds: [],
                format: 'single-elimination',
                minGames: 1,
                firstPlaceBye: false,
                seedingMethod: 'manual'
            };
            
            // Auto-populate teams from event if available
            if (selectedTournament.teams && selectedTournament.teams.length > 0 && initialBracket.teams.length === 0) {
                initialBracket.teams = selectedTournament.teams.map(team => ({
                    id: team.id || team.teamId,
                    name: team.name || team.teamName
                }));
            }
            
            setBracketData(initialBracket);
        }
    }, [selectedTournament]);

    // Create game statistics from bracket match data and save to backend
    const createGameStatsFromBracket = async (match, eventId) => {
        if (!match.team1 || !match.team2) return;
        
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            
            // Create game stat entry for backend
            const gameStatData = {
                id: `${eventId}_${match.id}`,
                event_id: eventId,
                home_team: {
                    id: match.team1.id,
                    name: match.team1.name,
                    score: match.score1 || 0,
                    goals: match.score1 || 0,
                    assists: 0,
                    saves: 0,
                    shots: match.score1 || 0
                },
                away_team: {
                    id: match.team2.id,
                    name: match.team2.name,
                    score: match.score2 || 0,
                    goals: match.score2 || 0,
                    assists: 0,
                    saves: 0,
                    shots: match.score2 || 0
                },
                tournament_id: selectedTournament?.id,
                match_type: 'tournament',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('🏆 Saving bracket match to game stats:', gameStatData);
            
            // Save to backend
            const response = await fetch(`${BACKEND_URL}/api/game-stats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameStatData)
            });
            
            if (response.ok) {
                console.log('✅ Bracket match saved to game stats successfully');
                // Show success message to user
                alert(`Match result saved: ${match.team1.name} ${match.score1} - ${match.score2} ${match.team2.name}`);
            } else {
                const error = await response.text();
                console.error('❌ Failed to save bracket match to game stats:', error);
                alert('Error saving match result. Please check your connection and try again.');
            }
        } catch (error) {
            console.error('❌ Error saving bracket match to game stats:', error);
            alert('Error saving match result. Please check your connection and try again.');
        }
    };

    // Update match scores and save to backend
    const updateMatch = (roundIndex, matchIndex, updates) => {
        if (!bracketData) return;
        
        const newBracketData = { ...bracketData };
        const match = newBracketData.rounds[roundIndex].matches[matchIndex];
        
        // Update match with new data
        Object.assign(match, updates);
        
        // Determine winner and loser based on scores
        if (updates.score1 !== undefined && updates.score2 !== undefined && 
            updates.score1 !== null && updates.score2 !== null) {
            
            console.log('🏆 Updating match scores:', { 
                team1: match.team1?.name, 
                score1: updates.score1, 
                team2: match.team2?.name, 
                score2: updates.score2 
            });
            
            if (updates.score1 > updates.score2) {
                match.winner = match.team1;
                match.loser = match.team2;
            } else if (updates.score2 > updates.score1) {
                match.winner = match.team2;
                match.loser = match.team1;
            } else {
                // Tie - no winner determined yet
                match.winner = null;
                match.loser = null;
            }
            
            if (match.winner) {
                match.status = 'completed';
            }
        }
        
        setBracketData(newBracketData);
        
        // Update the selectedTournament data as well to persist changes
        if (selectedTournament) {
            const updatedTournament = { ...selectedTournament };
            updatedTournament.bracket = newBracketData;
            setSelectedTournament(updatedTournament);
            
            // Also update in the events array
            const updatedEvents = events.map(event => 
                event.id === selectedTournament.id ? updatedTournament : event
            );
            // Note: We would need to pass setEvents from parent component to update this
        }
        
        // Create game stats when match is completed with scores
        if (updates.score1 !== undefined && updates.score2 !== undefined && 
            updates.score1 !== null && updates.score2 !== null &&
            match.team1 && match.team2) {
            console.log('🎯 Triggering game stats creation for completed match');
            createGameStatsFromBracket(match, selectedTournament.id);
        }
    };

    // Simple bracket match component
    const BracketMatchCard = ({ match, onUpdateMatch, roundIndex, matchIndex }) => {
        const [editingScores, setEditingScores] = useState(false);
        const [tempScore1, setTempScore1] = useState(match.score1 || '');
        const [tempScore2, setTempScore2] = useState(match.score2 || '');
        
        const handleScoreEdit = () => {
            if (editingScores) {
                // Save scores
                onUpdateMatch({
                    score1: parseInt(tempScore1) || 0,
                    score2: parseInt(tempScore2) || 0
                });
            }
            setEditingScores(!editingScores);
        };

        if (!match.team1 || !match.team2) {
            return (
                <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                    <div className="text-center text-gray-500">
                        Waiting for teams...
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">Match {matchIndex + 1}</h4>
                    <button
                        onClick={handleScoreEdit}
                        className={`px-3 py-1 text-sm rounded ${
                            editingScores 
                                ? 'bg-green-500 text-white' 
                                : 'bg-blue-500 text-white'
                        }`}
                    >
                        {editingScores ? 'Save' : 'Edit Scores'}
                    </button>
                </div>
                
                <div className="space-y-3">
                    {/* Team 1 */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium">{match.team1.name}</span>
                        {editingScores ? (
                            <input
                                type="number"
                                value={tempScore1}
                                onChange={(e) => setTempScore1(e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                min="0"
                            />
                        ) : (
                            <span className="text-xl font-bold">{match.score1 || 0}</span>
                        )}
                    </div>
                    
                    {/* Team 2 */}
                    <div className="flex items-center justify-between">
                        <span className="font-medium">{match.team2.name}</span>
                        {editingScores ? (
                            <input
                                type="number"
                                value={tempScore2}
                                onChange={(e) => setTempScore2(e.target.value)}
                                className="w-16 px-2 py-1 border rounded text-center"
                                min="0"
                            />
                        ) : (
                            <span className="text-xl font-bold">{match.score2 || 0}</span>
                        )}
                    </div>
                </div>
                
                {match.winner && (
                    <div className="mt-3 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                            Winner: {match.winner.name}
                        </span>
                    </div>
                )}
            </div>
        );
    };

    if (tournaments.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">No Tournaments Found</h2>
                    <p className="text-gray-600 mb-8">No tournament events are currently scheduled.</p>
                    <button
                        onClick={() => onNavigate('events')}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Go to Events & Schedule
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Tournament Brackets</h1>
                
                {/* Tournament Selector */}
                {tournaments.length > 1 && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Tournament
                        </label>
                        <select
                            value={selectedTournament?.id || ''}
                            onChange={(e) => {
                                const tournament = tournaments.find(t => t.id === e.target.value);
                                setSelectedTournament(tournament);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                            {tournaments.map(tournament => (
                                <option key={tournament.id} value={tournament.id}>
                                    {tournament.title || tournament.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {selectedTournament && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">
                        {selectedTournament.title || selectedTournament.name}
                    </h2>

                    {bracketData && bracketData.rounds && bracketData.rounds.length > 0 ? (
                        <div className="space-y-8">
                            {bracketData.rounds.map((round, roundIndex) => (
                                <div key={roundIndex}>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                        Round {roundIndex + 1}
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {round.matches && round.matches.map((match, matchIndex) => (
                                            <BracketMatchCard
                                                key={match.id || matchIndex}
                                                match={match}
                                                roundIndex={roundIndex}
                                                matchIndex={matchIndex}
                                                onUpdateMatch={(updates) => updateMatch(roundIndex, matchIndex, updates)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-medium text-gray-700 mb-2">
                                Tournament Bracket Not Set Up
                            </h3>
                            <p className="text-gray-600 mb-4">
                                The bracket for this tournament hasn't been created yet.
                            </p>
                            <button
                                onClick={() => onNavigate('admin')}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Go to Admin Panel
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TournamentPage;