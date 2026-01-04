import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fixGoogleDriveUrl } from '../utils/imageUtils';

const EventsTicker = ({ events = [], teams = [], websiteStyle = {}, onEventClick, onTeamClick }) => {
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const animationRef = useRef(null);
    const scrollPosRef = useRef(0);

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

    // Render individual event item
    const renderEventItem = (event, index) => {
        const typeStyle = getEventTypeStyle(event.type);
        const hasTeams = event.teams && event.teams.length >= 2;
        
        return (
            <div 
                key={`${event.id}-${index}`}
                className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors flex-shrink-0"
                onClick={() => onEventClick && onEventClick(event)}
                style={{ minWidth: '280px' }}
            >
                {/* Event Type Badge */}
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${typeStyle.bg} ${typeStyle.text}`}>
                    {typeStyle.label}
                </span>
                
                {/* Event Info */}
                <div className="flex flex-col">
                    <span className="text-white font-medium text-sm truncate max-w-[180px]">
                        {event.title || 'Untitled Event'}
                    </span>
                    <span className="text-slate-400 text-xs">
                        {formatEventDate(event.date)}
                        {event.time && ` • ${event.time}`}
                        {event.location && ` • ${event.location}`}
                    </span>
                </div>

                {/* Team logos for games */}
                {hasTeams && (
                    <div className="flex items-center space-x-1 ml-2">
                        {event.teams.slice(0, 2).map((teamId, idx) => {
                            const logo = getTeamLogo(teamId);
                            return logo ? (
                                <img 
                                    key={teamId}
                                    src={logo}
                                    alt={getTeamName(teamId)}
                                    className="w-6 h-6 rounded-full object-cover border border-slate-600"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : null;
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            className="w-full py-2 overflow-hidden relative"
            style={{ 
                backgroundColor: websiteStyle?.tickerColor || '#1e293b',
                minHeight: '60px'
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
                className="flex items-center space-x-4 overflow-x-hidden"
                style={{ 
                    whiteSpace: 'nowrap',
                    paddingLeft: '1rem',
                    paddingRight: '1rem'
                }}
            >
                {/* Duplicate content for infinite scroll effect */}
                {[...tickerEvents, ...tickerEvents].map((event, index) => renderEventItem(event, index))}
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
