import React, { useState } from 'react';

const EventCreator = ({ teams, currentUser, onEventCreate, onCancel, editingEvent }) => {
    const [formData, setFormData] = useState({
        type: 'regular_game', // regular_game, tournament, practice, social
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        teams: [], // For regular games (max 2), tournaments (multiple)
        rsvp_enabled: true,
        groupme_integration: true,
        auto_create_polls: false,
        tournament_config: {
            format: 'single_elimination', // single_elimination, double_elimination
            seeding_method: 'league_rankings', // league_rankings, manual
            auto_advance: true,
            allow_bracket_editing: true
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const eventTypes = [
        { value: 'regular_game', label: '🏆 Regular Game', desc: 'League game between two teams' },
        { value: 'tournament', label: '🏅 Tournament', desc: 'Multi-team bracket competition' },
        { value: 'practice', label: '🏃 Practice', desc: 'Team practice session' },
        { value: 'social', label: '🎉 Social Event', desc: 'Team social gathering or meeting' }
    ];

    const tournamentFormats = [
        { value: 'single_elimination', label: 'Single Elimination', desc: 'One loss and you\'re out' },
        { value: 'double_elimination', label: 'Double Elimination', desc: 'Must lose twice to be eliminated' }
    ];

    const seedingMethods = [
        { value: 'league_rankings', label: 'League Rankings', desc: 'Use current standings for seeding' },
        { value: 'manual', label: 'Manual Seeding', desc: 'Manually arrange teams' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const handleTournamentConfigChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            tournament_config: {
                ...prev.tournament_config,
                [field]: value
            }
        }));
    };

    const handleTeamSelection = (teamId) => {
        setFormData(prev => {
            const currentTeams = prev.teams || [];
            const isSelected = currentTeams.includes(teamId);
            
            let updatedTeams;
            if (isSelected) {
                updatedTeams = currentTeams.filter(id => id !== teamId);
            } else {
                // For regular games, limit to 2 teams
                if (prev.type === 'regular_game' && currentTeams.length >= 2) {
                    updatedTeams = [currentTeams[1], teamId]; // Replace first team
                } else {
                    updatedTeams = [...currentTeams, teamId];
                }
            }
            
            return {
                ...prev,
                teams: updatedTeams
            };
        });
    };

    const generateTournamentBracket = (teamIds, config) => {
        const teamList = teamIds.map((teamId, index) => ({
            id: teamId,
            name: getTeamName(teamId),
            seed: index + 1
        }));

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
                name: getRoundName(roundNumber, countRounds(currentTeams.length)),
                matches: matches
            });

            // Prepare for next round
            currentTeams = new Array(matchesInRound).fill(null);
            roundNumber++;
        }

        return {
            format: config.format,
            seeding_method: config.seeding_method,
            teams: teamList,
            rounds: rounds,
            settings: {
                auto_advance: config.auto_advance,
                allow_editing: config.allow_bracket_editing
            }
        };
    };

    const countRounds = (teamCount) => {
        let rounds = 0;
        while (teamCount > 1) {
            teamCount = Math.floor(teamCount / 2);
            rounds++;
        }
        return rounds;
    };

    const getRoundName = (roundNumber, totalRounds) => {
        const remaining = totalRounds - roundNumber + 1;
        if (remaining === 1) return 'Final';
        if (remaining === 2) return 'Semifinals';
        if (remaining === 3) return 'Quarterfinals';
        return `Round ${roundNumber}`;
    };

    const getTeamName = (teamId) => {
        const team = teams?.find(t => t.id === teamId);
        return team ? team.name : teamId;
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.date) newErrors.date = 'Date is required';
        if (!formData.time) newErrors.time = 'Time is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        
        if (formData.type === 'regular_game' && formData.teams.length !== 2) {
            newErrors.teams = 'Regular games require exactly 2 teams';
        }
        
        if (formData.type === 'tournament' && formData.teams.length < 4) {
            newErrors.teams = 'Tournaments require at least 4 teams';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        try {
            setLoading(true);
            
            // Generate event ID
            const eventId = `${formData.type}_${Date.now()}`;
            
            // Generate bracket for tournament events
            let bracket = null;
            if (formData.type === 'tournament' && formData.teams.length >= 4) {
                bracket = generateTournamentBracket(formData.teams, formData.tournament_config);
                console.log('🏆 Generated tournament bracket:', bracket);
            }

            const eventData = {
                ...formData,
                id: eventId,
                created_by: String(currentUser?.id || 'admin'),
                created_at: new Date().toISOString(),
                status: 'scheduled', // scheduled, in_progress, completed, cancelled
                bracket: bracket
            };
            
            await onEventCreate(eventData);
            
        } catch (error) {
            console.error('❌ Error creating event:', error);
            alert('Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Event Type Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {eventTypes.map(type => (
                            <div
                                key={type.value}
                                className={`cursor-pointer p-4 rounded-lg border-2 transition-colors ${
                                    formData.type === type.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleInputChange('type', type.value)}
                            >
                                <div className="font-medium text-gray-800">{type.label}</div>
                                <div className="text-sm text-gray-600 mt-1">{type.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Basic Event Details */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter event title"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.location ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter location"
                            />
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.date ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time *
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => handleInputChange('time', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.time ? 'border-red-500' : 'border-gray-300'
                                }`}
                            />
                            {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter event description (optional)"
                        />
                    </div>
                </div>

                {/* Team Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Team Selection
                        {formData.type === 'regular_game' && ' (Select exactly 2 teams)'}
                        {formData.type === 'tournament' && ' (Select 4 or more teams)'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teams.map(team => {
                            const isSelected = formData.teams.includes(team.id);
                            return (
                                <div
                                    key={team.id}
                                    className={`cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                                        isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleTeamSelection(team.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {team.style?.logoUrl && (
                                            <img 
                                                src={team.style.logoUrl} 
                                                alt={team.name} 
                                                className="w-8 h-8 object-cover rounded"
                                            />
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-800">{team.name}</div>
                                            {team.division && (
                                                <div className="text-sm text-gray-600">{team.division}</div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="ml-auto text-blue-600">✓</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {errors.teams && <p className="text-red-500 text-sm mt-2">{errors.teams}</p>}
                    
                    <div className="mt-4 text-sm text-gray-600">
                        Selected teams: {formData.teams.length}
                        {formData.type === 'regular_game' && ' / 2'}
                        {formData.type === 'tournament' && ' (minimum 4)'}
                    </div>
                </div>

                {/* Tournament Configuration */}
                {formData.type === 'tournament' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Tournament Configuration</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tournament Format
                                </label>
                                <div className="space-y-3">
                                    {tournamentFormats.map(format => (
                                        <div
                                            key={format.value}
                                            className={`cursor-pointer p-3 rounded-lg border transition-colors ${
                                                formData.tournament_config.format === format.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handleTournamentConfigChange('format', format.value)}
                                        >
                                            <div className="font-medium text-gray-800">{format.label}</div>
                                            <div className="text-sm text-gray-600">{format.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Seeding Method
                                </label>
                                <div className="space-y-3">
                                    {seedingMethods.map(method => (
                                        <div
                                            key={method.value}
                                            className={`cursor-pointer p-3 rounded-lg border transition-colors ${
                                                formData.tournament_config.seeding_method === method.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => handleTournamentConfigChange('seeding_method', method.value)}
                                        >
                                            <div className="font-medium text-gray-800">{method.label}</div>
                                            <div className="text-sm text-gray-600">{method.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.tournament_config.auto_advance}
                                    onChange={(e) => handleTournamentConfigChange('auto_advance', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Auto-advance winning teams to next round
                                </span>
                            </label>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.tournament_config.allow_bracket_editing}
                                    onChange={(e) => handleTournamentConfigChange('allow_bracket_editing', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Allow admins to modify bracket structure
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* RSVP & Communication Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">RSVP & Communication</h3>
                    
                    <div className="space-y-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={formData.rsvp_enabled}
                                onChange={(e) => handleInputChange('rsvp_enabled', e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Enable RSVP for this event
                            </span>
                        </label>

                        {formData.rsvp_enabled && (
                            <>
                                <label className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.groupme_integration}
                                        onChange={(e) => handleInputChange('groupme_integration', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Integrate with GroupMe
                                    </span>
                                </label>

                                {formData.groupme_integration && (
                                    <label className="flex items-center gap-3 ml-6">
                                        <input
                                            type="checkbox"
                                            checked={formData.auto_create_polls}
                                            onChange={(e) => handleInputChange('auto_create_polls', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            Automatically create GroupMe polls
                                        </span>
                                    </label>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-between pt-6 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventCreator;