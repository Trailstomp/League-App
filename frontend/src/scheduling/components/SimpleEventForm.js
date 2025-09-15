import React, { useState, useEffect } from 'react';
import SimpleTeamSelector from './SimpleTeamSelector';
import useEventPersistence from '../hooks/useEventPersistence'; 

/**
 * Simple Event Form - Direct state management, no complex hooks
 * This should finally solve the team selection persistence!
 */
const SimpleEventForm = ({ 
    initialEvent = null, 
    teams = [], 
    leagueSchedule = [], 
    setLeagueSchedule,
    leagueLocations = [], // Keep for backward compatibility
    onSave,
    onCancel 
}) => {
    // Use the event persistence hook for API integration
    const { saveEventToSchedule } = useEventPersistence();
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    
    // State for optional field visibility - show if editing existing event with these fields
    const [showSeasonField, setShowSeasonField] = useState(!!initialEvent?.season);
    const [showLeagueField, setShowLeagueField] = useState(!!initialEvent?.league);
    
    // State for dynamic picklist options
    const [seasons, setSeasons] = useState([]);
    const [leagues, setLeagues] = useState([]);

    // Load locations from API
    useEffect(() => {
        const loadLocations = async () => {
            try {
                setLoadingLocations(true);
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations`);
                if (response.ok) {
                    const locationsData = await response.json();
                    setLocations(locationsData);
                    console.log('📍 Loaded locations for events:', locationsData.length, 'locations');
                } else {
                    console.error('❌ Failed to load locations:', response.statusText);
                }
            } catch (error) {
                console.error('❌ Error loading locations:', error);
            } finally {
                setLoadingLocations(false);
            }
        };

        loadLocations();
        loadSeasonsAndLeagues();
    }, []);

    // Load seasons and leagues from backend
    const loadSeasonsAndLeagues = async () => {
        try {
            const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
            const response = await fetch(`${BACKEND_URL}/api/league-data`);
            if (response.ok) {
                const data = await response.json();
                setSeasons(data.seasons || []);
                setLeagues(data.leagues || []);
                console.log('📅 Loaded seasons:', data.seasons?.length || 0);
                console.log('🏆 Loaded leagues:', data.leagues?.length || 0);
            }
        } catch (error) {
            console.error('Error loading seasons/leagues:', error);
        }
    };
    // Helper function to get team name by ID
    const getTeamName = (teamId) => {
        if (!teamId) return 'League-wide';
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown Team';
    };

    // Direct state management - no hooks confusion!
    const [eventData, setEventData] = useState(() => {
        console.log('🚀 SimpleEventForm initializing with:', initialEvent);
        
        const baseData = {
            id: initialEvent?.id || null,
            title: initialEvent?.title || '',
            date: initialEvent?.date || '',
            time: initialEvent?.time || '',
            location: initialEvent?.location || '',
            description: initialEvent?.description || '',
            type: initialEvent?.type || 'event',
            season: initialEvent?.season || '',
            league: initialEvent?.league || '',
            imageUrl: initialEvent?.imageUrl || '',
            imageStyle: initialEvent?.imageStyle || 'cover',
        };

        // Handle team IDs - support both formats
        let teamIds = [];
        if (initialEvent?.teamIds && Array.isArray(initialEvent.teamIds)) {
            teamIds = [...initialEvent.teamIds];
        } else if (initialEvent?.teamId) {
            teamIds = [initialEvent.teamId];
        }

        console.log('🚀 Extracted teamIds:', teamIds);
        
        return {
            ...baseData,
            teamIds: teamIds
        };
    });

    const isNewEvent = !eventData.id || eventData.id.startsWith('event_');

    const updateField = (field, value) => {
        console.log(`📝 Updating ${field}:`, value);
        setEventData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTeamToggle = (teamId) => {
        console.log('🔄 handleTeamToggle called with:', teamId);
        setEventData(prev => {
            const isSelected = prev.teamIds.includes(teamId);
            const newTeamIds = isSelected 
                ? prev.teamIds.filter(id => id !== teamId)
                : [...prev.teamIds, teamId];
            
            console.log('🔄 Team toggle result:', { 
                teamId, 
                wasSelected: isSelected, 
                oldTeamIds: prev.teamIds, 
                newTeamIds 
            });

            return {
                ...prev,
                teamIds: newTeamIds
            };
        });
    };

    const handleSave = async () => {
        try {
            console.log('💾 SIMPLE SAVE - Starting save process');
            console.log('💾 Event data to save:', eventData);

            // Create event with proper ID
            const eventToSave = {
                ...eventData,
                id: eventData.id || `event_${Date.now()}`,
                teamIds: [...eventData.teamIds] // Ensure array copy
            };

            console.log('💾 Final event to save:', eventToSave);

            // CRITICAL FIX: Use API persistence instead of memory-only saves
            console.log('🔄 Saving event to database via API...');
            
            // CRITICAL BSON FIX: Check document size before saving
            try {
                const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
                const currentDataResponse = await fetch(`${BACKEND_URL}/api/league-data`);
                if (currentDataResponse.ok) {
                    const currentData = await currentDataResponse.json();
                    const currentSize = JSON.stringify(currentData).length;
                    const eventSize = JSON.stringify(eventToSave).length;
                    const estimatedTotalSize = currentSize + eventSize;
                    const sizeLimitMB = 15; // Safety margin below 16MB
                    const sizeLimitBytes = sizeLimitMB * 1024 * 1024;
                    
                    console.log('📏 Document size check:', {
                        currentSizeMB: (currentSize / 1024 / 1024).toFixed(2),
                        eventSizeMB: (eventSize / 1024 / 1024).toFixed(2),
                        estimatedTotalMB: (estimatedTotalSize / 1024 / 1024).toFixed(2),
                        limitMB: sizeLimitMB
                    });
                    
                    if (estimatedTotalSize > sizeLimitBytes) {
                        const errorMsg = `Document size would exceed ${sizeLimitMB}MB limit. Current: ${(currentSize/1024/1024).toFixed(1)}MB, Adding: ${(eventSize/1024/1024).toFixed(1)}MB. Please contact admin to optimize database.`;
                        console.error('🚨 BSON size limit exceeded:', errorMsg);
                        alert(errorMsg);
                        return;
                    }
                }
            } catch (sizeCheckError) {
                console.warn('⚠️ Could not check document size, proceeding with save:', sizeCheckError);
            }
            
            const saveResult = await saveEventToSchedule(eventToSave, leagueSchedule, setLeagueSchedule);
            
            if (saveResult.success) {
                console.log('✅ Event successfully saved to database:', saveResult.event.title);
            } else {
                console.error('❌ Failed to save event to database:', saveResult.error);
                if (saveResult.error.includes('BSONObj size') || saveResult.error.includes('too large')) {
                    alert('Database document too large. Please contact admin to optimize data storage. Error: Document size exceeded MongoDB limit.');
                } else {
                    alert(`Failed to save event: ${saveResult.error}`);
                }
                return;
            }

            console.log('✅ SIMPLE SAVE - Success!');
            onSave && onSave(eventToSave);

        } catch (error) {
            console.error('❌ SIMPLE SAVE - Error:', error);
        }
    };

    const handleCancel = () => {
        console.log('🚫 SIMPLE CANCEL');
        onCancel && onCancel();
    };

    return (
        <div className="simple-event-form bg-white p-6 rounded-lg shadow-lg max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    🎯 {isNewEvent ? 'Create New Event' : 'Edit Event'} (Simple Version)
                </h2>
                <p className="text-gray-600">Direct state management - no hooks complexity</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Event Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Event Details</h3>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            value={eventData.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter event title"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                type="date"
                                value={eventData.date}
                                onChange={(e) => updateField('date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time
                            </label>
                            <select
                                value={eventData.time}
                                onChange={(e) => updateField('time', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select time</option>
                                {(() => {
                                    const times = [];
                                    for (let hour = 0; hour < 24; hour++) {
                                        for (let minute = 0; minute < 60; minute += 15) {
                                            const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                            const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                            const ampm = hour < 12 ? 'AM' : 'PM';
                                            const minuteStr = minute.toString().padStart(2, '0');
                                            const display = `${hour12}:${minuteStr} ${ampm}`;
                                            
                                            times.push(
                                                <option key={time24} value={time24}>
                                                    {display}
                                                </option>
                                            );
                                        }
                                    }
                                    return times;
                                })()}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                        </label>
                        {(() => {
                            // Get team-specific locations from API
                            const teamLocations = locations.filter(loc => loc.teamId && loc.teamId !== '').map(location => ({
                                value: location.name,
                                label: `🥍 ${location.name} (${getTeamName(location.teamId)})`,
                                type: 'team',
                                teamName: getTeamName(location.teamId),
                                surface: location.surface,
                                indoor: location.indoor,
                                address: location.address,
                                types: location.types || []
                            }));

                            // Get league-wide locations from API
                            const leagueLocationOptions = locations.filter(loc => !loc.teamId || loc.teamId === '').map(location => ({
                                value: location.name,
                                label: `🏛️ ${location.name}${location.address ? ` - ${location.address}` : ''}`,
                                type: 'league',
                                surface: location.surface,
                                indoor: location.indoor,
                                address: location.address,
                                types: location.types || []
                            }));

                            const allLocationOptions = [...teamLocations, ...leagueLocationOptions];
                            const selectedLocation = allLocationOptions.find(loc => loc.value === eventData.location);

                            if (loadingLocations) {
                                return (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                        Loading locations...
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-2">
                                    <select
                                        value={eventData.location}
                                        onChange={(e) => updateField('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">🏟️ Select location or enter custom</option>
                                        {allLocationOptions.map((option, index) => (
                                            <option key={index} value={option.value} title={option.address}>
                                                {option.label} {option.indoor ? '(Indoor)' : '(Outdoor)'} - {option.surface}
                                                {option.types.length > 0 ? ` [${option.types.join(', ').replace(/_/g, ' ')}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    
                                    {/* Custom location input */}
                                    <input
                                        type="text"
                                        value={eventData.location}
                                        onChange={(e) => updateField('location', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Or type custom location..."
                                    />
                                    
                                    {/* Location Preview */}
                                    {selectedLocation && selectedLocation.address && (
                                        <LocationPreview location={selectedLocation} />
                                    )}
                                    
                                    <div className="text-xs text-gray-500">
                                        📍 Available: {teamLocations.length} team locations, {leagueLocationOptions.length} league locations
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Type
                        </label>
                        <select
                            value={eventData.type}
                            onChange={(e) => updateField('type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="event">General Event</option>
                            <option value="game">Game</option>
                            <option value="practice">Practice</option>
                            <option value="tournament">Tournament</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Image/Logo
                        </label>
                        <div className="space-y-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        console.log('📸 Image file selected:', file.name, file.size);
                                        
                                        // Check file size (limit to 5MB)
                                        if (file.size > 5 * 1024 * 1024) {
                                            alert('Image file too large. Please choose a file under 5MB.');
                                            return;
                                        }
                                        
                                        // Convert to base64
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            const base64 = e.target.result;
                                            console.log('📸 Image converted to base64, length:', base64.length);
                                            updateField('imageUrl', base64);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            
                            {/* Image Display Options */}
                            {eventData.imageUrl && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Image Display Style
                                    </label>
                                    <select
                                        value={eventData.imageStyle || 'cover'}
                                        onChange={(e) => updateField('imageStyle', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="cover">🖼️ Fill (crop to fit)</option>
                                        <option value="contain">📐 Fit (show full image)</option>
                                        <option value="fill">📏 Stretch (may distort)</option>
                                    </select>
                                </div>
                            )}
                            
                            {/* Image Preview */}
                            {eventData.imageUrl && (
                                <div className="relative">
                                    <img 
                                        src={eventData.imageUrl} 
                                        alt="Event preview"
                                        className={`w-full h-32 rounded border border-gray-200 ${
                                            eventData.imageStyle === 'contain' ? 'object-contain bg-gray-50' :
                                            eventData.imageStyle === 'fill' ? 'object-fill' :
                                            'object-cover'
                                        }`}
                                        onError={(e) => {
                                            console.error('Image preview failed to load');
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateField('imageUrl', '');
                                            updateField('imageStyle', 'cover');
                                            console.log('📸 Image removed');
                                        }}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                        title="Remove image"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            
                            <div className="text-xs text-gray-500">
                                📸 Upload an image file (JPG, PNG, GIF) up to 5MB
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={eventData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Event description..."
                        />
                    </div>
                    
                    {/* Optional Fields with Checkboxes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Optional Information</label>
                        <div className="space-y-3">
                            {/* Season Field */}
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={showSeasonField}
                                        onChange={(e) => setShowSeasonField(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">Include Season</span>
                                </label>
                                {showSeasonField && (
                                    <select
                                        value={eventData.season}
                                        onChange={(e) => updateField('season', e.target.value)}
                                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Season</option>
                                        <option value="Spring 2024">Spring 2024</option>
                                        <option value="Summer 2024">Summer 2024</option>
                                        <option value="Fall 2024">Fall 2024</option>
                                        <option value="Winter 2024">Winter 2024</option>
                                        <option value="Spring 2025">Spring 2025</option>
                                        <option value="Summer 2025">Summer 2025</option>
                                        <option value="Fall 2025">Fall 2025</option>
                                        <option value="Winter 2025">Winter 2025</option>
                                        <option value="Spring 2026">Spring 2026</option>
                                        <option value="Summer 2026">Summer 2026</option>
                                        <option value="Fall 2026">Fall 2026</option>
                                        <option value="Winter 2026">Winter 2026</option>
                                    </select>
                                )}
                            </div>
                            
                            {/* League Field */}
                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={showLeagueField}
                                        onChange={(e) => setShowLeagueField(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">Include League</span>
                                </label>
                                {showLeagueField && (
                                    <select
                                        value={eventData.league}
                                        onChange={(e) => updateField('league', e.target.value)}
                                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select League</option>
                                        <option value="Recreational">Recreational</option>
                                        <option value="Competitive">Competitive</option>
                                        <option value="Division A">Division A</option>
                                        <option value="Division B">Division B</option>
                                        <option value="Division C">Division C</option>
                                        <option value="Championship">Championship</option>
                                        <option value="Tournament">Tournament</option>
                                        <option value="Playoff">Playoff</option>
                                        <option value="Exhibition">Exhibition</option>
                                        <option value="Youth">Youth</option>
                                        <option value="Adult">Adult</option>
                                        <option value="Masters">Masters</option>
                                        <option value="Women's">Women's</option>
                                        <option value="Men's">Men's</option>
                                        <option value="Co-Ed">Co-Ed</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Team Selection - Simple Component */}
                <div>
                    <SimpleTeamSelector 
                        teams={teams}
                        selectedTeamIds={eventData.teamIds}
                        onTeamToggle={handleTeamToggle}
                        title="Participating Teams"
                    />
                </div>
            </div>

            {/* Debug Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-700 mb-2">🔍 Debug Info:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <div><strong>Event ID:</strong> {eventData.id || 'New Event'}</div>
                        <div><strong>Title:</strong> {eventData.title || 'Empty'}</div>
                        <div><strong>Date:</strong> {eventData.date || 'Not set'}</div>
                        <div><strong>Location:</strong> {eventData.location || 'Not set'}</div>
                        <div><strong>Image URL:</strong> {eventData.imageUrl ? '✅ Set' : '❌ None'}</div>
                    </div>
                    <div>
                        <div><strong>Teams Selected:</strong> {eventData.teamIds.length}</div>
                        <div><strong>Team IDs:</strong> [{eventData.teamIds.join(', ') || 'None'}]</div>
                        <div><strong>Form Valid:</strong> {eventData.title ? '✅ Yes' : '❌ Missing title'}</div>
                        <div><strong>Is New:</strong> {isNewEvent ? '✅ Yes' : '❌ Editing existing'}</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={!eventData.title}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isNewEvent ? '💾 Create Event' : '💾 Update Event'}
                </button>
            </div>
        </div>
    );
};

// Location Preview Component for Events
const LocationPreview = ({ location }) => {
    const [apiIntegrations, setApiIntegrations] = useState({});

    useEffect(() => {
        const loadApiIntegrations = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`);
                if (response.ok) {
                    const data = await response.json();
                    setApiIntegrations(data);
                }
            } catch (error) {
                console.error('Error loading API integrations:', error);
            }
        };
        loadApiIntegrations();
    }, []);

    const getMapImageUrl = (address, satellite = false) => {
        const apiKey = apiIntegrations?.googleMapsApiKey;
        if (!apiKey || !address) return null;
        const mapType = satellite ? 'satellite' : 'roadmap';
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=16&size=300x150&maptype=${mapType}&markers=color:red%7C${encodeURIComponent(address)}&key=${apiKey}&scale=2`;
    };

    const openGoogleMaps = (address) => {
        if (!address) return;
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k`, '_blank');
    };

    if (!location.address) return null;

    return (
        <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-slate-700">📍 {location.value}</span>
                <div className="ml-2 flex flex-wrap gap-1">
                    {location.types.map((type, index) => (
                        <span key={index} className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            {type.replace('_', ' ')}
                        </span>
                    ))}
                </div>
            </div>
            
            <div className="text-xs text-slate-600 mb-2">
                {location.address} • {location.indoor ? '🏢 Indoor' : '🌤️ Outdoor'} • {location.surface}
            </div>

            {getMapImageUrl(location.address) && (
                <div className="grid grid-cols-2 gap-2">
                    <div 
                        className="cursor-pointer rounded overflow-hidden border border-slate-200"
                        onClick={() => openGoogleMaps(location.address)}
                        title="Click to open in Google Maps"
                    >
                        <div className="text-xs text-slate-500 bg-white px-2 py-1 border-b">📍 Street</div>
                        <img 
                            src={getMapImageUrl(location.address, false)} 
                            alt={`Street map of ${location.value}`}
                            className="w-full h-16 object-cover hover:opacity-90 transition-opacity"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                    <div 
                        className="cursor-pointer rounded overflow-hidden border border-slate-200"
                        onClick={() => openGoogleMaps(location.address)}
                        title="Click to open in Google Maps"
                    >
                        <div className="text-xs text-slate-500 bg-white px-2 py-1 border-b">🛰️ Satellite</div>
                        <img 
                            src={getMapImageUrl(location.address, true)} 
                            alt={`Satellite view of ${location.value}`}
                            className="w-full h-16 object-cover hover:opacity-90 transition-opacity"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleEventForm;