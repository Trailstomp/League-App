import React, { useState, useRef, useEffect, useMemo } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

const GameTicker = ({ teams, leagueSchedule, onTeamClick, websiteStyle, onNavigate, onEventClick }) => {
    const getTeam = (id) => teams.find(t => t.id === id);
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Combine games and upcoming events with tournament consolidation and filtering
    const allItems = useMemo(() => {
        console.log('🎫 GameTicker processing leagueSchedule:', leagueSchedule?.length || 0, 'events');
        console.log('🎫 First event sample:', leagueSchedule?.[0]);
        
        // Get ticker filter settings from websiteStyle
        const tickerFilters = websiteStyle?.tickerFilters || {
            games: true,
            tournaments: true,
            practices: true,
            meetings: true,
            social: true,
            other: true
        };

        // Get date range settings
        const lookBackDays = websiteStyle?.tickerLookBack || 7;
        const lookForwardDays = websiteStyle?.tickerLookForward || 120; // Extended to 4 months
        
        const today = new Date();
        const lookBackDate = new Date(today);
        lookBackDate.setDate(today.getDate() - lookBackDays);
        
        const lookForwardDate = new Date(today);
        lookForwardDate.setDate(today.getDate() + lookForwardDays);

        // Process leagueSchedule data to create ticker items
        const allTickerItems = [];
        
        if (!leagueSchedule || leagueSchedule.length === 0) {
            console.log('🎫 No events in leagueSchedule, returning empty array');
        }
        
        // Process individual events from leagueSchedule
        (leagueSchedule || []).forEach(event => {
            if (event.type === 'game') {
                allTickerItems.push({
                    id: event.id,
                    homeTeam: event.homeTeam,
                    awayTeam: event.awayTeam,
                    homeScore: event.homeScore || 0,
                    awayScore: event.awayScore || 0,
                    location: event.location,
                    gameDate: event.date,
                    time: event.time,
                    status: event.status || 'scheduled',
                    itemType: 'game'
                });
            } else if (event.type === 'tournament') {
                // Add tournament for grouping processing (will be consolidated later)
                allTickerItems.push({
                    id: event.id,
                    tournamentName: event.title, // Use event title as tournament name
                    location: event.location,
                    gameDate: event.date,
                    time: event.time,
                    teamName: event.teamName,
                    teamId: event.teamId,
                    status: event.status || 'scheduled',
                    itemType: 'tournament',
                    games: event.allTeams ? event.allTeams.map(team => ({
                        homeTeam: team.id,
                        awayTeam: team.id
                    })) : []
                });
            } else {
                // Other events (practice, etc.)
                allTickerItems.push({
                    id: event.id,
                    title: event.title,
                    location: event.location,
                    gameDate: event.date,
                    time: event.time,
                    teamName: event.teamName,
                    teamId: event.teamId,
                    status: event.status || 'scheduled',
                    itemType: 'event'
                });
            }
        });

        // Apply date range filtering
        const gamesWithDates = allTickerItems.filter(item => {
            if (item.gameDate) {
                const itemDate = new Date(item.gameDate);
                const inRange = itemDate >= lookBackDate && itemDate <= lookForwardDate;
                return inRange;
            }
            return true; // Include items without dates for now
        });
        
        // Group tournament games by tournament ID (not name) to prevent duplicates
        const regularGames = [];
        const tournaments = new Map();
        
        gamesWithDates.forEach(game => {
            if (game.itemType === 'tournament' && game.id) {
                if (tickerFilters.tournaments) {
                    if (!tournaments.has(game.id)) {
                        tournaments.set(game.id, {
                            ...game,
                            games: []
                        });
                    }
                    
                    // Add individual games to the tournament
                    const tournament = tournaments.get(game.id);
                    if (game.games) {
                        tournament.games.push(...game.games);
                    }
                }
            } else if (game.itemType === 'game') {
                if (tickerFilters.games) {
                    regularGames.push(game);
                }
            } else {
                // Handle other event types with filtering
                const eventType = game.title?.toLowerCase() || '';
                if (eventType.includes('practice') && !tickerFilters.practices) return false;
                if (eventType.includes('meeting') && !tickerFilters.meetings) return false;
                if (eventType.includes('social') && !tickerFilters.social) return false;
                if (!['practice', 'meeting', 'social'].some(type => eventType.includes(type)) && !tickerFilters.other) return false;
                
                regularGames.push(game);
            }
        });

        // Convert tournaments map to array
        const tournamentGames = Array.from(tournaments.values());
        
        // Combine and sort by date
        const combinedItems = [...regularGames, ...tournamentGames].sort((a, b) => {
            const dateA = new Date(a.gameDate);
            const dateB = new Date(b.gameDate);
            return dateA - dateB;
        });

        return combinedItems;
    }, [leagueSchedule, teams, websiteStyle?.tickerFilters]);

    // Auto-scroll animation - only scroll when content is wider than container
    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement || allItems.length === 0) return;

        // Add a small delay to ensure content is rendered
        const startScrolling = () => {
            const containerWidth = tickerElement.clientWidth;
            const contentWidth = tickerElement.scrollWidth;
            
            console.log('🎫 Ticker dimensions:', { containerWidth, contentWidth, items: allItems.length });
            
            // Only scroll if content is wider than container
            if (contentWidth <= containerWidth) {
                console.log('🎫 Ticker content fits in container, no scrolling needed');
                return; // Don't scroll, but content is still visible
            }

            let scrollPosition = 0;
            const scrollSpeed = 1;
            
            const scroll = () => {
                if (!isHovering) {
                    scrollPosition += scrollSpeed;
                    tickerElement.scrollLeft = scrollPosition;
                    
                    // Reset when we've scrolled through one set of items
                    if (scrollPosition >= tickerElement.scrollWidth / 2) {
                        scrollPosition = 0;
                    }
                }
            };

            const intervalId = setInterval(scroll, 16); // ~60fps
            
            return () => clearInterval(intervalId);
        };

        const timeoutId = setTimeout(startScrolling, 100);
        return () => clearTimeout(timeoutId);
    }, [isHovering, allItems.length]);
    
    // Debug: Add console log to confirm component is rendering
    console.log('🎫 GameTicker render called - allItems count:', allItems.length);
    console.log('🎫 GameTicker allItems details:', allItems.map(item => ({
        itemType: item.itemType,
        title: item.title,
        homeTeam: item.homeTeam,
        awayTeam: item.awayTeam
    })));

    return (
        <div 
            className="text-white py-3 overflow-hidden shadow-lg border-2 border-red-500"
            style={{ 
                backgroundColor: websiteStyle?.tickerColor || '#1e293b',
                minHeight: '60px',
                display: 'block',
                visibility: 'visible'
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            data-testid="game-ticker"
        >
            <div 
                ref={tickerRef} 
                className="flex items-center space-x-6 no-scrollbar" 
                style={{ 
                    overflowX: 'scroll', 
                    scrollBehavior: 'auto',
                    minWidth: '100%',
                    width: 'max-content',
                    minHeight: '50px'
                }}
            >
                {allItems.length === 0 ? (
                    // Show placeholder when no items
                    <div className="flex-shrink-0 w-72 rounded-lg p-2 border opacity-50" style={{ 
                        backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                        borderColor: websiteStyle?.tickerBorderColor || '#475569'
                    }}>
                        <div className="text-center py-4">
                            <span className="text-slate-400 text-sm">No ticker items to display</span>
                        </div>
                    </div>
                ) : (
                    // Duplicate items for infinite scrolling effect - duplicate only when needed
                    (allItems.length > 2 ? [...allItems, ...allItems] : allItems).map((item, index) => {
                        if (item.itemType === 'game') {
                            const home = getTeam(item.homeTeam);
                            const away = getTeam(item.awayTeam);
                            console.log('🎫 Game ticker item debug:', {
                                itemType: item.itemType,
                                homeTeam: item.homeTeam,
                                awayTeam: item.awayTeam,
                                homeFound: !!home,
                                awayFound: !!away,
                                availableTeams: teams.map(t => t.id)
                            });
                            if (!home || !away) return null;
                            
                            return (
                                <div 
                                    key={`game-${index}`} 
                                    className="flex-shrink-0 w-72 rounded-lg p-2 border cursor-pointer hover:opacity-90 transition-opacity" 
                                    style={{ 
                                        backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                        borderColor: websiteStyle?.tickerBorderColor || '#475569'
                                    }}
                                    onClick={() => onEventClick && onEventClick({
                                        id: item.id,
                                        title: `${home.name} vs ${away.name}`,
                                        type: 'game',
                                        date: item.gameDate,
                                        location: item.location,
                                        homeTeam: item.homeTeam,
                                        awayTeam: item.awayTeam,
                                        homeScore: item.homeScore,
                                        awayScore: item.awayScore,
                                        status: item.status
                                    })}
                                    title="Click to view game details"
                                >
                                    <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        <span>{item.location}</span>
                                        <span className="font-bold text-xs text-red-400">GAME</span>
                                    </div>
                                    <div className="space-y-1 mb-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onTeamClick && onTeamClick(home.id); }} 
                                                className="flex items-center gap-2 hover:opacity-80"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                                    <LacrosseIcon name="stick" style={{fontSize: '12px'}} className="text-slate-600" />
                                                </div>
                                                <span className="font-medium text-white">{home.name}</span>
                                            </button>
                                            <span className="text-orange-400 font-bold">{item.homeScore}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onTeamClick && onTeamClick(away.id); }} 
                                                className="flex items-center gap-2 hover:opacity-80"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                                    <LacrosseIcon name="stick" style={{fontSize: '12px'}} className="text-slate-600" />
                                                </div>
                                                <span className="font-medium text-white">{away.name}</span>
                                            </button>
                                            <span className="text-orange-400 font-bold">{item.awayScore}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {new Date(item.gameDate).toLocaleDateString()} • {item.time}
                                        <span className={`ml-2 px-1 rounded text-xs ${
                                            item.status === 'completed' ? 'bg-green-600 text-white' :
                                            item.status === 'live' ? 'bg-red-600 text-white' :
                                            'bg-blue-600 text-white'
                                        }`}>
                                            {item.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        } else if (item.itemType === 'tournament') {
                            return (
                                <div 
                                    key={`tournament-${index}`} 
                                    className="flex-shrink-0 w-72 rounded-lg p-2 border cursor-pointer hover:opacity-90 transition-opacity" 
                                    style={{ 
                                        backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                        borderColor: websiteStyle?.tickerBorderColor || '#475569'
                                    }}
                                    onClick={() => onEventClick && onEventClick({
                                        id: item.id,
                                        title: item.tournamentName,
                                        type: 'tournament',
                                        date: item.gameDate,
                                        location: item.location,
                                        status: item.status
                                    })}
                                    title="Click to view tournament details"
                                >
                                    <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        <span>{item.location}</span>
                                        <span className="font-bold text-xs text-purple-400">TOURNAMENT</span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-sm font-medium text-white mb-1">{item.tournamentName}</div>
                                        <div className="text-xs" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                            {item.games.length} team{item.games.length !== 1 ? 's' : ''} competing
                                        </div>
                                    </div>
                                    <div className="text-xs" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {new Date(item.gameDate).toLocaleDateString()} • {item.time}
                                        <span className={`ml-2 px-1 rounded text-xs ${
                                            item.status === 'completed' ? 'bg-green-600 text-white' :
                                            item.status === 'live' ? 'bg-red-600 text-white' :
                                            'bg-purple-600 text-white'
                                        }`}>
                                            {item.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        } else {
                            // Other events (practice, meetings, etc)
                            const team = getTeam(item.teamId);
                            return (
                                <div 
                                    key={`event-${index}`} 
                                    className="flex-shrink-0 w-72 rounded-lg p-2 border cursor-pointer hover:opacity-90 transition-opacity" 
                                    style={{ 
                                        backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                        borderColor: websiteStyle?.tickerBorderColor || '#475569'
                                    }}
                                    onClick={() => onEventClick && onEventClick({
                                        id: item.id,
                                        title: item.title,
                                        type: 'event',
                                        date: item.gameDate,
                                        location: item.location,
                                        teamId: item.teamId,
                                        status: item.status
                                    })}
                                    title="Click to view event details"
                                >
                                    <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        <span>{item.location}</span>
                                        <span className="font-bold text-xs text-green-400">EVENT</span>
                                    </div>
                                    <div className="mb-2">
                                        <div className="text-sm font-medium text-white mb-1">{item.title}</div>
                                        {team && (
                                            <div className="flex items-center gap-2 text-xs" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                                <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center">
                                                    <LacrosseIcon name="stick" style={{fontSize: '8px'}} className="text-slate-600" />
                                                </div>
                                                <span>{team.name}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {new Date(item.gameDate).toLocaleDateString()} • {item.time}
                                        <span className={`ml-2 px-1 rounded text-xs ${
                                            item.status === 'completed' ? 'bg-green-600 text-white' :
                                            item.status === 'live' ? 'bg-red-600 text-white' :
                                            'bg-slate-600 text-white'
                                        }`}>
                                            {item.status?.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            );
                        }
                    })
                )}
            </div>
        </div>
    );
};

export default GameTicker;