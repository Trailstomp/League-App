import React, { useState, useEffect, useRef } from 'react';
import { LacrosseIcon } from '../components/LacrosseIcons';
import TeamGalleryDisplay from '../components/TeamGalleryDisplay';
import GroupMeChat from '../components/GroupMeChat';
import NewsDisplay from '../components/NewsDisplay';
import TeamStatsDisplay from '../components/TeamStatsDisplay';
import YouTubeSettings from '../components/managers/YouTubeSettings';
import PlayerCard from '../components/PlayerCard';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import CachedImage from '../components/CachedImage';
import Skeleton, { SkeletonEventCard } from '../components/Skeleton';

const TeamDetailPage = ({ team, teams, events, players, currentUser, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('home');

    if (!team) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} />
                    <h2 className="text-xl font-semibold text-slate-800 mt-4">Team not found</h2>
                    <p className="text-slate-600 mt-2">The team you're looking for doesn't exist.</p>
                    <button 
                        onClick={() => onNavigate('home')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Check if current user is a coach or admin for this team
    const isTeamCoachOrAdmin = currentUser && (
        currentUser.roles?.includes('admin') ||
        (currentUser.roles?.includes('coach') && (
            currentUser.teamId === team.id ||
            currentUser.teamAssignments?.some(a => a.teamId === team.id)
        ))
    );

    const tabs = [
        { id: 'home', label: 'Home', icon: 'venue' },
        { id: 'schedule', label: 'Schedule', icon: 'calendar' },
        { id: 'roster', label: 'Roster', icon: 'teams' },
        { id: 'stats', label: 'Stats', icon: 'trophy' },
        { id: 'chat', label: 'Team Chat', icon: 'email' },
        { id: 'media', label: 'Photos & Vids', icon: 'view' },
        { id: 'contact', label: 'Contact', icon: 'email' },
        // Coach/Admin only tabs
        ...(isTeamCoachOrAdmin ? [
            { id: 'manage-roster', label: 'Manage Roster', icon: 'admin', coachOnly: true },
            { id: 'recruiting', label: 'Recruiting', icon: 'add', coachOnly: true },
            { id: 'team-fees', label: 'Fees', icon: '💰', coachOnly: true },
        ] : []),
        { id: 'settings', label: 'Settings', icon: 'settings', adminOnly: true }
    ];

    const teamStyle = team.style || {};

    return (
        <div 
            className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 min-h-screen"
            style={{
                background: teamStyle.pageBackgroundType === 'image' && teamStyle.pageBackgroundImage
                    ? `url(${teamStyle.pageBackgroundImage})`
                    : `linear-gradient(135deg, ${teamStyle.pageBackgroundColor || teamStyle.backgroundColor || '#f8fafc'} 0%, rgba(255,255,255,0.8) 100%)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            {/* DEBUG: Log team colors - DETAILED */}
            {(() => {
                console.log('🎨 DETAILED Team page background analysis:');
                console.log('  - pageBackgroundType:', teamStyle.pageBackgroundType);
                console.log('  - pageBackgroundColor:', teamStyle.pageBackgroundColor);
                console.log('  - backgroundColor:', teamStyle.backgroundColor);
                console.log('  - primaryColor:', teamStyle.primaryColor);
                console.log('  - Final calculated color:', teamStyle.pageBackgroundColor || teamStyle.backgroundColor || '#f8fafc');
                console.log('  - Full teamStyle object:', teamStyle);
                return null;
            })()}
            {/* Team Header */}
            <div 
                className="relative bg-gradient-to-r from-slate-800 to-slate-600 text-white rounded-lg overflow-hidden mb-4 sm:mb-6"
                style={{
                    backgroundColor: teamStyle.primaryColor || '#64748b',
                    backgroundImage: teamStyle.bannerUrl ? `url(${teamStyle.bannerUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {teamStyle.bannerUrl && <div className="absolute inset-0 bg-black bg-opacity-40"></div>}
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        {/* Team Logo - Enhanced - LARGER */}
                        <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-white">
                            {teamStyle.logoUrl ? (
                                <CachedImage 
                                    src={fixGoogleDriveUrl(teamStyle.logoUrl)} 
                                    alt={`${team.name} logo`}
                                    className="w-full h-full object-contain p-2"
                                    style={{ opacity: teamStyle.logoOpacity || 1 }}
                                    fallback={
                                        <div 
                                            className="w-full h-full flex items-center justify-center rounded-xl"
                                            style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                        >
                                            <LacrosseIcon name="stick" style={{fontSize: '64px', color: 'white'}} />
                                        </div>
                                    }
                                />
                            ) : (
                                <div 
                                    className="w-full h-full flex items-center justify-center rounded-xl"
                                    style={{ backgroundColor: teamStyle.primaryColor || '#dc2626' }}
                                >
                                    <LacrosseIcon name="stick" style={{fontSize: '64px', color: 'white'}} />
                                </div>
                            )}
                        </div>
                        
                        {/* Team Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">{team.name}</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                                <div>
                                    <span className="text-blue-200">Division:</span>
                                    <div className="font-semibold truncate">{team.division || 'Field'}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Record:</span>
                                    <div className="font-semibold">{team.wins || 0}-{team.losses || 0}-{team.ties || 0}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Coach:</span>
                                    <div className="font-semibold truncate">{team.coach || 'TBD'}</div>
                                </div>
                                <div>
                                    <span className="text-blue-200">Home Field:</span>
                                    <div className="font-semibold truncate">{team.homeField || 'TBD'}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Back Button */}
                        <button 
                            onClick={() => onNavigate('home')}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm flex-shrink-0"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-4 sm:mb-6">
                <div className="flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            <LacrosseIcon name={tab.icon} className="mr-1 sm:mr-2" style={{fontSize: '14px'}} />
                            <span className="hidden sm:inline">{tab.label}</span>
                            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6 overflow-x-hidden">
                {activeTab === 'home' && <TeamHomeTab team={team} teams={teams} events={events} onNavigate={onNavigate} />}
                {activeTab === 'schedule' && <TeamScheduleTab team={team} events={events} />}
                {activeTab === 'roster' && <TeamRosterTab team={team} players={players} />}
                {activeTab === 'stats' && <TeamStatsTab team={team} events={events} />}
                {activeTab === 'chat' && <TeamChatTab team={team} />}
                {activeTab === 'media' && <TeamMediaTab team={team} />}
                {activeTab === 'contact' && <TeamContactTab team={team} />}
                {activeTab === 'manage-roster' && <TeamRosterManageTab team={team} currentUser={currentUser} />}
                {activeTab === 'recruiting' && <TeamRecruitingTab team={team} currentUser={currentUser} />}
                {activeTab === 'team-fees' && <TeamFeesTab team={team} currentUser={currentUser} />}
                {activeTab === 'settings' && <TeamSettingsTab team={team} />}
            </div>
        </div>
    );
};

// Team Home Tab - Enhanced with Team Identity and Locations
const TeamHomeTab = ({ team, teams, events, onNavigate }) => {
    const [teamLocations, setTeamLocations] = useState([]);
    const [apiIntegrations, setApiIntegrations] = useState({});
    const [loadingLocations, setLoadingLocations] = useState(true);
    const teamStyle = team.style || {};

    // Load team locations from API
    useEffect(() => {
        const loadTeamLocations = async () => {
            try {
                setLoadingLocations(true);
                
                // Load team-specific locations
                const locationsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations?team_id=${team.id}`);
                if (locationsResponse.ok) {
                    const locationsData = await locationsResponse.json();
                    setTeamLocations(locationsData);
                    console.log('📍 Loaded team locations:', locationsData.length, 'for team', team.name);
                }

                // Load API integrations for Google Maps
                const apiResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`);
                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    setApiIntegrations(apiData);
                }
                
            } catch (error) {
                console.error('❌ Error loading team locations:', error);
            } finally {
                setLoadingLocations(false);
            }
        };

        if (team.id) {
            loadTeamLocations();
        }
    }, [team.id, team.name]);

    const getLocationTypeIcon = (types) => {
        if (!types || types.length === 0) return '📍';
        const icons = {
            practice_field: '🏃‍♂️',
            game_field: '🏟️',
            social_venue: '🍽️',
            training_facility: '💪'
        };
        return icons[types[0]] || '📍';
    };

    const getSurfaceIcon = (surface) => {
        const icons = {
            turf: '🌿',
            grass: '🌱',
            concrete: '🧱',
            indoor_court: '🏢'
        };
        return icons[surface] || '🌿';
    };

    const openGoogleMaps = (address) => {
        if (!address) return;
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k`, '_blank');
    };

    const getMapImageUrl = (address, satellite = false) => {
        const apiKey = apiIntegrations?.googleMapsApiKey;
        if (!apiKey || !address) return null;
        const mapType = satellite ? 'satellite' : 'roadmap';
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=17&size=400x200&maptype=${mapType}&markers=color:red%7C${encodeURIComponent(address)}&key=${apiKey}&scale=2`;
    };
    
    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Team News */}
            <NewsDisplay teamId={team.id} maxItems={5} />

            {/* Team Media Gallery */}
            <TeamGalleryDisplay 
                teamId={team.id}
                pageType="team"
            />

            {/* Team Locations Section - Moved below stats */}
            {teamLocations.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">🏟️ Team Locations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamLocations.map(location => (
                            <div 
                                key={location.id} 
                                className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <span className="text-xl mr-2">{getLocationTypeIcon(location.types)}</span>
                                            <h4 className="font-semibold text-slate-800">{location.name}</h4>
                                        </div>
                                        
                                        {/* Multiple type badges */}
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {location.types && location.types.map((type, index) => (
                                                <span key={index} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {type.replace('_', ' ')}
                                                </span>
                                            ))}
                                            {(!location.types || location.types.length === 0) && (
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    location
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1 text-sm text-slate-600">
                                            {location.address && (
                                                <div 
                                                    className="flex items-center cursor-pointer hover:text-blue-600"
                                                    onClick={() => openGoogleMaps(location.address)}
                                                    title="Click to open in Google Maps"
                                                >
                                                    📍 {location.address}
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center space-x-4">
                                                <span className={`flex items-center ${location.indoor ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {location.indoor ? '🏢 Indoor' : '🌤️ Outdoor'}
                                                </span>
                                                <span className="flex items-center">
                                                    {getSurfaceIcon(location.surface)} {location.surface?.replace('_', ' ') || 'grass'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {location.description && (
                                            <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Google Maps Preview with Satellite */}
                                {getMapImageUrl(location.address) && (
                                    <div className="mt-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div 
                                                className="cursor-pointer rounded-lg overflow-hidden border border-slate-200"
                                                onClick={() => openGoogleMaps(location.address)}
                                                title="Click to open in Google Maps"
                                            >
                                                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 border-b">📍 Street View</div>
                                                <img 
                                                    src={getMapImageUrl(location.address, false)} 
                                                    alt={`Street map of ${location.name}`}
                                                    className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                            <div 
                                                className="cursor-pointer rounded-lg overflow-hidden border border-slate-200"
                                                onClick={() => openGoogleMaps(location.address)}
                                                title="Click to open in Google Maps"
                                            >
                                                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 border-b">🛰️ Satellite</div>
                                                <img 
                                                    src={getMapImageUrl(location.address, true)} 
                                                    alt={`Satellite view of ${location.name}`}
                                                    className="w-full h-24 object-cover hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loadingLocations && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">🏟️ Team Locations</h3>
                    <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500">
                        <p>Loading team locations...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Team Schedule Tab
const TeamScheduleTab = ({ team, events = [] }) => {
    const teamEvents = events.filter(event => 
        event.teamIds?.includes(team.id) || 
        event.homeTeam === team.id || 
        event.awayTeam === team.id
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Schedule</h2>
            
            {teamEvents.length > 0 ? (
                <div className="space-y-4">
                    {teamEvents.map(event => (
                        <div key={event.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-slate-800">{event.title}</h3>
                                    <p className="text-sm text-slate-600">{event.date} at {event.time}</p>
                                    <p className="text-sm text-slate-500">{event.location}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        event.type === 'game' ? 'bg-red-100 text-red-800' :
                                        event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {event.type || 'Event'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="calendar" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No scheduled events</h3>
                    <p>Check back later for upcoming games and practices</p>
                </div>
            )}
        </div>
    );
};

// Team Roster Tab
const TeamRosterTab = ({ team, players = [] }) => {
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const teamPlayers = players.filter(player => player.teamId === team.id);
    const cardRef = useRef(null);

    const openPlayerCard = (player) => {
        setSelectedPlayer(player);
        setIsFlipped(false);
    };

    const closePlayerCard = () => {
        setSelectedPlayer(null);
        setIsFlipped(false);
    };

    const toggleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    // Print the player card
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const teamColor = team?.style?.primaryColor || '#2563eb';
        
        printWindow.document.write(`
            <html>
            <head>
                <title>${selectedPlayer.name} - Player Card</title>
                <style>
                    @page { size: 3.5in 5in; margin: 0; }
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    .card { width: 3in; border: 2px solid ${teamColor}; border-radius: 12px; overflow: hidden; }
                    .header { background: ${teamColor}; color: white; padding: 8px; text-align: center; }
                    .photo { height: 180px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; }
                    .photo img { max-width: 100%; max-height: 100%; object-fit: cover; }
                    .info { padding: 12px; text-align: center; }
                    .name { font-size: 18px; font-weight: bold; color: ${teamColor}; margin-bottom: 4px; }
                    .position { background: ${teamColor}; color: white; padding: 4px 12px; border-radius: 12px; display: inline-block; font-size: 12px; }
                    .number { font-size: 24px; font-weight: bold; color: ${teamColor}; }
                    .section { margin-top: 8px; font-size: 11px; text-align: left; padding: 0 8px; }
                    .section-title { font-weight: bold; color: #666; margin-bottom: 2px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">${team?.name || 'Team'}</div>
                    <div class="photo">
                        ${selectedPlayer.photoUrl ? `<img src="${selectedPlayer.photoUrl}" />` : '<span style="font-size:48px;color:#ccc">👤</span>'}
                    </div>
                    <div class="info">
                        <div class="number">#${selectedPlayer.jerseyNumber || '?'}</div>
                        <div class="name">${selectedPlayer.name}</div>
                        <div class="position">${selectedPlayer.position || 'Player'}</div>
                    </div>
                    ${selectedPlayer.lacrosseHistory?.highSchool?.teamName ? `
                        <div class="section">
                            <div class="section-title">🏫 High School</div>
                            <div>${selectedPlayer.lacrosseHistory.highSchool.teamName}</div>
                        </div>
                    ` : ''}
                    ${selectedPlayer.lacrosseHistory?.college?.teamName ? `
                        <div class="section">
                            <div class="section-title">🎓 College</div>
                            <div>${selectedPlayer.lacrosseHistory.college.teamName}</div>
                        </div>
                    ` : ''}
                    ${selectedPlayer.funFacts ? `
                        <div class="section">
                            <div class="section-title">✨ Fun Facts</div>
                            <div>${selectedPlayer.funFacts}</div>
                        </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Download as PDF
    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: [3.5, 5] });
        const teamColor = team?.style?.primaryColor || '#2563eb';
        
        // Card border
        pdf.setDrawColor(teamColor);
        pdf.setLineWidth(0.02);
        pdf.roundedRect(0.1, 0.1, 3.3, 4.8, 0.15, 0.15, 'S');
        
        // Header
        pdf.setFillColor(teamColor);
        pdf.rect(0.1, 0.1, 3.3, 0.4, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.text(team?.name || 'Team', 1.75, 0.35, { align: 'center' });
        
        // Jersey number
        pdf.setTextColor(teamColor);
        pdf.setFontSize(36);
        pdf.text(`#${selectedPlayer.jerseyNumber || '?'}`, 1.75, 2.2, { align: 'center' });
        
        // Name
        pdf.setFontSize(16);
        pdf.text(selectedPlayer.name || 'Player', 1.75, 2.5, { align: 'center' });
        
        // Position
        pdf.setFontSize(11);
        pdf.text(selectedPlayer.position || 'Player', 1.75, 2.75, { align: 'center' });
        
        // Bio info
        let yPos = 3.1;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        
        if (selectedPlayer.lacrosseHistory?.highSchool?.teamName) {
            pdf.text(`🏫 HS: ${selectedPlayer.lacrosseHistory.highSchool.teamName}`, 0.3, yPos);
            yPos += 0.25;
        }
        if (selectedPlayer.lacrosseHistory?.college?.teamName) {
            pdf.text(`🎓 College: ${selectedPlayer.lacrosseHistory.college.teamName}`, 0.3, yPos);
            yPos += 0.25;
        }
        if (selectedPlayer.funFacts) {
            const funFacts = selectedPlayer.funFacts.substring(0, 60) + (selectedPlayer.funFacts.length > 60 ? '...' : '');
            pdf.text(`✨ ${funFacts}`, 0.3, yPos, { maxWidth: 2.9 });
        }
        
        pdf.save(`${selectedPlayer.name?.replace(/\s+/g, '_')}_card.pdf`);
    };

    const getPositionColor = (position) => {
        switch (position?.toLowerCase()) {
            case 'attack':
                return 'text-red-600';
            case 'midfield':
            case 'midfielder':
                return 'text-blue-600';
            case 'defense':
            case 'defender':
                return 'text-green-600';
            case 'goalie':
            case 'goalkeeper':
                return 'text-purple-600';
            default:
                return 'text-gray-600';
        }
    };

    // Player Card Popup Modal with Flip Animation
    const PlayerCardPopup = ({ player, team, isFlipped, onFlip, onClose, onPrint, onDownload }) => {
        if (!player) return null;

        const teamColor = team?.style?.primaryColor || '#2563eb';
        const accentColor = team?.style?.accentColor || '#3b82f6';

        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="relative max-w-sm w-full">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-3 -right-3 z-20 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                    >
                        <span className="text-gray-600 text-xl">✕</span>
                    </button>

                    {/* Card Container with 3D Flip */}
                    <div 
                        className="relative w-full cursor-pointer"
                        style={{ 
                            perspective: '1500px',
                            height: '480px'
                        }}
                        onClick={onFlip}
                    >
                        <div 
                            className="relative w-full h-full"
                            style={{ 
                                transformStyle: 'preserve-3d',
                                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                transition: 'transform 0.8s ease-in-out'
                            }}
                        >
                            {/* FRONT OF CARD */}
                            <div 
                                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                                style={{ 
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    border: `3px solid ${teamColor}`,
                                    background: `linear-gradient(135deg, white 0%, ${team?.style?.backgroundColor || '#f8fafc'} 100%)`
                                }}
                            >
                                {/* Header with Team Name */}
                                <div 
                                    className="h-10 w-full flex items-center justify-center"
                                    style={{ background: `linear-gradient(90deg, ${teamColor} 0%, ${accentColor} 100%)` }}
                                >
                                    <span className="text-white font-bold text-sm tracking-wide">{team?.name || 'Team'}</span>
                                </div>
                                
                                {/* Player Photo */}
                                <div className="relative h-56 bg-gradient-to-br from-slate-100 to-slate-200">
                                    {player.photoUrl ? (
                                        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team?.style?.backgroundColor || '#f8fafc'} 0%, ${teamColor}15 100%)` }}>
                                            <svg className="w-24 h-24 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: teamColor }}>
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                            </svg>
                                        </div>
                                    )}
                                    
                                    {/* Team Logo */}
                                    <div className="absolute top-3 left-3">
                                        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                                            {team?.style?.logoUrl ? (
                                                <img src={fixGoogleDriveUrl(team.style.logoUrl)} alt={team.name} className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: teamColor }}>
                                                    <span className="text-white font-bold">{team?.name?.charAt(0)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Jersey Number */}
                                    <div className="absolute bottom-3 right-3">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white shadow-lg" style={{ backgroundColor: teamColor }}>
                                            {player.jerseyNumber || '?'}
                                        </div>
                                    </div>
                                    
                                    {/* Position Badge */}
                                    <div className="absolute top-3 right-3">
                                        <div className="px-3 py-1 bg-white/90 rounded-full text-sm font-bold shadow-sm" style={{ color: teamColor }}>
                                            {player.position || 'Player'}
                                        </div>
                                    </div>
                                </div>

                                {/* Player Info */}
                                <div className="p-4 bg-white text-center">
                                    <h2 className="font-bold text-xl mb-2" style={{ color: teamColor }}>
                                        {player.name}
                                    </h2>
                                    <div className="inline-block px-4 py-1 rounded-full text-white text-sm font-medium" style={{ backgroundColor: accentColor }}>
                                        {player.position || 'Player'}
                                    </div>
                                    <p className="text-slate-400 text-sm mt-3">
                                        Tap card to flip →
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="h-3 w-full" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${teamColor} 100%)` }}></div>
                            </div>

                            {/* BACK OF CARD */}
                            <div 
                                className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                                style={{ 
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    border: `3px solid ${teamColor}`,
                                    background: `linear-gradient(135deg, ${teamColor}08 0%, #f8fafc 50%, ${accentColor}08 100%)`
                                }}
                            >
                                {/* Header */}
                                <div className="h-10 w-full flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${teamColor} 0%, ${accentColor} 100%)` }}>
                                    <span className="text-white font-bold text-sm tracking-wide">Player Bio</span>
                                </div>
                                
                                <div className="p-4 h-[calc(100%-52px)] overflow-y-auto">
                                    {/* Header with mini photo */}
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: teamColor }}>
                                            {player.photoUrl ? (
                                                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-lg font-bold">
                                                    {player.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-lg" style={{ color: teamColor }}>{player.name}</h3>
                                            <p className="text-sm text-slate-500">#{player.jerseyNumber || '?'} • {player.position || 'Player'}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    {(player.goals > 0 || player.assists > 0) && (
                                        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${teamColor}08` }}>
                                            <div className="text-xs font-semibold text-slate-600 uppercase mb-2">📊 Season Stats</div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="bg-white rounded p-2 shadow-sm">
                                                    <div className="text-xl font-bold" style={{ color: teamColor }}>{player.goals || 0}</div>
                                                    <div className="text-xs text-slate-500">Goals</div>
                                                </div>
                                                <div className="bg-white rounded p-2 shadow-sm">
                                                    <div className="text-xl font-bold" style={{ color: teamColor }}>{player.assists || 0}</div>
                                                    <div className="text-xs text-slate-500">Assists</div>
                                                </div>
                                                <div className="bg-white rounded p-2 shadow-sm">
                                                    <div className="text-xl font-bold" style={{ color: teamColor }}>{(player.goals || 0) + (player.assists || 0)}</div>
                                                    <div className="text-xs text-slate-500">Points</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bio Info */}
                                    <div className="space-y-3 text-sm">
                                        {player.lacrosseHistory?.highSchool?.teamName && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">🏫</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">High School</div>
                                                    <div className="text-slate-600">{player.lacrosseHistory.highSchool.teamName} {player.lacrosseHistory.highSchool.graduationYear && `'${player.lacrosseHistory.highSchool.graduationYear.toString().slice(-2)}`}</div>
                                                </div>
                                            </div>
                                        )}
                                        {player.lacrosseHistory?.college?.teamName && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">🎓</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">College</div>
                                                    <div className="text-slate-600">{player.lacrosseHistory.college.teamName} {player.lacrosseHistory.college.graduationYear && `'${player.lacrosseHistory.college.graduationYear.toString().slice(-2)}`}</div>
                                                </div>
                                            </div>
                                        )}
                                        {player.lacrosseHistory?.postGrad?.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">🏆</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">Post-Grad</div>
                                                    {player.lacrosseHistory.postGrad.map((t, i) => (
                                                        <div key={i} className="text-slate-600">{t.teamName} {t.years && `(${t.years})`}</div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {player.funFacts && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">✨</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700">Fun Facts</div>
                                                    <div className="text-slate-600">{player.funFacts}</div>
                                                </div>
                                            </div>
                                        )}
                                        {player.socialMedia && Object.values(player.socialMedia).some(v => v) && (
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg">📱</span>
                                                <div>
                                                    <div className="font-semibold text-slate-700 mb-1">Social</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {player.socialMedia.instagram && <a href={`https://instagram.com/${player.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200" onClick={e => e.stopPropagation()}>📸 @{player.socialMedia.instagram}</a>}
                                                        {player.socialMedia.twitter && <a href={`https://twitter.com/${player.socialMedia.twitter}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-blue-100 text-blue-500 rounded-full hover:bg-blue-200" onClick={e => e.stopPropagation()}>🐦 @{player.socialMedia.twitter}</a>}
                                                        {player.socialMedia.tiktok && <a href={`https://tiktok.com/@${player.socialMedia.tiktok}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200" onClick={e => e.stopPropagation()}>🎵 @{player.socialMedia.tiktok}</a>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Empty state */}
                                        {!player.lacrosseHistory?.highSchool?.teamName && 
                                         !player.lacrosseHistory?.college?.teamName && 
                                         !player.funFacts &&
                                         !(player.goals > 0 || player.assists > 0) && (
                                            <div className="text-center text-slate-400 py-4">
                                                <p>No bio information yet</p>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-center text-slate-400 text-sm mt-3">
                                        ← Tap to flip back
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="h-3 w-full absolute bottom-0" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${teamColor} 100%)` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-3 mt-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrint(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                        >
                            🖨️ Print
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDownload(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                        >
                            📥 Save PDF
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Team Roster</h2>
                <div className="text-sm text-slate-500">
                    {teamPlayers.length} player{teamPlayers.length !== 1 ? 's' : ''}
                </div>
            </div>
            
            {teamPlayers.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {teamPlayers.map(player => (
                        <div 
                            key={player.id} 
                            className="relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
                            style={{ 
                                border: `2px solid ${team.style?.primaryColor || '#2563eb'}40`
                            }}
                            onClick={() => openPlayerCard(player)}
                        >
                            {/* Card Header */}
                            <div 
                                className="h-2 w-full"
                                style={{ background: `linear-gradient(90deg, ${team.style?.primaryColor || '#2563eb'} 0%, ${team.style?.accentColor || '#3b82f6'} 100%)` }}
                            />
                            
                            {/* Player Photo */}
                            <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200">
                                {player.photoUrl ? (
                                    <CachedImage 
                                        src={player.photoUrl} 
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                        fallback={
                                            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, ${team.style?.primaryColor || '#2563eb'}15 100%)` }}>
                                                <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                </svg>
                                            </div>
                                        }
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${team.style?.backgroundColor || '#f8fafc'} 0%, ${team.style?.primaryColor || '#2563eb'}15 100%)` }}>
                                        <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                )}
                                
                                {/* Team Logo */}
                                <div className="absolute top-2 left-2">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                                        {team.style?.logoUrl ? (
                                            <CachedImage src={fixGoogleDriveUrl(team.style.logoUrl)} alt={team.name} className="w-full h-full object-contain p-0.5" fallback={<span className="text-white font-bold text-xs">{team.name.charAt(0)}</span>} />
                                        ) : (
                                            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}>
                                                <span className="text-white font-bold text-xs">{team.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Jersey Number */}
                                <div className="absolute bottom-2 right-2">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md" style={{ backgroundColor: team.style?.primaryColor || '#2563eb' }}>
                                        {player.jerseyNumber || '?'}
                                    </div>
                                </div>
                                
                                {/* Position Badge */}
                                <div className="absolute top-2 right-2">
                                    <div className="px-2 py-1 bg-white/90 rounded-full text-xs font-bold shadow-sm" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                        {player.position?.charAt(0) || 'P'}
                                    </div>
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                                        View Card
                                    </span>
                                </div>
                            </div>

                            {/* Player Info */}
                            <div className="p-3 bg-white text-center">
                                <h3 className="font-bold text-sm mb-1 truncate" style={{ color: team.style?.primaryColor || '#2563eb' }}>
                                    {player.name}
                                </h3>
                                <div className="text-xs font-medium px-2 py-0.5 rounded-full inline-block text-white" style={{ backgroundColor: team.style?.accentColor || '#3b82f6' }}>
                                    {player.position || 'Player'}
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${team.style?.accentColor || '#3b82f6'} 0%, ${team.style?.primaryColor || '#2563eb'} 100%)` }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-6 sm:p-8 rounded-lg text-center text-slate-500">
                    <LacrosseIcon name="teams" style={{fontSize: '48px'}} className="mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-medium mb-2">No players registered</h3>
                    <p className="text-sm mb-4">Start building your team by adding players to the roster</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Add First Player
                    </button>
                </div>
            )}

            {/* Player Detail Modal */}
            {selectedPlayer && (
                <PlayerDetailModal 
                    player={selectedPlayer} 
                    team={team}
                    onClose={() => setSelectedPlayer(null)} 
                />
            )}
        </div>
    );
};

// Team Stats Tab
const TeamStatsTab = ({ team, events = [] }) => {
    return <TeamStatsDisplay teamId={team.id} />;
};

// Team Media Tab
const TeamMediaTab = ({ team }) => {
    // Import YouTubeGallery and MediaGallery dynamically
    const YouTubeGallery = React.lazy(() => import('../components/YouTubeGallery'));
    // TeamGalleryDisplay is already imported above

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Photos & Videos</h2>
            
            <React.Suspense fallback={<div className="bg-slate-50 p-8 rounded-lg text-center text-slate-500">Loading media...</div>}>
                {/* Team-specific Media Gallery */}
                <TeamGalleryDisplay 
                    teamId={team.id}
                    pageType="team"
                />
                
                {/* Team YouTube Videos */}
                <YouTubeGallery 
                    teamId={team.id}
                    title={`${team.name} YouTube Videos`} 
                />
            </React.Suspense>
        </div>
    );
};

// Team Contact Tab - Enhanced with Locations
const TeamContactTab = ({ team }) => {
    const [teamLocations, setTeamLocations] = useState([]);
    const [apiIntegrations, setApiIntegrations] = useState({});
    const [loadingLocations, setLoadingLocations] = useState(true);

    // Load team locations from API
    useEffect(() => {
        const loadTeamLocations = async () => {
            try {
                setLoadingLocations(true);
                
                // Load team-specific locations
                const locationsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/locations?team_id=${team.id}`);
                if (locationsResponse.ok) {
                    const locationsData = await locationsResponse.json();
                    setTeamLocations(locationsData);
                }

                // Load API integrations for Google Maps
                const apiResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/api-integrations`);
                if (apiResponse.ok) {
                    const apiData = await apiResponse.json();
                    setApiIntegrations(apiData);
                }
                
            } catch (error) {
                console.error('❌ Error loading team locations:', error);
            } finally {
                setLoadingLocations(false);
            }
        };

        if (team.id) {
            loadTeamLocations();
        }
    }, [team.id]);

    const getLocationTypeIcon = (types) => {
        if (!types || types.length === 0) return '📍';
        const icons = {
            practice_field: '🏃‍♂️',
            game_field: '🏟️', 
            social_venue: '🍽️',
            training_facility: '💪'
        };
        return icons[types[0]] || '📍';
    };

    const openGoogleMaps = (address) => {
        if (!address) return;
        window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=k`, '_blank');
    };

    return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Contact Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Team Details</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Team Name</label>
                        <div className="text-slate-800">{team.name}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Division</label>
                        <div className="text-slate-800">{team.division || 'Field'}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Home Field</label>
                        <div className="text-slate-800">{team.homeField || 'TBD'}</div>
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Coaching Staff</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Head Coach</label>
                        <div className="text-slate-800">{team.coach || 'TBD'}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Contact Email</label>
                        <div className="text-slate-800">
                            {team.contactEmail ? (
                                <a href={`mailto:${team.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                                    {team.contactEmail}
                                </a>
                            ) : (
                                'Not provided'
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Team Locations */}
        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">📍 Team Locations</h3>
            {loadingLocations ? (
                <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500">
                    <p>Loading team locations...</p>
                </div>
            ) : teamLocations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {teamLocations.map(location => (
                        <div key={location.id} className="bg-white border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <span className="text-lg mr-2">{getLocationTypeIcon(location.types)}</span>
                                <h4 className="font-semibold text-slate-800">{location.name}</h4>
                            </div>
                            
                            {/* Multiple type badges */}
                            <div className="flex flex-wrap gap-1 mb-2">
                                {location.types && location.types.map((type, index) => (
                                    <span key={index} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {type.replace('_', ' ')}
                                    </span>
                                ))}
                                {(!location.types || location.types.length === 0) && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        location
                                    </span>
                                )}
                            </div>
                            
                            {location.address && (
                                <div 
                                    className="text-sm text-slate-600 mb-2 cursor-pointer hover:text-blue-600"
                                    onClick={() => openGoogleMaps(location.address)}
                                    title="Click to open in Google Maps"
                                >
                                    📍 {location.address}
                                </div>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-slate-500">
                                <span className={location.indoor ? 'text-orange-600' : 'text-green-600'}>
                                    {location.indoor ? '🏢 Indoor' : '🌤️ Outdoor'}
                                </span>
                                <span>
                                    {location.surface?.replace('_', ' ') || 'grass'}
                                </span>
                            </div>
                            
                            {location.description && (
                                <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 p-6 rounded-lg text-center text-slate-500">
                    <span className="text-3xl mb-2 block">📍</span>
                    <p>No team locations configured</p>
                    <p className="text-xs mt-1">Contact your team administrator to add practice fields, game venues, and meeting locations</p>
                </div>
            )}
        </div>
    </div>
    );
};

// Team Chat Tab
const TeamChatTab = ({ team }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Team Chat</h2>
                <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">💬</span>
                    Real-time GroupMe integration
                </div>
            </div>
            
            <GroupMeChat teamId={team.id} channelType="team" />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">Team Chat Features</h4>
                        <div className="text-sm text-blue-700 mt-1">
                            <ul className="list-disc list-inside space-y-1">
                                <li>RSVP to events with <code className="bg-blue-100 px-1 rounded">/rsvp yes</code> or <code className="bg-blue-100 px-1 rounded">/rsvp no</code></li>
                                <li>Check schedule with <code className="bg-blue-100 px-1 rounded">/schedule</code></li>
                                <li>Get help with <code className="bg-blue-100 px-1 rounded">/help</code></li>
                                <li>Messages sync in real-time from GroupMe</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Team Settings Tab - Admin Only
const TeamSettingsTab = ({ team }) => {
    const [activeSection, setActiveSection] = useState('youtube');
    
    const sections = [
        { id: 'youtube', label: 'YouTube Channel', icon: '📺' },
        { id: 'social', label: 'Social Media', icon: '📱' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' }
    ];
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Team Settings</h2>
                <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">⚙️</span>
                    Manage team configuration
                </div>
            </div>
            
            {/* Settings Navigation */}
            <div className="flex gap-2 border-b pb-4">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeSection === section.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <span className="mr-2">{section.icon}</span>
                        {section.label}
                    </button>
                ))}
            </div>
            
            {/* Settings Content */}
            <div className="bg-white/90 rounded-lg shadow-sm border p-6 backdrop-blur-sm">
                {activeSection === 'youtube' && (
                    <YouTubeSettings 
                        teamId={team.id} 
                        onSave={() => console.log('Team YouTube settings saved')} 
                    />
                )}
                
                {activeSection === 'social' && (
                    <div className="text-center py-8 text-slate-600">
                        <p className="text-4xl mb-4">📱</p>
                        <h3 className="text-lg font-semibold mb-2">Social Media Settings</h3>
                        <p>Configure your team's social media links and integration.</p>
                        <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
                    </div>
                )}
                
                {activeSection === 'appearance' && (
                    <div className="text-center py-8 text-slate-600">
                        <p className="text-4xl mb-4">🎨</p>
                        <h3 className="text-lg font-semibold mb-2">Appearance Settings</h3>
                        <p>Customize your team page colors, fonts, and branding.</p>
                        <p className="text-sm text-slate-500 mt-4">Coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Team Recruiting Tab - For coaches to send invitations
const TeamRecruitingTab = ({ team, currentUser }) => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        method: 'email',
        position: '',
        message: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadInvites();
    }, [team.id]);

    const loadInvites = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`);
            if (response.ok) {
                const data = await response.json();
                setInvites(data.invites || []);
            }
        } catch (error) {
            console.error('Error loading invites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setMessage('❌ Name is required');
            return;
        }
        
        if (formData.method === 'email' && !formData.email.trim()) {
            setMessage('❌ Email is required for email invites');
            return;
        }
        
        if (formData.method === 'sms' && !formData.phone.trim()) {
            setMessage('❌ Phone number is required for SMS invites');
            return;
        }

        try {
            setSending(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/invites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    sentBy: currentUser?.id,
                    sentByName: currentUser?.name || 'Coach'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('✅ Invitation sent successfully!');
                setShowInviteForm(false);
                setFormData({ name: '', email: '', phone: '', method: 'email', position: '', message: '' });
                loadInvites();
            } else {
                setMessage(`❌ ${data.detail || 'Failed to send invite'}`);
            }
        } catch (error) {
            setMessage('❌ Network error. Please try again.');
        } finally {
            setSending(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleResend = async (inviteId) => {
        try {
            const response = await fetch(`${backendUrl}/api/invite/${inviteId}/resend`, {
                method: 'POST'
            });
            
            if (response.ok) {
                setMessage('✅ Invitation resent!');
                loadInvites();
            } else {
                setMessage('❌ Failed to resend invite');
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleCancel = async (inviteId) => {
        if (!window.confirm('Are you sure you want to cancel this invitation?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/invite/${inviteId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                setMessage('✅ Invitation cancelled');
                loadInvites();
            } else {
                setMessage('❌ Failed to cancel invite');
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const getStatusBadge = (status) => {
        const styles = {
            sent: 'bg-blue-100 text-blue-800',
            viewed: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-green-100 text-green-800',
            declined: 'bg-red-100 text-red-800',
            expired: 'bg-gray-100 text-gray-800',
            failed: 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const positionOptions = [
        'Attack', 'Midfield', 'Defense', 'Goalie', 'FOGO', 'LSM', 'Any Position'
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Recruiting</h2>
                    <p className="text-slate-600">Invite new players to join {team.name}</p>
                </div>
                <button
                    onClick={() => setShowInviteForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <span className="text-lg">+</span> Send Invitation
                </button>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Invite Form Modal */}
            {showInviteForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Send Recruitment Invitation</h3>
                                <button
                                    onClick={() => setShowInviteForm(false)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSendInvite} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Recruit's Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="John Smith"
                                        required
                                    />
                                </div>

                                {/* Send Method */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Send via
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="method"
                                                value="email"
                                                checked={formData.method === 'email'}
                                                onChange={() => setFormData({...formData, method: 'email'})}
                                                className="mr-2"
                                            />
                                            📧 Email
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="method"
                                                value="sms"
                                                checked={formData.method === 'sms'}
                                                onChange={() => setFormData({...formData, method: 'sms'})}
                                                className="mr-2"
                                            />
                                            📱 Text Message
                                        </label>
                                    </div>
                                </div>

                                {/* Email */}
                                {formData.method === 'email' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="recruit@email.com"
                                        />
                                    </div>
                                )}

                                {/* Phone */}
                                {formData.method === 'sms' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                )}

                                {/* Position */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Position Needed
                                    </label>
                                    <select
                                        value={formData.position}
                                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select position...</option>
                                        {positionOptions.map(pos => (
                                            <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Personal Message */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Personal Message
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="We'd love to have you on our team! We practice on Tuesdays and Thursdays..."
                                    />
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInviteForm(false)}
                                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        {sending ? 'Sending...' : 'Send Invitation'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Invites Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {invites.filter(i => i.status === 'sent').length}
                    </div>
                    <div className="text-sm text-blue-800">Sent</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                        {invites.filter(i => i.status === 'viewed').length}
                    </div>
                    <div className="text-sm text-yellow-800">Viewed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {invites.filter(i => i.status === 'accepted').length}
                    </div>
                    <div className="text-sm text-green-800">Accepted</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-600">
                        {invites.length}
                    </div>
                    <div className="text-sm text-slate-800">Total</div>
                </div>
            </div>

            {/* Invites List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">Sent Invitations</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : invites.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">📨</div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No invitations yet</h3>
                        <p className="text-slate-600">Start recruiting by sending your first invitation!</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {invites.map(invite => (
                            <div key={invite.id} className="p-4 hover:bg-slate-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800">{invite.name}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(invite.status)}`}>
                                                {invite.status}
                                            </span>
                                            {invite.method === 'sms' && <span className="text-sm">📱</span>}
                                            {invite.method === 'email' && <span className="text-sm">📧</span>}
                                        </div>
                                        <div className="text-sm text-slate-600 mt-1">
                                            {invite.email || invite.phone}
                                            {invite.position && <span className="ml-2 text-slate-500">• {invite.position}</span>}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Sent {new Date(invite.sentAt).toLocaleDateString()} by {invite.sentByName}
                                            {invite.viewedAt && (
                                                <span className="ml-2">• Viewed {new Date(invite.viewedAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    {(invite.status === 'sent' || invite.status === 'viewed') && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleResend(invite.id)}
                                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                            >
                                                Resend
                                            </button>
                                            <button
                                                onClick={() => handleCancel(invite.id)}
                                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Team Roster Management Tab - For coaches to add/edit players
const TeamRosterManageTab = ({ team, currentUser }) => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        playerNumber: '',
        position: '',
        status: 'active'
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadPlayers();
    }, [team.id]);

    const loadPlayers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/team/${team.id}/players`);
            if (response.ok) {
                const data = await response.json();
                setPlayers(data || []);
            }
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setMessage('❌ Name is required');
            return;
        }

        try {
            const playerData = {
                ...formData,
                roles: ['player'],
                teamId: team.id,
                teamName: team.name,
                teamAssignments: [{
                    teamId: team.id,
                    teamName: team.name,
                    playerNumber: formData.playerNumber,
                    position: formData.position,
                    isPrimary: true
                }],
                status: 'active',
                approvedBy: currentUser?.id
            };

            const response = await fetch(`${backendUrl}/api/users/admin-create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(playerData)
            });

            if (response.ok) {
                setMessage('✅ Player added successfully!');
                setShowAddForm(false);
                setFormData({ name: '', email: '', phone: '', playerNumber: '', position: '', status: 'active' });
                loadPlayers();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to add player'}`);
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 4000);
    };

    const handleRemovePlayer = async (playerId) => {
        if (!window.confirm('Remove this player from the team?')) return;
        
        try {
            // Update user to remove team assignment
            const response = await fetch(`${backendUrl}/api/users/${playerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teamId: null,
                    teamAssignments: []
                })
            });

            if (response.ok) {
                setMessage('✅ Player removed from team');
                loadPlayers();
            }
        } catch (error) {
            setMessage('❌ Error removing player');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const positionOptions = ['Attack', 'Midfield', 'Defense', 'Goalie', 'FOGO', 'LSM'];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Manage Roster</h2>
                    <p className="text-slate-600">Add, edit, or remove players from {team.name}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <span>+</span> Add Player
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Add Player Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Add Player to {team.name}</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={handleAddPlayer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Jersey #</label>
                                        <input
                                            type="text"
                                            value={formData.playerNumber}
                                            onChange={(e) => setFormData({...formData, playerNumber: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                        <select
                                            value={formData.position}
                                            onChange={(e) => setFormData({...formData, position: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            <option value="">Select...</option>
                                            {positionOptions.map(pos => (
                                                <option key={pos} value={pos}>{pos}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Add Player
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Players List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Current Roster ({players.length} players)</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : players.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">👥</div>
                        <p className="text-slate-600">No players on roster yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {players.map(player => (
                            <div key={player.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                        {player.jerseyNumber || '#'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-800">{player.name}</div>
                                        <div className="text-sm text-slate-500">
                                            {player.position || 'No position'} • {player.email || 'No email'}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemovePlayer(player.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Team Fees Tab - For coaches to manage team fees
const TeamFeesTab = ({ team, currentUser }) => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dueDate: '',
        description: ''
    });

    const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;

    useEffect(() => {
        loadFees();
    }, [team.id]);

    const loadFees = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${backendUrl}/api/fees?teamId=${team.id}`);
            if (response.ok) {
                const data = await response.json();
                setFees(data.fees || []);
            }
        } catch (error) {
            console.error('Error loading fees:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFee = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.amount) {
            setMessage('❌ Name and amount are required');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/fees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    amount: parseFloat(formData.amount),
                    dueDate: formData.dueDate || null,
                    description: formData.description,
                    teamId: team.id,
                    teamName: team.name,
                    scope: 'team',
                    createdBy: currentUser?.id
                })
            });

            if (response.ok) {
                setMessage('✅ Fee created successfully!');
                setShowAddForm(false);
                setFormData({ name: '', amount: '', dueDate: '', description: '' });
                loadFees();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.detail || 'Failed to create fee'}`);
            }
        } catch (error) {
            setMessage('❌ Network error');
        }
        setTimeout(() => setMessage(''), 4000);
    };

    const handleDeleteFee = async (feeId) => {
        if (!window.confirm('Delete this fee?')) return;
        
        try {
            const response = await fetch(`${backendUrl}/api/fees/${feeId}`, { method: 'DELETE' });
            if (response.ok) {
                setMessage('✅ Fee deleted');
                loadFees();
            }
        } catch (error) {
            setMessage('❌ Error deleting fee');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Team Fees</h2>
                    <p className="text-slate-600">Manage fees for {team.name}</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                    <span>+</span> Add Fee
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                </div>
            )}

            {/* Add Fee Form Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Create Team Fee</h3>
                                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <form onSubmit={handleAddFee} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fee Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        placeholder="Season Registration, Tournament Fee, etc."
                                        required
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="100.00"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        rows={2}
                                        placeholder="Details about the fee..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        Create Fee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Fees List */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b">
                    <h3 className="font-semibold text-slate-800">Team Fees</h3>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : fees.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-4xl mb-4">💰</div>
                        <p className="text-slate-600">No fees set up yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {fees.map(fee => (
                            <div key={fee.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-slate-800">{fee.name}</div>
                                    <div className="text-sm text-slate-500">
                                        ${fee.amount?.toFixed(2) || '0.00'}
                                        {fee.dueDate && ` • Due: ${new Date(fee.dueDate).toLocaleDateString()}`}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteFee(fee.id)}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailPage;