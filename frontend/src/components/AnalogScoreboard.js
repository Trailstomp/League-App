import React, { useState, useEffect } from 'react';

/**
 * AnalogScoreboard - A realistic stadium-style scoreboard component
 * Features LED-style digits, team colors, shot clock, and period display
 */
const AnalogScoreboard = ({ 
    homeTeam = { name: 'HOME', score: 0, logo: null, color: '#1e40af' },
    awayTeam = { name: 'AWAY', score: 0, logo: null, color: '#dc2626' },
    timeRemaining = '15:00',
    currentPeriod = 1,
    periodName = 'QTR',
    shotClock = null, // { time: 30, isRunning: false }
    isLive = true,
    isPaused = false,
    compact = false,
    onTimeClick = null,
    getImageUrl = (url) => url
}) => {
    const [blinkColon, setBlinkColon] = useState(true);

    // Blink the colon every second when running
    useEffect(() => {
        if (!isPaused) {
            const interval = setInterval(() => {
                setBlinkColon(prev => !prev);
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isPaused]);

    // LED Digit Component - Single digit with LED segment style
    const LEDDigit = ({ value, size = 'lg', color = '#ff3333' }) => {
        const sizeClasses = {
            sm: 'text-3xl w-6',
            md: 'text-5xl w-10',
            lg: 'text-7xl w-14',
            xl: 'text-8xl w-20'
        };
        
        return (
            <span 
                className={`font-mono font-bold inline-block text-center ${sizeClasses[size]}`}
                style={{ 
                    color: color,
                    textShadow: `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}40`,
                    fontFamily: '"DSEG7 Classic", "Segment7", "Digital-7", monospace'
                }}
            >
                {value}
            </span>
        );
    };

    // Score Display Component - Large LED-style score
    const ScoreDisplay = ({ score, color, align = 'center' }) => {
        const scoreStr = String(score).padStart(2, '0');
        
        return (
            <div 
                className={`flex items-center justify-${align} gap-1`}
                style={{ 
                    filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.5))'
                }}
            >
                <div 
                    className="bg-black/90 rounded-lg px-4 py-2 border-2"
                    style={{ 
                        borderColor: `${color}60`,
                        boxShadow: `inset 0 2px 10px rgba(0,0,0,0.8), 0 0 20px ${color}30`
                    }}
                >
                    <div className="flex">
                        <LEDDigit value={scoreStr[0]} size={compact ? 'md' : 'xl'} color={color} />
                        <LEDDigit value={scoreStr[1]} size={compact ? 'md' : 'xl'} color={color} />
                    </div>
                </div>
            </div>
        );
    };

    // Time Display Component - Game clock with blinking colon
    const TimeDisplay = ({ time, onClick }) => {
        const [minutes, seconds] = (time || '00:00').split(':');
        const isLowTime = parseInt(minutes) === 0 && parseInt(seconds) <= 30;
        const clockColor = isLowTime ? '#ff3333' : '#ffcc00';
        
        return (
            <div 
                className={`cursor-${onClick ? 'pointer' : 'default'} transition-transform hover:scale-105`}
                onClick={onClick}
            >
                <div 
                    className="bg-black rounded-xl px-6 py-3 border-4 border-gray-700"
                    style={{ 
                        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.5)',
                        background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)'
                    }}
                >
                    <div className="flex items-center justify-center">
                        <LEDDigit value={minutes?.[0] || '0'} size={compact ? 'md' : 'lg'} color={clockColor} />
                        <LEDDigit value={minutes?.[1] || '0'} size={compact ? 'md' : 'lg'} color={clockColor} />
                        <span 
                            className={`${compact ? 'text-4xl' : 'text-6xl'} font-bold mx-1 transition-opacity`}
                            style={{ 
                                color: clockColor,
                                textShadow: `0 0 10px ${clockColor}`,
                                opacity: blinkColon ? 1 : 0.3
                            }}
                        >
                            :
                        </span>
                        <LEDDigit value={seconds?.[0] || '0'} size={compact ? 'md' : 'lg'} color={clockColor} />
                        <LEDDigit value={seconds?.[1] || '0'} size={compact ? 'md' : 'lg'} color={clockColor} />
                    </div>
                    
                    {/* Period Display */}
                    <div className="text-center mt-2">
                        <span 
                            className="text-sm font-bold tracking-widest"
                            style={{ color: '#888', textShadow: '0 0 5px #888' }}
                        >
                            {periodName} {currentPeriod}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // Shot Clock Component
    const ShotClockDisplay = ({ time, isRunning }) => {
        if (time === null || time === undefined) return null;
        
        const timeStr = String(Math.max(0, Math.floor(time))).padStart(2, '0');
        const isLow = time <= 10;
        const clockColor = isLow ? '#ff3333' : '#00ff00';
        
        return (
            <div 
                className="bg-black rounded-lg px-3 py-2 border-2 border-gray-600"
                style={{ 
                    boxShadow: `inset 0 2px 10px rgba(0,0,0,0.8), 0 0 15px ${isLow ? '#ff333330' : '#00ff0020'}`
                }}
            >
                <div className="text-center mb-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Shot</span>
                </div>
                <div className="flex justify-center">
                    <LEDDigit value={timeStr[0]} size="sm" color={clockColor} />
                    <LEDDigit value={timeStr[1]} size="sm" color={clockColor} />
                </div>
            </div>
        );
    };

    // Team Logo/Name Display
    const TeamDisplay = ({ team, isHome }) => {
        const alignment = isHome ? 'items-start' : 'items-end';
        const textAlign = isHome ? 'text-left' : 'text-right';
        
        return (
            <div className={`flex flex-col ${alignment} gap-2`}>
                {/* Team Logo */}
                {team.logo ? (
                    <div 
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 shadow-lg"
                        style={{ 
                            borderColor: team.color,
                            boxShadow: `0 0 20px ${team.color}50`
                        }}
                    >
                        <img 
                            src={getImageUrl(team.logo)} 
                            alt={team.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div 
                        className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white border-4"
                        style={{ 
                            backgroundColor: team.color,
                            borderColor: `${team.color}80`,
                            boxShadow: `0 0 20px ${team.color}50`
                        }}
                    >
                        {team.name?.[0] || '?'}
                    </div>
                )}
                
                {/* Team Name */}
                <div 
                    className={`${textAlign} px-3 py-1 rounded-lg`}
                    style={{ 
                        background: `linear-gradient(90deg, ${isHome ? team.color + '40' : 'transparent'}, ${isHome ? 'transparent' : team.color + '40'})`,
                    }}
                >
                    <span 
                        className="text-white font-bold text-lg uppercase tracking-wide"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                        {team.name}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div 
            className="relative w-full"
            style={{
                background: 'linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 10%, #0d0d0d 50%, #1a1a1a 90%, #2d2d2d 100%)',
                borderTop: '4px solid #444',
                borderBottom: '4px solid #222',
                boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.1)'
            }}
        >
            {/* Metal Frame Effect */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, transparent 20%, transparent 80%, rgba(255,255,255,0.03) 100%)'
                }}
            />
            
            {/* Scoreboard Content */}
            <div className={`relative z-10 ${compact ? 'py-4 px-4' : 'py-6 px-8'}`}>
                {/* Live Indicator */}
                {isLive && (
                    <div className="absolute top-2 left-4 flex items-center gap-2">
                        <span 
                            className="w-3 h-3 rounded-full bg-red-500 animate-pulse"
                            style={{ boxShadow: '0 0 10px #ff0000, 0 0 20px #ff0000' }}
                        />
                        <span className="text-red-500 text-xs font-bold tracking-wider">LIVE</span>
                    </div>
                )}
                
                {/* Paused Indicator */}
                {isPaused && (
                    <div className="absolute top-2 right-4">
                        <span 
                            className="text-yellow-500 text-xs font-bold tracking-wider animate-pulse"
                            style={{ textShadow: '0 0 10px #eab308' }}
                        >
                            ⏸ PAUSED
                        </span>
                    </div>
                )}

                {/* Main Scoreboard Grid */}
                <div className={`grid ${compact ? 'grid-cols-5 gap-2' : 'grid-cols-5 gap-6'} items-center max-w-5xl mx-auto`}>
                    
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-2">
                        <TeamDisplay team={homeTeam} isHome={true} />
                    </div>
                    
                    {/* Home Score */}
                    <div className="flex justify-center">
                        <ScoreDisplay score={homeTeam.score} color={homeTeam.color} />
                    </div>
                    
                    {/* Center - Clock & Shot Clock */}
                    <div className="flex flex-col items-center gap-3">
                        <TimeDisplay 
                            time={timeRemaining} 
                            onClick={onTimeClick}
                        />
                        {shotClock && (
                            <ShotClockDisplay 
                                time={shotClock.time} 
                                isRunning={shotClock.isRunning} 
                            />
                        )}
                    </div>
                    
                    {/* Away Score */}
                    <div className="flex justify-center">
                        <ScoreDisplay score={awayTeam.score} color={awayTeam.color} />
                    </div>
                    
                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-2">
                        <TeamDisplay team={awayTeam} isHome={false} />
                    </div>
                </div>

                {/* Bottom Stats Bar (optional) */}
                <div className="mt-4 flex justify-center gap-8 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeTeam.color }} />
                        <span className="uppercase tracking-wider">{homeTeam.name}</span>
                    </div>
                    <span className="text-gray-600">VS</span>
                    <div className="flex items-center gap-2">
                        <span className="uppercase tracking-wider">{awayTeam.name}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayTeam.color }} />
                    </div>
                </div>
            </div>
            
            {/* Bottom Edge Reflection */}
            <div 
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
                }}
            />
        </div>
    );
};

export default AnalogScoreboard;
