import React from 'react';

/**
 * Sport Icons - High-quality SVG icons for each sport
 * Used throughout the app based on league sport setting
 */

// Lacrosse Stick Icon
export const LacrosseIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path 
            d="M4.5 2L3 3.5V8C3 10.5 5 13 8 13H9L15.5 19.5C16.5 20.5 18 20.5 19 19.5C20 18.5 20 17 19 16L12.5 9.5V8.5C12.5 5.5 10 3 7 3H5.5L4.5 2Z" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <circle cx="7" cy="8" r="2.5" stroke={color} strokeWidth="1.5"/>
        <path d="M19 16L21 18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

// Hockey Stick Icon
export const HockeyIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path 
            d="M5 2L3 4L4 20C4 21 5 22 6 22H8C9 22 10 21 10 20L9 8L15 2H5Z" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path d="M9 8L21 8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="18" cy="15" r="2" stroke={color} strokeWidth="1.5"/>
    </svg>
);

// Soccer Ball Icon
export const SoccerIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
        <path 
            d="M12 2L12 6M12 18L12 22M2 12H6M18 12H22" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
        />
        <path 
            d="M12 8L15.5 10L14.5 14H9.5L8.5 10L12 8Z" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinejoin="round"
        />
        <path d="M12 2L8.5 6L12 8L15.5 6L12 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M15.5 10L20 9.5L18 14H14.5L15.5 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8.5 10L4 9.5L6 14H9.5L8.5 10Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
);

// Volleyball Icon
export const VolleyballIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
        <path 
            d="M12 2C8 6 6 10 6 14C6 18 8 20 12 22" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
        />
        <path 
            d="M12 2C16 6 18 10 18 14C18 18 16 20 12 22" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
        />
        <path 
            d="M2 12H22" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round"
        />
    </svg>
);

// Generic Sport Icon (fallback)
export const GenericSportIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
        <path d="M12 6V12L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Sport Icon Selector - Returns appropriate icon based on sport type
export const SportIcon = ({ sport, size = 24, color = "currentColor", className = "" }) => {
    const props = { size, color, className };
    
    switch (sport) {
        case 'lacrosse':
            return <LacrosseIcon {...props} />;
        case 'hockey':
            return <HockeyIcon {...props} />;
        case 'soccer':
            return <SoccerIcon {...props} />;
        case 'volleyball':
            return <VolleyballIcon {...props} />;
        default:
            return <LacrosseIcon {...props} />;
    }
};

// Goal/Score Icon for each sport
export const GoalIcon = ({ sport, size = 24, color = "currentColor", className = "" }) => {
    const props = { size, color, className };
    
    // Soccer/Hockey use goal nets, volleyball uses point, lacrosse uses goal
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
            <rect x="3" y="6" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
            <path d="M3 6V4C3 3.44772 3.44772 3 4 3H20C20.5523 3 21 3.44772 21 4V6" stroke={color} strokeWidth="1.5"/>
            <path d="M7 6V20M12 6V20M17 6V20" stroke={color} strokeWidth="1" strokeOpacity="0.5"/>
            <path d="M3 10H21M3 14H21M3 18H21" stroke={color} strokeWidth="1" strokeOpacity="0.5"/>
        </svg>
    );
};

// Save/Block Icon
export const SaveIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path 
            d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" 
            stroke={color} 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        <path d="M9 12L11 14L15 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Miss/Error Icon
export const MissIcon = ({ size = 24, color = "currentColor", className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5"/>
        <path d="M15 9L9 15M9 9L15 15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

export default SportIcon;
