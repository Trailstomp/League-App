import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fixGoogleDriveUrl } from '../utils/imageUtils';

const EventsTicker = ({ events = [], teams = [], websiteStyle = {}, tickerConfig = {}, onEventClick, onTeamClick, compact = false }) => {
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

        // Get admin filter settings from separate tickerConfig (not template-dependent)
        const lookBackDays = tickerConfig?.tickerLookBack || 365;
        const lookForwardDays = tickerConfig?.tickerLookForward || 365;
        const showCancelled = tickerConfig?.tickerShowCancelled ?? false;
        const eventFilters = tickerConfig?.tickerFilters || {
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
            // Filter out cancelled events unless showCancelled is true
            const status = event.status?.toLowerCase();
            if (!showCancelled && (status === 'cancelled' || status === 'canceled')) {
                return false;
            }
            
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
            
            // Get the mapped filter key for this event type
            const mappedType = typeMapping[eventType] || 'other';
            
            // Only check the specific filter for this event type - don't fall back to 'other'
            // This ensures practices are hidden when practices filter is false
            typeAllowed = eventFilters[mappedType] === true;
            
            return inDateRange && typeAllowed;
        });

        // Sort events: Scored/Final games first (most recent), then upcoming by date
        filteredEvents.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date('2099-12-31');
            const dateB = b.date ? new Date(b.date) : new Date('2099-12-31');
            const now = new Date();
            
            // Check if events have scores (completed games)
            const aHasScores = a.scores?.home_team?.score !== undefined || 
                               a.scores?.home !== undefined ||
                               a.homeScore !== undefined;
            const bHasScores = b.scores?.home_team?.score !== undefined || 
                               b.scores?.home !== undefined ||
                               b.homeScore !== undefined;
            
            // Check if event status is final/completed
            const aIsFinal = ['final', 'completed'].includes(a.status?.toLowerCase());
            const bIsFinal = ['final', 'completed'].includes(b.status?.toLowerCase());
            
            // Priority: Live games > Final/scored games (recent first) > Upcoming games (soonest first) > Past events
            const aIsLive = ['live', 'in_progress'].includes(a.status?.toLowerCase());
            const bIsLive = ['live', 'in_progress'].includes(b.status?.toLowerCase());
            
            // Live games first
            if (aIsLive && !bIsLive) return -1;
            if (!aIsLive && bIsLive) return 1;
            
            // Scored/final games next (most recent first)
            if ((aHasScores || aIsFinal) && !(bHasScores || bIsFinal)) return -1;
            if (!(aHasScores || aIsFinal) && (bHasScores || bIsFinal)) return 1;
            if ((aHasScores || aIsFinal) && (bHasScores || bIsFinal)) {
                // Both are scored - most recent first
                return dateB - dateA;
            }
            
            // Upcoming events by date (soonest first)
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
            showCancelled,
            activeFilters: Object.entries(eventFilters).filter(([_, enabled]) => enabled).map(([type]) => type),
            sampleEvents: filteredEvents.slice(0, 3).map(e => ({ title: e.title, type: e.type, date: e.date, status: e.status }))
        });

        return filteredEvents;
    }, [tickerConfig?.tickerLookBack, tickerConfig?.tickerLookForward, tickerConfig?.tickerFilters, tickerConfig?.tickerShowCancelled]);
    
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
            'hold': { label: 'HOLD', bg: 'bg-gray-500', text: 'text-white' },
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
            'canceled': { label: 'CANCELLED', bg: 'bg-red-800', text: 'text-white' },
            'scheduled': { label: 'UPCOMING', bg: 'bg-blue-600', text: 'text-white' },
            'upcoming': { label: 'UPCOMING', bg: 'bg-blue-600', text: 'text-white' },
            'archived': { label: 'PAST', bg: 'bg-slate-500', text: 'text-white' }
        };
        return styles[status?.toLowerCase()] || styles['scheduled'];
    };
    
    // Extract scores from event - handles various data formats
    const getScores = (event) => {
        // Try direct scores first (simple format)
        if (event.homeScore !== undefined && event.homeScore !== null) {
            return { home: event.homeScore, away: event.awayScore };
        }
        
        // Try nested scores object with home/away
        if (event.scores?.home !== undefined) {
            return { home: event.scores.home, away: event.scores.away };
        }
        
        // Try nested scores object with home_team/away_team (from live scoring)
        if (event.scores?.home_team?.score !== undefined) {
            return { 
                home: event.scores.home_team.score, 
                away: event.scores.away_team?.score 
            };
        }
        
        // Try gameStats if available
        if (event.gameStats?.home_team?.goals_for !== undefined) {
            return {
                home: event.gameStats.home_team.goals_for,
                away: event.gameStats.away_team?.goals_for
            };
        }
        
        return { home: null, away: null };
    };

    // Don't render if no events
    if (tickerEvents.length === 0) {
        return (
            <div 
                className="w-full py-3 text-center"
                style={{ 
                    backgroundColor: websiteStyle?.tickerTransparent ? 'transparent' : (websiteStyle?.tickerColor || '#1e293b'),
                    minHeight: '60px'
                }}
            >
                <div className="flex items-center justify-center h-full">
                    <span className="text-slate-400 text-sm">No upcoming events</span>
                </div>
            </div>
        );
    }

    // Handle team click - navigates to team page
    const handleTeamClick = (e, teamId) => {
        e.stopPropagation(); // Don't trigger event click
        if (onTeamClick && teamId) {
            onTeamClick(teamId);
        }
    };

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
        // Also check scores object for team IDs (which contain the actual game data)
        let homeTeamId = event.homeTeam || getTeamIdFromEntry(teamsArray[0]) || event.scores?.home_team?.id;
        let awayTeamId = event.awayTeam || getTeamIdFromEntry(teamsArray[1]) || event.scores?.away_team?.id;
        
        // Get scores using the helper function
        const scores = getScores(event);
        const hasScores = scores.home !== null || scores.away !== null;
        
        // Determine if this should display as a game card
        // Show as game if: it's a game type, OR it has scores with teams (tournament finals, etc.)
        const isGame = event.type === 'game' || event.type === 'regular_game' || 
            (hasScores && homeTeamId && awayTeamId);
        
        // Game card layout (teams stacked with score)
        if (isGame && (hasTeams || hasScores)) {
            return (
                <div 
                    key={`${event.id}-${index}`}
                    className="flex flex-col rounded-lg cursor-pointer hover:opacity-90 transition-colors flex-shrink-0 overflow-hidden border-2"
                    onClick={() => onEventClick && onEventClick(event)}
                    style={{ 
                        minWidth: '200px', 
                        maxWidth: '240px',
                        backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                        borderColor: websiteStyle?.tickerBorderColor || '#475569'
                    }}
                    data-testid={`ticker-event-${event.id}`}
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
                            {/* Home Team */}
                            <div 
                                className="flex items-center space-x-2 hover:bg-slate-700/50 rounded px-1 -mx-1 cursor-pointer"
                                onClick={(e) => handleTeamClick(e, homeTeamId)}
                                title={`View ${getTeamName(homeTeamId)}`}
                            >
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
                                <span className="text-white text-sm truncate hover:underline">
                                    {getTeamName(homeTeamId)}
                                </span>
                            </div>
                            
                            {/* Away Team */}
                            <div 
                                className="flex items-center space-x-2 hover:bg-slate-700/50 rounded px-1 -mx-1 cursor-pointer"
                                onClick={(e) => handleTeamClick(e, awayTeamId)}
                                title={`View ${getTeamName(awayTeamId)}`}
                            >
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
                                <span className="text-white text-sm truncate hover:underline">
                                    {getTeamName(awayTeamId)}
                                </span>
                            </div>
                        </div>
                        
                        {/* Score on the right */}
                        {hasScores && (
                            <div className="flex flex-col items-center ml-3 flex-shrink-0">
                                <span className="text-white font-bold text-lg leading-tight">
                                    {scores.home ?? '-'}
                                </span>
                                <span className="text-white font-bold text-lg leading-tight">
                                    {scores.away ?? '-'}
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
                className="flex flex-col rounded-lg cursor-pointer hover:opacity-90 transition-colors flex-shrink-0 overflow-hidden border-2"
                onClick={() => onEventClick && onEventClick(event)}
                style={{ 
                    minWidth: '200px', 
                    maxWidth: '260px',
                    backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                    borderColor: websiteStyle?.tickerBorderColor || '#475569'
                }}
                data-testid={`ticker-event-${event.id}`}
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

    // ─── COMPACT MOBILE TICKER ───
    const renderCompactItem = (event, index) => {
        const scores = getScores(event);
        const hasScores = scores.home !== null || scores.away !== null;
        const teamsArray = event.teams || [];
        let homeTeamId = event.homeTeam || (typeof teamsArray[0] === 'string' ? teamsArray[0] : teamsArray[0]?.teamId) || event.scores?.home_team?.id;
        let awayTeamId = event.awayTeam || (typeof teamsArray[1] === 'string' ? teamsArray[1] : teamsArray[1]?.teamId) || event.scores?.away_team?.id;
        const isGame = event.type === 'game' || event.type === 'regular_game' || (hasScores && homeTeamId && awayTeamId);
        const statusStyle = getStatusStyle(event.status);

        if (isGame && (homeTeamId || awayTeamId)) {
            return (
                <div
                    key={`${event.id}-${index}`}
                    className="flex items-center gap-2 px-3 rounded cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0"
                    onClick={() => onEventClick && onEventClick(event)}
                    style={{ height: '36px' }}
                    data-testid={`ticker-compact-${event.id}`}
                >
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                    </span>
                    <span className="text-white text-xs font-medium">{getTeamName(homeTeamId)?.substring(0, 10)}</span>
                    <span className="text-white font-bold text-sm">{hasScores ? scores.home ?? '-' : ''}</span>
                    <span className="text-slate-500 text-[10px]">-</span>
                    <span className="text-white font-bold text-sm">{hasScores ? scores.away ?? '-' : ''}</span>
                    <span className="text-white text-xs font-medium">{getTeamName(awayTeamId)?.substring(0, 10)}</span>
                </div>
            );
        }

        const typeStyle = getEventTypeStyle(event.type);
        return (
            <div
                key={`${event.id}-${index}`}
                className="flex items-center gap-2 px-3 rounded cursor-pointer hover:bg-white/10 transition-colors flex-shrink-0"
                onClick={() => onEventClick && onEventClick(event)}
                style={{ height: '36px' }}
                data-testid={`ticker-compact-${event.id}`}
            >
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.label}
                </span>
                <span className="text-white text-xs truncate" style={{ maxWidth: '140px' }}>
                    {event.title || 'Event'}
                </span>
            </div>
        );
    };

    // ─── COMPACT RENDER ───
    if (compact) {
        const isTransparent = websiteStyle?.tickerTransparent;
        const bgColor = isTransparent ? 'transparent' : (websiteStyle?.tickerColor || '#1e293b');
        const fadeColor = isTransparent ? 'rgba(0,0,0,0)' : (websiteStyle?.tickerColor || '#1e293b');
        return (
            <div
                className="w-full overflow-hidden relative flex items-center"
                style={{ backgroundColor: bgColor, height: '100%' }}
                data-testid="events-ticker-compact"
            >
                {!isTransparent && (
                    <>
                        <div
                            className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                            style={{ background: `linear-gradient(to right, ${fadeColor}, transparent)` }}
                        />
                        <div
                            className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                            style={{ background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
                        />
                    </>
                )}
                <div
                    ref={tickerRef}
                    className="flex items-center gap-3 overflow-x-hidden"
                    style={{ whiteSpace: 'nowrap', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
                >
                    {tickerEvents.map((e, i) => renderCompactItem(e, i))}
                    <div className="flex-shrink-0" style={{ width: '200px' }} aria-hidden="true" />
                    {tickerEvents.map((e, i) => renderCompactItem(e, `dup-${i}`))}
                    <div className="flex-shrink-0" style={{ width: '200px' }} aria-hidden="true" />
                </div>
            </div>
        );
    }

    const isTransparentMain = websiteStyle?.tickerTransparent;
    const mainBgColor = isTransparentMain ? 'transparent' : (websiteStyle?.tickerColor || '#1e293b');
    const mainFadeColor = isTransparentMain ? 'rgba(0,0,0,0)' : (websiteStyle?.tickerColor || '#1e293b');

    return (
        <div 
            className="w-full py-2 overflow-hidden relative"
            style={{ 
                backgroundColor: mainBgColor,
                minHeight: '90px'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            data-testid="events-ticker"
        >
            {/* Gradient overlays for smooth edges */}
            {!isTransparentMain && (
                <>
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                        style={{ background: `linear-gradient(to right, ${mainFadeColor}, transparent)` }}
                    />
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                        style={{ background: `linear-gradient(to left, ${mainFadeColor}, transparent)` }}
                    />
                </>
            )}
            
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
