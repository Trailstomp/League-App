// Define comprehensive permissions system
export const PERMISSIONS = {
    // User Management
    'users.view': { name: 'View Users', category: 'User Management', description: 'View user list and profiles' },
    'users.create': { name: 'Create Users', category: 'User Management', description: 'Add new users to the system' },
    'users.edit': { name: 'Edit Users', category: 'User Management', description: 'Modify user information and roles' },
    'users.delete': { name: 'Delete Users', category: 'User Management', description: 'Remove users from the system' },
    
    // Team Management
    'teams.view': { name: 'View Teams', category: 'Team Management', description: 'View team information' },
    'teams.create': { name: 'Create Teams', category: 'Team Management', description: 'Add new teams' },
    'teams.edit': { name: 'Edit Teams', category: 'Team Management', description: 'Modify team information' },
    'teams.delete': { name: 'Delete Teams', category: 'Team Management', description: 'Remove teams' },
    'teams.manage_own': { name: 'Manage Own Team', category: 'Team Management', description: 'Manage assigned team only' },
    
    // Player Management  
    'players.view': { name: 'View Players', category: 'Player Management', description: 'View player roster and stats' },
    'players.add': { name: 'Add Players', category: 'Player Management', description: 'Add players to teams' },
    'players.edit': { name: 'Edit Players', category: 'Player Management', description: 'Modify player information' },
    'players.remove': { name: 'Remove Players', category: 'Player Management', description: 'Remove players from teams' },
    
    // Schedule & Events
    'events.view': { name: 'View Events', category: 'Schedule & Events', description: 'View game and event schedules' },
    'events.create': { name: 'Create Events', category: 'Schedule & Events', description: 'Create new games and events' },
    'events.edit': { name: 'Edit Events', category: 'Schedule & Events', description: 'Modify existing events' },
    'events.delete': { name: 'Delete Events', category: 'Schedule & Events', description: 'Remove events from calendar' },
    
    // Media Management
    'media.view': { name: 'View Media', category: 'Media Management', description: 'View photos and videos' },
    'media.upload': { name: 'Upload Media', category: 'Media Management', description: 'Upload new photos and videos' },
    'media.edit': { name: 'Edit Media', category: 'Media Management', description: 'Edit media metadata and organize galleries' },
    'media.delete': { name: 'Delete Media', category: 'Media Management', description: 'Remove photos and videos' },
    
    // System Administration
    'system.settings': { name: 'System Settings', category: 'System Administration', description: 'Manage website settings and configuration' },
    'system.roles': { name: 'Role Management', category: 'System Administration', description: 'Create and manage user roles and permissions' },
    'system.invitations': { name: 'Manage Invitations', category: 'System Administration', description: 'Send invitations and manage access requests' },
    'system.admin_access': { name: 'Admin Access', category: 'System Administration', description: 'Access administrative functions' }
};

// Define system roles with their permissions
export const SYSTEM_ROLES = {
    'super_admin': {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystemRole: true,
        permissions: Object.keys(PERMISSIONS)
    },
    'league_admin': {
        id: 'league_admin', 
        name: 'League Administrator',
        description: 'League management with most administrative functions',
        isSystemRole: true,
        permissions: [
            'users.view', 'users.create', 'users.edit',
            'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
            'players.view', 'players.add', 'players.edit', 'players.remove',
            'events.view', 'events.create', 'events.edit', 'events.delete',
            'media.view', 'media.upload', 'media.edit', 'media.delete',
            'system.settings', 'system.invitations'
        ]
    },
    'team_coach': {
        id: 'team_coach',
        name: 'Team Coach',
        description: 'Coach with team management and administrative responsibilities',
        isSystemRole: true,
        permissions: [
            'users.view', 'users.edit', // Added user permissions for coaches
            'teams.view', 'teams.create', 'teams.edit', 'teams.manage_own',
            'players.view', 'players.add', 'players.edit', 'players.remove',
            'events.view', 'events.create', 'events.edit', 'events.delete',
            'media.view', 'media.upload', 'media.edit', 'media.delete',
            'system.admin_access' // Added admin access for coaches
        ]
    },
    'player': {
        id: 'player',
        name: 'Player',
        description: 'League player with basic access',
        isSystemRole: true,
        permissions: [
            'teams.view',
            'players.view',
            'events.view',
            'media.view'
        ]
    },
    'guest': {
        id: 'guest',
        name: 'Guest',
        description: 'Public access with view-only permissions',
        isSystemRole: true,
        permissions: [
            'teams.view',
            'events.view',
            'media.view'
        ]
    }
};

// Utility functions for permission checking
export const getUserPermissions = (user) => {
    if (!user || !user.roles) return SYSTEM_ROLES.guest.permissions;
    
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    const permissions = new Set();
    
    userRoles.forEach(role => {
        const systemRole = SYSTEM_ROLES[role];
        if (systemRole) {
            systemRole.permissions.forEach(permission => permissions.add(permission));
        }
    });
    
    return Array.from(permissions);
};

export const hasPermission = (user, permission) => {
    const userPermissions = getUserPermissions(user);
    return userPermissions.includes(permission);
};

export const isAdmin = (user) => {
    if (!user || !user.roles) return false;
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    return userRoles.includes('admin') || userRoles.includes('super_admin') || userRoles.includes('league_admin');
};

export const isCoach = (user) => {
    if (!user || !user.roles) return false;
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.role];
    return userRoles.includes('coach') || userRoles.includes('team_coach');
};

export const canEditTeam = (user, teamId) => {
    if (isAdmin(user)) return true;
    if (isCoach(user) && user.teamId === teamId) return true;
    return false;
};

export const canEditEvent = (user, event) => {
    if (isAdmin(user)) return true;
    if (isCoach(user)) {
        // Coach can edit events for their team
        if (event.teamId === user.teamId) return true;
        if (event.homeTeam === user.teamId || event.awayTeam === user.teamId) return true;
        if (event.teamIds && event.teamIds.includes(user.teamId)) return true;
    }
    return false;
};