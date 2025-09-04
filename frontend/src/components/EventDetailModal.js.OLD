import React, { useState } from 'react';

/**
 * Event Detail Modal - Comprehensive event viewing and management
 * Features tabbed interface with Details, RSVP, Scores, and Brackets
 */
const EventDetailModal = ({ 
    event, 
    onClose, 
    currentUser, 
    teams = [], 
    users = [], 
    leagueInfo = {},
    onUpdateEvent,
    onUpdateRSVP,
    isOpen = false 
}) => {
    const [activeTab, setActiveTab] = useState('details');
    const [editMode, setEditMode] = useState(false);

    if (!isOpen || !event) return null;

    // Permission checks
    const canEdit = () => {
        if (!currentUser) return false;
        
        // Admins can edit any event
        if (currentUser.role === 'admin' || currentUser.roles?.includes('admin')) {
            return true;
        }
        
        // Coaches can edit events for their teams
        if (currentUser.role === 'coach' || currentUser.roles?.includes('coach')) {
            // Check if this event involves the coach's team
            const userTeam = teams.find(team => 
                team.players?.some(player => player.email === currentUser.email) ||
                team.coaches?.some(coach => coach.email === currentUser.email)
            );
            
            if (userTeam && (
                event.teamIds?.includes(userTeam.id) || 
                event.teamId === userTeam.id
            )) {
                return true;
            }
        }
        
        return false;
    };

    // Get team info
    const getTeamInfo = (teamId) => {
        return teams.find(team => team.id === teamId);
    };

    // Get Google Maps static image URL
    const getMapImageUrl = (location) => {
        const apiKey = leagueInfo?.googleMapsApiKey;
        if (!apiKey || !location) return null;
        
        const size = '300x200';
        const zoom = 15;
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(location)}&zoom=${zoom}&size=${size}&markers=color:red%7C${encodeURIComponent(location)}&key=${apiKey}&scale=2`;
    };

    // Open Google Maps
    const openGoogleMaps = (location) => {
        if (!location) return;
        const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=k`;
        window.open(mapsUrl, '_blank');
    };

    const tabs = [
        { id: 'details', label: '📋 Details', icon: '📋' },
        { id: 'rsvp', label: '👥 RSVP', icon: '👥' },
        { id: 'scores', label: '🏆 Scores', icon: '🏆' },
        { id: 'brackets', label: '🏁 Brackets', icon: '🏁' }
    ];

    const userCanEdit = canEdit();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">{event.title || 'Event Details'}</h2>
                            <div className="flex items-center mt-2 space-x-4 text-blue-100">
                                <span>📅 {event.date}</span>
                                {event.time && <span>⏰ {event.time}</span>}
                                {event.location && <span>📍 {event.location}</span>}
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {userCanEdit && (
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm transition-colors"
                                >
                                    {editMode ? '👁️ View' : '✏️ Edit'}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-md transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {activeTab === 'details' && (
                        <DetailsTab 
                            event={event}
                            teams={teams}
                            getTeamInfo={getTeamInfo}
                            getMapImageUrl={getMapImageUrl}
                            openGoogleMaps={openGoogleMaps}
                            editMode={editMode}
                            userCanEdit={userCanEdit}
                        />
                    )}

                    {activeTab === 'rsvp' && (
                        <RSVPTab 
                            event={event}
                            users={users}
                            teams={teams}
                            editMode={editMode}
                            userCanEdit={userCanEdit}
                            onUpdateRSVP={onUpdateRSVP}
                        />
                    )}

                    {activeTab === 'scores' && (
                        <ScoresTab 
                            event={event}
                            teams={teams}
                            getTeamInfo={getTeamInfo}
                            editMode={editMode}
                            userCanEdit={userCanEdit}
                        />
                    )}

                    {activeTab === 'brackets' && (
                        <BracketsTab 
                            event={event}
                            teams={teams}
                            editMode={editMode}
                            userCanEdit={userCanEdit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Details Tab Component
const DetailsTab = ({ event, teams, getTeamInfo, getMapImageUrl, openGoogleMaps, editMode, userCanEdit }) => {
    const mapImageUrl = getMapImageUrl(event.location);
    
    return (
        <div className="space-y-6">
            {/* Event Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Event Information</h3>
                        <div className="space-y-2">
                            <div><strong>Type:</strong> {event.type || 'Event'}</div>
                            <div><strong>Date:</strong> {event.date}</div>
                            <div><strong>Time:</strong> {event.time || 'TBD'}</div>
                            <div><strong>Location:</strong> {event.location || 'TBD'}</div>
                            {event.description && (
                                <div>
                                    <strong>Description:</strong>
                                    <p className="mt-1 text-gray-600">{event.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teams */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Teams Involved</h4>
                        <div className="space-y-2">
                            {event.teamIds?.map(teamId => {
                                const team = getTeamInfo(teamId);
                                return team ? (
                                    <div key={teamId} className="flex items-center space-x-2">
                                        <img 
                                            src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`} 
                                            alt={team.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span>{team.name}</span>
                                    </div>
                                ) : null;
                            })}
                            {event.teamId && !event.teamIds && (() => {
                                const team = getTeamInfo(event.teamId);
                                return team ? (
                                    <div className="flex items-center space-x-2">
                                        <img 
                                            src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`} 
                                            alt={team.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span>{team.name}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Location Map</h4>
                    {mapImageUrl ? (
                        <div 
                            onClick={() => openGoogleMaps(event.location)}
                            className="cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 rounded-lg overflow-hidden"
                        >
                            <img 
                                src={mapImageUrl}
                                alt={`Map of ${event.location}`}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                }}
                            />
                            <div 
                                className="hidden items-center justify-center bg-gray-100 text-gray-500 h-48"
                                onClick={() => openGoogleMaps(event.location)}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">🗺️</div>
                                    <div>Click to view on Google Maps</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => openGoogleMaps(event.location)}
                            className="cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg p-8 text-center text-gray-500"
                        >
                            <div className="text-2xl mb-2">🗺️</div>
                            <div>Click to view {event.location} on Google Maps</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Event Image */}
            {event.imageUrl && (
                <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Event Image</h4>
                    <img 
                        src={event.imageUrl}
                        alt="Event"
                        className="max-w-full h-64 object-cover rounded-lg"
                    />
                </div>
            )}
        </div>
    );
};

// RSVP Tab Component
const RSVPTab = ({ event, users, teams, editMode, userCanEdit, onUpdateRSVP }) => {
    const [rsvpData, setRsvpData] = useState(event.rsvps || {});

    const handleRSVPChange = (userId, status) => {
        const newRsvpData = { ...rsvpData, [userId]: status };
        setRsvpData(newRsvpData);
        if (onUpdateRSVP) {
            onUpdateRSVP(event.id, newRsvpData);
        }
    };

    // Get players from involved teams
    const getInvolvedPlayers = () => {
        const teamIds = event.teamIds || (event.teamId ? [event.teamId] : []);
        const players = [];
        
        teamIds.forEach(teamId => {
            const team = teams.find(t => t.id === teamId);
            if (team?.players) {
                players.push(...team.players.map(player => ({ ...player, teamName: team.name })));
            }
        });
        
        return players;
    };

    const involvedPlayers = getInvolvedPlayers();
    const attendingCount = Object.values(rsvpData).filter(status => status === 'attending').length;
    const notAttendingCount = Object.values(rsvpData).filter(status => status === 'not-attending').length;
    const pendingCount = involvedPlayers.length - attendingCount - notAttendingCount;

    return (
        <div className="space-y-6">
            {/* RSVP Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{attendingCount}</div>
                    <div className="text-sm text-green-700">Attending</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{notAttendingCount}</div>
                    <div className="text-sm text-red-700">Not Attending</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                    <div className="text-sm text-yellow-700">Pending</div>
                </div>
            </div>

            {/* RSVP List */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-4">Player Responses</h4>
                <div className="space-y-2">
                    {involvedPlayers.map(player => {
                        const rsvpStatus = rsvpData[player.id] || 'pending';
                        return (
                            <div key={player.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <img 
                                        src={player.avatar || `https://ui-avatars.com/api/?name=${player.name}&background=random`}
                                        alt={player.name}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <div>
                                        <div className="font-medium">{player.name}</div>
                                        <div className="text-sm text-gray-500">{player.teamName}</div>
                                    </div>
                                </div>
                                
                                {editMode && userCanEdit ? (
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={() => handleRSVPChange(player.id, 'attending')}
                                            className={`px-3 py-1 rounded text-sm ${
                                                rsvpStatus === 'attending'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                            }`}
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => handleRSVPChange(player.id, 'not-attending')}
                                            className={`px-3 py-1 rounded text-sm ${
                                                rsvpStatus === 'not-attending'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                                            }`}
                                        >
                                            ✗
                                        </button>
                                        <button
                                            onClick={() => handleRSVPChange(player.id, 'pending')}
                                            className={`px-3 py-1 rounded text-sm ${
                                                rsvpStatus === 'pending'
                                                    ? 'bg-yellow-600 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                                            }`}
                                        >
                                            ?
                                        </button>
                                    </div>
                                ) : (
                                    <div className={`px-3 py-1 rounded-full text-sm ${
                                        rsvpStatus === 'attending' ? 'bg-green-100 text-green-800' :
                                        rsvpStatus === 'not-attending' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {rsvpStatus === 'attending' ? '✓ Attending' :
                                         rsvpStatus === 'not-attending' ? '✗ Not Attending' :
                                         '? Pending'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Scores Tab Component
const ScoresTab = ({ event, teams, getTeamInfo, editMode, userCanEdit }) => {
    const [scores, setScores] = useState(event.scores || {});

    const handleScoreChange = (teamId, score) => {
        setScores(prev => ({ ...prev, [teamId]: parseInt(score) || 0 }));
    };

    const eventTeams = event.teamIds || (event.teamId ? [event.teamId] : []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">Game Scores</h4>
                {editMode && userCanEdit && (
                    <div className="text-sm text-blue-600">Edit mode: Click to modify scores</div>
                )}
            </div>

            {eventTeams.length >= 2 ? (
                <div className="space-y-4">
                    {eventTeams.map(teamId => {
                        const team = getTeamInfo(teamId);
                        if (!team) return null;

                        return (
                            <div key={teamId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <img 
                                        src={team.logo || `https://ui-avatars.com/api/?name=${team.name}&background=random`}
                                        alt={team.name}
                                        className="w-10 h-10 rounded-full"
                                    />
                                    <span className="font-medium">{team.name}</span>
                                </div>
                                
                                {editMode && userCanEdit ? (
                                    <input
                                        type="number"
                                        min="0"
                                        value={scores[teamId] || 0}
                                        onChange={(e) => handleScoreChange(teamId, e.target.value)}
                                        className="w-20 p-2 border border-gray-300 rounded text-center text-xl font-bold"
                                    />
                                ) : (
                                    <div className="text-2xl font-bold text-blue-600">
                                        {scores[teamId] || 0}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Winner Display */}
                    {Object.keys(scores).length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <div className="text-lg font-semibold text-yellow-800">
                                {(() => {
                                    const maxScore = Math.max(...Object.values(scores));
                                    const winners = Object.entries(scores)
                                        .filter(([_, score]) => score === maxScore)
                                        .map(([teamId, _]) => getTeamInfo(teamId)?.name)
                                        .filter(Boolean);
                                    
                                    if (winners.length === 1) {
                                        return `🏆 Winner: ${winners[0]}`;
                                    } else if (winners.length > 1) {
                                        return `🤝 Tie: ${winners.join(' & ')}`;
                                    }
                                    return 'Game in progress...';
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">⚽</div>
                    <div>This event doesn't have multiple teams for scoring</div>
                    <div className="text-sm mt-1">Scores are available for games between teams</div>
                </div>
            )}
        </div>
    );
};

// Brackets Tab Component  
const BracketsTab = ({ event, teams, editMode, userCanEdit }) => {
    const [brackets, setBrackets] = useState(event.brackets || null);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">Tournament Brackets</h4>
                {editMode && userCanEdit && (
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                        Generate Bracket
                    </button>
                )}
            </div>

            {event.type === 'tournament' ? (
                <div className="border border-gray-200 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">🏁</div>
                    <div className="text-lg font-semibold text-gray-800 mb-2">Tournament Brackets</div>
                    <div className="text-gray-600 mb-4">
                        Bracket management for {event.title}
                    </div>
                    
                    {brackets ? (
                        <div className="bg-gray-50 p-4 rounded">
                            <div className="text-sm text-gray-600">Bracket system coming soon...</div>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            No brackets generated yet
                            {editMode && userCanEdit && (
                                <div className="mt-2 text-sm">Click "Generate Bracket" to create tournament structure</div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🏆</div>
                    <div>Brackets are only available for tournament events</div>
                    <div className="text-sm mt-1">Change event type to "Tournament" to enable brackets</div>
                </div>
            )}
        </div>
    );
};

export default EventDetailModal;