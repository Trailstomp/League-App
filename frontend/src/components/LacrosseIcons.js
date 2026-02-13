/**
 * Lacrosse-Themed Icon System
 * Photo-realistic lacrosse icons with emoji fallbacks
 */

const ICON_BASE = '/icons/lacrosse';

// Photo-realistic icon URLs
const PHOTO_ICONS = {
    stick: `${ICON_BASE}/stick.png`,
    goal: `${ICON_BASE}/goal.png`,
    helmet: `${ICON_BASE}/helmet.png`,
    ball: `${ICON_BASE}/ball.png`,
    trophy: `${ICON_BASE}/trophy.png`,
    field: `${ICON_BASE}/field.png`,
    whistle: `${ICON_BASE}/whistle.png`,
    gloves: `${ICON_BASE}/gloves.png`,
};

// Emoji fallbacks for icons that don't have photo versions
const EMOJI_ICONS = {
    // Core Lacrosse Icons
    stick: '🥍',
    game: '🏆',
    practice: '🏃‍♂️',
    tournament: '🎯',
    event: '📅',
    
    // Team & Player Icons
    teams: '🥍',
    players: '👥',
    coach: '📋',
    roster: '📝',
    
    // Game Elements
    goal: '🥅',
    ball: '⚪',
    field: '🏟️',
    whistle: '🔔',
    helmet: '⛑️',
    gloves: '🧤',
    
    // Statistics & Data
    stats: '📊',
    trophy: '🏆',
    medal: '🏅',
    ranking: '📈',
    
    // Time & Schedule
    time: '🕐',
    calendar: '📅',
    schedule: '📋',
    
    // Location & Venue
    location: '📍',
    home: '🏠',
    away: '🚌',
    venue: '🏟️',
    
    // Actions & Navigation
    add: '➕',
    edit: '✏️',
    delete: '🗑️',
    view: '👁️',
    back: '⬅️',
    forward: '➡️',
    customize: '🎨',
    save: '💾',
    
    // Status & State
    active: '✅',
    inactive: '❌',
    pending: '⏳',
    complete: '✅',
    
    // Communication & Media
    email: '📧',
    phone: '📞',
    social: '💬',
    notification: '🔔',
    
    // Admin & Management
    admin: '👑',
    settings: '⚙️',
    backup: '💾',
    download: '⬇️',
    upload: '⬆️',
    
    // Auth
    login: '🔑',
    logout: '🚪',
    image: '🖼️',
    text: '📄',
};

// Map icon names to photo-realistic versions where available
const PHOTO_MAP = {
    stick: 'stick',
    teams: 'stick',
    game: 'trophy',
    trophy: 'trophy',
    medal: 'trophy',
    ranking: 'trophy',
    goal: 'goal',
    ball: 'ball',
    field: 'field',
    venue: 'field',
    whistle: 'whistle',
    helmet: 'helmet',
    gloves: 'gloves',
};

// Export the emoji map for backward compat
export const LacrosseIcons = EMOJI_ICONS;

// Component that renders photo-realistic icon or emoji fallback
export const LacrosseIcon = ({ name, className = "", size, usePhoto = true, style, ...props }) => {
    const photoKey = PHOTO_MAP[name];
    const photoUrl = photoKey ? PHOTO_ICONS[photoKey] : null;
    
    // Parse size from style.fontSize if not explicitly set
    const iconSize = size || (style?.fontSize ? parseInt(style.fontSize) : 20);
    
    if (usePhoto && photoUrl) {
        return (
            <img 
                src={photoUrl} 
                alt={name} 
                className={`lacrosse-icon-img inline-block object-contain ${className}`}
                style={{ width: iconSize, height: iconSize, verticalAlign: 'middle', ...style, fontSize: undefined }}
                loading="lazy"
                {...props}
            />
        );
    }
    
    // Emoji fallback
    return (
        <span className={`lacrosse-icon ${className}`} style={style} {...props}>
            {EMOJI_ICONS[name] || '❓'}
        </span>
    );
};

// Themed icon components for common use cases
export const GameIcon = (props) => <LacrosseIcon name="game" {...props} />;
export const PracticeIcon = (props) => <LacrosseIcon name="practice" {...props} />;
export const TournamentIcon = (props) => <LacrosseIcon name="tournament" {...props} />;
export const TeamIcon = (props) => <LacrosseIcon name="teams" {...props} />;
export const PlayerIcon = (props) => <LacrosseIcon name="players" {...props} />;
export const StatsIcon = (props) => <LacrosseIcon name="stats" {...props} />;
export const CalendarIcon = (props) => <LacrosseIcon name="calendar" {...props} />;
