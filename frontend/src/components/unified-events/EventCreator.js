import React, { useState, useEffect } from 'react';

const EventCreator = ({ teams, currentUser, onEventCreate, onCancel, editingEvent }) => {
    const [formData, setFormData] = useState({
        type: 'regular_game', // regular_game, tournament, practice, social, external
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        locationId: '', // Reference to saved location
        imageUrl: '',
        imageFile: null, // For file upload
        teams: [], // Optional for all event types now
        rsvp_enabled: true,
        groupme_integration: true,
        email_notifications: true,
        auto_create_polls: false,
        // Recurring event fields
        is_recurring: false,
        recurrence: {
            frequency: 'weekly', // daily, weekly, biweekly, monthly
            endType: 'count', // count, date, never
            count: 10,
            endDate: '',
            daysOfWeek: [] // For weekly: [0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat]
        },
        // External event fields
        is_external: false,
        external_url: '',
        external_organizer: '',
        tournament_config: {
            format: 'single_elimination',
            seeding_method: 'league_rankings',
            auto_advance: true,
            allow_bracket_editing: true
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [locations, setLocations] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Load locations on mount
    useEffect(() => {
        loadLocations();
    }, []);

    // Populate form when editing an existing event
    useEffect(() => {
        if (editingEvent) {
            console.log('📝 Loading event for editing:', editingEvent);
            setFormData({
                type: editingEvent.type || 'regular_game',
                title: editingEvent.title || '',
                description: editingEvent.description || '',
                date: editingEvent.date || '',
                time: editingEvent.time || '',
                location: editingEvent.location || '',
                locationId: editingEvent.locationId || '',
                imageUrl: editingEvent.imageUrl || '',
                imageFile: null,
                teams: editingEvent.teams || [],
                rsvp_enabled: editingEvent.rsvp_enabled !== false,
                groupme_integration: editingEvent.groupme_integration || false,
                email_notifications: editingEvent.email_notifications !== false,
                auto_create_polls: editingEvent.auto_create_polls || false,
                is_external: editingEvent.is_external || false,
                external_url: editingEvent.external_url || '',
                external_organizer: editingEvent.external_organizer || '',
                tournament_config: editingEvent.tournament_config || {
                    format: 'single_elimination',
                    seeding_method: 'league_rankings',
                    auto_advance: true,
                    allow_bracket_editing: true
                }
            });
            if (editingEvent.imageUrl) {
                setImagePreview(editingEvent.imageUrl);
            }
        }
    }, [editingEvent]);

    const loadLocations = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/locations`);
            if (response.ok) {
                const data = await response.json();
                setLocations(data || []);
            }
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    };

    const eventTypes = [
        { value: 'regular_game', label: '🏆 Regular Game', desc: 'League game between two teams' },
        { value: 'tournament', label: '🏅 Tournament', desc: 'Multi-team bracket competition' },
        { value: 'practice', label: '🏃 Practice', desc: 'Team practice session' },
        { value: 'social', label: '🎉 Social Event', desc: 'Team social gathering or meeting' },
        { value: 'external', label: '🌐 External Event', desc: 'Tournament or event outside our league' }
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

        // Auto-set is_external when type is 'external'
        if (field === 'type' && value === 'external') {
            setFormData(prev => ({
                ...prev,
                type: value,
                is_external: true
            }));
        } else if (field === 'type') {
            setFormData(prev => ({
                ...prev,
                type: value,
                is_external: false
            }));
        }
    };

    const handleLocationSelect = (locationId) => {
        const selectedLocation = locations.find(l => l.id === locationId);
        setFormData(prev => ({
            ...prev,
            locationId: locationId,
            location: selectedLocation ? selectedLocation.name : ''
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        setFormData(prev => ({
            ...prev,
            imageFile: file
        }));
    };

    const uploadImage = async (file) => {
        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'event');

            const response = await fetch(`${backendUrl}/api/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                return data.url;
            } else {
                console.error('Image upload failed');
                return null;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        } finally {
            setUploadingImage(false);
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
        if (!teamIds || teamIds.length < 4) return null;
        
        const teamList = teamIds.map((teamId, index) => ({
            id: teamId,
            name: getTeamName(teamId),
            seed: index + 1
        }));

        const rounds = [];
        let currentTeams = [...teamList];
        let roundNumber = 1;

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
        // Date and time are optional for placeholder events
        // Location is optional
        
        // External events require URL
        if (formData.is_external && !formData.external_url.trim()) {
            newErrors.external_url = 'External event URL is required';
        }
        
        // Teams are FULLY OPTIONAL for all event types
        // No validation on team count - allow 0, 1, 2, or any number
        // Users can add teams as they sign on
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        try {
            setLoading(true);
            
            // Upload image if file is selected
            let finalImageUrl = formData.imageUrl;
            if (formData.imageFile) {
                const uploadedUrl = await uploadImage(formData.imageFile);
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl;
                }
            }
            
            // Generate event ID
            const eventId = editingEvent?.id || `${formData.type}_${Date.now()}`;
            
            // Generate bracket for tournament events with at least 2 teams
            let bracket = null;
            if (formData.type === 'tournament' && formData.teams.length >= 2) {
                bracket = generateTournamentBracket(formData.teams, formData.tournament_config);
            }

            const eventData = {
                ...formData,
                id: eventId,
                imageUrl: finalImageUrl,
                imageFile: undefined, // Don't send file object
                created_by: String(currentUser?.id || 'admin'),
                created_at: new Date().toISOString(),
                status: 'scheduled',
                bracket: bracket
            };
            
            console.log('📤 Final event data to send:', JSON.stringify(eventData, null, 2));
            
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
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                {editingEvent && (
                    <p className="text-gray-600 mt-1">
                        Editing: {editingEvent.title}
                    </p>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
                {/* Event Type Selection */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Event Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                {/* External Event Notice */}
                {formData.type === 'external' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🌐</span>
                            <div>
                                <h4 className="font-semibold text-amber-800">External Event</h4>
                                <p className="text-sm text-amber-700 mt-1">
                                    This is for tournaments or events hosted outside our league. 
                                    Add the external registration/info URL so players can access it.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
                                Location
                            </label>
                            <div className="space-y-2">
                                <select
                                    value={formData.locationId}
                                    onChange={(e) => handleLocationSelect(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select from saved locations...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name} {loc.address ? `- ${loc.address}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="text-center text-xs text-gray-500">or</div>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Type custom location"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty for placeholder events</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <select
                                value={formData.time}
                                onChange={(e) => handleInputChange('time', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select time...</option>
                                {Array.from({ length: 96 }, (_, i) => {
                                    const hours = Math.floor(i / 4);
                                    const minutes = (i % 4) * 15;
                                    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                                    const ampm = hours < 12 ? 'AM' : 'PM';
                                    return (
                                        <option key={timeStr} value={timeStr}>
                                            {displayHours}:{minutes.toString().padStart(2, '0')} {ampm}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    {/* External Event Fields */}
                    {formData.type === 'external' && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
                            <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                🌐 External Event Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Event URL *
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.external_url}
                                        onChange={(e) => handleInputChange('external_url', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.external_url ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="https://tournament-site.com/register"
                                    />
                                    {errors.external_url && <p className="text-red-500 text-sm mt-1">{errors.external_url}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Organizer
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.external_organizer}
                                        onChange={(e) => handleInputChange('external_organizer', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tournament organizer name"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recurring Event Options */}
                    {(formData.type === 'practice' || formData.type === 'meeting' || formData.type === 'social') && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_recurring"
                                    checked={formData.is_recurring}
                                    onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <label htmlFor="is_recurring" className="font-medium text-gray-800">
                                    🔄 Make this a recurring event
                                </label>
                            </div>
                            
                            {formData.is_recurring && (
                                <div className="ml-8 space-y-4 border-l-2 border-blue-200 pl-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Repeat Frequency
                                        </label>
                                        <select
                                            value={formData.recurrence.frequency}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                recurrence: { ...prev.recurrence, frequency: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Every 2 Weeks</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    
                                    {formData.recurrence.frequency === 'weekly' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Repeat On
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => {
                                                            const days = formData.recurrence.daysOfWeek || [];
                                                            const newDays = days.includes(index)
                                                                ? days.filter(d => d !== index)
                                                                : [...days, index];
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                recurrence: { ...prev.recurrence, daysOfWeek: newDays }
                                                            }));
                                                        }}
                                                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                                            (formData.recurrence.daysOfWeek || []).includes(index)
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Recurrence
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="endType"
                                                    value="count"
                                                    checked={formData.recurrence.endType === 'count'}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        recurrence: { ...prev.recurrence, endType: 'count' }
                                                    }))}
                                                    className="text-blue-600"
                                                />
                                                <span>After</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="52"
                                                    value={formData.recurrence.count}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        recurrence: { ...prev.recurrence, count: parseInt(e.target.value) || 10 }
                                                    }))}
                                                    className="w-16 px-2 py-1 border border-gray-300 rounded"
                                                    disabled={formData.recurrence.endType !== 'count'}
                                                />
                                                <span>occurrences</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="endType"
                                                    value="date"
                                                    checked={formData.recurrence.endType === 'date'}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        recurrence: { ...prev.recurrence, endType: 'date' }
                                                    }))}
                                                    className="text-blue-600"
                                                />
                                                <span>On date</span>
                                                <input
                                                    type="date"
                                                    value={formData.recurrence.endDate}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        recurrence: { ...prev.recurrence, endDate: e.target.value }
                                                    }))}
                                                    className="px-2 py-1 border border-gray-300 rounded"
                                                    disabled={formData.recurrence.endType !== 'date'}
                                                />
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="endType"
                                                    value="never"
                                                    checked={formData.recurrence.endType === 'never'}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev,
                                                        recurrence: { ...prev.recurrence, endType: 'never' }
                                                    }))}
                                                    className="text-blue-600"
                                                />
                                                <span>Never (create events indefinitely)</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-blue-700">
                                        💡 This will create multiple events based on your selection when you save.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Event Image Upload */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Event Image
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="flex-1">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="event-image-upload"
                                    />
                                    <label htmlFor="event-image-upload" className="cursor-pointer">
                                        <div className="text-gray-500">
                                            <span className="text-3xl">📷</span>
                                            <p className="mt-2 text-sm">Click to upload image</p>
                                            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            {imagePreview && (
                                <div className="relative">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="w-32 h-32 object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setFormData(prev => ({ ...prev, imageFile: null, imageUrl: '' }));
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                        {uploadingImage && (
                            <p className="text-sm text-blue-600 mt-2">⏳ Uploading image...</p>
                        )}
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

                {/* Team Selection - Now Optional */}
                {formData.type !== 'external' && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Team Selection
                                    <span className="text-sm font-normal text-gray-500 ml-2">(Optional)</span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {formData.type === 'regular_game' && 'Select 2 teams for a game, or leave empty for a placeholder'}
                                    {formData.type === 'tournament' && 'Select 4+ teams, or leave empty for a placeholder'}
                                    {formData.type === 'practice' && 'Select teams for practice, or leave empty'}
                                    {formData.type === 'social' && 'Select teams to invite, or leave empty for all'}
                                </p>
                            </div>
                            {formData.teams.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, teams: [] }))}
                                    className="text-sm text-red-600 hover:text-red-700"
                                >
                                    Clear selection
                                </button>
                            )}
                        </div>
                        
                        {/* Group teams by type */}
                        {['box', 'field', 'outside'].map(teamType => {
                            const teamsByType = teams.filter(t => (t.type || 'field') === teamType);
                            if (teamsByType.length === 0) return null;
                            
                            return (
                                <div key={teamType} className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">{teamType} Teams</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {teamsByType.map(team => {
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
                                                    <div className="flex items-center gap-2">
                                                        {team.style?.logoUrl && (
                                                            <img
                                                                src={team.style.logoUrl}
                                                                alt={team.name}
                                                                className="w-8 h-8 object-cover rounded"
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{team.name}</div>
                                                            <div className="text-xs text-gray-500">{team.division}</div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="ml-auto text-blue-600">✓</div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {errors.teams && <p className="text-red-500 text-sm mt-2">{errors.teams}</p>}
                        
                        <div className="mt-4 text-sm text-gray-600">
                            Selected teams: {formData.teams.length}
                            {formData.type === 'regular_game' && formData.teams.length > 0 && ' / 2'}
                            {formData.type === 'tournament' && formData.teams.length > 0 && ' (minimum 4 for bracket)'}
                        </div>
                    </div>
                )}

                {/* Tournament Configuration */}
                {formData.type === 'tournament' && formData.teams.length >= 4 && (
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
                {formData.type !== 'external' && (
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
                                            checked={formData.email_notifications}
                                            onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            📧 Send Email Notifications
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.groupme_integration}
                                            onChange={(e) => handleInputChange('groupme_integration', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm font-medium text-gray-700">
                                            💬 Integrate with GroupMe
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
                )}

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
                        disabled={loading || uploadingImage}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading 
                            ? (editingEvent ? 'Updating...' : 'Creating...') 
                            : (editingEvent ? 'Update Event' : 'Create Event')
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventCreator;
