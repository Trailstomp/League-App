import React, { useState, useRef, useEffect } from 'react';

const EventsTicker = ({ events = [], teams = [], websiteStyle = {}, onEventClick, onTeamClick }) => {
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || teamId;
    };

    // Show ALL events with NO filtering or constraints
    const tickerEvents = events; // No filtering - show everything!

    // Auto-scroll animation
    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement || tickerEvents.length === 0) return;

        // Only scroll if content is wider than container
        const checkAndScroll = () => {
            const containerWidth = tickerElement.clientWidth;
            const contentWidth = tickerElement.scrollWidth;
            
            if (contentWidth <= containerWidth) {
                console.log('🎫 Ticker content fits, no scrolling needed');
                return;
            }

            let scrollPosition = 0;
            const scrollSpeed = Math.max(websiteStyle?.tickerSpeed || 1, 0.5); // Ensure minimum scroll speed
            
            const scroll = () => {
                if (!isHovering) {
                    scrollPosition += scrollSpeed;
                    tickerElement.scrollLeft = scrollPosition;
                    
                    // Reset when scrolled halfway (for infinite effect)
                    if (scrollPosition >= contentWidth / 2) {
                        scrollPosition = 0;
                    }
                }
            };

            const intervalId = setInterval(scroll, 16); // ~60fps
            return () => clearInterval(intervalId);
        };

        const timeoutId = setTimeout(checkAndScroll, 100);
        return () => clearTimeout(timeoutId);
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
                    <span className="text-slate-400 text-sm">No upcoming events</span>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="w-full py-3 overflow-hidden"
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
                className="flex items-center space-x-6 overflow-x-auto no-scrollbar"
                style={{ 
                    width: 'max-content',
                    minWidth: '100%'
                }}
            >
                {/* Duplicate events for infinite scroll effect */}
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
                                                    <div className="w-4 h-4 bg-slate-400 rounded-full flex-shrink-0"></div>
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
                                                    <div className="w-4 h-4 bg-slate-400 rounded-full flex-shrink-0"></div>
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
                                                    <div className="w-4 h-4 bg-slate-400 rounded-full flex-shrink-0"></div>
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