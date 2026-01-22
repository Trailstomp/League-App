/**
 * Sports Configuration - Defines sport-specific settings
 * Each sport has its own icons, positions, scoring stats, and terminology
 */

// Sport types
export const SPORTS = {
    LACROSSE: 'lacrosse',
    HOCKEY: 'hockey',
    SOCCER: 'soccer',
    VOLLEYBALL: 'volleyball'
};

// Sport configurations
export const SPORT_CONFIG = {
    [SPORTS.LACROSSE]: {
        name: 'Lacrosse',
        icon: '🥍',
        emoji: '🥍',
        ballName: 'Ball',
        periodName: 'Quarter',
        periods: 4,
        positions: [
            { id: 'attack', name: 'Attack', abbrev: 'A' },
            { id: 'midfield', name: 'Midfield', abbrev: 'M' },
            { id: 'defense', name: 'Defense', abbrev: 'D' },
            { id: 'goalie', name: 'Goalie', abbrev: 'G' },
            { id: 'fogo', name: 'Face-Off Get-Off', abbrev: 'FOGO' },
            { id: 'lsm', name: 'Long Stick Midfield', abbrev: 'LSM' }
        ],
        stats: {
            offensive: ['goals', 'assists', 'shots', 'groundBalls'],
            defensive: ['saves', 'causedTurnovers', 'groundBalls'],
            goalie: ['saves', 'goalsAllowed', 'savePercentage']
        },
        scoringActions: [
            { id: 'goal', name: 'Goal', emoji: '🥅', points: 1 },
            { id: 'save', name: 'Save', emoji: '🧤', points: 0 },
            { id: 'miss', name: 'Miss', emoji: '❌', points: 0 }
        ],
        terminology: {
            score: 'Goal',
            assist: 'Assist',
            save: 'Save',
            period: 'Quarter'
        }
    },
    
    [SPORTS.HOCKEY]: {
        name: 'Hockey',
        icon: '🏒',
        emoji: '🏒',
        ballName: 'Puck',
        periodName: 'Period',
        periods: 3,
        positions: [
            { id: 'center', name: 'Center', abbrev: 'C' },
            { id: 'left_wing', name: 'Left Wing', abbrev: 'LW' },
            { id: 'right_wing', name: 'Right Wing', abbrev: 'RW' },
            { id: 'left_defense', name: 'Left Defense', abbrev: 'LD' },
            { id: 'right_defense', name: 'Right Defense', abbrev: 'RD' },
            { id: 'goalie', name: 'Goalie', abbrev: 'G' }
        ],
        stats: {
            offensive: ['goals', 'assists', 'shots', 'plusMinus'],
            defensive: ['blocks', 'hits', 'takeaways'],
            goalie: ['saves', 'goalsAllowed', 'savePercentage', 'shutouts']
        },
        scoringActions: [
            { id: 'goal', name: 'Goal', emoji: '🥅', points: 1 },
            { id: 'save', name: 'Save', emoji: '🧤', points: 0 },
            { id: 'miss', name: 'Miss', emoji: '❌', points: 0 }
        ],
        terminology: {
            score: 'Goal',
            assist: 'Assist',
            save: 'Save',
            period: 'Period'
        }
    },
    
    [SPORTS.SOCCER]: {
        name: 'Soccer',
        icon: '⚽',
        emoji: '⚽',
        ballName: 'Ball',
        periodName: 'Half',
        periods: 2,
        positions: [
            { id: 'forward', name: 'Forward', abbrev: 'FW' },
            { id: 'striker', name: 'Striker', abbrev: 'ST' },
            { id: 'midfielder', name: 'Midfielder', abbrev: 'MF' },
            { id: 'attacking_mid', name: 'Attacking Midfielder', abbrev: 'AM' },
            { id: 'defensive_mid', name: 'Defensive Midfielder', abbrev: 'DM' },
            { id: 'defender', name: 'Defender', abbrev: 'DF' },
            { id: 'center_back', name: 'Center Back', abbrev: 'CB' },
            { id: 'fullback', name: 'Fullback', abbrev: 'FB' },
            { id: 'goalkeeper', name: 'Goalkeeper', abbrev: 'GK' }
        ],
        stats: {
            offensive: ['goals', 'assists', 'shots', 'shotsOnTarget'],
            defensive: ['tackles', 'interceptions', 'clearances'],
            goalie: ['saves', 'goalsAllowed', 'cleanSheets']
        },
        scoringActions: [
            { id: 'goal', name: 'Goal', emoji: '⚽', points: 1 },
            { id: 'save', name: 'Save', emoji: '🧤', points: 0 },
            { id: 'miss', name: 'Miss', emoji: '❌', points: 0 }
        ],
        terminology: {
            score: 'Goal',
            assist: 'Assist',
            save: 'Save',
            period: 'Half'
        }
    },
    
    [SPORTS.VOLLEYBALL]: {
        name: 'Volleyball',
        icon: '🏐',
        emoji: '🏐',
        ballName: 'Ball',
        periodName: 'Set',
        periods: 5, // Best of 5 sets
        positions: [
            { id: 'setter', name: 'Setter', abbrev: 'S' },
            { id: 'outside_hitter', name: 'Outside Hitter', abbrev: 'OH' },
            { id: 'opposite', name: 'Opposite', abbrev: 'OPP' },
            { id: 'middle_blocker', name: 'Middle Blocker', abbrev: 'MB' },
            { id: 'libero', name: 'Libero', abbrev: 'L' },
            { id: 'defensive_specialist', name: 'Defensive Specialist', abbrev: 'DS' }
        ],
        stats: {
            offensive: ['kills', 'assists', 'aces', 'attackAttempts'],
            defensive: ['blocks', 'digs', 'receptionErrors'],
            goalie: [] // No goalie in volleyball
        },
        scoringActions: [
            { id: 'kill', name: 'Kill', emoji: '💥', points: 1 },
            { id: 'ace', name: 'Ace', emoji: '🎯', points: 1 },
            { id: 'block', name: 'Block', emoji: '🧱', points: 1 },
            { id: 'error', name: 'Error', emoji: '❌', points: 0 }
        ],
        terminology: {
            score: 'Point',
            assist: 'Assist',
            save: 'Dig',
            period: 'Set'
        }
    }
};

// Get sport config with fallback to lacrosse
export const getSportConfig = (sportType) => {
    return SPORT_CONFIG[sportType] || SPORT_CONFIG[SPORTS.LACROSSE];
};

// Get positions for a sport
export const getPositions = (sportType) => {
    const config = getSportConfig(sportType);
    return config.positions;
};

// Get scoring actions for a sport
export const getScoringActions = (sportType) => {
    const config = getSportConfig(sportType);
    return config.scoringActions;
};

// Get sport icon
export const getSportIcon = (sportType) => {
    const config = getSportConfig(sportType);
    return config.icon;
};

// Get all available sports for selection
export const getAvailableSports = () => {
    return Object.entries(SPORT_CONFIG).map(([key, config]) => ({
        id: key,
        name: config.name,
        icon: config.icon
    }));
};

export default SPORT_CONFIG;
