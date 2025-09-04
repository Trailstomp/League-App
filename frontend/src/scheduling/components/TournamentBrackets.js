import React, { useState, useEffect } from 'react';

/**
 * Tournament Brackets System - Foundation for comprehensive tournament management
 * Supports Single/Double Elimination, Manual/Ranked brackets, #1 team bye option
 */

// Tournament Configuration
const TOURNAMENT_TYPES = {
    SINGLE_ELIMINATION: 'single_elimination',
    DOUBLE_ELIMINATION: 'double_elimination'
};

const BRACKET_SETUP_TYPES = {
    MANUAL: 'manual',
    RANKED: 'ranked'
};

// Create Tournament Bracket Structure
const createBracketStructure = (teams, config) => {
    const {
        type = TOURNAMENT_TYPES.SINGLE_ELIMINATION,
        setupType = BRACKET_SETUP_TYPES.RANKED,
        allowBye = true,
        seedingMethod = 'record' // 'record', 'random', 'manual'
    } = config;

    // Determine bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(teams.length)));
    const byesNeeded = bracketSize - teams.length;

    let seededTeams = [...teams];

    // Apply seeding based on method
    if (setupType === BRACKET_SETUP_TYPES.RANKED) {
        switch (seedingMethod) {
            case 'record':
                // Sort by wins, then by goal differential
                seededTeams.sort((a, b) => {
                    const aRecord = calculateTeamRecord(a);
                    const bRecord = calculateTeamRecord(b);
                    
                    if (aRecord.winPercentage !== bRecord.winPercentage) {
                        return bRecord.winPercentage - aRecord.winPercentage;
                    }
                    return bRecord.goalDifferential - aRecord.goalDifferential;
                });
                break;
            case 'random':
                seededTeams = shuffleArray(seededTeams);
                break;
            // 'manual' keeps original order
        }
    }

    // Give #1 team bye if enabled and byes are needed
    const teamsWithByes = [];
    if (allowBye && byesNeeded > 0) {
        for (let i = 0; i < Math.min(byesNeeded, seededTeams.length); i++) {
            teamsWithByes.push(seededTeams[i]);
        }
    }

    return {
        id: `tournament_${Date.now()}`,
        type,
        setupType,
        bracketSize,
        teams: seededTeams,
        teamsWithByes,
        byesNeeded,
        status: 'setup', // setup, in_progress, completed
        rounds: generateRounds(seededTeams, bracketSize, type, teamsWithByes),
        winnersBracket: type === TOURNAMENT_TYPES.DOUBLE_ELIMINATION ? [] : null,
        losersBracket: type === TOURNAMENT_TYPES.DOUBLE_ELIMINATION ? [] : null,
        champion: null,
        runnerUp: null
    };
};

// Generate Tournament Rounds
const generateRounds = (teams, bracketSize, type, teamsWithByes = []) => {
    const rounds = [];
    const totalRounds = Math.log2(bracketSize);

    // First round matchups
    const firstRoundTeams = teams.filter(team => !teamsWithByes.includes(team));
    const firstRoundMatches = [];

    for (let i = 0; i < firstRoundTeams.length; i += 2) {
        if (i + 1 < firstRoundTeams.length) {
            firstRoundMatches.push({
                id: `match_${i / 2 + 1}`,
                round: 1,
                homeTeam: firstRoundTeams[i],
                awayTeam: firstRoundTeams[i + 1],
                winner: null,
                score: { home: 0, away: 0 },
                status: 'scheduled', // scheduled, in_progress, completed
                gameId: null // Will link to actual game event
            });
        }
    }

    rounds.push({
        roundNumber: 1,
        name: firstRoundMatches.length === bracketSize / 2 ? 'First Round' : 'Play-in Round',
        matches: firstRoundMatches,
        status: 'upcoming'
    });

    // Generate subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
        const roundName = getRoundName(round, totalRounds);
        const matches = [];
        const previousMatches = rounds[round - 2].matches;
        
        for (let i = 0; i < previousMatches.length; i += 2) {
            matches.push({
                id: `match_${round}_${i / 2 + 1}`,
                round,
                homeTeam: null, // Will be filled by winners
                awayTeam: null,
                winner: null,
                score: { home: 0, away: 0 },
                status: 'pending',
                gameId: null,
                dependsOn: [previousMatches[i].id, previousMatches[i + 1]?.id].filter(Boolean)
            });
        }

        rounds.push({
            roundNumber: round,
            name: roundName,
            matches,
            status: 'pending'
        });
    }

    return rounds;
};

// Helper function to get round names
const getRoundName = (round, totalRounds) => {
    const roundsFromEnd = totalRounds - round + 1;
    switch (roundsFromEnd) {
        case 1: return 'Championship';
        case 2: return 'Semifinals';
        case 3: return 'Quarterfinals';
        case 4: return 'Round of 16';
        case 5: return 'Round of 32';
        default: return `Round ${round}`;
    }
};

// Calculate team record (placeholder - would use real season data)
const calculateTeamRecord = (team) => {
    // This would integrate with real season statistics
    return {
        wins: team.seasonRecord?.wins || 0,
        losses: team.seasonRecord?.losses || 0,
        ties: team.seasonRecord?.ties || 0,
        goalsFor: team.seasonRecord?.goalsFor || 0,
        goalsAgainst: team.seasonRecord?.goalsAgainst || 0,
        get winPercentage() {
            const total = this.wins + this.losses + this.ties;
            return total > 0 ? (this.wins / total) * 100 : 0;
        },
        get goalDifferential() {
            return this.goalsFor - this.goalsAgainst;
        }
    };
};

// Shuffle array utility
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Tournament Brackets Component for EventDetailModal
const TournamentBracketsTab = ({ 
    event, 
    teams, 
    editMode, 
    userCanEdit, 
    onUpdateTournament,
    tournamentData = null 
}) => {
    const [tournament, setTournament] = useState(tournamentData);
    const [setupMode, setSetupMode] = useState(!tournamentData);
    const [config, setConfig] = useState({
        type: TOURNAMENT_TYPES.SINGLE_ELIMINATION,
        setupType: BRACKET_SETUP_TYPES.RANKED,
        allowBye: true,
        seedingMethod: 'record'
    });
    const [selectedTeams, setSelectedTeams] = useState([]);

    // Get available teams for tournament
    const availableTeams = teams.filter(team => team.active);
    
    // Initialize selected teams when availableTeams changes
    useEffect(() => {
        if (availableTeams.length > 0 && selectedTeams.length === 0) {
            // Start with all teams selected by default, but allow user to deselect
            setSelectedTeams(availableTeams.slice());
        }
    }, [availableTeams.length]);

    const handleCreateTournament = () => {
        if (selectedTeams.length < 2) {
            alert('Need at least 2 teams to create a tournament');
            return;
        }

        const newTournament = createBracketStructure(selectedTeams, config);
        setTournament(newTournament);
        setSetupMode(false);
        
        if (onUpdateTournament) {
            onUpdateTournament(event.id, newTournament);
        }
    };

    const handleMatchResult = (matchId, homeScore, awayScore) => {
        if (!tournament || !editMode || !userCanEdit) return;

        const updatedTournament = { ...tournament };
        
        // Find and update the match
        updatedTournament.rounds.forEach(round => {
            const match = round.matches.find(m => m.id === matchId);
            if (match) {
                match.score = { home: parseInt(homeScore) || 0, away: parseInt(awayScore) || 0 };
                match.status = 'completed';
                
                // Determine winner
                if (match.score.home > match.score.away) {
                    match.winner = match.homeTeam;
                } else if (match.score.away > match.score.home) {
                    match.winner = match.awayTeam;
                } else {
                    // Handle ties (might need overtime rules)
                    match.winner = match.homeTeam; // Default to home team for now
                }

                // Advance winner to next round
                advanceWinner(updatedTournament, match);
            }
        });

        setTournament(updatedTournament);
        
        if (onUpdateTournament) {
            onUpdateTournament(event.id, updatedTournament);
        }
    };

    const advanceWinner = (tournament, completedMatch) => {
        const nextRound = tournament.rounds.find(r => r.roundNumber === completedMatch.round + 1);
        if (!nextRound) return;

        // Find the match that depends on this completed match
        const nextMatch = nextRound.matches.find(m => 
            m.dependsOn && m.dependsOn.includes(completedMatch.id)
        );

        if (nextMatch) {
            // Determine if winner should be home or away team
            const dependentMatchIndex = nextMatch.dependsOn.indexOf(completedMatch.id);
            if (dependentMatchIndex === 0) {
                nextMatch.homeTeam = completedMatch.winner;
            } else {
                nextMatch.awayTeam = completedMatch.winner;
            }

            // Update match status if both teams are set
            if (nextMatch.homeTeam && nextMatch.awayTeam) {
                nextMatch.status = 'scheduled';
            }
        }
    };

    if (setupMode && (!tournament || editMode)) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">🏁 Tournament Setup</h4>
                    <p className="text-gray-600">Configure your tournament bracket</p>
                </div>

                {/* Tournament Type Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-800 mb-3">Tournament Format</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="tournamentType"
                                value={TOURNAMENT_TYPES.SINGLE_ELIMINATION}
                                checked={config.type === TOURNAMENT_TYPES.SINGLE_ELIMINATION}
                                onChange={(e) => setConfig({...config, type: e.target.value})}
                                className="mr-3"
                            />
                            <div>
                                <div className="font-medium">Single Elimination</div>
                                <div className="text-sm text-gray-600">One loss and you're out</div>
                            </div>
                        </label>
                        
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="tournamentType"
                                value={TOURNAMENT_TYPES.DOUBLE_ELIMINATION}
                                checked={config.type === TOURNAMENT_TYPES.DOUBLE_ELIMINATION}
                                onChange={(e) => setConfig({...config, type: e.target.value})}
                                className="mr-3"
                            />
                            <div>
                                <div className="font-medium">Double Elimination</div>
                                <div className="text-sm text-gray-600">Two losses to be eliminated</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Bracket Setup Method */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-800 mb-3">Bracket Setup</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="setupType"
                                value={BRACKET_SETUP_TYPES.RANKED}
                                checked={config.setupType === BRACKET_SETUP_TYPES.RANKED}
                                onChange={(e) => setConfig({...config, setupType: e.target.value})}
                                className="mr-3"
                            />
                            <div>
                                <div className="font-medium">Ranked Brackets</div>
                                <div className="text-sm text-gray-600">Seeded by team records</div>
                            </div>
                        </label>
                        
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="radio"
                                name="setupType"
                                value={BRACKET_SETUP_TYPES.MANUAL}
                                checked={config.setupType === BRACKET_SETUP_TYPES.MANUAL}
                                onChange={(e) => setConfig({...config, setupType: e.target.value})}
                                className="mr-3"
                            />
                            <div>
                                <div className="font-medium">Manual Brackets</div>
                                <div className="text-sm text-gray-600">Admin picks matchups</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Additional Options */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-800 mb-3">Tournament Options</h5>
                    
                    <label className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            checked={config.allowBye}
                            onChange={(e) => setConfig({...config, allowBye: e.target.checked})}
                            className="mr-3"
                        />
                        <div>
                            <div className="font-medium">#1 Team Gets Bye</div>
                            <div className="text-sm text-gray-600">Top seed skips first round if needed</div>
                        </div>
                    </label>

                    {config.setupType === BRACKET_SETUP_TYPES.RANKED && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Seeding Method</label>
                            <select
                                value={config.seedingMethod}
                                onChange={(e) => setConfig({...config, seedingMethod: e.target.value})}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="record">By Season Record</option>
                                <option value="random">Random Seeding</option>
                                <option value="manual">Manual Order</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Team Selection */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-800">Select Teams for Tournament</h5>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedTeams(availableTeams.slice())}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setSelectedTeams([])}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {availableTeams.map(team => (
                            <label key={team.id} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    checked={selectedTeams.some(t => t.id === team.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedTeams([...selectedTeams, team]);
                                        } else {
                                            setSelectedTeams(selectedTeams.filter(t => t.id !== team.id));
                                        }
                                    }}
                                    className="mr-2"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-sm">{team.name}</div>
                                    {team.wins !== undefined && (
                                        <div className="text-xs text-gray-500">
                                            {team.wins}W-{team.losses}L
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                    
                    {selectedTeams.length === 0 && (
                        <p className="text-sm text-red-600 mt-2">⚠️ Please select at least 2 teams</p>
                    )}
                </div>

                {/* Tournament Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-medium text-blue-800">
                                {selectedTeams.length} Teams Selected
                            </div>
                            <div className="text-sm text-blue-600">
                                Bracket size: {selectedTeams.length > 0 ? Math.pow(2, Math.ceil(Math.log2(selectedTeams.length))) : 0}
                                {selectedTeams.length > 0 && Math.pow(2, Math.ceil(Math.log2(selectedTeams.length))) - selectedTeams.length > 0 && 
                                    ` (${Math.pow(2, Math.ceil(Math.log2(selectedTeams.length))) - selectedTeams.length} byes needed)`
                                }
                            </div>
                        </div>
                        <button
                            onClick={handleCreateTournament}
                            disabled={selectedTeams.length < 2}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Tournament
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏁</div>
                <div>No tournament bracket created</div>
                {editMode && userCanEdit && (
                    <button
                        onClick={() => setSetupMode(true)}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Create Tournament Bracket
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tournament Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="text-lg font-bold">🏆 {event.title} Tournament</h4>
                        <div className="text-sm opacity-90">
                            {tournament.type.replace('_', ' ').toUpperCase()} • {tournament.teams.length} Teams
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm opacity-90">Status</div>
                        <div className="font-medium capitalize">{tournament.status.replace('_', ' ')}</div>
                    </div>
                </div>
            </div>

            {/* Tournament Rounds */}
            <div className="space-y-4">
                {tournament.rounds.map(round => (
                    <div key={round.roundNumber} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-3">
                            {round.name} (Round {round.roundNumber})
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {round.matches.map(match => (
                                <div key={match.id} className="border rounded-lg p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <span className="text-sm font-medium">Match {match.id.split('_').pop()}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                            {match.status}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {/* Home Team */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {match.homeTeam ? (
                                                    <>
                                                        <img 
                                                            src={match.homeTeam.logo || `https://ui-avatars.com/api/?name=${match.homeTeam.name}&background=random`}
                                                            alt={match.homeTeam.name}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                        <span className="text-sm">{match.homeTeam.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">TBD</span>
                                                )}
                                            </div>
                                            {editMode && userCanEdit && match.homeTeam && match.awayTeam ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={match.score.home}
                                                    onChange={(e) => handleMatchResult(match.id, e.target.value, match.score.away)}
                                                    className="w-12 p-1 border rounded text-center text-sm"
                                                />
                                            ) : (
                                                <span className="font-medium">{match.score.home}</span>
                                            )}
                                        </div>
                                        
                                        {/* Away Team */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                {match.awayTeam ? (
                                                    <>
                                                        <img 
                                                            src={match.awayTeam.logo || `https://ui-avatars.com/api/?name=${match.awayTeam.name}&background=random`}
                                                            alt={match.awayTeam.name}
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                        <span className="text-sm">{match.awayTeam.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm text-gray-500 italic">TBD</span>
                                                )}
                                            </div>
                                            {editMode && userCanEdit && match.homeTeam && match.awayTeam ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={match.score.away}
                                                    onChange={(e) => handleMatchResult(match.id, match.score.home, e.target.value)}
                                                    className="w-12 p-1 border rounded text-center text-sm"
                                                />
                                            ) : (
                                                <span className="font-medium">{match.score.away}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {match.winner && (
                                        <div className="mt-2 pt-2 border-t">
                                            <div className="text-xs text-green-600 font-medium">
                                                Winner: {match.winner.name}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tournament Actions */}
            {editMode && userCanEdit && (
                <div className="flex space-x-2">
                    <button
                        onClick={() => setSetupMode(true)}
                        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                        ⚙️ Reconfigure Tournament
                    </button>
                    
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to reset all tournament results?')) {
                                // Reset all match results
                                const resetTournament = { ...tournament };
                                resetTournament.rounds.forEach(round => {
                                    round.matches.forEach(match => {
                                        match.score = { home: 0, away: 0 };
                                        match.winner = null;
                                        match.status = match.homeTeam && match.awayTeam ? 'scheduled' : 'pending';
                                    });
                                });
                                setTournament(resetTournament);
                                if (onUpdateTournament) {
                                    onUpdateTournament(event.id, resetTournament);
                                }
                            }
                        }}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                    >
                        🔄 Reset Results
                    </button>
                </div>
            )}
        </div>
    );
};

export default TournamentBracketsTab;