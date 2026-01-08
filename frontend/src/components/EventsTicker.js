import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fixGoogleDriveUrl } from '../utils/imageUtils';

const EventsTicker = ({ events = [], teams = [], websiteStyle = {}, onEventClick, onTeamClick }) => {
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const animationRef = useRef(null);
    const scrollPosRef = useRef(0);

    // Get team data by ID
    const getTeam = (teamId) => {
        return teams.find(t => t.id === teamId) || null;
    };

    // Get team name by ID
    const getTeamName = (teamId) => {
        if (!teamId) return 'TBD';
        const team = getTeam(teamId);
        const name = team?.name || String(teamId);
        return name || 'TBD';
    };

    // Get team logo by ID with Google Drive URL fix
    const getTeamLogo = (teamId) => {
        const team = getTeam(teamId);
        const logoUrl = team?.style?.logoUrl || team?.logo || null;
        return logoUrl ? fixGoogleDriveUrl(logoUrl) : null;
    };

    // Get venue name from location (extract just the venue name, not full address)
    const getVenueName = (event) => {
        // Prefer venue field if available
        if (event.venue) return event.venue;
        
        // If location exists, try to extract just the venue name (before any commas or numbers)
        if (event.location) {
            const loc = event.location;
            // If it looks like a full address (has numbers or commas), take first part
            if (/\d/.test(loc) || loc.includes(',')) {
                // Take everything before the first number or comma
                const match = loc.match(/^([^,\d]+)/);
                if (match) {
                    return match[1].trim();
                }
            }
            return loc;
        }
        return 'TBD';
    };

    // Filter events based on admin ticker settings
    const applyTickerFilters = useCallback((events) => {
        // First deduplicate by event ID
        const uniqueEvents = events.reduce((unique, event) => {
            if (!unique.find(e => e.id === event.id)) {
                unique.push(event);
            }
            return unique;
        }, []);

        // Get admin filter settings - much longer lookback for better visibility
        const lookBackDays = websiteStyle?.tickerLookBack || 365; // Default 1 year lookback
        const lookForwardDays = websiteStyle?.tickerLookForward || 365; // Default 1 year forward
        const eventFilters = websiteStyle?.tickerFilters || {
            games: true,
            tournaments: true,
            practices: true,
            meetings: true,
            social: true,
            other: true
        };

        // Apply date range filter
        const today = new Date();
        const lookBackDate = new Date();
        lookBackDate.setDate(today.getDate() - lookBackDays);
        const lookForwardDate = new Date();
        lookForwardDate.setDate(today.getDate() + lookForwardDays);

        const filteredEvents = uniqueEvents.filter(event => {
            // Include events without dates (placeholder events)
            const eventDate = event.date ? new Date(event.date) : null;
            let inDateRange = true;
            
            if (eventDate && !isNaN(eventDate.getTime())) {
                inDateRange = eventDate >= lookBackDate && eventDate <= lookForwardDate;
            }
            
            // Event type filter - handle both singular and plural forms
            const eventType = event.type || 'other';
            let typeAllowed = false;
            
            // Map singular database types to plural filter types
            const typeMapping = {
                'game': 'games',
                'regular_game': 'games',
                'tournament': 'tournaments', 
                'practice': 'practices',
                'meeting': 'meetings',
                'social': 'social',
                'external': 'other',
                'event': 'other',
                'other': 'other',
                '': 'other',  // Empty type maps to other
                'undefined': 'other'
            };
            
            // Check both the original type and mapped type
            const mappedType = typeMapping[eventType] || 'other';
            typeAllowed = eventFilters[eventType] || eventFilters[mappedType] || eventFilters['other'] || false;
            
            return inDateRange && typeAllowed;
        });

        // Sort by date (upcoming first, then by title)
        filteredEvents.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date('2099-12-31');
            const dateB = b.date ? new Date(b.date) : new Date('2099-12-31');
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            return (a.title || '').localeCompare(b.title || '');
        });

        console.log('🎫 Ticker filtering:', {
            total: events.length,
            unique: uniqueEvents.length,
            filtered: filteredEvents.length,
            lookBackDays,
            lookForwardDays,
            activeFilters: Object.entries(eventFilters).filter(([_, enabled]) => enabled).map(([type]) => type),
            sampleEvents: filteredEvents.slice(0, 3).map(e => ({ title: e.title, type: e.type, date: e.date }))
        });

        return filteredEvents;
    }, [websiteStyle?.tickerLookBack, websiteStyle?.tickerLookForward, websiteStyle?.tickerFilters]);
    
    const tickerEvents = applyTickerFilters(events);

    // Auto-scroll animation with requestAnimationFrame
    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement || tickerEvents.length === 0) {
            return;
        }

        const scrollSpeed = websiteStyle?.tickerSpeed || 1;
        
        const scroll = () => {
            if (!isHovering && tickerElement) {
                scrollPosRef.current += scrollSpeed;
                
                // Get content width (half because we duplicate content)
                const halfWidth = tickerElement.scrollWidth / 2;
                
                // Reset when we've scrolled past the first set of content
                if (scrollPosRef.current >= halfWidth) {
                    scrollPosRef.current = 0;
                }
                
                tickerElement.scrollLeft = scrollPosRef.current;
            }
            animationRef.current = requestAnimationFrame(scroll);
        };

        // Start scrolling
        animationRef.current = requestAnimationFrame(scroll);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isHovering, tickerEvents.length, websiteStyle?.tickerSpeed]);

    // Format date for display
    const formatEventDate = (dateStr) => {
        if (!dateStr) return 'TBD';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'TBD';
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
        } catch {
            return 'TBD';
        }
    };

    // Get event type label and color
    const getEventTypeStyle = (type) => {
        const styles = {
            'game': { label: 'GAME', bg: 'bg-green-500', text: 'text-white' },
            'regular_game': { label: 'GAME', bg: 'bg-green-500', text: 'text-white' },
            'tournament': { label: 'TOURNAMENT', bg: 'bg-purple-500', text: 'text-white' },
            'practice': { label: 'PRACTICE', bg: 'bg-blue-500', text: 'text-white' },
            'meeting': { label: 'MEETING', bg: 'bg-yellow-500', text: 'text-black' },
            'social': { label: 'SOCIAL', bg: 'bg-pink-500', text: 'text-white' },
            'external': { label: 'EXTERNAL', bg: 'bg-orange-500', text: 'text-white' },
            'other': { label: 'EVENT', bg: 'bg-slate-500', text: 'text-white' }
        };
        return styles[type] || styles['other'];
    };

    // Get event status label and color
    const getStatusStyle = (status) => {
        const styles = {
            'live': { label: 'LIVE', bg: 'bg-red-600', text: 'text-white', pulse: true },
            'in_progress': { label: 'LIVE', bg: 'bg-red-600', text: 'text-white', pulse: true },
            'final': { label: 'FINAL', bg: 'bg-slate-600', text: 'text-white' },
            'completed': { label: 'FINAL', bg: 'bg-slate-600', text: 'text-white' },
            'postponed': { label: 'POSTPONED', bg: 'bg-orange-600', text: 'text-white' },
            'cancelled': { label: 'CANCELLED', bg: 'bg-red-800', text: 'text-white' },
            'scheduled': { label: 'UPCOMING', bg: 'bg-blue-600', text: 'text-white' },
            'upcoming': { label: 'UPCOMING', bg: 'bg-blue-600', text: 'text-white' }
        };
        return styles[status?.toLowerCase()] || styles['scheduled'];
    };

    // Don't render if no events
    if (tickerEvents.length === 0) {
        return (
            <div 
                className="w-full py-3 text-center"
                style={{ 
                    backgroundColor: websiteStyle?.tickerColor || '#1e293b',
                    minHeight: '60px'
                }}
            >
                <div className="flex items-center justify-center h-full">
                    <span className="text-slate-400 text-sm">No upcoming events</span>
                </div>
            </div>
        );
    }

    // Render individual event item - New design with status at top, teams stacked, score on right
    const renderEventItem = (event, index) => {
        const typeStyle = getEventTypeStyle(event.type);
        const statusStyle = getStatusStyle(event.status);
        
        // Helper to extract team ID from various formats
        const getTeamIdFromEntry = (entry) => {
            if (typeof entry === 'string') return entry;
            if (entry?.id) return entry.id;
            if (entry?.teamId) return entry.teamId;
            return null;
        };
        
        // Check if this is a game with teams
        const teamsArray = event.teams || [];
        const hasTeams = teamsArray.length >= 2 || (event.homeTeam && event.awayTeam);
        
        // Get team IDs - handle both string arrays and object arrays
        const homeTeamId = event.homeTeam || getTeamIdFromEntry(teamsArray[0]);
        const awayTeamId = event.awayTeam || getTeamIdFromEntry(teamsArray[1]);
        
        // Get scores
        const homeScore = event.scores?.home ?? event.homeScore ?? null;
        const awayScore = event.scores?.away ?? event.awayScore ?? null;
        const hasScores = homeScore !== null || awayScore !== null;
        
        // Determine if this is a game-type event
        const isGame = event.type === 'game' || event.type === 'regular_game' || (hasTeams && homeTeamId && awayTeamId);
        
        // Game card layout (teams stacked with score)
        if (isGame && hasTeams) {
            return (
                <div 
                    key={`${event.id}-${index}`}
                    className="flex flex-col bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors flex-shrink-0 overflow-hidden"
                    onClick={() => onEventClick && onEventClick(event)}
                    style={{ minWidth: '200px', maxWidth: '240px' }}
                >
                    {/* Status bar at top */}
                    <div className={`px-3 py-1 flex items-center justify-between ${statusStyle.bg} ${statusStyle.text}`}>
                        <span className={`text-xs font-bold ${statusStyle.pulse ? 'animate-pulse' : ''}`}>
                            {statusStyle.label}
                        </span>
                        <span className="text-xs opacity-80">
                            {formatEventDate(event.date)}
                        </span>
                    </div>
                    
                    {/* Teams and score section */}
                    <div className="px-3 py-2 flex items-center justify-between">
                        {/* Teams stacked vertically */}
                        <div className="flex flex-col space-y-1 flex-1 min-w-0">
                            {/* Home/Away Team 1 */}
                            <div className="flex items-center space-x-2">
                                {getTeamLogo(homeTeamId) ? (
                                    <img 
                                        src={getTeamLogo(homeTeamId)}
                                        alt={getTeamName(homeTeamId)}
                                        className="w-5 h-5 rounded-full object-cover border border-slate-600 flex-shrink-0"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white flex-shrink-0">
                                        {getTeamName(homeTeamId)?.charAt(0) || '?'}
                                    </div>
                                )}
                                <span className="text-white text-sm truncate">
                                    {getTeamName(homeTeamId)}
                                </span>
                            </div>
                            
                            {/* Away Team 2 */}
                            <div className="flex items-center space-x-2">
                                {getTeamLogo(awayTeamId) ? (
                                    <img 
                                        src={getTeamLogo(awayTeamId)}
                                        alt={getTeamName(awayTeamId)}
                                        className="w-5 h-5 rounded-full object-cover border border-slate-600 flex-shrink-0"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white flex-shrink-0">
                                        {getTeamName(awayTeamId)?.charAt(0) || '?'}
                                    </div>
                                )}
                                <span className="text-white text-sm truncate">
                                    {getTeamName(awayTeamId)}
                                </span>
                            </div>
                        </div>
                        
                        {/* Score on the right */}
                        {hasScores && (
                            <div className="flex flex-col items-center ml-3 flex-shrink-0">
                                <span className="text-white font-bold text-lg leading-tight">
                                    {homeScore ?? '-'}
                                </span>
                                <span className="text-white font-bold text-lg leading-tight">
                                    {awayScore ?? '-'}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {/* Venue/Time footer */}
                    <div className="px-3 pb-2 flex items-center text-slate-400 text-xs">
                        <span className="truncate">
                            {event.time && `${event.time} • `}
                            {getVenueName(event)}
                        </span>
                    </div>
                </div>
            );
        }
        
        // Non-game event card (tournaments, practices, etc.)
        return (
            <div 
                key={`${event.id}-${index}`}
                className="flex flex-col bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors flex-shrink-0 overflow-hidden"
                onClick={() => onEventClick && onEventClick(event)}
                style={{ minWidth: '200px', maxWidth: '260px' }}
            >
                {/* Type badge at top */}
                <div className={`px-3 py-1 flex items-center justify-between ${typeStyle.bg}`}>
                    <span className={`text-xs font-bold ${typeStyle.text}`}>
                        {typeStyle.label}
                    </span>
                    <span className={`text-xs ${typeStyle.text} opacity-80`}>
                        {formatEventDate(event.date)}
                    </span>
                </div>
                
                {/* Event content */}
                <div className="px-3 py-2">
                    <span className="text-white font-medium text-sm line-clamp-2">
                        {event.title || 'Untitled Event'}
                    </span>
                </div>
                
                {/* Venue/Time footer */}
                <div className="px-3 pb-2 flex items-center text-slate-400 text-xs">
                    <span className="truncate">
                        {event.time && `${event.time} • `}
                        {getVenueName(event)}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div 
            className="w-full py-2 overflow-hidden relative"
            style={{ 
                backgroundColor: websiteStyle?.tickerColor || '#1e293b',
                minHeight: '90px'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            data-testid="events-ticker"
        >
            {/* Gradient overlays for smooth edges */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                style={{ background: `linear-gradient(to right, ${websiteStyle?.tickerColor || '#1e293b'}, transparent)` }}
            />
            <div 
                className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                style={{ background: `linear-gradient(to left, ${websiteStyle?.tickerColor || '#1e293b'}, transparent)` }}
            />
            
            <div 
                ref={tickerRef}
                className="flex items-stretch space-x-4 overflow-x-hidden"
                style={{ 
                    whiteSpace: 'nowrap',
                    paddingLeft: '1rem',
                    paddingRight: '1rem'
                }}
            >
                {/* First set of events */}
                {tickerEvents.map((event, index) => renderEventItem(event, index))}
                
                {/* Gap spacer between cycles (width of ~2 cards) */}
                <div className="flex-shrink-0" style={{ width: '500px' }} aria-hidden="true" />
                
                {/* Duplicate set for infinite scroll effect */}
                {tickerEvents.map((event, index) => renderEventItem(event, `dup-${index}`))}
                
                {/* Second gap spacer for smooth looping */}
                <div className="flex-shrink-0" style={{ width: '500px' }} aria-hidden="true" />
            </div>
            
            {/* Hover indicator */}
            {isHovering && (
                <div className="absolute top-1 right-2 text-xs text-slate-500">
                    ⏸ Paused
                </div>
            )}
        </div>
    );
};

export default EventsTicker;
