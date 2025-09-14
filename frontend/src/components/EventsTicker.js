import React, { useState, useRef, useEffect } from 'react';

const EventsTicker = ({ events = [], teams = [], websiteStyle = {}, onEventClick, onTeamClick }) => {
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Get team name by ID
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === teamId);
        return team?.name || teamId;
    };

    // Filter and format events for ticker
    const tickerEvents = events.filter(event => {
        // Only show upcoming events (within next 30 days)
        const eventDate = new Date(event.date);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return eventDate >= today && eventDate <= thirtyDaysFromNow;
    }).slice(0, 10); // Limit to 10 events

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
            const scrollSpeed = websiteStyle?.tickerSpeed || 1;
            
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
    }, [isHovering, tickerEvents.length]);

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
                            className="flex-shrink-0 bg-slate-700 rounded-lg px-4 py-2 cursor-pointer hover:bg-slate-600 transition-colors border border-slate-600"
                            onClick={() => onEventClick && onEventClick(event)}
                        >
                            <div className="flex items-center space-x-3">
                                {/* Event Type Badge */}
                                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${typeColor}`}>
                                    {eventType.toUpperCase()}
                                </span>
                                
                                {/* Event Details */}
                                <div className="text-white">
                                    <div className="font-medium text-sm">{event.title}</div>
                                    <div className="text-xs text-slate-300 flex items-center space-x-2">
                                        <span>{formattedDate}</span>
                                        {event.time && <span>• {event.time}</span>}
                                        {event.location && <span>• {event.location}</span>}
                                    </div>
                                </div>
                                
                                {/* Teams (for games) */}
                                {event.teamIds && event.teamIds.length > 0 && (
                                    <div className="text-slate-300 text-xs">
                                        {event.teamIds.map((teamId, i) => (
                                            <span 
                                                key={teamId}
                                                className="hover:text-white cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTeamClick && onTeamClick(teamId);
                                                }}
                                            >
                                                {getTeamName(teamId)}
                                                {i < event.teamIds.length - 1 && ' vs '}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EventsTicker;