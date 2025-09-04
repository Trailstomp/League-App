/**
 * Lacrosse-Themed Icon System
 * Centralized lacrosse-themed icons for consistent theming across the app
 */

export const LacrosseIcons = {
    // Core Lacrosse Icons
    stick: '🥍',        // Primary lacrosse stick
    game: '🏆',         // Trophy for games/matches
    practice: '🏃‍♂️',     // Running for practice sessions
    tournament: '🎯',    // Target for tournaments
    event: '📅',        // Calendar for general events
    
    // Team & Player Icons
    teams: '🥍',        // Lacrosse stick for teams
    players: '👥',      // People for players
    coach: '📋',        // Clipboard for coaches
    roster: '📝',       // Document for rosters
    
    // Game Elements
    goal: '🥅',         // Goal net
    ball: '⚪',         // Ball (white circle)
    field: '🏟️',        // Stadium/field
    whistle: '🔔',      // Referee whistle
    
    // Statistics & Data
    stats: '📊',        // Chart for statistics
    trophy: '🏆',       // Trophy for achievements
    medal: '🏅',        // Medal for awards
    ranking: '📈',      // Chart for rankings
    
    // Time & Schedule
    time: '🕐',         // Clock for time
    calendar: '📅',     // Calendar for dates
    schedule: '📋',     // Clipboard for schedules
    
    // Location & Venue
    location: '📍',     // Pin for location
    home: '🏠',         // House for home games
    away: '🚌',         // Bus for away games
    venue: '🏟️',        // Stadium for venue
    
    // Actions & Navigation
    add: '➕',          // Plus for add actions
    edit: '✏️',         // Pencil for edit
    delete: '🗑️',       // Trash for delete
    view: '👁️',         // Eye for view
    back: '⬅️',         // Arrow for back
    forward: '➡️',      // Arrow for forward
    
    // Status & State
    active: '✅',       // Check for active
    inactive: '❌',     // X for inactive
    pending: '⏳',      // Hourglass for pending
    complete: '✅',     // Check for complete
    
    // Communication & Media
    email: '📧',        // Email
    phone: '📞',        // Phone
    social: '💬',       // Chat for social media
    notification: '🔔', // Bell for notifications
    
    // Admin & Management
    admin: '👑',        // Crown for admin
    settings: '⚙️',     // Gear for settings
    backup: '💾',       // Disk for backup
    download: '⬇️',     // Down arrow for download
    upload: '⬆️',       // Up arrow for upload
};

// Component wrappers for easy use in JSX
export const LacrosseIcon = ({ name, className = "", ...props }) => (
    <span className={`lacrosse-icon ${className}`} {...props}>
        {LacrosseIcons[name] || '❓'}
    </span>
);

// Themed icon components for common use cases
export const GameIcon = (props) => <LacrosseIcon name="game" {...props} />;
export const PracticeIcon = (props) => <LacrosseIcon name="practice" {...props} />;
export const TournamentIcon = (props) => <LacrosseIcon name="tournament" {...props} />;
export const TeamIcon = (props) => <LacrosseIcon name="teams" {...props} />;
export const PlayerIcon = (props) => <LacrosseIcon name="players" {...props} />;
export const StatsIcon = (props) => <LacrosseIcon name="stats" {...props} />;
export const CalendarIcon = (props) => <LacrosseIcon name="calendar" {...props} />;
export const LocationIcon = (props) => <LacrosseIcon name="location" {...props} />;
export const TimeIcon = (props) => <LacrosseIcon name="time" {...props} />;

export default LacrosseIcons;