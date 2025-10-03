import React, { useState, useRef, useEffect } from 'react';
import { fixGoogleDriveUrl } from '../utils/imageUtils';

const EventsTicker = ({ events = [], teams = [], websiteStyle = {}, onEventClick, onTeamClick }) => {
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || teamId;
    };

    // Get team logo by ID with Google Drive URL fix
    const getTeamLogo = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        const logoUrl = team?.style?.logoUrl || team?.logo || null;
        return logoUrl ? fixGoogleDriveUrl(logoUrl) : null;
    };

    // Filter events based on admin ticker settings
    const applyTickerFilters = (events) => {
        // First deduplicate by event ID
        const uniqueEvents = events.reduce((unique, event) => {
            if (!unique.find(e => e.id === event.id)) {
                unique.push(event);
            }
            return unique;
        }, []);

        // Get admin filter settings
        const lookBackDays = websiteStyle?.tickerLookBack || 30; // Increased from 7 to 30 days
        const lookForwardDays = websiteStyle?.tickerLookForward || 365; // Increased from 120 to 365 days
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
            // Date range filter
            if (!event.date) return false;
            const eventDate = new Date(event.date);
            const inDateRange = eventDate >= lookBackDate && eventDate <= lookForwardDate;
            
            // Event type filter - handle both singular and plural forms
            const eventType = event.type || 'other';
            let typeAllowed = false;
            
            // Map singular database types to plural filter types
            const typeMapping = {
                'game': 'games',
                'tournament': 'tournaments', 
                'practice': 'practices',
                'meeting': 'meetings',
                'social': 'social',
                'event': 'other', // Generic events fall under 'other'
                'other': 'other'
            };
            
            // Check both the original type and mapped type
            const mappedType = typeMapping[eventType] || 'other';
            typeAllowed = eventFilters[eventType] || eventFilters[mappedType] || false;
            
            return inDateRange && typeAllowed;
        });

        console.log('🎫 Ticker filtering:', {
            total: events.length,
            unique: uniqueEvents.length,
            filtered: filteredEvents.length,
            lookBackDays,
            lookForwardDays,
            activeFilters: Object.entries(eventFilters).filter(([_, enabled]) => enabled).map(([type]) => type)
        });

        return filteredEvents;
    };
    
    const tickerEvents = applyTickerFilters(events);

    // Auto-scroll animation
    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement || tickerEvents.length === 0) return;

        let scrollPosition = 0;
        const scrollSpeed = websiteStyle?.tickerSpeed || 1;
        let animationId;
        
        const scroll = () => {
            if (!isHovering && tickerElement) {
                scrollPosition += scrollSpeed;
                tickerElement.scrollLeft = scrollPosition;
                
                // Get content width dynamically
                const contentWidth = tickerElement.scrollWidth;
                const containerWidth = tickerElement.clientWidth;
                
                // Reset when scrolled to show duplicated content
                if (scrollPosition >= contentWidth / 2) {
                    scrollPosition = 0;
                }
                
                // Only continue if content is wider than container
                if (contentWidth > containerWidth) {
                    animationId = requestAnimationFrame(scroll);
                }
            } else if (!isHovering) {
                animationId = requestAnimationFrame(scroll);
            }
        };

        // Start scrolling after a brief delay
        const startScrolling = setTimeout(() => {
            if (tickerElement && tickerElement.scrollWidth > tickerElement.clientWidth) {
                scroll();
            }
        }, 500);

        return () => {
            clearTimeout(startScrolling);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isHovering, tickerEvents.length, websiteStyle?.tickerSpeed]);

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
                    <span className="text-slate-400 text-sm">No events available</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="w-full py-3 overflow-hidden relative"
            style={{ 
                backgroundColor: websiteStyle?.tickerColor || '#1e293b',
                minHeight: '60px'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            data-testid="events-ticker"
        >
            <div 
                ref={tickerRef}
                className="flex items-center space-x-6 overflow-x-hidden no-scrollbar"
                style={{ 
                    width: 'max-content',
                    minWidth: '100%',
                    paddingLeft: '1rem',
                    paddingRight: '1rem'
                }}
            >
                {/* Duplicate content for infinite scroll effect */}
                {[...tickerEvents, ...tickerEvents].map((event, index) => {
                    const eventDate = new Date(event.date);
                    const formattedDate = eventDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    
                    const eventType = event.type || 'event';
                    const typeColors = {
                        game: 'bg-green-600',
                        tournament: 'bg-purple-600',
                        practice: 'bg-blue-600',
                        meeting: 'bg-yellow-600',
                        social: 'bg-pink-600'
                    };
                    
                    const typeColor = typeColors[eventType] || 'bg-gray-600';

                    return (
                        <div 
                            key={`ticker-${event.id}-${index}`}
                            className="flex-shrink-0 rounded-lg cursor-pointer hover:opacity-80 transition-opacity border"
                            style={{
                                backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                borderColor: websiteStyle?.tickerBorderColor || '#475569',
                                minWidth: '300px'
                            }}
                            onClick={() => onEventClick && onEventClick(event)}
                        >
                            <div className="flex">
                                {/* Event Type Badge - Far Left */}
                                <div className={`w-12 flex items-center justify-center rounded-l-lg ${typeColor}`}>
                                    <span className="text-white text-xs font-bold transform -rotate-90 whitespace-nowrap">
                                        {eventType.toUpperCase()}
                                    </span>
                                </div>
                                
                                {/* Event Details - Rest of Card */}
                                <div className="flex-1 p-3 text-white">
                                    {/* Row 1: Event Title (left) | Status (right) */}
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="font-medium text-sm truncate">{event.title}</div>
                                        <div className="text-xs text-slate-300">{event.status || 'Scheduled'}</div>
                                    </div>
                                    
                                    {/* Teams for games/matches with exactly 2 teams */}
                                    {event.teamIds && event.teamIds.length === 2 ? (
                                        <>
                                            {/* Row 2: Home Team */}
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center space-x-2">
                                                    {getTeamLogo(event.teamIds[0]) ? (
                                                        <img 
                                                            src={getTeamLogo(event.teamIds[0])} 
                                                            alt="Team Logo"
                                                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                                // Fallback to placeholder on error
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="w-4 h-4 bg-slate-400 rounded-full flex-shrink-0"
                                                        style={{ display: getTeamLogo(event.teamIds[0]) ? 'none' : 'block' }}
                                                    ></div>
                                                    <span className="text-xs text-slate-200 truncate">
                                                        {getTeamName(event.teamIds[0])}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-300">
                                                    {event.homeScore || event.homeScore === 0 ? event.homeScore : '-'}
                                                </span>
                                            </div>
                                            
                                            {/* Row 3: Away Team */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    {getTeamLogo(event.teamIds[1]) ? (
                                                        <img 
                                                            src={getTeamLogo(event.teamIds[1])} 
                                                            alt="Team Logo"
                                                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                                // Fallback to placeholder on error
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="w-4 h-4 bg-slate-400 rounded-full flex-shrink-0"
                                                        style={{ display: getTeamLogo(event.teamIds[1]) ? 'none' : 'block' }}
                                                    ></div>
                                                    <span className="text-xs text-slate-200 truncate">
                                                        {getTeamName(event.teamIds[1])}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-300">
                                                    {event.awayScore || event.awayScore === 0 ? event.awayScore : '-'}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        /* For tournaments or single team events - show participant count */
                                        event.teamIds && event.teamIds.length > 2 ? (
                                            <div className="mb-2">
                                                <span className="text-xs text-slate-300">
                                                    {event.teamIds.length} teams participating
                                                </span>
                                            </div>
                                        ) : event.teamIds && event.teamIds.length === 1 ? (
                                            <div className="mb-2">
                                                <div className="flex items-center space-x-2">
                                                    {getTeamLogo(event.teamIds[0]) ? (
                                                        <img 
                                                            src={getTeamLogo(event.teamIds[0])} 
                                                            alt="Team Logo"
                                                            className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                                                            onError={(e) => {
                                                                // Fallback to placeholder on error
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'block';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="w-4 h-4 bg-slate-400 rounded-full flex-shrink-0"
                                                        style={{ display: getTeamLogo(event.teamIds[0]) ? 'none' : 'block' }}
                                                    ></div>
                                                    <span className="text-xs text-slate-200">
                                                        {getTeamName(event.teamIds[0])}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-2"></div>
                                        )
                                    )}
                                    
                                    {/* Row 4: Date/Time (left) | Location (right) */}
                                    <div className="flex justify-between items-center text-xs text-slate-300">
                                        <div>
                                            <span>{formattedDate}</span>
                                            {event.time && <span> • {event.time}</span>}
                                        </div>
                                        {event.location && (
                                            <span className="truncate ml-2">{event.location}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventsTicker;