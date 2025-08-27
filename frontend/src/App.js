import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Home, BarChart2, Users, Calendar, Shield, Menu, X, Settings, LogOut, Sun, Moon, ArrowUp, ArrowDown, Trophy, Swords, MessageSquare, Crown, LogIn, Mail, Edit, ToggleLeft, ToggleRight, Plus, Trash2, Twitter, Instagram, Facebook, Image, Video, UserCheck, MapPin, Palette, ChevronLeft, ChevronRight, Eye, Upload, Play, Pause, Music } from 'lucide-react';
import "./App.css";

// --- ASSETS ---
const MlblLogo = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzE4MTgyOCIvPjxwYXRoIGQ9Ik0zMCAyMEw3MCAyMFY4MEw1MCA5MEwzMCA4MFoiIGZpbGw9IiNkYzI2MjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9InNlcmlmIiBmaWxsPSJ3aGl0ZSI+TUxCTDwvdGV4dD48L3N2Zz4=";

// Music Player Component
const MusicPlayer = ({ musicState, setMusicState }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            setMusicState(prev => ({ ...prev, audioRef: audioRef.current }));
        }
    }, [setMusicState]);

    useEffect(() => {
        if (audioRef.current && musicState.currentTrack) {
            audioRef.current.src = musicState.currentTrack.url;
            if (musicState.isPlaying) {
                audioRef.current.play().catch(console.error);
            }
        }
    }, [musicState.currentTrack, musicState.isPlaying]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (musicState.isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setMusicState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        }
    };

    const stopMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setMusicState(prev => ({ ...prev, isPlaying: false, currentTrack: null }));
        }
    };

    if (!musicState.currentTrack) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-xs">
            <div className="flex items-center space-x-3">
                <div className="flex-grow">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                        {musicState.currentTrack.title}
                    </p>
                    {musicState.currentTrack.teamId && (
                        <p className="text-xs text-slate-500">Team Music</p>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={togglePlay}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                        {musicState.isPlaying ? <X size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        onClick={stopMusic}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
            <audio
                ref={audioRef}
                onEnded={() => setMusicState(prev => ({ ...prev, isPlaying: false }))}
                onPlay={() => setMusicState(prev => ({ ...prev, isPlaying: true }))}
                onPause={() => setMusicState(prev => ({ ...prev, isPlaying: false }))}
            />
        </div>
    );
};
const getLogoStyle = (websiteStyle) => {
    const logoStyle = websiteStyle?.logoStyle || 'contain';
    return logoStyle === 'contain' ? 'object-contain' : 
           logoStyle === 'cover' ? 'object-cover' : 
           'object-fill';
};

// File Upload Component
const FileUploadInput = ({ label, accept, currentValue, onChange, placeholder }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (file) {
            // Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            onChange(objectUrl);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="space-y-2">
            <label className="block font-semibold text-slate-700">{label}</label>
            
            {/* Drop Zone */}
            <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        handleFileSelect(file);
                    }}
                    className="hidden"
                />
                
                {currentValue ? (
                    <div className="space-y-2">
                        {accept.includes('image') ? (
                            <img src={currentValue} alt="Preview" className="max-w-full h-32 mx-auto rounded object-cover" />
                        ) : accept.includes('video') ? (
                            <div className="bg-slate-200 h-32 flex items-center justify-center rounded">
                                <span className="text-slate-600">Video selected</span>
                            </div>
                        ) : null}
                        <p className="text-sm text-green-600">✅ File selected - Click to change</p>
                    </div>
                ) : (
                    <div className="py-4">
                        <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">{placeholder || 'Click or drag to upload file'}</p>
                        <p className="text-xs text-slate-500 mt-1">Supported: {accept}</p>
                    </div>
                )}
            </div>
            
            {/* URL Input as Fallback */}
            <div className="text-xs">
                <label className="text-slate-500">Or paste URL:</label>
                <input 
                    type="url"
                    value={typeof currentValue === 'string' && currentValue.startsWith('http') ? currentValue : ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-1 border rounded text-xs mt-1"
                />
            </div>
        </div>
    );
};

// Helper function to find address from location name
const findLocationAddress = (locationName, teams) => {
    if (!locationName || !teams) return null;
    
    for (const team of teams) {
        if (team.locations) {
            const location = team.locations.find(loc => loc.name === locationName);
            if (location) {
                return location.address;
            }
        }
    }
    return null;
};

// Background style utility function
const getBackgroundStyle = (websiteStyle) => {
    const style = {};
    
    // Page background color
    if (websiteStyle?.pageBackgroundColor) {
        style.backgroundColor = websiteStyle.pageBackgroundColor;
    }
    
    // Background image overlay
    if (websiteStyle?.backgroundImage) {
        const { backgroundImage, backgroundMode = 'cover', backgroundOpacity = 0.1 } = websiteStyle;
        
        let backgroundSize = 'cover';
        let backgroundRepeat = 'no-repeat';
        
        switch (backgroundMode) {
            case 'contain':
                backgroundSize = 'contain';
                break;
            case 'repeat':
                backgroundSize = 'auto';
                backgroundRepeat = 'repeat';
                break;
            default: // 'cover'
                backgroundSize = 'cover';
                break;
        }
        
        style.backgroundImage = `linear-gradient(rgba(255, 255, 255, ${1 - backgroundOpacity}), rgba(255, 255, 255, ${1 - backgroundOpacity})), url(${backgroundImage})`;
        style.backgroundSize = backgroundSize;
        style.backgroundRepeat = backgroundRepeat;
        style.backgroundPosition = 'center';
        style.backgroundAttachment = 'fixed';
    }
    
    return style;
};

// Clickable location component
const ClickableLocation = ({ locationName, teams, className = "", children }) => {
    const address = findLocationAddress(locationName, teams);
    
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const searchTerm = address || locationName;
        const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchTerm)}&t=k`;
        window.open(mapsUrl, '_blank');
    };
    
    if (!locationName) return null;
    
    return (
        <button 
            onClick={handleClick}
            className={`text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors ${className}`}
            title={`Click to open in Google Maps${address ? ` (${address})` : ''}`}
        >
            {children || locationName}
        </button>
    );
};

// --- DATA IMPORTED FROM SPREADSHEETS ---
const initialMockUsers = [
    { id: 1, name: 'Admin Ali', roleIds: ['super_admin'], teamId: null, email: 'admin@mlbl.org', roles: ['admin'], status: 'active', createdAt: '2024-01-01' },
    { id: 2, name: 'Coach Chandler (OH10)', roleIds: ['team_coach'], teamId: 'oh10-lacrosse', email: 'cschrudder23@gmail.com', roles: ['coach'], status: 'active', createdAt: '2024-01-15' },
    { id: 3, name: 'Player Pat (Dayton)', roleIds: ['player'], teamId: 'dayton-eagles', email: 'pat@test.com', roles: ['player'], status: 'active', createdAt: '2024-02-01' },
    { id: 4, name: 'Coach Dave (Dads)', roleIds: ['team_coach'], teamId: 'american-dads', email: 'dave@test.com', roles: ['coach'], status: 'active', createdAt: '2024-02-15' },
    // Pending users (for testing)
    { id: 5, name: 'New Player John', roleIds: [], teamId: 'indiana-lacers', email: 'john.new@test.com', roles: [], status: 'pending', createdAt: '2025-06-15', preferredRole: 'player', phone: '555-1234', reasonForJoining: 'Want to join the league and play competitive lacrosse' },
    { id: 6, name: 'Sarah Coach', roleIds: [], teamId: 'columbus-ball-hawgs', email: 'sarah.coach@test.com', roles: [], status: 'pending', createdAt: '2025-06-20', preferredRole: 'coach', phone: '555-5678', reasonForJoining: 'Experienced player looking to coach and help develop the team' },
];

const initialTeams = [
    { id: 'oh10-lacrosse', name: 'OH10 Lacrosse', logo: 'https://lh3.googleusercontent.com/d/12Piww7Y46hHbAbnDZwxsFDBfuSKbq2RR', wins: 4, losses: 2, ties: 0, pf: 65, pa: 59, contactEmail: 'cschrudder23@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#ff0000', backgroundColor: '#fef2f2' } },
    { id: 'american-dads', name: 'American Dads', logo: 'https://lh3.googleusercontent.com/d/1_YssV72EQ9Y3gtXzjM8S0eAJCGQMFpJ6', wins: 4, losses: 0, ties: 0, pf: 56, pa: 10, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#1d4ed8', backgroundColor: '#eff6ff' } },
    { id: 'indiana-lacers', name: 'Indiana Lacers', logo: 'https://lh3.googleusercontent.com/d/1grpa4h9wlU21hDZGMYjiWUZOHQEttN1U', wins: 4, losses: 3, ties: 0, pf: 55, pa: 63, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Box', musicUrl: '', style: { bannerUrl: '', primaryColor: '#047857', backgroundColor: '#ecfdf5' } },
    { id: 'cincinnati-trash-pandas', name: 'Cincinnati Trash Pandas', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 2, losses: 1, ties: 0, pf: 21, pa: 25, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Box', musicUrl: '', style: { bannerUrl: '', primaryColor: '#4b5563', backgroundColor: '#f3f4f6' } },
    { id: 'columbus-ball-hawgs', name: 'Columbus Ball Hawgs', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 1, losses: 0, ties: 0, pf: 17, pa: 7, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#f59e0b', backgroundColor: '#fffbeb' } },
    { id: 'indy-sabers', name: 'Indy Sabers', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 1, losses: 4, ties: 0, pf: 40, pa: 48, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#be185d', backgroundColor: '#fdf2f8' } },
    { id: 'dayton-eagles', name: 'Dayton Eagles', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 0, losses: 6, ties: 0, pf: 37, pa: 79, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Box', musicUrl: '', style: { bannerUrl: '', primaryColor: '#581c87', backgroundColor: '#f5f3ff' } },
];

const initialPlayersList = [
    { id: 1, firstName: 'Chandler', lastName: 'Schrudder', nickname: 'Chan', email: 'cschrudder23@gmail.com', phone: '555-0101', number: 10, positions: ['Attack'], teams: ['oh10-lacrosse'], photo: `https://placehold.co/200x200/ff0000/FFFFFF?text=CS`, active: true, roles: ['coach'], handedness: 'Right' },
    { id: 2, firstName: 'John', lastName: 'Smith', nickname: 'Dad', email: 'j.smith@example.com', phone: '555-0102', number: 22, positions: ['Defense'], teams: ['american-dads'], photo: `https://placehold.co/200x200/1d4ed8/FFFFFF?text=JS`, active: true, handedness: 'Left' },
    { id: 3, firstName: 'Mike', lastName: 'Miller', nickname: 'Lacer', email: 'm.miller@example.com', phone: '555-0103', number: 15, positions: ['Middie'], teams: ['indiana-lacers'], photo: `https://placehold.co/200x200/047857/FFFFFF?text=MM`, active: true, handedness: 'Right' },
    { id: 4, firstName: 'Alex', lastName: 'Williams', nickname: 'Panda', email: 'a.williams@example.com', phone: '555-0104', number: 7, positions: ['Goalie'], teams: ['cincinnati-trash-pandas'], photo: `https://placehold.co/200x200/4b5563/FFFFFF?text=AW`, active: true, handedness: 'Right' },
    { id: 5, firstName: 'Brian', lastName: 'Davis', nickname: 'Hawg', email: 'b.davis@example.com', phone: '555-0105', number: 99, positions: ['Attack'], teams: ['columbus-ball-hawgs'], photo: `https://placehold.co/200x200/f59e0b/FFFFFF?text=BD`, active: true, handedness: 'Left' },
    { id: 6, firstName: 'Kevin', lastName: 'Brown', nickname: 'Saber', email: 'k.brown@example.com', phone: '555-0106', number: 1, positions: ['Defense'], teams: ['indy-sabers'], photo: `https://placehold.co/200x200/be185d/FFFFFF?text=KB`, active: true, handedness: 'Right' },
    { id: 7, firstName: 'Tom', lastName: 'Wilson', nickname: 'Eagle', email: 't.wilson@example.com', phone: '555-0107', number: 23, positions: ['Middie'], teams: ['dayton-eagles'], photo: `https://placehold.co/200x200/581c87/FFFFFF?text=TW`, active: false, handedness: 'Left' },
];

const initialGameTickerData = [
    { id: 1, homeTeam: 'oh10-lacrosse', awayTeam: 'american-dads', homeScore: 3, awayScore: 16, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 2, homeTeam: 'dayton-eagles', awayTeam: 'cincinnati-trash-pandas', homeScore: 5, awayScore: 10, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 3, homeTeam: 'indiana-lacers', awayTeam: 'american-dads', homeScore: 0, awayScore: 14, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 4, homeTeam: 'indy-sabers', awayTeam: 'cincinnati-trash-pandas', homeScore: 7, awayScore: 9, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 5, homeTeam: 'columbus-ball-hawgs', awayTeam: 'dayton-eagles', homeScore: 17, awayScore: 7, location: 'Columbus', type: 'League Game', tournamentName: null, status: 'Final' },
];

const initialLeagueSchedule = [
    { date: '2025-08-09', games: [ 
        { id: 1, home: 'oh10-lacrosse', away: 'american-dads', time: '1:00 PM', location: 'Dayton' },
        { id: 2, home: 'dayton-eagles', away: 'cincinnati-trash-pandas', time: '2:00 PM', location: 'Dayton' },
        { id: 3, home: 'indiana-lacers', away: 'american-dads', time: '3:00 PM', location: 'Dayton' },
    ] },
    { date: '2025-08-02', games: [ 
        { id: 6, home: 'indiana-lacers', away: 'oh10-lacrosse', time: '6:00 PM', location: 'Indy' },
        { id: 7, home: 'indy-sabers', away: 'dayton-eagles', time: '7:00 PM', location: 'Indy' },
    ] },
     { date: '2025-07-10', games: [ { id: 8, home: 'columbus-ball-hawgs', away: 'dayton-eagles', time: '7:00 PM', location: 'Columbus' } ] },
];

const newsFeed = [
    { id: 1, title: 'American Dads Dominate Dayton Classic', date: '2025-08-10', snippet: 'The American Dads team swept the competition at the Dayton Classic tournament this past weekend, securing the championship with a decisive 13-5 victory...' },
    { id: 2, title: 'Indy Gauntlet Tournament Recap', date: '2025-08-03', snippet: 'OH10 and the Indy Lacers came out on top in a hard-fought weekend of lacrosse at the Indy Gauntlet tournament...' },
];

// --- SECURITY & PERMISSIONS SYSTEM ---

// Define comprehensive permissions system
const PERMISSIONS = {
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
const SYSTEM_ROLES = {
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
            'system.settings', 'system.invitations', 'system.admin_access'
        ]
    },
    'team_coach': {
        id: 'team_coach',
        name: 'Team Coach',
        description: 'Team and player management for assigned team',
        isSystemRole: true,
        permissions: [
            'teams.view', 'teams.manage_own',
            'players.view', 'players.add', 'players.edit',
            'events.view', 'events.create', 'events.edit',
            'media.view', 'media.upload'
        ]
    },
    'player': {
        id: 'player',
        name: 'Player',
        description: 'Basic access to view team and league information',
        isSystemRole: true,
        permissions: [
            'teams.view', 'players.view', 'events.view', 'media.view'
        ]
    }
};

// Permission checking utilities
const hasPermission = (user, permission) => {
    if (!user || !user.roleIds) return false;
    return user.roleIds.some(roleId => {
        const role = getAllRoles().find(r => r.id === roleId);
        return role && role.permissions.includes(permission);
    });
};

const hasAllPermissions = (user, permissions) => {
    return permissions.every(permission => hasPermission(user, permission));
};

const hasAnyPermission = (user, permissions) => {
    return permissions.some(permission => hasPermission(user, permission));
};

const getAllRoles = () => {
    // This would normally come from a database
    // For now, return system roles + any custom roles from localStorage
    const customRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
    return [...Object.values(SYSTEM_ROLES), ...customRoles];
};

// Role Management Component
const RoleManager = ({ users, setUsers }) => {
    const [editingRole, setEditingRole] = useState(null);
    const [roles, setRoles] = useState(() => getAllRoles());

    const handleSaveRole = (e) => {
        e.preventDefault();
        
        if (editingRole.id && !editingRole.isSystemRole) {
            // Edit existing custom role
            const updatedRoles = roles.map(r => 
                r.id === editingRole.id ? editingRole : r
            );
            setRoles(updatedRoles);
            
            // Save custom roles to localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
        } else if (!editingRole.id) {
            // Create new role
            const newRole = {
                ...editingRole,
                id: `custom_${Date.now()}`,
                isSystemRole: false
            };
            
            const updatedRoles = [...roles, newRole];
            setRoles(updatedRoles);
            
            // Save custom roles to localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
        }
        
        setEditingRole(null);
    };

    const handleDeleteRole = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (role && !role.isSystemRole && window.confirm(`Delete role "${role.name}"?`)) {
            const updatedRoles = roles.filter(r => r.id !== roleId);
            setRoles(updatedRoles);
            
            // Update localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
            
            // Update users who had this role
            setUsers(currentUsers => 
                currentUsers.map(user => ({
                    ...user,
                    roleIds: (user.roleIds || []).filter(id => id !== roleId)
                }))
            );
        }
    };

    const getPermissionsByCategory = () => {
        const categories = {};
        Object.entries(PERMISSIONS).forEach(([key, permission]) => {
            if (!categories[permission.category]) {
                categories[permission.category] = [];
            }
            categories[permission.category].push({ key, ...permission });
        });
        return categories;
    };

    const permissionCategories = getPermissionsByCategory();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Role Management</h3>
                <button 
                    onClick={() => setEditingRole({name: '', description: '', permissions: []})}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Create Role
                </button>
            </div>

            {/* Role List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-slate-50 p-4 rounded-lg border hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-grow">
                                <h4 className="font-semibold text-slate-800 mb-1">{role.name}</h4>
                                {role.isSystemRole && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">System Role</span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setEditingRole(role)}
                                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
                                    title={role.isSystemRole ? "View Permissions" : "Edit Role"}
                                >
                                    <Edit size={16} />
                                </button>
                                {!role.isSystemRole && (
                                    <button 
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                                        title="Delete Role"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                                {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                            </p>
                            <button 
                                onClick={() => setEditingRole(role)}
                                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded transition-colors"
                            >
                                {role.isSystemRole ? 'View Details' : 'Edit Permissions'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Edit Modal */}
            {editingRole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingRole.id ? 'Edit Role' : 'Create New Role'}
                        </h3>
                        
                        <form onSubmit={handleSaveRole}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role Details */}
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                        <input 
                                            type="text"
                                            value={editingRole.name || ''}
                                            onChange={e => setEditingRole(prev => ({...prev, name: e.target.value}))}
                                            className="w-full p-2 border rounded"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            value={editingRole.description || ''}
                                            onChange={e => setEditingRole(prev => ({...prev, description: e.target.value}))}
                                            className="w-full p-2 border rounded h-20"
                                            placeholder="Describe what this role can do..."
                                        />
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {Object.entries(permissionCategories).map(([category, permissions]) => (
                                            <div key={category} className="border rounded p-3">
                                                <h4 className="font-semibold text-sm text-slate-700 mb-2">{category}</h4>
                                                <div className="space-y-1">
                                                    {permissions.map(permission => (
                                                        <label key={permission.key} className="flex items-start space-x-2 text-sm">
                                                            <input 
                                                                type="checkbox"
                                                                checked={editingRole.permissions?.includes(permission.key) || false}
                                                                onChange={e => {
                                                                    const permissions = editingRole.permissions || [];
                                                                    if (e.target.checked) {
                                                                        setEditingRole(prev => ({
                                                                            ...prev,
                                                                            permissions: [...permissions, permission.key]
                                                                        }));
                                                                    } else {
                                                                        setEditingRole(prev => ({
                                                                            ...prev,
                                                                            permissions: permissions.filter(p => p !== permission.key)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <div>
                                                                <div className="font-medium">{permission.name}</div>
                                                                <div className="text-xs text-slate-500">{permission.description}</div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingRole(null)}
                                    className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    {editingRole.id ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
const GameTicker = ({teams, gameTickerData, onTeamClick, websiteStyle}) => {
    const getTeam = (id) => teams.find(t => t.id === id);
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Combine games and upcoming events
    const allItems = useMemo(() => {
        // Add date information to games from schedule
        const gamesWithDates = gameTickerData.map(game => {
            // Find the game in the schedule to get its date
            let gameDate = null;
            for (const day of [
                { date: '2025-08-09', games: [ 
                    { id: 1, home: 'oh10-lacrosse', away: 'american-dads', time: '1:00 PM', location: 'Dayton' },
                    { id: 2, home: 'dayton-eagles', away: 'cincinnati-trash-pandas', time: '2:00 PM', location: 'Dayton' },
                    { id: 3, home: 'indiana-lacers', away: 'american-dads', time: '3:00 PM', location: 'Dayton' },
                ] },
                { date: '2025-08-02', games: [ 
                    { id: 6, home: 'indiana-lacers', away: 'oh10-lacrosse', time: '6:00 PM', location: 'Indy' },
                    { id: 7, home: 'indy-sabers', away: 'dayton-eagles', time: '7:00 PM', location: 'Indy' },
                ] },
                { date: '2025-07-10', games: [ { id: 8, home: 'columbus-ball-hawgs', away: 'dayton-eagles', time: '7:00 PM', location: 'Columbus' } ] },
            ]) {
                const scheduleGame = day.games.find(g => g.id === game.id);
                if (scheduleGame) {
                    gameDate = day.date;
                    break;
                }
            }
            return {...game, gameDate, type: 'game', itemType: 'game'};
        });
        
        const upcomingEvents = teams.flatMap(team => 
            (team.calendar || [])
                .filter(event => new Date(event.date) >= new Date()) // Only upcoming events
                .slice(0, 3) // Limit per team
                .map(event => ({
                    ...event,
                    teamName: team.name,
                    teamLogo: team.logo,
                    teamId: team.id,
                    itemType: 'event',
                    status: 'Scheduled' // Add scheduled status for upcoming events
                }))
        ).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5); // Show next 5 events

        return [...gamesWithDates, ...upcomingEvents];
    }, [gameTickerData, teams]);

    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement) return;

        let animationFrameId;

        const scroll = () => {
            if (!isHovering) {
                tickerElement.scrollLeft += 1; // Scroll right to left
                if (tickerElement.scrollLeft >= tickerElement.scrollWidth / 2) {
                    tickerElement.scrollLeft = 0;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };
        
        animationFrameId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovering]);
    
    return (
        <div 
            className="text-white py-2 overflow-hidden shadow-lg"
            style={{ backgroundColor: websiteStyle?.tickerColor || '#1e293b' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div ref={tickerRef} className="flex space-x-6 overflow-x-auto no-scrollbar">
                {[...allItems, ...allItems].map((item, index) => {
                    if (item.itemType === 'game') {
                        const home = getTeam(item.homeTeam);
                        const away = getTeam(item.awayTeam);
                        if (!home || !away) return null;
                        
                        return (
                            <div key={`game-${index}`} className="flex-shrink-0 w-72 rounded-lg p-2 border" style={{ 
                                backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                borderColor: websiteStyle?.tickerBorderColor || '#475569'
                            }}>
                                <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                    <span>{item.location}</span>
                                    <span className="font-bold text-xs text-red-400">GAME</span>
                                </div>
                                <div className="space-y-1 mb-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <button onClick={() => onTeamClick(home.id)} className="flex items-center gap-2 hover:opacity-80">
                                            <img src={home.logo} alt={home.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                            <span className="font-medium text-white">{home.name}</span>
                                        </button>
                                        <span className="font-bold text-lg text-white">{item.homeScore ?? '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <button onClick={() => onTeamClick(away.id)} className="flex items-center gap-2 hover:opacity-80">
                                            <img src={away.logo} alt={away.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                            <span className="font-medium text-white">{away.name}</span>
                                        </button>
                                        <span className="font-bold text-lg text-white">{item.awayScore ?? '-'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {item.gameDate ? new Date(item.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                                    </span>
                                    <span className="font-bold text-green-400 tracking-wider">{item.status}</span>
                                </div>
                            </div>
                        );
                    } else {
                        // Event item
                        return (
                            <div key={`event-${index}`} className="flex-shrink-0 w-72 rounded-lg p-2 border" style={{ 
                                backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                borderColor: websiteStyle?.tickerBorderColor || '#475569'
                            }}>
                                <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                    <span>{item.location || 'TBA'}</span>
                                    <span className="font-bold text-xs text-blue-400">EVENT</span>
                                </div>
                                <div className="space-y-1 mb-2">
                                    <button onClick={() => onTeamClick(item.teamId)} className="flex items-center gap-2 hover:opacity-80 w-full">
                                        <img src={item.teamLogo} alt={item.teamName} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                        <span className="font-medium text-white text-left">{item.teamName}</span>
                                    </button>
                                    <div className="text-sm text-white font-semibold">{item.title}</div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} • {item.time}
                                    </span>
                                    <span className="font-bold tracking-wider text-orange-400">
                                        {item.status || 'SCHEDULED'}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md text-center ${color}`}>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
);

const PlayerCard = ({ player, teamStyle, onClick }) => (
    <div
        className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 border-4 cursor-pointer"
        style={{ borderColor: teamStyle?.primaryColor || '#cccccc' }}
        onClick={onClick}
        title="Click for player details"
    >
        <div className="relative h-48 overflow-hidden">
            <img 
                src={player.photo || `https://ui-avatars.com/api/?name=${player.firstName}+${player.lastName}&background=random`} 
                alt={`${player.firstName} ${player.lastName}`}
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{player.firstName} {player.lastName}</h3>
                <p className="text-white text-sm">#{player.number}</p>
            </div>
        </div>
        <div className="p-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-600">
                    {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                </span>
                {player.roles && player.roles.includes('coach') && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">COACH</span>
                )}
            </div>
            {player.nickname && (
                <p className="text-slate-500 text-sm">"{player.nickname}"</p>
            )}
        </div>
    </div>
);

// Player Card Modal Component
const PlayerCardModal = ({ player, teamStyle, teams, isOpen, onClose }) => {
    if (!isOpen || !player) return null;

    // Get the primary team for logo display
    const primaryTeam = teams?.find(t => player.teams && player.teams.includes(t.id));

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full transform transition-all overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                    <X className="h-5 w-5 text-slate-600" />
                </button>

                {/* Large Player Photo Section - Match typical portrait proportions */}
                <div className="relative h-96 overflow-hidden bg-gradient-to-b from-slate-200 to-slate-300">
                    <img 
                        src={player.photo || `https://ui-avatars.com/api/?name=${player.firstName}+${player.lastName}&background=random&size=600`} 
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-full h-full object-contain"
                    />
                    
                    {/* Team logo circle overlay */}
                    {primaryTeam && (
                        <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <img 
                                src={primaryTeam.logo} 
                                alt={primaryTeam.name}
                                className="w-12 h-12 rounded-full object-contain"
                            />
                        </div>
                    )}

                    {/* Coach badge */}
                    {player.roles && player.roles.includes('coach') && (
                        <div className="absolute top-4 right-20 bg-yellow-500 px-3 py-1 rounded-full text-sm font-bold text-black shadow-lg">
                            COACH
                        </div>
                    )}
                </div>

                {/* Player details section */}
                <div className="p-6 relative">
                    {/* Player name, nickname, and position */}
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">{player.firstName} {player.lastName}</h2>
                        {player.nickname && (
                            <p className="text-xl text-slate-600 mb-2">"{player.nickname}"</p>
                        )}
                        <p className="text-lg text-slate-500">
                            {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                        </p>
                        {/* Handedness field for future use */}
                        {player.handedness && (
                            <p className="text-sm text-slate-400 mt-1">
                                {player.handedness} Handed
                            </p>
                        )}
                    </div>

                    {/* Teams */}
                    {player.teams && player.teams.length > 1 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-slate-800 mb-2 text-center">Teams</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {player.teams.map(teamId => {
                                    const team = teams?.find(t => t.id === teamId);
                                    return team ? (
                                        <span 
                                            key={teamId}
                                            className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center"
                                        >
                                            <img 
                                                src={team.logo} 
                                                alt={team.name}
                                                className="w-4 h-4 rounded-full object-contain mr-2"
                                            />
                                            {team.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

                    {/* Jersey number - bottom right corner */}
                    <div className="absolute bottom-4 right-4">
                        <div 
                            className="text-slate-300 text-5xl font-bold opacity-50"
                        >
                            #{player.number}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ContactCard = ({ entity }) => {
    const [messageSent, setMessageSent] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`Message sent to ${entity.name}`);
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 3000);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact {entity.name}</h2>
            {messageSent ? (
                <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">Message Sent!</div>
            ) : (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Your Name" className="w-full p-2 border rounded" required />
                    <input type="email" placeholder="Your Email" className="w-full p-2 border rounded" required />
                    <textarea placeholder="Your Message" rows="4" className="w-full p-2 border rounded" required></textarea>
                    <button type="submit" className="w-full bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Send Message</button>
                </form>
            )}
        </div>
    );
};

const SocialCard = ({ entity }) => {
    const [activeTab, setActiveTab] = useState('links');

    const getEmbedUrl = (url, platform) => {
        if (!url || url === '#') return null;
        
        try {
            if (platform === 'twitter') {
                // Extract Twitter username from URL
                const match = url.match(/twitter\.com\/([^/?]+)/);
                if (match) {
                    const username = match[1];
                    return `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}?dnt=false&embedId=twitter-widget-0&frame=false&hideBorder=false&hideFooter=false&hideHeader=false&hideScrollBar=false&lang=en&maxHeight=400px&origin=${window.location.origin}&sessionId=&theme=light&widgetsVersion=82e1070%3A1619632193066&width=340px`;
                }
            } else if (platform === 'instagram') {
                // For Instagram, we'll show a link since embedding requires approval
                return null;
            } else if (platform === 'facebook') {
                // For Facebook, we'll use the page plugin
                const match = url.match(/facebook\.com\/([^/?]+)/);
                if (match) {
                    const pageId = match[1];
                    return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=340&height=400&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`;
                }
            }
        } catch (error) {
            console.error('Error generating embed URL:', error);
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Follow Us</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 border-b">
                <button 
                    onClick={() => setActiveTab('links')}
                    className={`pb-2 px-1 ${activeTab === 'links' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    Quick Links
                </button>
                <button 
                    onClick={() => setActiveTab('feeds')}
                    className={`pb-2 px-1 ${activeTab === 'feeds' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    Live Feeds
                </button>
            </div>

            {activeTab === 'links' && (
                <div className="text-center">
                    <div className="flex space-x-6 justify-center mb-6">
                        <a href={entity.social.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                            <Twitter size={32} />
                            <div className="text-xs mt-1">Twitter</div>
                        </a>
                        <a href={entity.social.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition-colors">
                            <Instagram size={32} />
                            <div className="text-xs mt-1">Instagram</div>
                        </a>
                        <a href={entity.social.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">
                            <Facebook size={32} />
                            <div className="text-xs mt-1">Facebook</div>
                        </a>
                    </div>
                    <p className="text-sm text-slate-600">Click the icons above to visit our social media pages</p>
                </div>
            )}

            {activeTab === 'feeds' && (
                <div className="space-y-6">
                    {/* Twitter Embed */}
                    {entity.social.twitter && entity.social.twitter !== '#' && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                                <Twitter className="mr-2 text-blue-400" size={18} />
                                Twitter Feed
                            </h4>
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-600">
                                <p className="mb-2">Live Twitter feed</p>
                                <a 
                                    href={entity.social.twitter} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 underline"
                                >
                                    View our latest tweets →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Facebook Embed */}
                    {entity.social.facebook && entity.social.facebook !== '#' && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                                <Facebook className="mr-2 text-blue-600" size={18} />
                                Facebook Page
                            </h4>
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-600">
                                <p className="mb-2">Latest Facebook posts</p>
                                <a 
                                    href={entity.social.facebook} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 underline"
                                >
                                    Visit our Facebook page →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Instagram */}
                    {entity.social.instagram && entity.social.instagram !== '#' && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                                <Instagram className="mr-2 text-pink-500" size={18} />
                                Instagram Photos
                            </h4>
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-600">
                                <p className="mb-2">Latest Instagram photos</p>
                                <a 
                                    href={entity.social.instagram} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-pink-500 hover:text-pink-700 underline"
                                >
                                    View our Instagram →
                                </a>
                            </div>
                        </div>
                    )}

                    {(!entity.social.twitter || entity.social.twitter === '#') && 
                     (!entity.social.facebook || entity.social.facebook === '#') && 
                     (!entity.social.instagram || entity.social.instagram === '#') && (
                        <div className="text-center py-8 text-slate-500">
                            <p>No social media accounts configured yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Page Components ---
const NewHomePage = ({teams, onTeamClick, leagueInfo, currentUser, websiteStyle, setCurrentUser}) => {
    const sortedTeams = teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name));
    const isLeagueAdmin = currentUser && currentUser.roles.includes('admin');
    
    // State for editing modes
    const [editingNews, setEditingNews] = useState(false);
    const [editingPhotos, setEditingPhotos] = useState(false);
    const [editingVideos, setEditingVideos] = useState(false);
    const [editingNewsItem, setEditingNewsItem] = useState(null);
    const [selectedNewsItem, setSelectedNewsItem] = useState(null);
    const [showingMedia, setShowingMedia] = useState(false); // For inline media display
    
    // Mock news data - enhanced with multimedia support
    const [newsItems, setNewsItems] = useState([
        { 
            id: 1, 
            type: 'text',
            heading: "American Dads Championship Victory",
            text: "🏆 American Dads win Dayton Classic Tournament!", 
            comments: "Outstanding performance in the finals with a 12-9 victory over the defending champions.",
            date: "2025-08-10"
        },
        { 
            id: 2, 
            type: 'image',
            heading: "Championship Celebration",
            text: "📸 Championship celebration photos!", 
            imageUrl: "https://placehold.co/400x300/dc2626/FFFFFF?text=Championship+Photos",
            comments: "Amazing shots from the post-game celebration and trophy ceremony.",
            date: "2025-08-05"
        },
        { 
            id: 3, 
            type: 'text',
            heading: "OH10 Reaches Finals",
            text: "🥍 OH10 Lacrosse advances to championship finals", 
            comments: "After a thrilling semi-final match, OH10 secures their spot in the championship game.",
            date: "2025-08-03"
        },
        { 
            id: 4, 
            type: 'video',
            heading: "Game Highlights Available",
            text: "🎥 Game highlights now available!", 
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumbnailUrl: "https://placehold.co/400x300/f59e0b/FFFFFF?text=Video+Highlights",
            comments: "Check out the best plays and goals from this weekend's games.",
            date: "2025-08-01"
        }
    ]);
    
    // Mock picture/video content - will be made editable by admin
    const [mediaContent, setMediaContent] = useState({
        pictures: [
            { id: 1, title: "Championship Games", image: "https://placehold.co/400x250/dc2626/FFFFFF?text=Championship+Games", description: "The most exciting moments from our championship tournaments." },
            { id: 2, title: "Team Action Shots", image: "https://placehold.co/400x250/1d4ed8/FFFFFF?text=Action+Shots", description: "Dynamic gameplay photography showcasing player intensity." },
            { id: 3, title: "League Events", image: "https://placehold.co/400x250/047857/FFFFFF?text=League+Events", description: "Awards ceremonies and community gatherings." }
        ],
        videos: [
            { id: 1, title: "Season Highlights", thumbnail: "https://placehold.co/400x250/f59e0b/FFFFFF?text=Season+Highlights", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Best moments from the current season." },
            { id: 2, title: "Training Sessions", thumbnail: "https://placehold.co/400x250/be185d/FFFFFF?text=Training+Sessions", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Behind-the-scenes training footage." }
        ]
    });

    // News editing functions
    const handleAddNews = () => {
        const newItem = {
            id: Date.now(),
            type: 'text',
            text: "New announcement - edit this text",
            date: new Date().toISOString().split('T')[0]
        };
        setNewsItems(prev => [...prev, newItem]);
        setEditingNewsItem(newItem);
    };

    const handleSaveNews = (newsId, updatedItem) => {
        setNewsItems(prev => prev.map(item => 
            item.id === newsId ? { ...item, ...updatedItem } : item
        ));
        setEditingNewsItem(null);
    };

    const handleDeleteNews = (newsId) => {
        setNewsItems(prev => prev.filter(item => item.id !== newsId));
    };
    
    return (
        <div className="min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            {/* Enhanced Vertical Scrolling News Feed - Extra Tall & Clean */}
            <div className="bg-red-800 text-white py-2 relative">
                <div className="flex items-start px-4 max-w-3xl mx-auto">
                    <span className="bg-white text-red-800 px-4 py-3 rounded text-sm font-bold mr-6 flex-shrink-0">NEWS</span>
                    
                    {/* Vertical scrolling container - Extra tall with minimal red space */}
                    <div className="flex-grow overflow-hidden relative max-w-xl" style={{ height: '280px' }}>
                        <div className="animate-scroll-vertical absolute w-full">
                            {/* Create a continuous loop by duplicating news items */}
                            {[...newsItems, ...newsItems].map((item, index) => (
                                <div 
                                    key={`${item.id}-${index}`} 
                                    className="flex items-center py-6 cursor-pointer hover:bg-red-700 hover:bg-opacity-50 rounded px-4 transition-colors"
                                    style={{ height: '280px' }}
                                    onClick={() => setSelectedNewsItem(item)}
                                >
                                    {item.type === 'image' && item.imageUrl && (
                                        <img 
                                            src={item.imageUrl} 
                                            alt="News"
                                            className="w-40 h-32 rounded mr-5 object-cover flex-shrink-0 shadow-sm"
                                        />
                                    )}
                                    {item.type === 'video' && item.thumbnailUrl && (
                                        <div className="relative mr-5 flex-shrink-0">
                                            <img 
                                                src={item.thumbnailUrl} 
                                                alt="Video"
                                                className="w-40 h-32 rounded object-cover shadow-sm"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                    <div className="w-0 h-0 border-l-6 border-l-red-600 border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-grow min-w-0">
                                        <div className="text-white font-semibold text-2xl truncate leading-tight">{item.heading || item.text}</div>
                                        {item.comments && (
                                            <div className="text-red-100 text-xl truncate mt-3 leading-relaxed">{item.comments}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Controls - Positioned outside ticker for better visibility */}
            {currentUser && (
                <div className="bg-slate-700 text-white px-4 py-2 text-center">
                    <span className="text-sm">Logged in as: <strong>{currentUser.name}</strong> ({currentUser.roles.join(', ')})</span>
                </div>
            )}
            
            {isLeagueAdmin && (
                <div className="bg-blue-800 text-white px-4 py-3 flex items-center justify-center">
                    <button 
                        onClick={() => setEditingNews(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950 flex items-center"
                        title="Edit news ticker"
                    >
                        <Edit className="mr-2 h-4 w-4"/> Edit News Ticker
                    </button>
                    <span className="mx-4 text-blue-200">|</span>
                    <button 
                        onClick={() => setEditingPhotos(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950 flex items-center"
                        title="Edit photo gallery"
                    >
                        <Edit className="mr-2 h-4 w-4"/> Edit Photos
                    </button>
                    <span className="mx-4 text-blue-200">|</span>
                    <button 
                        onClick={() => setEditingVideos(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950 flex items-center"
                        title="Edit video gallery"
                    >
                        <Edit className="mr-2 h-4 w-4"/> Edit Videos
                    </button>
                </div>
            )}

            {/* News Editing Modal */}
            {editingNews && isLeagueAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setEditingNews(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit News Ticker</h3>
                            <button 
                                onClick={() => setEditingNews(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                            {newsItems.map(item => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded">
                                    {editingNewsItem?.id === item.id ? (
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <select 
                                                    defaultValue={item.type}
                                                    className="p-2 border rounded"
                                                    onChange={(e) => {
                                                        setEditingNewsItem(prev => ({...prev, type: e.target.value}));
                                                    }}
                                                >
                                                    <option value="text">📝 Text Only</option>
                                                    <option value="image">🖼️ Image + Text</option>
                                                    <option value="video">🎥 Video + Text</option>
                                                </select>
                                                
                                                <input 
                                                    type="text"
                                                    defaultValue={item.text}
                                                    placeholder="News text"
                                                    className="p-2 border rounded md:col-span-2"
                                                    onChange={(e) => {
                                                        setEditingNewsItem(prev => ({...prev, text: e.target.value}));
                                                    }}
                                                />
                                            </div>
                                            
                                            {editingNewsItem?.type === 'image' && (
                                                <FileUploadInput
                                                    label="News Image"
                                                    accept="image/*"
                                                    currentValue={editingNewsItem.imageUrl || ''}
                                                    onChange={(url) => {
                                                        setEditingNewsItem(prev => ({...prev, imageUrl: url}));
                                                    }}
                                                    placeholder="Upload image or paste URL"
                                                />
                                            )}
                                            
                                            {editingNewsItem?.type === 'video' && (
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block font-semibold text-slate-700 mb-1">Video URL (YouTube, etc.)</label>
                                                        <input 
                                                            type="url"
                                                            defaultValue={editingNewsItem.videoUrl || ''}
                                                            placeholder="https://www.youtube.com/watch?v=..."
                                                            className="w-full p-2 border rounded"
                                                            onChange={(e) => {
                                                                setEditingNewsItem(prev => ({...prev, videoUrl: e.target.value}));
                                                            }}
                                                        />
                                                    </div>
                                                    <FileUploadInput
                                                        label="Video Thumbnail"
                                                        accept="image/*"
                                                        currentValue={editingNewsItem.thumbnailUrl || ''}
                                                        onChange={(url) => {
                                                            setEditingNewsItem(prev => ({...prev, thumbnailUrl: url}));
                                                        }}
                                                        placeholder="Upload thumbnail image"
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleSaveNews(item.id, editingNewsItem)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={() => setEditingNewsItem(null)}
                                                    className="bg-slate-500 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2 flex-grow">
                                                {item.type === 'image' && item.imageUrl && (
                                                    <img src={item.imageUrl} alt="News" className="w-8 h-6 rounded object-cover"/>
                                                )}
                                                {item.type === 'video' && item.thumbnailUrl && (
                                                    <div className="relative">
                                                        <img src={item.thumbnailUrl} alt="Video" className="w-8 h-6 rounded object-cover"/>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="flex-grow font-semibold">{item.text}</span>
                                                    <span className="text-xs text-slate-500 ml-2">({item.type})</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => setEditingNewsItem(item)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteNews(item.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleAddNews}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add News Item
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-8">
                {/* Teams of MLBL Section */}
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-slate-800 mb-2 tracking-tight">{leagueInfo.name || "Men's Lacrosse Beer League"}</h1>
                        <h2 className="text-3xl font-bold text-slate-600 mb-6 tracking-tight">Our Teams</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => onTeamClick(team.id)}
                                className="group bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative overflow-hidden"
                                style={{
                                    backgroundColor: team.style?.backgroundColor || '#ffffff',
                                    borderLeft: `6px solid ${team.style?.primaryColor || '#dc2626'}`
                                }}
                            >
                                {/* Team Logo - Full Rectangle */}
                                <div className="h-32 mb-4 rounded-lg overflow-hidden relative" style={{
                                    backgroundColor: team.style?.primaryColor || '#dc2626',
                                    backgroundImage: `linear-gradient(45deg, ${team.style?.primaryColor || '#dc2626'} 0%, ${team.style?.backgroundColor || '#ffffff'} 100%)`
                                }}>
                                    <img 
                                        src={team.logo} 
                                        alt={team.name} 
                                        className={`w-full h-full group-hover:scale-110 transition-transform ${getLogoStyle(websiteStyle)} opacity-90`}
                                    />
                                    {/* Overlay for better contrast */}
                                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                                </div>
                                
                                {/* Team Name and Division */}
                                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-opacity-80 transition-all text-center">
                                    {team.name}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 text-center flex items-center justify-center">
                                    {team.division === 'Field' ? (
                                        <><Trophy size={14} className="mr-1" /> Field Lacrosse</>
                                    ) : (
                                        <><Shield size={14} className="mr-1" /> Box Lacrosse</>
                                    )}
                                </p>
                                
                                {/* W/L Record - Labels above numbers */}
                                <div className="flex justify-center space-x-6 mb-4">
                                    <div className="text-center">
                                        <div className="text-xs font-semibold text-slate-500 mb-1">W</div>
                                        <div className="text-2xl font-bold text-green-600">{team.wins}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-semibold text-slate-500 mb-1">L</div>
                                        <div className="text-2xl font-bold text-red-600">{team.losses}</div>
                                    </div>
                                </div>
                                
                                {/* Hover Action */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div 
                                        className="text-sm font-semibold text-center py-2 rounded-lg"
                                        style={{ 
                                            backgroundColor: team.style?.primaryColor || '#dc2626',
                                            color: 'white'
                                        }}
                                    >
                                        View Team →
                                    </div>
                                </div>
                                
                                {/* Decorative gradient overlay */}
                                <div 
                                    className="absolute top-0 right-0 w-16 h-16 opacity-10"
                                    style={{
                                        background: `linear-gradient(135deg, ${team.style?.primaryColor || '#dc2626'} 0%, transparent 70%)`
                                    }}
                                ></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Picture and Video Windows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Picture Window */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Photo Gallery</h3>
                            {isLeagueAdmin && (
                                <button 
                                    onClick={() => setEditingPhotos(true)}
                                    className="bg-red-800 text-white px-3 py-2 rounded text-sm hover:bg-red-900 flex items-center"
                                    title="Edit photos"
                                >
                                    <Edit className="mr-1 h-4 w-4"/> Edit Photos
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {mediaContent.pictures.map(picture => (
                                <div key={picture.id} 
                                     onClick={() => {
                                         // Open a simple image viewer or placeholder
                                         window.open(picture.image, '_blank');
                                     }}
                                     className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <img 
                                            src={picture.image} 
                                            alt={picture.title}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                        <div className="flex-grow">
                                            <h4 className="font-semibold text-slate-800">{picture.title}</h4>
                                            <p className="text-sm text-slate-600">{picture.description}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(picture.image, '_blank');
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                        >
                                            View →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Video Window */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Video Gallery</h3>
                            {isLeagueAdmin && (
                                <button 
                                    onClick={() => setEditingVideos(true)}
                                    className="bg-red-800 text-white px-3 py-2 rounded text-sm hover:bg-red-900 flex items-center"
                                    title="Edit videos"
                                >
                                    <Edit className="mr-1 h-4 w-4"/> Edit Videos
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {mediaContent.videos.map(video => (
                                <div key={video.id} 
                                     onClick={() => {
                                         window.open(video.url, '_blank');
                                     }}
                                     className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <img 
                                                src={video.thumbnail} 
                                                alt={video.title}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <div className="w-0 h-0 border-l-4 border-l-red-600 border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-semibold text-slate-800">{video.title}</h4>
                                            <p className="text-sm text-slate-600">{video.description}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(video.url, '_blank');
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                        >
                                            Watch →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Admin Quick Access */}
                {isLeagueAdmin && (
                    <div className="text-center">
                        <button 
                            onClick={() => window.location.hash = 'admin-portal'}
                            className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 flex items-center mx-auto"
                        >
                            <Settings className="mr-2 h-5 w-5"/> League Management
                        </button>
                    </div>
                )}

            {/* Photo Editing Modal */}
            {editingPhotos && isLeagueAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setEditingPhotos(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Photo Gallery</h3>
                            <button 
                                onClick={() => setEditingPhotos(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                            {mediaContent.pictures.map(picture => (
                                <div key={picture.id} className="bg-slate-50 p-4 rounded border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <img src={picture.image} alt={picture.title} className="w-full h-32 object-cover rounded"/>
                                        </div>
                                        <div className="space-y-2">
                                            <input 
                                                type="text"
                                                defaultValue={picture.title}
                                                placeholder="Photo title"
                                                className="w-full p-2 border rounded"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.map(p => 
                                                            p.id === picture.id ? {...p, title: e.target.value} : p
                                                        )
                                                    }));
                                                }}
                                            />
                                            <FileUploadInput
                                                label="Photo Image"
                                                accept="image/*"
                                                currentValue={picture.image}
                                                onChange={(url) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.map(p => 
                                                            p.id === picture.id ? {...p, image: url} : p
                                                        )
                                                    }));
                                                }}
                                                placeholder="Upload photo or paste URL"
                                            />
                                            <textarea 
                                                defaultValue={picture.description}
                                                placeholder="Photo description"
                                                className="w-full p-2 border rounded h-20"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.map(p => 
                                                            p.id === picture.id ? {...p, description: e.target.value} : p
                                                        )
                                                    }));
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.filter(p => p.id !== picture.id)
                                                    }));
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Delete Photo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => {
                                const newPhoto = {
                                    id: Date.now(),
                                    title: "New Photo",
                                    image: "https://placehold.co/400x250/94a3b8/FFFFFF?text=New+Photo",
                                    description: "Add description here"
                                };
                                setMediaContent(prev => ({
                                    ...prev,
                                    pictures: [...prev.pictures, newPhoto]
                                }));
                            }}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add Photo
                        </button>
                    </div>
                </div>
            )}

            {/* Video Editing Modal */}
            {editingVideos && isLeagueAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setEditingVideos(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Video Gallery</h3>
                            <button 
                                onClick={() => setEditingVideos(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                            {mediaContent.videos.map(video => (
                                <div key={video.id} className="bg-slate-50 p-4 rounded border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <img src={video.thumbnail} alt={video.title} className="w-full h-32 object-cover rounded"/>
                                        </div>
                                        <div className="space-y-2">
                                            <input 
                                                type="text"
                                                defaultValue={video.title}
                                                placeholder="Video title"
                                                className="w-full p-2 border rounded"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.map(v => 
                                                            v.id === video.id ? {...v, title: e.target.value} : v
                                                        )
                                                    }));
                                                }}
                                            />
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1">Video URL</label>
                                                <input 
                                                    type="url"
                                                    defaultValue={video.url}
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    className="w-full p-2 border rounded"
                                                    onChange={(e) => {
                                                        setMediaContent(prev => ({
                                                            ...prev,
                                                            videos: prev.videos.map(v => 
                                                                v.id === video.id ? {...v, url: e.target.value} : v
                                                            )
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <FileUploadInput
                                                label="Video Thumbnail"
                                                accept="image/*"
                                                currentValue={video.thumbnail}
                                                onChange={(url) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.map(v => 
                                                            v.id === video.id ? {...v, thumbnail: url} : v
                                                        )
                                                    }));
                                                }}
                                                placeholder="Upload thumbnail image"
                                            />
                                            <textarea 
                                                defaultValue={video.description}
                                                placeholder="Video description"
                                                className="w-full p-2 border rounded h-20"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.map(v => 
                                                            v.id === video.id ? {...v, description: e.target.value} : v
                                                        )
                                                    }));
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.filter(v => v.id !== video.id)
                                                    }));
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Delete Video
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => {
                                const newVideo = {
                                    id: Date.now(),
                                    title: "New Video",
                                    thumbnail: "https://placehold.co/400x250/be185d/FFFFFF?text=New+Video",
                                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                                    description: "Add description here"
                                };
                                setMediaContent(prev => ({
                                    ...prev,
                                    videos: [...prev.videos, newVideo]
                                }));
                            }}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add Video
                        </button>
                    </div>
                </div>
            )}

            {/* News Item Popup Modal */}
            {selectedNewsItem && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => {
                        setSelectedNewsItem(null);
                        setShowingMedia(false);
                    }}
                >
                    <div 
                        className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {selectedNewsItem.heading || selectedNewsItem.text}
                                </h2>
                                <button 
                                    onClick={() => {
                                        setSelectedNewsItem(null);
                                        setShowingMedia(false);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 p-2"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>
                            
                            {/* Full size image */}
                            {selectedNewsItem.type === 'image' && selectedNewsItem.imageUrl && (
                                <div className="mb-4">
                                    <div className="relative group">
                                        <img 
                                            src={selectedNewsItem.imageUrl} 
                                            alt="News"
                                            className="w-full rounded-lg object-cover max-h-[400px] cursor-pointer transition-transform hover:scale-[1.02]"
                                            onClick={() => setShowingMedia(!showingMedia)}
                                        />
                                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                            Click to {showingMedia ? 'shrink' : 'enlarge'}
                                        </div>
                                    </div>
                                    
                                    {/* Full screen image view */}
                                    {showingMedia && (
                                        <div 
                                            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
                                            onClick={() => setShowingMedia(false)}
                                        >
                                            <div className="relative max-w-[90vw] max-h-[90vh]">
                                                <img 
                                                    src={selectedNewsItem.imageUrl} 
                                                    alt="News Full Size"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                <button
                                                    onClick={() => setShowingMedia(false)}
                                                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                                                >
                                                    <X size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* Inline video player */}
                            {selectedNewsItem.type === 'video' && selectedNewsItem.videoUrl && (
                                <div className="mb-4">
                                    {!showingMedia ? (
                                        // Video thumbnail with play button
                                        <div className="relative">
                                            {selectedNewsItem.thumbnailUrl && (
                                                <img 
                                                    src={selectedNewsItem.thumbnailUrl} 
                                                    alt="Video thumbnail"
                                                    className="w-full rounded-lg object-cover max-h-[400px]"
                                                />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <button
                                                    onClick={() => setShowingMedia(true)}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors shadow-lg"
                                                >
                                                    <Play size={20} />
                                                    <span>Play Video</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Inline video player
                                        <div className="relative">
                                            <div className="bg-slate-100 rounded-lg p-4 text-center">
                                                {selectedNewsItem.videoUrl.includes('youtube.com') || selectedNewsItem.videoUrl.includes('youtu.be') ? (
                                                    // YouTube embed
                                                    <div className="aspect-video">
                                                        <iframe
                                                            className="w-full h-full rounded-lg"
                                                            src={`https://www.youtube.com/embed/${selectedNewsItem.videoUrl.split('v=')[1]?.split('&')[0] || selectedNewsItem.videoUrl.split('/').pop()}`}
                                                            title="YouTube video"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                ) : (
                                                    // Generic video player
                                                    <div className="aspect-video">
                                                        <video 
                                                            className="w-full h-full rounded-lg"
                                                            controls
                                                            src={selectedNewsItem.videoUrl}
                                                        >
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setShowingMedia(false)}
                                                className="mt-2 text-slate-500 hover:text-slate-700 flex items-center space-x-1"
                                            >
                                                <Eye size={16} />
                                                <span>Show thumbnail</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* News content */}
                            <div className="space-y-3">
                                <div className="text-lg text-slate-700">
                                    {selectedNewsItem.text}
                                </div>
                                
                                {selectedNewsItem.comments && (
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-slate-800 mb-2">Details</h3>
                                        <p className="text-slate-700">{selectedNewsItem.comments}</p>
                                    </div>
                                )}
                                
                                <div className="text-sm text-slate-500">
                                    Published: {new Date(selectedNewsItem.date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

const HomePage = ({teams, onTeamClick, leagueInfo, websiteStyle}) => {
    const sortedTeams = teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name));
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            {/* Hero Section */}
            <div className="text-center mb-12">
                <h1 className="text-6xl font-bold text-slate-800 mb-4 tracking-tight">{leagueInfo.name}</h1>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    {leagueInfo.description || "Welcome to the premier lacrosse league featuring competitive teams from across the region. Experience the excitement, skill, and camaraderie that makes our league special."}
                </p>
            </div>

            {/* Photo Albums Section */}
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-slate-800 mb-8 text-center tracking-tight">League Photo Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <img src="https://placehold.co/400x250/dc2626/FFFFFF?text=Championship+Games" alt="Championship" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Championship Games</h3>
                            <p className="text-slate-600">The most exciting moments from our championship tournaments and playoff games.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <img src="https://placehold.co/400x250/1d4ed8/FFFFFF?text=Team+Action+Shots" alt="Action" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Action Shots</h3>
                            <p className="text-slate-600">Dynamic gameplay photography showcasing the intensity and skill of our players.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <img src="https://placehold.co/400x250/047857/FFFFFF?text=League+Events" alt="Events" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">League Events</h3>
                            <p className="text-slate-600">Behind-the-scenes moments, awards ceremonies, and community gatherings.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Grid */}
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-slate-800 mb-8 text-center tracking-tight">Our Teams</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sortedTeams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => onTeamClick(team.id)}
                            className="group bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform transition-all duration-300 hover:scale-105 text-center"
                        >
                            <div className="relative mb-4">
                                <img 
                                    src={team.logo} 
                                    alt={team.name} 
                                    className="w-20 h-20 mx-auto rounded-full bg-slate-200 p-2 group-hover:scale-110 transition-transform"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-red-700 transition-colors">
                                {team.name}
                            </h3>
                            <div className="flex justify-center space-x-4 text-sm">
                                <div className="text-center">
                                    <div className="font-bold text-green-600">{team.wins}</div>
                                    <div className="text-slate-500">Wins</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-red-600">{team.losses}</div>
                                    <div className="text-slate-500">Losses</div>
                                </div>
                            </div>
                            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-sm text-red-600 font-semibold">View Team →</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* About Section */}
            <div className="bg-slate-50 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">About Our League</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="text-4xl font-bold text-red-600 mb-2">{teams.filter(t => t.active).length}</div>
                        <div className="text-slate-600">Active Teams</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-red-600 mb-2">{leagueInfo.founded || "2020"}</div>
                        <div className="text-slate-600">Founded</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-red-600 mb-2">{leagueInfo.location || "Ohio Valley"}</div>
                        <div className="text-slate-600">Region</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventsPage = ({teams, leagueSchedule, onTeamClick, currentUser, websiteStyle}) => {
    const [selectedTeamSchedule, setSelectedTeamSchedule] = useState('all');
    const getTeam = (id) => teams.find(t => t.id === id);
    const isAdmin = currentUser && currentUser.roles.includes('admin');
    
    // Get all calendar events from all teams
    const allEvents = teams.flatMap(team => 
        (team.calendar || []).map(event => ({
            ...event,
            teamName: team.name,
            teamLogo: team.logo,
            teamId: team.id
        }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter events
    const filteredEvents = selectedTeamSchedule === 'all' 
        ? allEvents 
        : allEvents.filter(event => event.teamId === selectedTeamSchedule);
    
    // Group tournament events by title, date, and location
    const groupedEvents = filteredEvents.reduce((groups, event) => {
        if (event.type === 'tournament') {
            const key = `${event.title}-${event.date}-${event.location}`;
            if (!groups[key]) {
                groups[key] = {
                    ...event,
                    teams: [],
                    teamIds: []
                };
            }
            groups[key].teams.push({ name: event.teamName, logo: event.teamLogo, id: event.teamId });
            groups[key].teamIds.push(event.teamId);
        }
        return groups;
    }, {});

    // Create display events (individual events + tournament summaries)
    const displayEvents = [];
    const processedTournamentKeys = new Set();

    filteredEvents.forEach(event => {
        if (event.type === 'tournament') {
            const key = `${event.title}-${event.date}-${event.location}`;
            if (!processedTournamentKeys.has(key)) {
                displayEvents.push(groupedEvents[key]);
                processedTournamentKeys.add(key);
            }
        } else {
            displayEvents.push(event);
        }
    });

    // Filter schedule
    const filteredSchedule = leagueSchedule.map(day => {
        if (selectedTeamSchedule === 'all') return day;
        const games = day.games.filter(g => g.home === selectedTeamSchedule || g.away === selectedTeamSchedule);
        return { ...day, games };
    }).filter(day => day.games.length > 0);
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">League Events & Schedule</h1>
                {isAdmin && (
                    <button 
                        onClick={() => window.location.hash = 'admin-portal'}
                        className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center text-sm"
                        title="Quick access to calendar management"
                    >
                        <Plus className="mr-2 h-4 w-4"/> Add League Event
                    </button>
                )}
            </div>
            
            <div className="mb-6">
                <select onChange={(e) => setSelectedTeamSchedule(e.target.value)} value={selectedTeamSchedule} className="p-3 border border-slate-300 rounded-md shadow-sm">
                    <option value="all">All Teams</option>
                    {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Events */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Calendar className="mr-2" size={24} />
                        Upcoming Events
                    </h2>
                    <div className="space-y-4">
                        {displayEvents.length > 0 ? displayEvents.slice(0, 10).map(event => {
                            if (event.teams) {
                                // Tournament summary card
                                return (
                                    <div key={`tournament-${event.title}-${event.date}`} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Trophy className="text-yellow-600" size={18} />
                                                    <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                                                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                                    <span>{event.time}</span>
                                                    {event.location && (
                                                        <ClickableLocation 
                                                            locationName={event.location}
                                                            teams={teams}
                                                        />
                                                    )}
                                                </div>
                                                {event.imageUrl && (
                                                    <img src={event.imageUrl} alt="Tournament" className="w-full h-32 object-cover rounded-lg mb-3" />
                                                )}
                                                <div className="mb-2">
                                                    <span className="text-sm font-semibold text-slate-700">Participating Teams ({event.teams.length}):</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {event.teams.sort((a, b) => a.name.localeCompare(b.name)).map((team, index) => (
                                                        <button
                                                            key={`${team.id}-${index}`}
                                                            onClick={() => onTeamClick(team.id)}
                                                            className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs hover:shadow-md transition-shadow"
                                                        >
                                                            <img src={team.logo} alt={team.name} className="w-4 h-4 rounded-full" />
                                                            <span className="text-slate-700">{team.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                {event.description && (
                                                    <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                                                )}
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                TOURNAMENT
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Regular event card
                                return (
                                    <div key={`${event.teamId}-${event.id}`} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <button onClick={() => onTeamClick(event.teamId)} className="flex items-center gap-2 mb-2 hover:opacity-80">
                                                    <img src={event.teamLogo} alt={event.teamName} className="w-6 h-6 rounded-full" />
                                                    <span className="font-semibold text-red-700">{event.teamName}</span>
                                                </button>
                                                <h3 className="font-bold text-slate-800 mb-1">{event.title}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                                                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                                    <span>{event.time}</span>
                                                    {event.location && (
                                                        <ClickableLocation 
                                                            locationName={event.location}
                                                            teams={teams}
                                                        />
                                                    )}
                                                </div>
                                                {event.imageUrl && (
                                                    <img src={event.imageUrl} alt="Event" className="w-full h-32 object-cover rounded-lg mb-3" />
                                                )}
                                                {event.description && (
                                                    <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                event.type === 'tournament' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {event.type}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        }) : (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                <p>No upcoming events found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* League Games */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Swords className="mr-2" size={24} />
                        League Games
                    </h2>
                    <div className="space-y-6">
                        {filteredSchedule.map(day => (
                            <div key={day.date}>
                                <h3 className="text-lg font-semibold text-slate-700 pb-2 border-b-2 border-red-800 mb-3">
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </h3>
                                <div className="space-y-3">
                                    {day.games.map((game) => {
                                        const home = getTeam(game.home);
                                        const away = getTeam(game.away);
                                        if (!home || !away) return null;
                                        return (
                                            <div key={game.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <button onClick={() => onTeamClick(away.id)} className="text-center w-28 hover:opacity-80">
                                                        <img src={away.logo} alt={away.name} className="w-12 h-12 mx-auto rounded-full bg-slate-200 p-1"/>
                                                        <p className="font-bold text-xs mt-1">{away.name}</p>
                                                    </button>
                                                    <span className="text-xl font-bold text-slate-400 mx-3">@</span>
                                                    <button onClick={() => onTeamClick(home.id)} className="text-center w-28 hover:opacity-80">
                                                        <img src={home.logo} alt={home.name} className="w-12 h-12 mx-auto rounded-full bg-slate-200 p-1"/>
                                                        <p className="font-bold text-xs mt-1">{home.name}</p>
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{game.time}</p>
                                                    <p className="text-sm text-slate-500">{game.location}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeagueContactPage = ({ websiteStyle, leagueInfo }) => (
    <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <img src={websiteStyle.logoUrl} alt="MLBL Logo" className="h-40 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{leagueInfo.name}</h1>
            </div>
            <ContactCard entity={leagueInfo} />
        </div>
    </div>
);

const StandingsPage = ({teams, onTeamClick, websiteStyle}) => {
    const fieldTeams = teams.filter(t => t.active && t.division === 'Field').sort((a, b) => {
        const scoreA = a.wins * 2 + a.ties;
        const scoreB = b.wins * 2 + b.ties;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.pf - b.pa) - (a.pf - a.pa);
    });
    
    const boxTeams = teams.filter(t => t.active && t.division === 'Box').sort((a, b) => {
        const scoreA = a.wins * 2 + a.ties;
        const scoreB = b.wins * 2 + b.ties;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.pf - b.pa) - (a.pf - a.pa);
    });

    const renderStandingsTable = (divisionTeams, divisionName) => (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center">
                {divisionName === 'Field' ? <Trophy className="mr-2" size={24} /> : <Shield className="mr-2" size={24} />}
                {divisionName} Lacrosse Standings
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6 text-left">Team</th>
                            <th className="py-3 px-6 text-center">W</th><th className="py-3 px-6 text-center">L</th><th className="py-3 px-6 text-center">T</th>
                            <th className="py-3 px-6 text-center">PF</th><th className="py-3 px-6 text-center">PA</th><th className="py-3 px-6 text-center">DIFF</th>
                            <th className="py-3 px-6 text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm font-light">
                        {divisionTeams.map((team, index) => {
                            const differential = team.pf - team.pa;
                            const score = team.wins * 2 + team.ties;
                            return (
                                <tr key={team.id} className={`border-b border-slate-200 hover:bg-slate-50 ${index === 0 ? 'bg-yellow-50' : ''}`}>
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <button onClick={() => onTeamClick(team.id)} className="flex items-center hover:opacity-80">
                                            {index === 0 && <Crown size={16} className="text-yellow-600 mr-1" />}
                                            <img src={team.logo} alt={team.name} className="w-8 h-8 mr-3 rounded-full bg-white p-1" />
                                            <span className="font-medium">{team.name}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-6 text-center">{team.wins}</td><td className="py-3 px-6 text-center">{team.losses}</td><td className="py-3 px-6 text-center">{team.ties}</td>
                                    <td className="py-3 px-6 text-center text-green-600 font-semibold">{team.pf}</td><td className="py-3 px-6 text-center text-red-600 font-semibold">{team.pa}</td>
                                    <td className={`py-3 px-6 text-center font-semibold ${differential > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {differential > 0 ? `+${differential}` : differential}
                                    </td>
                                    <td className="py-3 px-6 text-center font-bold text-red-800">{score}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <h1 className="text-4xl font-bold text-slate-800 mb-6 tracking-tight">League Standings</h1>
            {fieldTeams.length > 0 && renderStandingsTable(fieldTeams, 'Field')}
            {boxTeams.length > 0 && renderStandingsTable(boxTeams, 'Box')}
        </div>
    );
};

const LeagueCalendarManager = ({ teams, setTeams }) => {
    const [selectedTeamId, setSelectedTeamId] = useState('all');
    const [editingEvent, setEditingEvent] = useState(null);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const events = selectedTeamId === 'all' 
        ? teams.flatMap(team => (team.calendar || []).map(event => ({...event, teamName: team.name, teamId: team.id})))
        : selectedTeam?.calendar || [];

    const handleSave = (e) => {
        e.preventDefault();
        
        // Helper function to generate recurring events
        const generateRecurringEvents = (baseEvent) => {
            if (!baseEvent.repeatType || baseEvent.repeatType === 'none' || !baseEvent.repeatCount) {
                return [baseEvent];
            }
            
            const events = [];
            const startDate = new Date(baseEvent.date);
            
            for (let i = 0; i < baseEvent.repeatCount; i++) {
                const eventDate = new Date(startDate);
                
                switch (baseEvent.repeatType) {
                    case 'daily':
                        eventDate.setDate(startDate.getDate() + i);
                        break;
                    case 'weekly':
                        eventDate.setDate(startDate.getDate() + (i * 7));
                        break;
                    case 'biweekly':
                        eventDate.setDate(startDate.getDate() + (i * 14));
                        break;
                    case 'monthly':
                        eventDate.setMonth(startDate.getMonth() + i);
                        break;
                }
                
                const event = {
                    ...baseEvent,
                    id: (baseEvent.id || Date.now()) + i,
                    date: eventDate.toISOString().split('T')[0],
                    title: `${baseEvent.title}${i > 0 ? ` (${i + 1})` : ''}`
                };
                
                // Remove repeat properties from individual events
                delete event.repeatType;
                delete event.repeatCount;
                
                events.push(event);
            }
            
            return events;
        };

        const baseEvent = {
            ...editingEvent,
            id: editingEvent.id || Date.now(),
            teamIds: editingEvent.teamIds || []
        };

        const eventsToAdd = generateRecurringEvents(baseEvent);

        // Update each selected team's calendar
        const teamIds = baseEvent.teamIds.length > 0 ? baseEvent.teamIds : [selectedTeamId];
        setTeams(currentTeams => currentTeams.map(t => {
            if (teamIds.includes(t.id)) {
                let updatedEvents = t.calendar || [];
                
                if (editingEvent.id && !editingEvent.repeatType) {
                    // Single event edit
                    updatedEvents = updatedEvents.map(event => 
                        event.id === editingEvent.id ? baseEvent : event
                    );
                } else {
                    // New events or recurring events
                    updatedEvents = [...updatedEvents, ...eventsToAdd];
                }
                
                return { ...t, calendar: updatedEvents };
            }
            return t;
        }));
        
        setEditingEvent(null);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {editingEvent && (
                <EventForm 
                    editingEvent={editingEvent}
                    setEditingEvent={setEditingEvent}
                    onSave={handleSave}
                    onCancel={() => setEditingEvent(null)}
                    teams={teams}
                    isTeamSpecific={false}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} className="p-2 border rounded-md mr-4">
                        <option value="all">All Teams</option>
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => setEditingEvent({
                        teamIds: selectedTeamId === 'all' ? [] : [selectedTeamId],
                        type: 'practice', 
                        date: '', 
                        time: '', 
                        title: '', 
                        location: '', 
                        description: '',
                        imageUrl: ''
                    })} 
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add Event
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                {events.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {events.map(event => (
                            <li key={`${event.teamId || selectedTeamId}-${event.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">
                                                {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                            {selectedTeamId === 'all' && <p className="text-sm font-semibold text-red-700">{event.teamName}</p>}
                                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                                                <span className="flex items-center"><Calendar className="mr-1 h-4 w-4"/>{event.time}</span>
                                                {event.location && (
                                                    <ClickableLocation 
                                                        locationName={event.location}
                                                        teams={teams}
                                                        className="flex items-center"
                                                    >
                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                        {event.location}
                                                    </ClickableLocation>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                    event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                    event.type === 'tournament' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>{event.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingEvent({...event, teamIds: event.teamIds || [event.teamId || selectedTeamId]})} className="text-slate-500 hover:text-slate-700 p-1"><Edit size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <p>No events scheduled. Add the first event!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LeagueInfoManager = ({ leagueInfo, setLeagueInfo, websiteStyle, setWebsiteStyle }) => {
    const [info, setInfo] = useState({
        name: leagueInfo.name || '',
        contactEmail: leagueInfo.contactEmail || '',
        description: leagueInfo.description || '',
        location: leagueInfo.location || '',
        founded: leagueInfo.founded || '',
        website: leagueInfo.website || '',
        social: {
            twitter: leagueInfo.social?.twitter || '',
            instagram: leagueInfo.social?.instagram || '',
            facebook: leagueInfo.social?.facebook || ''
        }
    });
    
    const [tickerStyle, setTickerStyle] = useState({
        tickerColor: websiteStyle?.tickerColor || '#1e293b',
        tickerItemColor: websiteStyle?.tickerItemColor || '#334155', 
        tickerBorderColor: websiteStyle?.tickerBorderColor || '#475569',
        tickerTextColor: websiteStyle?.tickerTextColor || '#94a3b8'
    });

    const [saved, setSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setLeagueInfo(info);
        if (setWebsiteStyle) {
            setWebsiteStyle(prev => ({...prev, ...tickerStyle}));
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleSocialChange = (platform, value) => {
        setInfo(prev => ({
            ...prev,
            social: { ...prev.social, [platform]: value }
        }));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">
                {/* League Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                            <Trophy className="mr-2" size={20} />
                            League Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">League Name</label>
                                <input
                                    type="text"
                                    value={info.name}
                                    onChange={(e) => setInfo(prev => ({...prev, name: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Men's Lacrosse Beer League"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Location/Region</label>
                                <input
                                    type="text"
                                    value={info.location}
                                    onChange={(e) => setInfo(prev => ({...prev, location: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ohio Valley Region"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Founded Year</label>
                                <input
                                    type="text"
                                    value={info.founded}
                                    onChange={(e) => setInfo(prev => ({...prev, founded: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="2020"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Website URL</label>
                                <input
                                    type="url"
                                    value={info.website}
                                    onChange={(e) => setInfo(prev => ({...prev, website: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="https://mlbl.org"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    value={info.contactEmail}
                                    onChange={(e) => setInfo(prev => ({...prev, contactEmail: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="admin@mlbl.org"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">League Description</label>
                                <textarea
                                    value={info.description}
                                    onChange={(e) => setInfo(prev => ({...prev, description: e.target.value}))}
                                    rows="4"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Describe your league..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ticker Styling */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                            <Palette className="mr-2" size={20} />
                            Game Ticker Styling
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Ticker Background</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3" style={{ backgroundColor: tickerStyle.tickerColor }}>
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {tickerStyle.tickerColor}
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Game Card Background</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3" style={{ backgroundColor: tickerStyle.tickerItemColor }}>
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {tickerStyle.tickerItemColor}
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerItemColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerItemColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Card Border Color</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3" style={{ backgroundColor: tickerStyle.tickerBorderColor }}>
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {tickerStyle.tickerBorderColor}
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerBorderColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerBorderColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Secondary Text Color</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3 bg-slate-800">
                                        <span className="font-semibold text-sm px-2 py-1 rounded" style={{ color: tickerStyle.tickerTextColor }}>
                                            {tickerStyle.tickerTextColor} Sample
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerTextColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerTextColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="mr-2" size={20} />
                        League Social Media
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Twitter className="mr-2 text-blue-400" size={18} />
                                Twitter/X
                            </label>
                            <input
                                type="url"
                                value={info.social.twitter}
                                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://twitter.com/mlbl"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Instagram className="mr-2 text-pink-500" size={18} />
                                Instagram
                            </label>
                            <input
                                type="url"
                                value={info.social.instagram}
                                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://instagram.com/mlbl"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Facebook className="mr-2 text-blue-600" size={18} />
                                Facebook
                            </label>
                            <input
                                type="url"
                                value={info.social.facebook}
                                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://facebook.com/mlbl"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end items-center space-x-4">
                    {saved && (
                        <div className="flex items-center text-green-600">
                            <span className="mr-2">✓</span>
                            <span className="font-semibold">League information saved successfully!</span>
                        </div>
                    )}
                    <button type="submit" className="bg-red-800 text-white px-8 py-3 rounded-lg hover:bg-red-900 font-semibold flex items-center">
                        <Settings className="mr-2" size={18} />
                        Save League Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

const EventForm = ({ editingEvent, setEditingEvent, onSave, onCancel, teams, isTeamSpecific = false, currentTeamId = null }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editingEvent?.id ? 'Edit Event' : 'Add New Event'}</h3>
            <form onSubmit={onSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="date" 
                        value={editingEvent?.date || ''} 
                        onChange={e => setEditingEvent(prev => ({...prev, date: e.target.value}))} 
                        className="w-full p-2 border rounded" 
                        required 
                    />
                    <select 
                        value={editingEvent?.time || ''} 
                        onChange={e => setEditingEvent(prev => ({...prev, time: e.target.value}))} 
                        className="w-full p-2 border rounded" 
                        required 
                    >
                        <option value="">Select Time</option>
                        {Array.from({ length: 96 }, (_, i) => {
                            const hour = Math.floor(i / 4);
                            const minute = (i % 4) * 15;
                            const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            const period = hour < 12 ? 'AM' : 'PM';
                            const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
                            return (
                                <option key={time24} value={time24}>{time12}</option>
                            );
                        })}
                    </select>
                </div>
                <input 
                    type="text" 
                    value={editingEvent?.title || ''} 
                    onChange={e => setEditingEvent(prev => ({...prev, title: e.target.value}))} 
                    placeholder="Event Title" 
                    className="w-full p-2 border rounded" 
                    required 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                        value={editingEvent?.type || 'practice'} 
                        onChange={e => setEditingEvent(prev => ({...prev, type: e.target.value}))} 
                        className="w-full p-2 border rounded"
                    >
                        <option value="practice">Practice</option>
                        <option value="game">Game</option>
                        <option value="scrimmage">Scrimmage</option>
                        <option value="tournament">Tournament</option>
                        <option value="social">Social Event</option>
                        <option value="meeting">Team Meeting</option>
                    </select>
                    {/* Location Dropdown from Team Locations */}
                    <div className="relative">
                        <select 
                            value={editingEvent?.location || ''} 
                            onChange={e => setEditingEvent(prev => ({...prev, location: e.target.value}))} 
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="">Select Location</option>
                            {(() => {
                                // Collect all locations from relevant teams
                                const allLocations = [];
                                
                                if (isTeamSpecific && currentTeamId) {
                                    // For team-specific events, show only current team's locations
                                    const currentTeam = teams.find(t => t.id === currentTeamId);
                                    if (currentTeam?.locations) {
                                        allLocations.push(...currentTeam.locations.map(loc => ({...loc, teamName: currentTeam.name})));
                                    }
                                } else {
                                    // For league events, show all teams' locations
                                    teams.forEach(team => {
                                        if (team.locations) {
                                            allLocations.push(...team.locations.map(loc => ({...loc, teamName: team.name})));
                                        }
                                    });
                                }
                                
                                return allLocations.map(location => (
                                    <option key={`${location.teamName}-${location.id}`} value={location.name}>
                                        {location.name} {!isTeamSpecific ? `(${location.teamName})` : ''}
                                    </option>
                                ));
                            })()}
                            <option value="custom">+ Add Custom Location</option>
                        </select>
                        
                        {editingEvent?.location === 'custom' && (
                            <input 
                                type="text" 
                                value={editingEvent?.customLocation || ''} 
                                onChange={e => setEditingEvent(prev => ({...prev, customLocation: e.target.value}))} 
                                placeholder="Enter custom location" 
                                className="w-full p-2 border rounded mt-2" 
                                required
                            />
                        )}
                    </div>
                </div>
                <textarea 
                    value={editingEvent?.description || ''} 
                    onChange={e => setEditingEvent(prev => ({...prev, description: e.target.value}))} 
                    placeholder="Description (optional)" 
                    className="w-full p-2 border rounded" 
                    rows="3"
                />
                
                {/* Event Photo Upload */}
                <div>
                    <label className="block font-semibold text-slate-700 mb-2">Event Photo (Optional)</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                const fileUrl = URL.createObjectURL(e.target.files[0]);
                                setEditingEvent(prev => ({...prev, imageUrl: fileUrl}));
                            }
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {editingEvent?.imageUrl && (
                        <div className="mt-3">
                            <img src={editingEvent.imageUrl} alt="Event preview" className="w-full h-32 object-cover rounded-lg border" />
                        </div>
                    )}
                </div>
                
                {/* Repeat Options */}
                <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                        <Calendar className="mr-2" size={16} />
                        Repeat Event
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Type</label>
                            <select 
                                value={editingEvent?.repeatType || 'none'} 
                                onChange={e => setEditingEvent(prev => ({...prev, repeatType: e.target.value}))} 
                                className="w-full p-2 border rounded"
                            >
                                <option value="none">No Repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        
                        {editingEvent?.repeatType && editingEvent?.repeatType !== 'none' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Occurrences</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="52" 
                                    value={editingEvent?.repeatCount || 1} 
                                    onChange={e => setEditingEvent(prev => ({...prev, repeatCount: parseInt(e.target.value) || 1}))} 
                                    placeholder="Number of events" 
                                    className="w-full p-2 border rounded" 
                                />
                            </div>
                        )}
                    </div>
                    
                    {editingEvent?.repeatType && editingEvent?.repeatType !== 'none' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Preview:</strong> This will create {editingEvent?.repeatCount || 1} events 
                                {editingEvent?.repeatType === 'daily' && ' daily'}
                                {editingEvent?.repeatType === 'weekly' && ' weekly'}
                                {editingEvent?.repeatType === 'biweekly' && ' every two weeks'}
                                {editingEvent?.repeatType === 'monthly' && ' monthly'}
                                {editingEvent?.date && ` starting from ${new Date(editingEvent.date).toLocaleDateString()}`}
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Team Selection */}
                {!isTeamSpecific && (
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Teams</label>
                        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto bg-slate-50">
                            <div className="grid grid-cols-1 gap-2">
                                {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                    <label key={team.id} className="flex items-center space-x-2 hover:bg-white p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={(editingEvent?.teamIds || []).includes(team.id)}
                                            onChange={(e) => {
                                                const teamIds = editingEvent?.teamIds || [];
                                                const newTeamIds = e.target.checked
                                                    ? [...teamIds, team.id]
                                                    : teamIds.filter(id => id !== team.id);
                                                setEditingEvent(prev => ({...prev, teamIds: newTeamIds}));
                                            }}
                                            className="rounded"
                                        />
                                        <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full" />
                                        <span className="text-sm font-medium">{team.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Select which team(s) this event applies to</p>
                    </div>
                )}

                {/* Photo Upload */}
                <div>
                    <label className="block font-semibold text-slate-700 mb-2">Event Photo</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                const fileUrl = URL.createObjectURL(e.target.files[0]);
                                setEditingEvent(prev => ({...prev, imageUrl: fileUrl}));
                            }
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                    />
                    {editingEvent?.imageUrl && (
                        <div className="mt-2">
                            <img src={editingEvent.imageUrl} alt="Event preview" className="w-full h-32 object-cover rounded-lg border" />
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                    <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Event</button>
                </div>
            </form>
        </div>
    </div>
);

const TeamCalendarManager = ({ team, teams, setTeams }) => {
    const [editingEvent, setEditingEvent] = useState(null);

    const handleSave = (e) => {
        e.preventDefault();
        
        // Helper function to generate recurring events
        const generateRecurringEvents = (baseEvent) => {
            if (!baseEvent.repeatType || baseEvent.repeatType === 'none' || !baseEvent.repeatCount) {
                return [baseEvent];
            }
            
            const events = [];
            const startDate = new Date(baseEvent.date);
            
            for (let i = 0; i < baseEvent.repeatCount; i++) {
                const eventDate = new Date(startDate);
                
                switch (baseEvent.repeatType) {
                    case 'daily':
                        eventDate.setDate(startDate.getDate() + i);
                        break;
                    case 'weekly':
                        eventDate.setDate(startDate.getDate() + (i * 7));
                        break;
                    case 'biweekly':
                        eventDate.setDate(startDate.getDate() + (i * 14));
                        break;
                    case 'monthly':
                        eventDate.setMonth(startDate.getMonth() + i);
                        break;
                }
                
                const event = {
                    ...baseEvent,
                    id: (baseEvent.id || Date.now()) + i,
                    date: eventDate.toISOString().split('T')[0],
                    title: `${baseEvent.title}${i > 0 ? ` (${i + 1})` : ''}`
                };
                
                // Remove repeat properties from individual events
                delete event.repeatType;
                delete event.repeatCount;
                
                events.push(event);
            }
            
            return events;
        };

        const baseEvent = {
            ...editingEvent,
            id: editingEvent.id || Date.now()
        };

        const eventsToAdd = generateRecurringEvents(baseEvent);

        // If it's a tournament or has multiple teams, add to all selected teams
        const targetTeamIds = editingEvent.teamIds && editingEvent.teamIds.length > 0 
            ? editingEvent.teamIds 
            : [team.id]; // Default to current team

        setTeams(currentTeams => currentTeams.map(t => {
            if (targetTeamIds.includes(t.id)) {
                let updatedEvents = t.calendar || [];
                
                if (editingEvent.id && !editingEvent.repeatType) {
                    // Single event edit
                    updatedEvents = updatedEvents.map(event => 
                        event.id === editingEvent.id ? baseEvent : event
                    );
                } else {
                    // New events or recurring events
                    updatedEvents = [...updatedEvents, ...eventsToAdd];
                }
                
                return { ...t, calendar: updatedEvents };
            }
            return t;
        }));
        
        setEditingEvent(null);
    };

    const handleDelete = (eventId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, calendar: (t.calendar || []).filter(event => event.id !== eventId) };
            }
            return t;
        }));
    };

    const events = team.calendar || [];

    return (
        <div className="max-w-4xl mx-auto">
            {editingEvent && (
                <EventForm 
                    editingEvent={editingEvent}
                    setEditingEvent={setEditingEvent}
                    onSave={handleSave}
                    onCancel={() => setEditingEvent(null)}
                    teams={teams}
                    isTeamSpecific={false} // Allow team selection even from team calendar
                    currentTeamId={team.id}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Calendar Management</h2>
                 <button 
                    onClick={() => setEditingEvent({
                        teamIds: [team.id], 
                        type: 'practice', 
                        date: '', 
                        time: '', 
                        title: '', 
                        location: '', 
                        description: '',
                        imageUrl: ''
                    })} 
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add Event
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                {events.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {events.map(event => (
                            <li key={event.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">
                                                {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                                                <span className="flex items-center">
                                                    <Calendar className="mr-1 h-4 w-4"/>
                                                    {event.time}
                                                </span>
                                                {event.location && (
                                                    <ClickableLocation 
                                                        locationName={event.location}
                                                        teams={teams}
                                                        className="flex items-center"
                                                    >
                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                        {event.location}
                                                    </ClickableLocation>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                    event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                    event.type === 'tournament' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>
                                                    {event.type}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingEvent(event)} className="text-slate-500 hover:text-slate-700 p-1"><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(event.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <p>No events scheduled yet. Add your first event!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const GalleryForm = ({ editingGallery, setEditingGallery, onSave, onCancel, galleryType }) => {
    const [galleryName, setGalleryName] = useState(editingGallery?.name || '');
    const [galleryDescription, setGalleryDescription] = useState(editingGallery?.description || '');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...editingGallery,
            name: galleryName,
            description: galleryDescription,
            type: galleryType,
            id: editingGallery?.id || Date.now(),
            items: editingGallery?.items || [],
            createdAt: editingGallery?.createdAt || new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">
                    {editingGallery?.id ? 'Edit' : 'Create New'} {galleryType === 'photo' ? 'Photo Gallery' : 'Video Collection'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Gallery Name</label>
                        <input 
                            type="text" 
                            value={galleryName}
                            onChange={(e) => setGalleryName(e.target.value)}
                            placeholder="e.g., Championship Games, Team Photos"
                            className="w-full p-2 border rounded" 
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Description</label>
                        <textarea 
                            value={galleryDescription}
                            onChange={(e) => setGalleryDescription(e.target.value)}
                            placeholder="Brief description of this gallery..."
                            className="w-full p-2 border rounded h-24 resize-none" 
                            required 
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Create Gallery</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ItemForm = ({ editingItem, setEditingItem, onSave, onCancel, itemType, galleryId }) => {
    const [itemData, setItemData] = useState({
        caption: editingItem?.caption || '',
        url: editingItem?.url || '',
        ...editingItem
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...itemData,
            id: editingItem?.id || Date.now(),
            type: itemType,
            galleryId: galleryId,
            addedAt: editingItem?.addedAt || new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-4">Add {itemType === 'photo' ? 'Photo' : 'Video'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {itemType === 'photo' ? (
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Photo Upload</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const fileUrl = URL.createObjectURL(e.target.files[0]);
                                        setItemData(prev => ({...prev, url: fileUrl}));
                                    }
                                }}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">YouTube URL or Video URL</label>
                            <input 
                                type="url" 
                                value={itemData.url}
                                onChange={(e) => setItemData(prev => ({...prev, url: e.target.value}))}
                                placeholder="https://www.youtube.com/watch?v=..." 
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Caption/Description</label>
                        <input 
                            type="text" 
                            value={itemData.caption}
                            onChange={(e) => setItemData(prev => ({...prev, caption: e.target.value}))}
                            placeholder="Caption/Description" 
                            className="w-full p-2 border rounded" 
                            required 
                        />
                    </div>
                    
                    {itemData.url && (
                        <div className="mt-2">
                            {itemType === 'photo' ? (
                                <img src={itemData.url} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
                            ) : (
                                <div className="bg-slate-100 p-4 rounded-lg">
                                    <p className="text-sm text-slate-600">Video URL: {itemData.url}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Add {itemType === 'photo' ? 'Photo' : 'Video'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Slideshow = ({ items, isOpen, onClose, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    
    if (!isOpen || !items.length) return null;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const currentItem = items[currentIndex];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl max-h-full">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-60"
                >
                    <X size={32} />
                </button>
                
                {items.length > 1 && (
                    <>
                        <button 
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-60"
                        >
                            <ChevronLeft size={48} />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-60"
                        >
                            <ChevronRight size={48} />
                        </button>
                    </>
                )}
                
                <div className="bg-white rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-12">
                        {currentItem.type === 'photo' ? (
                            <img 
                                src={currentItem.url} 
                                alt={currentItem.caption}
                                className="w-full h-96 object-contain bg-black"
                            />
                        ) : (
                            <div className="h-96 flex items-center justify-center bg-black">
                                {currentItem.url.includes('youtube.com') || currentItem.url.includes('youtu.be') ? (
                                    <iframe 
                                        src={currentItem.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                        title={currentItem.caption} 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen 
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <video controls className="w-full h-full">
                                        <source src={currentItem.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{currentItem.caption}</h3>
                        <div className="flex justify-between items-center text-sm text-slate-500">
                            <span>Added {new Date(currentItem.addedAt).toLocaleDateString()}</span>
                            <span>{currentIndex + 1} of {items.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MediaManager = ({ team, setTeams }) => {
    const [activeTab, setActiveTab] = useState('photos');
    const [editingGallery, setEditingGallery] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedGallery, setSelectedGallery] = useState(null);
    const [slideshow, setSlideshow] = useState({ isOpen: false, items: [], startIndex: 0 });
    
    const galleries = team.galleries || [];
    const photoGalleries = galleries.filter(g => g.type === 'photo').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const videoGalleries = galleries.filter(g => g.type === 'video').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleSaveGallery = (galleryData) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGalleries = galleryData.id && (t.galleries || []).find(g => g.id === galleryData.id)
                    ? (t.galleries || []).map(g => g.id === galleryData.id ? galleryData : g)
                    : [...(t.galleries || []), galleryData];
                return { ...t, galleries: updatedGalleries };
            }
            return t;
        }));
        setEditingGallery(null);
    };

    const handleSaveItem = (itemData) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGalleries = (t.galleries || []).map(g => {
                    if (g.id === selectedGallery.id) {
                        const updatedItems = itemData.id && (g.items || []).find(i => i.id === itemData.id)
                            ? (g.items || []).map(i => i.id === itemData.id ? itemData : i)
                            : [...(g.items || []), itemData];
                        return { ...g, items: updatedItems };
                    }
                    return g;
                });
                return { ...t, galleries: updatedGalleries };
            }
            return t;
        }));
        setEditingItem(null);
    };

    const handleDeleteGallery = (galleryId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, galleries: (t.galleries || []).filter(g => g.id !== galleryId) };
            }
            return t;
        }));
    };

    const handleDeleteItem = (galleryId, itemId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGalleries = (t.galleries || []).map(g => {
                    if (g.id === galleryId) {
                        return { ...g, items: (g.items || []).filter(i => i.id !== itemId) };
                    }
                    return g;
                });
                return { ...t, galleries: updatedGalleries };
            }
            return t;
        }));
    };

    const openSlideshow = (items, startIndex = 0) => {
        setSlideshow({ isOpen: true, items, startIndex });
    };

    return (
        <div className="max-w-6xl mx-auto">
            {editingGallery && (
                <GalleryForm
                    editingGallery={editingGallery}
                    setEditingGallery={setEditingGallery}
                    onSave={handleSaveGallery}
                    onCancel={() => setEditingGallery(null)}
                    galleryType={activeTab === 'photos' ? 'photo' : 'video'}
                />
            )}
            
            {editingItem && (
                <ItemForm
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                    onSave={handleSaveItem}
                    onCancel={() => setEditingItem(null)}
                    itemType={activeTab === 'photos' ? 'photo' : 'video'}
                    galleryId={selectedGallery?.id}
                />
            )}
            
            <Slideshow 
                items={slideshow.items}
                isOpen={slideshow.isOpen}
                onClose={() => setSlideshow({ isOpen: false, items: [], startIndex: 0 })}
                startIndex={slideshow.startIndex}
            />
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Media Management</h2>
                <button 
                    onClick={() => setEditingGallery({ name: '', description: '', type: activeTab === 'photos' ? 'photo' : 'video' })} 
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Create New {activeTab === 'photos' ? 'Photo Gallery' : 'Video Collection'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 border-b">
                <button 
                    onClick={() => setActiveTab('photos')}
                    className={`pb-2 px-1 ${activeTab === 'photos' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    <Image className="mr-2 inline" size={18} />
                    Photo Galleries ({photoGalleries.length})
                </button>
                <button 
                    onClick={() => setActiveTab('videos')}
                    className={`pb-2 px-1 ${activeTab === 'videos' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    <Video className="mr-2 inline" size={18} />
                    Video Collections ({videoGalleries.length})
                </button>
            </div>

            {/* Gallery Display */}
            <div className="space-y-8">
                {(activeTab === 'photos' ? photoGalleries : videoGalleries).map(gallery => (
                    <div key={gallery.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-grow">
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">{gallery.name}</h3>
                                <p className="text-slate-600 mb-2">{gallery.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-slate-500">
                                    <span>Created: {new Date(gallery.createdAt).toLocaleDateString()}</span>
                                    <span>{(gallery.items || []).length} {activeTab === 'photos' ? 'photos' : 'videos'}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                                <button 
                                    onClick={() => {
                                        setSelectedGallery(gallery);
                                        setEditingItem({ galleryId: gallery.id });
                                    }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="mr-1 h-3 w-3"/> Add {activeTab === 'photos' ? 'Photo' : 'Video'}
                                </button>
                                <button 
                                    onClick={() => setEditingGallery(gallery)} 
                                    className="text-slate-500 hover:text-slate-700 p-1"
                                    title="Edit gallery"
                                >
                                    <Edit size={16}/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteGallery(gallery.id)} 
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete gallery"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Gallery Items */}
                        {(gallery.items || []).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(gallery.items || []).map((item, index) => (
                                    <div key={item.id} className="group relative bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                                        <div 
                                            onClick={() => openSlideshow(gallery.items, index)}
                                            className="aspect-square relative overflow-hidden"
                                        >
                                            {activeTab === 'photos' ? (
                                                <img 
                                                    src={item.url} 
                                                    alt={item.caption} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                    {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                                        <div className="relative w-full h-full">
                                                            <img 
                                                                src={`https://img.youtube.com/vi/${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}/0.jpg`}
                                                                alt={item.caption}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="bg-red-600 rounded-full p-2">
                                                                    <Video className="text-white" size={24} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Video className="text-slate-400" size={32} />
                                                    )}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white rounded-full p-2">
                                                        <Eye className="text-slate-800" size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-slate-800 truncate">{item.caption}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-slate-500">
                                                    {new Date(item.addedAt).toLocaleDateString()}
                                                </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteItem(gallery.id, item.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete item"
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                                {activeTab === 'photos' ? (
                                    <Image className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                ) : (
                                    <Video className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                )}
                                <p>No {activeTab === 'photos' ? 'photos' : 'videos'} in this gallery yet.</p>
                                <button 
                                    onClick={() => {
                                        setSelectedGallery(gallery);
                                        setEditingItem({ galleryId: gallery.id });
                                    }}
                                    className="mt-2 text-red-600 hover:text-red-800 font-medium"
                                >
                                    Add the first {activeTab === 'photos' ? 'photo' : 'video'} →
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {(activeTab === 'photos' ? photoGalleries : videoGalleries).length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        {activeTab === 'photos' ? (
                            <Image className="mx-auto h-16 w-16 text-slate-300 mb-4"/>
                        ) : (
                            <Video className="mx-auto h-16 w-16 text-slate-300 mb-4"/>
                        )}
                        <h3 className="text-xl font-semibold mb-2">No {activeTab === 'photos' ? 'Photo Galleries' : 'Video Collections'} Yet</h3>
                        <p className="mb-4">Create your first {activeTab === 'photos' ? 'photo gallery' : 'video collection'} to showcase your team's memories and highlights.</p>
                        <button 
                            onClick={() => setEditingGallery({ name: '', description: '', type: activeTab === 'photos' ? 'photo' : 'video' })}
                            className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 font-medium"
                        >
                            Create First {activeTab === 'photos' ? 'Photo Gallery' : 'Video Collection'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const LocationManager = ({ team, setTeams }) => {
    const [editingLocation, setEditingLocation] = useState(null);
    const [locationData, setLocationData] = useState({
        name: '',
        address: '',
        description: '',
        type: 'field'
    });

    const locations = team.locations || [];

    const handleSaveLocation = (e) => {
        e.preventDefault();
        const newLocation = {
            ...locationData,
            id: editingLocation?.id || Date.now()
        };

        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedLocations = editingLocation?.id
                    ? (t.locations || []).map(loc => loc.id === editingLocation.id ? newLocation : loc)
                    : [...(t.locations || []), newLocation];
                return { ...t, locations: updatedLocations };
            }
            return t;
        }));
        
        setEditingLocation(null);
        setLocationData({ name: '', address: '', description: '', type: 'field' });
    };

    const handleDeleteLocation = (locationId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, locations: (t.locations || []).filter(loc => loc.id !== locationId) };
            }
            return t;
        }));
    };

    const handleEditLocation = (location) => {
        setEditingLocation(location);
        setLocationData({
            name: location.name,
            address: location.address,
            description: location.description || '',
            type: location.type || 'field'
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Locations</h2>
                <button 
                    onClick={() => {
                        setEditingLocation({});
                        setLocationData({ name: '', address: '', description: '', type: 'field' });
                    }}
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add Location
                </button>
            </div>

            {/* Location Form */}
            {editingLocation !== null && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">
                        {editingLocation.id ? 'Edit Location' : 'Add New Location'}
                    </h3>
                    <form onSubmit={handleSaveLocation} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Location Name</label>
                                <input 
                                    type="text" 
                                    value={locationData.name}
                                    onChange={(e) => setLocationData(prev => ({...prev, name: e.target.value}))}
                                    placeholder="e.g., Main Field, Home Stadium"
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Location Type</label>
                                <select 
                                    value={locationData.type}
                                    onChange={(e) => setLocationData(prev => ({...prev, type: e.target.value}))}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="field">Field</option>
                                    <option value="stadium">Stadium</option>
                                    <option value="gym">Gym</option>
                                    <option value="training">Training Facility</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Address</label>
                            <input 
                                type="text" 
                                value={locationData.address}
                                onChange={(e) => setLocationData(prev => ({...prev, address: e.target.value}))}
                                placeholder="Full address or directions"
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Description (Optional)</label>
                            <textarea 
                                value={locationData.description}
                                onChange={(e) => setLocationData(prev => ({...prev, description: e.target.value}))}
                                placeholder="Additional notes about this location..."
                                className="w-full p-2 border rounded h-20 resize-none" 
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingLocation(null);
                                    setLocationData({ name: '', address: '', description: '', type: 'field' });
                                }}
                                className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                {editingLocation.id ? 'Update Location' : 'Add Location'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Locations List */}
            <div className="space-y-4">
                {locations.length > 0 ? (
                    locations.map(location => (
                        <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-xl font-semibold text-slate-800">{location.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            location.type === 'field' ? 'bg-green-100 text-green-800' :
                                            location.type === 'stadium' ? 'bg-blue-100 text-blue-800' :
                                            location.type === 'gym' ? 'bg-orange-100 text-orange-800' :
                                            location.type === 'training' ? 'bg-purple-100 text-purple-800' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>
                                            {location.type}
                                        </span>
                                    </div>
                                    <div className="flex items-start space-x-2 text-slate-600">
                                        <MapPin className="mt-0.5" size={16} />
                                        <button 
                                            onClick={() => {
                                                const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=k`;
                                                window.open(mapsUrl, '_blank');
                                            }}
                                            className="text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                            title="Click to open in Google Maps"
                                        >
                                            {location.address}
                                        </button>
                                    </div>
                                    {location.description && (
                                        <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button 
                                        onClick={() => handleEditLocation(location)}
                                        className="text-slate-500 hover:text-slate-700 p-1"
                                        title="Edit location"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteLocation(location.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete location"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-lg">
                        <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No Locations Added Yet</h3>
                        <p className="mb-4">Add your team's practice fields, stadiums, and other venues.</p>
                        <button 
                            onClick={() => {
                                setEditingLocation({});
                                setLocationData({ name: '', address: '', description: '', type: 'field' });
                            }}
                            className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900"
                        >
                            Add First Location
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const GroupMeManager = ({ team, setTeams }) => {
    const [editingGroupMe, setEditingGroupMe] = useState(null);
    const [groupMeData, setGroupMeData] = useState({
        name: '',
        url: '',
        description: '',
        image: ''
    });

    const groupMes = team.groupMes || [];

    const handleSaveGroupMe = (e) => {
        e.preventDefault();
        const newGroupMe = {
            ...groupMeData,
            id: editingGroupMe?.id || Date.now()
        };

        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGroupMes = editingGroupMe?.id
                    ? (t.groupMes || []).map(gm => gm.id === editingGroupMe.id ? newGroupMe : gm)
                    : [...(t.groupMes || []), newGroupMe];
                return { ...t, groupMes: updatedGroupMes };
            }
            return t;
        }));
        
        setEditingGroupMe(null);
        setGroupMeData({ name: '', url: '', description: '', image: '' });
    };

    const handleDeleteGroupMe = (groupMeId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, groupMes: (t.groupMes || []).filter(gm => gm.id !== groupMeId) };
            }
            return t;
        }));
    };

    const handleEditGroupMe = (groupMe) => {
        setEditingGroupMe(groupMe);
        setGroupMeData({
            name: groupMe.name,
            url: groupMe.url,
            description: groupMe.description || '',
            image: groupMe.image || ''
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team GroupMe Chats</h2>
                <button 
                    onClick={() => {
                        setEditingGroupMe({});
                        setGroupMeData({ name: '', url: '', description: '', image: '' });
                    }}
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add GroupMe
                </button>
            </div>

            {/* GroupMe Form */}
            {editingGroupMe !== null && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">
                        {editingGroupMe.id ? 'Edit GroupMe' : 'Add New GroupMe'}
                    </h3>
                    <form onSubmit={handleSaveGroupMe} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Chat Name</label>
                                <input 
                                    type="text" 
                                    value={groupMeData.name}
                                    onChange={(e) => setGroupMeData(prev => ({...prev, name: e.target.value}))}
                                    placeholder="e.g., Main Team Chat, Parents Group"
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            <div>
                                <FileUploadInput
                                    label="Chat Image (Optional)"
                                    accept="image/*"
                                    currentValue={groupMeData.image}
                                    onChange={(url) => setGroupMeData(prev => ({...prev, image: url}))}
                                    placeholder="Upload chat group image"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">GroupMe Link/URL</label>
                            <input 
                                type="url" 
                                value={groupMeData.url}
                                onChange={(e) => setGroupMeData(prev => ({...prev, url: e.target.value}))}
                                placeholder="https://groupme.com/join_group/..."
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Description (Optional)</label>
                            <textarea 
                                value={groupMeData.description}
                                onChange={(e) => setGroupMeData(prev => ({...prev, description: e.target.value}))}
                                placeholder="Description of this chat group..."
                                className="w-full p-2 border rounded h-20 resize-none" 
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingGroupMe(null);
                                    setGroupMeData({ name: '', url: '', description: '', image: '' });
                                }}
                                className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                {editingGroupMe.id ? 'Update GroupMe' : 'Add GroupMe'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* GroupMe List */}
            <div className="space-y-4">
                {groupMes.length > 0 ? (
                    groupMes.map(groupMe => (
                        <div key={groupMe.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-grow">
                                    <div className="flex-shrink-0">
                                        {groupMe.image ? (
                                            <img 
                                                src={groupMe.image} 
                                                alt={groupMe.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className={`w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ${groupMe.image ? 'hidden' : 'flex'}`}
                                        >
                                            <MessageSquare className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-semibold text-slate-800">{groupMe.name}</h3>
                                        {groupMe.description && (
                                            <p className="text-sm text-slate-600 mt-1">{groupMe.description}</p>
                                        )}
                                        <button 
                                            onClick={() => window.open(groupMe.url, '_blank')}
                                            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Join GroupMe
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button 
                                        onClick={() => handleEditGroupMe(groupMe)}
                                        className="text-slate-500 hover:text-slate-700 p-1"
                                        title="Edit GroupMe"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGroupMe(groupMe.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete GroupMe"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No GroupMe Chats Added Yet</h3>
                        <p className="mb-4">Add your team's GroupMe chats to keep everyone connected.</p>
                        <button 
                            onClick={() => {
                                setEditingGroupMe({});
                                setGroupMeData({ name: '', url: '', description: '', image: '' });
                            }}
                            className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900"
                        >
                            Add First GroupMe
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TeamInfoManager = ({ team, setTeams }) => {
    const [teamInfo, setTeamInfo] = useState({
        name: team.name || '',
        contactEmail: team.contactEmail || '',
        social: {
            twitter: team.social?.twitter || '',
            instagram: team.social?.instagram || '',
            facebook: team.social?.facebook || ''
        },
        location: team.location || '',
        founded: team.founded || '',
        website: team.website || '',
        description: team.description || ''
    });
    const [saved, setSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setTeams(prevTeams => prevTeams.map(t => 
            t.id === team.id ? { 
                ...t, 
                name: teamInfo.name,
                contactEmail: teamInfo.contactEmail,
                social: teamInfo.social,
                location: teamInfo.location,
                founded: teamInfo.founded,
                website: teamInfo.website,
                description: teamInfo.description
            } : t
        ));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleSocialChange = (platform, value) => {
        setTeamInfo(prev => ({
            ...prev,
            social: { ...prev.social, [platform]: value }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Team Information & Contact</h2>
            
            <form onSubmit={handleSave} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Home className="mr-2" size={20} />
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Team Name</label>
                            <input
                                type="text"
                                value={teamInfo.name}
                                onChange={(e) => setTeamInfo(prev => ({...prev, name: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Enter team name"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={teamInfo.location}
                                onChange={(e) => setTeamInfo(prev => ({...prev, location: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="City, State"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Founded Year</label>
                            <input
                                type="text"
                                value={teamInfo.founded}
                                onChange={(e) => setTeamInfo(prev => ({...prev, founded: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="2020"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Website URL</label>
                            <input
                                type="url"
                                value={teamInfo.website}
                                onChange={(e) => setTeamInfo(prev => ({...prev, website: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://yourteam.com"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block font-semibold text-slate-700 mb-2">Team Description</label>
                        <textarea
                            value={teamInfo.description}
                            onChange={(e) => setTeamInfo(prev => ({...prev, description: e.target.value}))}
                            rows="4"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Tell us about your team..."
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Mail className="mr-2" size={20} />
                        Contact Information
                    </h3>
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Contact Email</label>
                        <input
                            type="email"
                            value={teamInfo.contactEmail}
                            onChange={(e) => setTeamInfo(prev => ({...prev, contactEmail: e.target.value}))}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="coach@yourteam.com"
                        />
                        <p className="text-sm text-slate-500 mt-1">This email will be used for league communications and fan contact.</p>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="mr-2" size={20} />
                        Social Media Links
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Twitter className="mr-2 text-blue-400" size={18} />
                                Twitter/X Profile
                            </label>
                            <input
                                type="url"
                                value={teamInfo.social.twitter}
                                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://twitter.com/yourteam or https://x.com/yourteam"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Instagram className="mr-2 text-pink-500" size={18} />
                                Instagram Profile
                            </label>
                            <input
                                type="url"
                                value={teamInfo.social.instagram}
                                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://instagram.com/yourteam"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Facebook className="mr-2 text-blue-600" size={18} />
                                Facebook Page
                            </label>
                            <input
                                type="url"
                                value={teamInfo.social.facebook}
                                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://facebook.com/yourteam"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end items-center space-x-4">
                    {saved && (
                        <div className="flex items-center text-green-600">
                            <span className="mr-2">✓</span>
                            <span className="font-semibold">Team information saved successfully!</span>
                        </div>
                    )}
                    <button 
                        type="submit" 
                        className="bg-red-800 text-white px-8 py-3 rounded-lg hover:bg-red-900 font-semibold flex items-center"
                    >
                        <Settings className="mr-2" size={18} />
                        Save Team Information
                    </button>
                </div>
            </form>
        </div>
    );
};

const TeamDetailPage = ({ teamId, teams, players, leagueSchedule, currentUser, setPlayers, setTeams, websiteStyle, playMusic, stopAllMusic, musicState }) => {
    const team = teams.find(t => t.id === teamId);
    const teamPlayers = players.filter(p => p.teams.includes(teamId) && p.active);
    const [activeTab, setActiveTab] = useState('roster');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

    // Ensure activeTab is visible, fallback to first visible tab
    React.useEffect(() => {
        if (team?.style?.visibleTabs) {
            const visibleTabs = ['roster', 'schedule', 'media', 'social', 'contact'].filter(
                tab => team.style.visibleTabs[tab] !== false
            );
            if (!visibleTabs.includes(activeTab) && visibleTabs.length > 0) {
                setActiveTab(visibleTabs[0]);
            }
        }
    }, [team, activeTab]);

    // Sort players: coaches first, then players
    const sortedTeamPlayers = teamPlayers.sort((a, b) => {
        const aIsCoach = a.roles && a.roles.includes('coach');
        const bIsCoach = b.roles && b.roles.includes('coach');
        
        if (aIsCoach && !bIsCoach) return -1;
        if (!aIsCoach && bIsCoach) return 1;
        
        // If both are coaches or both are players, sort by last name
        return a.lastName.localeCompare(b.lastName);
    });

    const handlePlayerClick = (player) => {
        setSelectedPlayer(player);
        setIsPlayerModalOpen(true);
    };

    const handleClosePlayerModal = () => {
        setIsPlayerModalOpen(false);
        setSelectedPlayer(null);
    };

    const getTeam = (id) => teams.find(t => t.id === id);
    const isAuthorizedToManage = currentUser && (
        currentUser.roles.includes('admin') || 
        ((currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) && currentUser.teamId === teamId)
    );
    const teamSchedule = leagueSchedule.map(day => ({
        ...day,
        games: day.games.filter(g => g.home === teamId || g.away === teamId)
    })).filter(day => day.games.length > 0);

    if (!team) return <div className="p-8 text-center text-red-500">Team not found!</div>;

    const handleSocialSave = (newSocial) => {
        setTeams(prevTeams => prevTeams.map(t =>
            t.id === teamId ? { ...t, social: newSocial } : t
        ));
    };

    const TeamTab = ({tabName, label, isManagerTab = false}) => {
        if (isManagerTab && !isAuthorizedToManage) return null;
        return (
            <button 
                onClick={() => setActiveTab(tabName)} 
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tabName ? 'text-slate-800' : 'text-slate-500 border-transparent hover:border-slate-300'}`}
                style={{ borderColor: activeTab === tabName ? (team.style?.primaryColor || '#dc2626') : 'transparent' }}
            >
                {label}
            </button>
        );
    };

    const teamBackgroundStyle = team.style?.pageBackgroundImage ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - (team.style.pageBackgroundOpacity !== undefined ? team.style.pageBackgroundOpacity : 0.1)}), rgba(255, 255, 255, ${1 - (team.style.pageBackgroundOpacity !== undefined ? team.style.pageBackgroundOpacity : 0.1)})), url(${team.style.pageBackgroundImage})`,
        backgroundSize: team.style.pageBackgroundMode === 'contain' ? 'contain' : team.style.pageBackgroundMode === 'repeat' ? 'auto' : 'cover',
        backgroundRepeat: team.style.pageBackgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    } : getBackgroundStyle(websiteStyle);

    return (
        <div className="min-h-screen" style={teamBackgroundStyle}>
            <div className="p-4 md:p-8">
                <div 
                    className="bg-cover bg-center h-48 rounded-lg mb-6 flex items-end p-4 shadow-inner relative" 
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${team.style?.bannerUrl || 'https://placehold.co/1200x400/4A5568/FFFFFF?text=MLBL'})` }}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                        <img src={team.logo} alt={team.name} className="w-24 h-24 mr-4 rounded-full bg-white p-2 shadow-lg" />
                        <div>
                            <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg">{team.name}</h1>
                            <p className="text-lg text-white opacity-90 drop-shadow-lg">{team.division} Lacrosse</p>
                        </div>
                    </div>
                    
                    {/* Music Controls */}
                    {team.musicUrl && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    if (musicState.currentTrack?.teamId === team.id && musicState.isPlaying) {
                                        stopAllMusic();
                                    } else {
                                        playMusic(team.musicUrl, `${team.name} Theme`, team.id);
                                    }
                                }}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all shadow-lg"
                                title={musicState.currentTrack?.teamId === team.id && musicState.isPlaying ? "Stop Team Music" : "Play Team Music"}
                            >
                                {musicState.currentTrack?.teamId === team.id && musicState.isPlaying ? 
                                    <Pause size={24} /> : <Play size={24} />
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex border-b mb-6 flex-wrap">
                {(team.style?.visibleTabs?.roster !== false) && <TeamTab tabName="roster" label="Roster & Stats" />}
                {(team.style?.visibleTabs?.schedule !== false) && <TeamTab tabName="schedule" label="Schedule" />}
                {(team.style?.visibleTabs?.media !== false) && <TeamTab tabName="media" label="Photos & Videos" />}
                {(team.style?.visibleTabs?.social !== false) && <TeamTab tabName="social" label="Social" />}
                {(team.style?.visibleTabs?.contact !== false) && <TeamTab tabName="contact" label="Contact" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_info" label="Team Info" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_calendar" label="Manage Calendar" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_players" label="Manage Players" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_media" label="Manage Media" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_locations" label="Manage Locations" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_groupme" label="Manage GroupMe" />}
                {isAuthorizedToManage && <TeamTab tabName="manage_style" label="Team Style" />}
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: team.style?.backgroundColor || 'transparent' }}>
                {activeTab === 'roster' && (
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <StatCard title="Wins" value={team.wins} color="text-green-500" />
                            <StatCard title="Losses" value={team.losses} color="text-red-500" />
                            <StatCard title="Points For" value={team.pf} color="text-slate-600" />
                            <StatCard title="Points Against" value={team.pa} color="text-orange-500" />
                        </div>

                        {/* Team Locations */}
                        {team.locations && team.locations.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Team Locations</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {team.locations.map(location => (
                                        <div key={location.id} className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderLeftColor: team.style?.primaryColor || '#dc2626' }}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-grow">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="text-lg font-semibold text-slate-800">{location.name}</h3>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            location.type === 'field' ? 'bg-green-100 text-green-800' :
                                                            location.type === 'stadium' ? 'bg-blue-100 text-blue-800' :
                                                            location.type === 'gym' ? 'bg-orange-100 text-orange-800' :
                                                            location.type === 'training' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-slate-100 text-slate-800'
                                                        }`}>
                                                            {location.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start space-x-2 text-slate-600 mb-2">
                                                        <MapPin className="mt-0.5 flex-shrink-0" size={16} />
                                                        <button 
                                                            onClick={() => {
                                                                const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=k`;
                                                                window.open(mapsUrl, '_blank');
                                                            }}
                                                            className="text-sm text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                                            title="Click to open in Google Maps"
                                                        >
                                                            {location.address}
                                                        </button>
                                                    </div>
                                                    {location.description && (
                                                        <p className="text-sm text-slate-500">{location.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team GroupMe Chats - Only visible to players, coaches, and admins */}
                        {currentUser && (currentUser.roles.includes('player') || currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach') || currentUser.roles.includes('admin')) && team.groupMes && team.groupMes.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Team Chat Groups</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {team.groupMes.map(groupMe => (
                                        <div key={groupMe.id} className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderLeftColor: team.style?.primaryColor || '#dc2626' }}>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    {groupMe.image ? (
                                                        <img 
                                                            src={groupMe.image} 
                                                            alt={groupMe.name}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className={`w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ${groupMe.image ? 'hidden' : 'flex'}`}
                                                    >
                                                        <MessageSquare className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="flex-grow">
                                                    <h3 className="text-lg font-semibold text-slate-800">{groupMe.name}</h3>
                                                    {groupMe.description && (
                                                        <p className="text-sm text-slate-600 mt-1">{groupMe.description}</p>
                                                    )}
                                                    <button 
                                                        onClick={() => window.open(groupMe.url, '_blank')}
                                                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                                                    >
                                                        <MessageSquare className="mr-1 h-4 w-4" />
                                                        Join Chat
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Roster</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {sortedTeamPlayers.map(player => 
                                    <PlayerCard 
                                        key={player.id} 
                                        player={player} 
                                        teamStyle={team.style}
                                        onClick={() => handlePlayerClick(player)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Player Card Modal */}
                        <PlayerCardModal
                            player={selectedPlayer}
                            teamStyle={team.style}
                            teams={teams}
                            isOpen={isPlayerModalOpen}
                            onClose={handleClosePlayerModal}
                        />
                    </div>
                )}
                
                {activeTab === 'schedule' && (
                     <div className="space-y-6">
                        {/* Team Calendar Events */}
                        {team.calendar && team.calendar.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-slate-700 pb-2 border-b-2 border-blue-600 mb-3">
                                    Team Events
                                </h2>
                                <div className="space-y-3">
                                    {team.calendar.map(event => {
                                        if (event.type === 'tournament') {
                                            // Tournament event - show as summary card
                                            return (
                                                <div key={event.id} className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Trophy className="text-yellow-600" size={16} />
                                                                <h3 className="font-bold text-slate-800">{event.title}</h3>
                                                            </div>
                                                            <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                                                <span className="flex items-center">
                                                                    <Calendar className="mr-1 h-4 w-4"/>
                                                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    {event.time}
                                                                </span>
                                                                {event.location && (
                                                                    <ClickableLocation 
                                                                        locationName={event.location}
                                                                        teams={teams}
                                                                        className="flex items-center"
                                                                    >
                                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                                        {event.location}
                                                                    </ClickableLocation>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 text-sm">
                                                                <span className="text-slate-700 font-medium">{team.name} participating in this tournament</span>
                                                            </div>
                                                            {event.description && (
                                                                <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center ml-4">
                                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                                TOURNAMENT
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {event.imageUrl && (
                                                        <div className="mt-3">
                                                            <img src={event.imageUrl} alt="Event" className="w-full h-32 object-cover rounded-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } else {
                                            // Regular event
                                            return (
                                                <div key={event.id} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-grow">
                                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                                            <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                                                <span className="flex items-center">
                                                                    <Calendar className="mr-1 h-4 w-4"/>
                                                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    {event.time}
                                                                </span>
                                                                {event.location && (
                                                                    <ClickableLocation 
                                                                        locationName={event.location}
                                                                        teams={teams}
                                                                        className="flex items-center"
                                                                    >
                                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                                        {event.location}
                                                                    </ClickableLocation>
                                                                )}
                                                            </div>
                                                            {event.description && (
                                                                <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center ml-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                                event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-slate-100 text-slate-800'
                                                            }`}>
                                                                {event.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {event.imageUrl && (
                                                        <div className="mt-3">
                                                            <img src={event.imageUrl} alt="Event" className="w-full h-32 object-cover rounded-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        )}

                        {/* League Games */}
                        {teamSchedule.map(day => (
                            <div key={day.date}>
                                <h2 className="text-xl font-semibold text-slate-700 pb-2 border-b-2 border-red-800 mb-3">
                                    League Games - {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </h2>
                                <div className="space-y-4">
                                    {day.games.map((game) => {
                                        const home = getTeam(game.home);
                                        const away = getTeam(game.away);
                                        if (!home || !away) return null;
                                        return (
                                            <div key={game.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="text-center w-32">
                                                        <img src={away.logo} alt={away.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1"/>
                                                        <p className="font-bold text-sm mt-1">{away.name}</p>
                                                    </div>
                                                    <span className="text-2xl font-bold text-slate-400 mx-4">@</span>
                                                    <div className="text-center w-32">
                                                        <img src={home.logo} alt={home.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1"/>
                                                        <p className="font-bold text-sm mt-1">{home.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">{game.time}</p>
                                                    <p className="text-sm text-slate-500">{game.location}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'media' && (
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Media Gallery</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {team.media.length > 0 ? team.media.map(item => (
                                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    {item.type === 'photo' ? (
                                        <img src={item.url} alt={item.caption} className="w-full h-auto object-cover"/>
                                    ) : (
                                        <div className="aspect-w-16 aspect-h-9">
                                            <iframe src={item.url} title={item.caption} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>
                                        </div>
                                    )}
                                    <p className="p-3 text-slate-600 text-sm">{item.caption}</p>
                                </div>
                            )) : <p>No media has been added for this team yet.</p>}
                        </div>
                    </div>
                )}
                
                {activeTab === 'social' && ( <div className="max-w-2xl mx-auto"> <SocialCard entity={team} /> </div> )}
                {activeTab === 'contact' && ( <div className="max-w-2xl mx-auto"> <ContactCard entity={team} /> </div> )}
                {activeTab === 'manage_info' && isAuthorizedToManage && <TeamInfoManager team={team} setTeams={setTeams} />}
                {activeTab === 'manage_calendar' && isAuthorizedToManage && <TeamCalendarManager team={team} teams={teams} setTeams={setTeams} />}
                {activeTab === 'manage_players' && isAuthorizedToManage && <PlayerManager players={players} setPlayers={setPlayers} teams={[team]} currentUser={currentUser} />}
                {activeTab === 'manage_media' && isAuthorizedToManage && <MediaManager team={team} setTeams={setTeams} />}
                {activeTab === 'manage_locations' && isAuthorizedToManage && <LocationManager team={team} setTeams={setTeams} />}
                {activeTab === 'manage_groupme' && isAuthorizedToManage && <GroupMeManager team={team} setTeams={setTeams} />}
                {activeTab === 'manage_style' && isAuthorizedToManage && <TeamStyleManager teams={[team]} setTeams={setTeams} currentUser={currentUser} />}
            </div>
            </div>
        </div>
    );
};

const ChatPage = ({ currentUser }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Welcome to the league chat!', displayName: 'System', timestamp: new Date() },
        { id: 2, text: 'Great game last weekend!', displayName: 'Coach Mike', timestamp: new Date() }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [channel, setChannel] = useState('league');
    const messagesEndRef = useRef(null);
    
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;
        
        const message = {
            id: Date.now(),
            text: newMessage,
            timestamp: new Date(),
            displayName: currentUser.name,
            uid: currentUser.id
        };
        
        setMessages(prev => [...prev, message]);
        setNewMessage('');
    };

    return (
        <div className="p-4 md:p-8 flex flex-col h-full">
            <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">League Chat</h1>
            <div className="flex border rounded-lg shadow-md bg-white flex-grow">
                <div className="w-1/4 border-r bg-slate-50">
                    <div className="p-4 font-bold text-lg border-b">Channels</div>
                    <ul>
                        {['league', 'falcons', 'bears'].map(ch => (
                            <li key={ch} className={`p-4 cursor-pointer hover:bg-slate-200 ${channel === ch ? 'bg-red-100 font-semibold' : ''}`} onClick={() => setChannel(ch)}>
                                # {ch.charAt(0).toUpperCase() + ch.slice(1)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-3/4 flex flex-col">
                    <div className="flex-grow p-4 overflow-y-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex mb-4 ${msg.uid === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-lg ${msg.uid === currentUser?.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                    <p className="font-bold text-sm">{msg.displayName}</p>
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-75 mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-slate-100 border-t">
                        <form onSubmit={handleSendMessage} className="flex">
                            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Message in #${channel}`} className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-800" />
                            <button type="submit" className="bg-red-800 text-white px-4 rounded-r-lg hover:bg-red-900">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN COMPONENTS ---
const PlayerForm = ({ initialPlayer, onSave, onCancel, managedTeams, isAdmin }) => {
    const [player, setPlayer] = useState(initialPlayer);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPlayer(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handlePositionChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setPlayer(prev => ({ ...prev, positions: selectedOptions }));
    };

    const handleTeamChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setPlayer(prev => ({ ...prev, teams: selectedOptions }));
    };
    
    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setPlayer(prev => ({...prev, photo: fileUrl}));
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(player);
    };
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-4">{player?.id ? 'Edit Player' : 'Add New Player'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="firstName" value={player.firstName || ''} onChange={handleChange} placeholder="First Name" className="w-full p-2 border rounded" required />
                        <input type="text" name="lastName" value={player.lastName || ''} onChange={handleChange} placeholder="Last Name" className="w-full p-2 border rounded" required />
                        <input type="text" name="nickname" value={player.nickname || ''} onChange={handleChange} placeholder="Nickname" className="w-full p-2 border rounded" />
                        <input type="email" name="email" value={player.email || ''} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
                        <input type="tel" name="phone" value={player.phone || ''} onChange={handleChange} placeholder="Cell Phone" className="w-full p-2 border rounded" />
                        <input type="number" name="number" value={player.number || ''} onChange={handleChange} placeholder="Player #" className="w-full p-2 border rounded" />
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team(s)</label>
                                <select multiple name="teams" value={player.teams || []} onChange={handleTeamChange} className="w-full p-2 border rounded h-24" required>
                                    {managedTeams.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position(s)</label>
                            <select multiple value={player.positions || []} onChange={handlePositionChange} className="w-full p-2 border rounded h-24" required>
                                <option>Attack</option><option>Middie</option><option>Defense</option><option>Goalie</option>
                            </select>
                             <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Handedness</label>
                            <select name="handedness" value={player.handedness || 'Right'} onChange={handleChange} className="w-full p-2 border rounded" required>
                                <option value="Right">Right Handed</option>
                                <option value="Left">Left Handed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Player Photo</label>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"/>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="active" id="active" checked={player.active} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Player</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const PlayerManager = ({ players, setPlayers, teams, currentUser }) => {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const isAdmin = currentUser.roles.includes('admin');
    
    const managedTeams = isAdmin
        ? teams 
        : teams.filter(t => t.id === currentUser.teamId);
    const [managedTeamId, setManagedTeamId] = useState(isAdmin ? 'all' : currentUser.teamId);

    const handleSave = (playerToSave) => {
        if (playerToSave.id) {
             setPlayers(prevPlayers => prevPlayers.map(p => p.id === playerToSave.id ? playerToSave : p));
        } else {
            const newPlayer = { ...playerToSave, id: Date.now() };
            setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
        }
        setEditingPlayer(null);
    };
    const teamRoster = managedTeamId === 'all' 
        ? players 
        : players.filter(p => p.teams.includes(managedTeamId));
    return (
        <div>
            {editingPlayer && <PlayerForm 
                initialPlayer={editingPlayer} 
                onSave={handleSave} 
                onCancel={() => setEditingPlayer(null)} 
                managedTeams={managedTeams} 
                isAdmin={isAdmin}
            />}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label htmlFor="team-select" className="mr-2 font-semibold">Manage Roster for:</label>
                    <select id="team-select" value={managedTeamId} onChange={e => setManagedTeamId(e.target.value)} className="p-2 border rounded-md">
                        {isAdmin && <option value="all">All Players</option>}
                        {managedTeams.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <button onClick={() => setEditingPlayer({firstName: '', lastName: '', nickname: '', email: '', phone: '', number: '', positions: [], teams: [managedTeamId === 'all' ? managedTeams[0].id : managedTeamId], photo: '', active: true, handedness: 'Right'})} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"><Plus className="mr-2 h-4 w-4"/> Add Player</button>
            </div>
            <ul className="mt-4 space-y-2">
                {teamRoster.map(p => (
                    <li key={p.id} className={`flex items-center p-3 border rounded-lg bg-white shadow-sm ${!p.active && 'opacity-50 bg-slate-100'}`}>
                        <span className="flex-grow">{p.firstName} {p.lastName} (#{p.number}) - {Array.isArray(p.positions) ? p.positions.join(', ') : p.positions}</span>
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => setEditingPlayer(p)} className="text-slate-500 hover:text-slate-700 mr-2 p-1"><Edit size={18}/></button>
                            <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const TeamManager = ({ teams, setTeams }) => {
    const [editingTeam, setEditingTeam] = useState(null);
    const handleSave = (e) => {
        e.preventDefault();
        if (editingTeam.id) {
            setTeams(teams.map(t => t.id === editingTeam.id ? editingTeam : t));
        } else {
            setTeams([...teams, { ...editingTeam, id: editingTeam.name.toLowerCase().replace(/\s/g, ''), wins: 0, losses: 0, ties: 0, pf: 0, pa: 0, active: true, media: [], calendar: [] }]);
        }
        setEditingTeam(null);
    };
    const toggleActive = (team) => {
        setTeams(teams.map(t => t.id === team.id ? {...t, active: !t.active} : t));
    };

    const TeamForm = () => (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">{editingTeam?.id ? 'Edit Team' : 'Add New Team'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <input type="text" value={editingTeam.name || ''} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} placeholder="Team Name" className="w-full p-2 border rounded" required />
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                        <select 
                            value={editingTeam.division || 'Field'} 
                            onChange={e => setEditingTeam({...editingTeam, division: e.target.value})} 
                            className="w-full p-2 border rounded" 
                            required
                        >
                            <option value="Field">Field Lacrosse</option>
                            <option value="Box">Box Lacrosse</option>
                        </select>
                    </div>
                    
                    <FileUploadInput
                        label="Team Logo"
                        accept="image/*"
                        currentValue={editingTeam.logo || ''}
                        onChange={(url) => setEditingTeam({...editingTeam, logo: url})}
                        placeholder="Upload team logo"
                    />
                    
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setEditingTeam(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Team</button>
                    </div>
                </form>
            </div>
        </div>
    );
    return (
        <div>
            {editingTeam && <TeamForm />}
            <div className="flex justify-end mb-4">
                <button onClick={() => setEditingTeam({name: '', logo: '', division: 'Field', musicUrl: ''})} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"><Plus className="mr-2 h-4 w-4"/> Add Team</button>
            </div>
             <ul className="mt-4 space-y-2">
                {teams.map(t => (
                    <li key={t.id} className={`flex items-center p-3 border rounded-lg bg-white shadow-sm ${!t.active && 'opacity-50 bg-slate-100'}`}>
                        <div className="flex-grow flex items-center gap-3">
                            <img src={t.logo} alt={t.name} className="w-8 h-8 rounded-full bg-white p-1" />
                            <span className="font-semibold">{t.name}</span>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => toggleActive(t)} className={`mr-2 p-1 ${t.active ? 'text-green-500' : 'text-slate-500'}`}>
                                {t.active ? <ToggleRight size={22}/> : <ToggleLeft size={22} />}
                            </button>
                            <button onClick={() => setEditingTeam(t)} className="text-slate-500 hover:text-slate-700 mr-2 p-1"><Edit size={18}/></button>
                            <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ScoreManager = ({ leagueSchedule, gameTickerData, setGameTickerData, teams }) => {
    const [scores, setScores] = useState({});
    const handleScoreChange = (gameId, team, value) => {
        setScores(prev => ({ ...prev, [gameId]: { ...prev[gameId], [team]: value } }));
    };

    const handleSaveScore = (game) => {
        const gameId = game.id;
        const homeScore = parseInt(scores[gameId]?.home, 10);
        const awayScore = parseInt(scores[gameId]?.away, 10);
        if (isNaN(homeScore) || isNaN(awayScore)) {
            alert("Please enter valid scores for both teams.");
            return;
        }
        
        setGameTickerData(prevData => prevData.map(g => 
            g.id === gameId ? { ...g, homeScore, awayScore, status: 'Final' } : g
        ));
    };

    const getTeam = (id) => teams.find(t => t.id === id);
    return (
        <div>
            {leagueSchedule.map(day => (
                <div key={day.date} className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 pb-2 border-b mb-3">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    {day.games.map(game => {
                        const gameData = gameTickerData.find(g => g.id === game.id);
                        const home = getTeam(game.home);
                        const away = getTeam(game.away);
                        if (!home || !away) return null;

                        return (
                            <div key={game.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex-grow">
                                    <span className="font-semibold">{home.name}</span> vs <span className="font-semibold">{away.name}</span>
                                    <span className="text-sm text-slate-500 ml-2">({game.location})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder={home.logo} className="w-16 p-1 border rounded text-center" disabled={gameData?.status === 'Final'} defaultValue={gameData?.homeScore} onChange={e => handleScoreChange(game.id, 'home', e.target.value)} />
                                    <span>-</span>
                                    <input type="number" placeholder={away.logo} className="w-16 p-1 border rounded text-center" disabled={gameData?.status === 'Final'} defaultValue={gameData?.awayScore} onChange={e => handleScoreChange(game.id, 'away', e.target.value)} />
                                    {gameData?.status !== 'Final' ? (
                                        <button onClick={() => handleSaveScore(game)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Save</button>
                                    ) : (
                                        <span className="text-sm font-bold text-green-600 px-3">FINAL</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const UserManager = ({ users, setUsers, teams }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [viewTab, setViewTab] = useState('active'); // 'active', 'pending'

    // User approval/rejection handlers
    const handleApproveUser = (userId) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                const approvedUser = {
                    ...u,
                    status: 'active',
                    roles: [u.preferredRole || 'player'],
                    roleIds: u.preferredRole === 'coach' ? ['team_coach'] : ['player'],
                    approvedAt: new Date().toISOString().split('T')[0]
                };
                return approvedUser;
            }
            return u;
        }));
    };

    const handleRejectUser = (userId) => {
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };

    const handleRoleChange = (role, checked) => {
        const currentRoles = editingUser.roles || [];
        if (checked) {
            setEditingUser({...editingUser, roles: [...currentRoles, role]});
        } else {
            setEditingUser({...editingUser, roles: currentRoles.filter(r => r !== role)});
        }
    };

    const activeUsers = users.filter(u => u.status === 'active');
    const pendingUsers = users.filter(u => u.status === 'pending');

    const UserForm = () => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setEditingUser(null)}
        >
            <div 
                className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold mb-4">Edit User: {editingUser.name}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block font-semibold mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['player', 'coach', 'player/coach', 'admin'].map(role => (
                               <label key={role} className="flex items-center space-x-2">
                                   <input type="checkbox" checked={editingUser.roles.includes(role)} onChange={e => handleRoleChange(role, e.target.checked)} />
                                   <span className="capitalize">{role}</span>
                               </label>
                           ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-semibold">Team</label>
                        <select value={editingUser.teamId || ''} onChange={e => setEditingUser({...editingUser, teamId: e.target.value})} className="w-full p-2 border rounded">
                            <option value="">(No Team)</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setEditingUser(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div>
            {editingUser && <UserForm />}
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b mb-4">
                <button 
                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                        viewTab === 'active' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-600 hover:text-blue-600'
                    }`}
                    onClick={() => setViewTab('active')}
                >
                    Active Users ({activeUsers.length})
                </button>
                <button 
                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                        viewTab === 'pending' 
                            ? 'border-orange-600 text-orange-600' 
                            : 'border-transparent text-slate-600 hover:text-orange-600'
                    }`}
                    onClick={() => setViewTab('pending')}
                >
                    Pending Approval ({pendingUsers.length})
                </button>
            </div>

            {/* Active Users Tab */}
            {viewTab === 'active' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Active Users</h3>
                    {activeUsers.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No active users found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {activeUsers.map(user => (
                                <li key={user.id} className="flex items-center p-3 border rounded-lg bg-white shadow-sm">
                                    <div className="flex-grow">
                                        <p className="font-bold">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                        {user.teamId && (
                                            <p className="text-xs text-slate-400">
                                                Team: {teams.find(t => t.id === user.teamId)?.name || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 ml-4 flex items-center gap-4">
                                        <span className={`font-semibold capitalize px-2 py-1 rounded-full text-xs ${user.roles.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.roles.length > 0 ? user.roles.join(', ') : 'Unassigned'}
                                        </span>
                                        <button onClick={() => setEditingUser(user)} className="text-slate-500 hover:text-slate-700 p-1">
                                            <Edit size={18}/>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Pending Users Tab */}
            {viewTab === 'pending' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Pending Approval</h3>
                    {pendingUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <UserCheck size={48} className="mx-auto mb-4" />
                            <p>No pending user requests.</p>
                            <p className="text-sm">New registration requests will appear here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {pendingUsers.map(user => (
                                <li key={user.id} className="border rounded-lg bg-yellow-50 border-yellow-200 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-lg">{user.name}</h4>
                                            <p className="text-slate-600">{user.email}</p>
                                            {user.phone && (
                                                <p className="text-sm text-slate-500">Phone: {user.phone}</p>
                                            )}
                                        </div>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                                            PENDING
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <strong>Preferred Role:</strong>
                                            <span className="ml-2 capitalize">{user.preferredRole}</span>
                                        </div>
                                        <div>
                                            <strong>Interested Team:</strong>
                                            <span className="ml-2">
                                                {user.teamId ? teams.find(t => t.id === user.teamId)?.name || 'Unknown' : 'No preference'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {user.reasonForJoining && (
                                        <div className="mb-4">
                                            <strong className="text-sm">Why they want to join:</strong>
                                            <p className="text-sm text-slate-700 bg-white p-2 rounded border mt-1">
                                                {user.reasonForJoining}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            Applied: {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleRejectUser(user.id)}
                                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApproveUser(user.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                Approve as {user.preferredRole}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

const TeamStyleManager = ({ teams, setTeams, currentUser }) => {
    const [selectedTeamId, setSelectedTeamId] = useState(
        currentUser.roles.includes('admin') ? teams[0]?.id : currentUser.teamId
    );
    const [style, setStyle] = useState({});
    const [saved, setSaved] = useState(false);

    // Filter teams based on user role
    const availableTeams = currentUser.roles.includes('admin') 
        ? teams 
        : teams.filter(t => t.id === currentUser.teamId);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    // Initialize style when team changes
    React.useEffect(() => {
        if (selectedTeam) {
            setStyle(selectedTeam.style || {
                bannerUrl: '',
                primaryColor: '#dc2626',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontFamily: 'Inter, sans-serif',
                formBackgroundColor: '#f8fafc',
                visibleTabs: {
                    roster: true,
                    schedule: true,
                    media: true,
                    social: true,
                    contact: true
                }
            });
        }
    }, [selectedTeam]);

    const handleSave = (e) => {
        e.preventDefault();
        setTeams(prevTeams => prevTeams.map(team => 
            team.id === selectedTeamId ? { ...team, style } : team
        ));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleImageUpload = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setStyle(prev => ({...prev, [field]: fileUrl}));
        }
    };

    if (!selectedTeam) return <div>No team found.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {currentUser.roles.includes('admin') && (
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Select Team</label>
                        <select 
                            value={selectedTeamId} 
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg"
                        >
                            {availableTeams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6 bg-slate-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-slate-800">Style Controls</h3>
                    
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Team Logo</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'logoUrl')}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        {selectedTeam.logo && (
                            <img src={selectedTeam.logo} alt="Current Logo" className="w-16 h-16 mt-2 rounded-full border" />
                        )}
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Team Banner</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'bannerUrl')}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                        <input 
                            type="url"
                            value={style.bannerUrl || ''}
                            onChange={(e) => setStyle(prev => ({...prev, bannerUrl: e.target.value}))}
                            placeholder="Or enter banner image URL"
                            className="w-full p-2 border border-slate-300 rounded-lg mt-2"
                        />
                    </div>

                    {/* === TEAM BACKGROUND IMAGE === */}
                    <div className="border-t border-slate-300 pt-4">
                        <label className="block font-semibold text-slate-700 mb-2">Team Page Background Image</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'pageBackgroundImage')}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <input 
                            type="url"
                            value={style.pageBackgroundImage || ''}
                            onChange={(e) => setStyle(prev => ({...prev, pageBackgroundImage: e.target.value}))}
                            placeholder="Or enter background image URL"
                            className="w-full p-2 border border-slate-300 rounded-lg mt-2"
                        />
                        
                        {/* Background Display Mode */}
                        <div className="mt-4">
                            <label className="block font-semibold text-slate-700 mb-2">Background Display Mode</label>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="teamBackgroundMode" 
                                        value="cover" 
                                        checked={(style.pageBackgroundMode || 'cover') === 'cover'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundMode: e.target.value}))} 
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">Cover (Fill)</div>
                                        <div className="text-xs text-slate-500">Covers entire page area</div>
                                    </div>
                                </label>
                                
                                <label className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="teamBackgroundMode" 
                                        value="contain" 
                                        checked={(style.pageBackgroundMode || 'cover') === 'contain'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundMode: e.target.value}))} 
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">Contain (Fit)</div>
                                        <div className="text-xs text-slate-500">Shows entire image within page</div>
                                    </div>
                                </label>
                                
                                <label className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="teamBackgroundMode" 
                                        value="repeat" 
                                        checked={(style.pageBackgroundMode || 'cover') === 'repeat'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundMode: e.target.value}))} 
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">Repeat (Tile)</div>
                                        <div className="text-xs text-slate-500">Repeats image as pattern</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {/* Background Opacity */}
                        <div className="mt-4">
                            <label className="block font-semibold text-slate-700 mb-2">
                                Background Opacity: {Math.round(((style.pageBackgroundOpacity !== undefined ? style.pageBackgroundOpacity : 0.1)) * 100)}%
                            </label>
                            <input 
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={style.pageBackgroundOpacity !== undefined ? style.pageBackgroundOpacity : 0.1}
                                onChange={(e) => setStyle(prev => ({...prev, pageBackgroundOpacity: parseFloat(e.target.value)}))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Transparent (Subtle)</span>
                                <span>Opaque (Bold)</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Lower values make the background more subtle for better text readability</p>
                        </div>
                        
                        <p className="text-xs text-slate-500 mt-2">Background image for this team's page</p>
                    </div>

                    {/* === TEAM MUSIC === */}
                    <div className="border-t border-slate-300 pt-4">
                        <label className="block font-semibold text-slate-700 mb-2">Team Music</label>
                        <input 
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const fileUrl = URL.createObjectURL(e.target.files[0]);
                                    setStyle(prev => ({...prev, musicUrl: fileUrl}));
                                    // Also update the team directly for immediate music functionality
                                    setTeams(prevTeams => prevTeams.map(team => 
                                        team.id === selectedTeamId ? { ...team, musicUrl: fileUrl } : team
                                    ));
                                }
                            }}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <input 
                            type="url"
                            value={style.musicUrl || selectedTeam.musicUrl || ''}
                            onChange={(e) => {
                                setStyle(prev => ({...prev, musicUrl: e.target.value}));
                                // Also update the team directly for immediate music functionality
                                setTeams(prevTeams => prevTeams.map(team => 
                                    team.id === selectedTeamId ? { ...team, musicUrl: e.target.value } : team
                                ));
                            }}
                            placeholder="Or enter music URL (MP3, Spotify, SoundCloud, etc.)"
                            className="w-full p-2 border border-slate-300 rounded-lg mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">Team theme song that plays when viewing this team's page</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Primary Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.primaryColor }}
                                >
                                    <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        {style.primaryColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.primaryColor}
                                    onChange={(e) => setStyle(prev => ({...prev, primaryColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Background Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.backgroundColor }}
                                >
                                    <span className="text-slate-700 font-semibold text-sm bg-white bg-opacity-75 px-2 py-1 rounded">
                                        {style.backgroundColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.backgroundColor}
                                    onChange={(e) => setStyle(prev => ({...prev, backgroundColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Text Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3 bg-white"
                                >
                                    <span 
                                        className="font-semibold text-sm px-2 py-1 rounded"
                                        style={{ color: style.textColor }}
                                    >
                                        {style.textColor} Sample Text
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.textColor}
                                    onChange={(e) => setStyle(prev => ({...prev, textColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Form Background</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.formBackgroundColor }}
                                >
                                    <span className="text-slate-700 font-semibold text-sm bg-white bg-opacity-75 px-2 py-1 rounded">
                                        {style.formBackgroundColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.formBackgroundColor}
                                    onChange={(e) => setStyle(prev => ({...prev, formBackgroundColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Font Family</label>
                            <select 
                                value={style.fontFamily}
                                onChange={(e) => setStyle(prev => ({...prev, fontFamily: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg"
                            >
                                <option value="Inter, sans-serif">Inter (Default)</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="'Oswald', sans-serif">Oswald (Sports)</option>
                            </select>
                        </div>
                    </div>

                    {/* Tab Visibility Controls */}
                    <div className="mt-6">
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Visible Tabs</h4>
                        <p className="text-sm text-slate-600 mb-4">Control which tabs are visible on your team page to visitors</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'roster', label: 'Roster & Stats', default: true },
                                { key: 'schedule', label: 'Schedule', default: true },
                                { key: 'media', label: 'Photos & Videos', default: true },
                                { key: 'social', label: 'Social', default: true },
                                { key: 'contact', label: 'Contact', default: true }
                            ].map(tab => (
                                <label key={tab.key} className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={style.visibleTabs?.[tab.key] !== false}
                                        onChange={(e) => setStyle(prev => ({
                                            ...prev, 
                                            visibleTabs: {
                                                ...prev.visibleTabs,
                                                [tab.key]: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{tab.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end items-center space-x-4">
                        {saved && <span className="text-green-600 font-semibold">✓ Saved!</span>}
                        <button 
                            type="submit" 
                            className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 font-semibold"
                        >
                            Save Team Style
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden shadow-lg">
                    <div 
                        className="h-32 bg-cover bg-center flex items-end p-4 relative"
                        style={{ 
                            backgroundImage: style.bannerUrl ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${style.bannerUrl})` : `linear-gradient(45deg, ${style.primaryColor}, ${style.primaryColor}dd)`,
                            fontFamily: style.fontFamily
                        }}
                    >
                        <div className="flex items-center">
                            <img 
                                src={selectedTeam.logo} 
                                alt={selectedTeam.name} 
                                className="w-16 h-16 mr-3 rounded-full bg-white p-1 shadow-lg" 
                            />
                            <h2 className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: style.fontFamily }}>
                                {selectedTeam.name}
                            </h2>
                        </div>
                    </div>
                    <div className="p-4" style={{ backgroundColor: style.backgroundColor, fontFamily: style.fontFamily }}>
                        <div className="flex mb-4 border-b">
                            <button 
                                className="px-4 py-2 font-semibold border-b-2 transition-colors"
                                style={{ 
                                    borderColor: style.primaryColor, 
                                    color: style.primaryColor,
                                    fontFamily: style.fontFamily 
                                }}
                            >
                                Active Tab
                            </button>
                            <button 
                                className="px-4 py-2 font-semibold text-slate-500 border-b-2 border-transparent"
                                style={{ fontFamily: style.fontFamily }}
                            >
                                Inactive Tab
                            </button>
                        </div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                            Roster & Stats
                        </h4>
                        <p className="mb-4" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                            This is how your team page will look with the selected colors and fonts.
                        </p>
                        
                        {/* Form Preview */}
                        <div 
                            className="p-4 rounded-lg border mb-4"
                            style={{ backgroundColor: style.formBackgroundColor }}
                        >
                            <h5 className="font-semibold mb-3" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                                Sample Form
                            </h5>
                            <div className="space-y-2">
                                <input 
                                    type="text" 
                                    placeholder="Player Name" 
                                    className="w-full p-2 border rounded"
                                    style={{ fontFamily: style.fontFamily }}
                                />
                                <input 
                                    type="email" 
                                    placeholder="Email Address" 
                                    className="w-full p-2 border rounded"
                                    style={{ fontFamily: style.fontFamily }}
                                />
                            </div>
                        </div>
                        
                        <button 
                            className="px-4 py-2 text-white rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: style.primaryColor, fontFamily: style.fontFamily }}
                        >
                            Example Button
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WebsiteStyleManager = ({ websiteStyle, setWebsiteStyle }) => {
    const [style, setStyle] = useState(websiteStyle || {});
    const [saved, setSaved] = useState(false);

    React.useEffect(() => {
        setStyle(websiteStyle || {});
    }, [websiteStyle]);

    const handleSave = () => {
        setWebsiteStyle(style);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const FileUploadInput = ({ label, accept, currentValue, onChange, placeholder }) => (
        <div>
            <label className="block font-semibold text-slate-700 mb-2">{label}</label>
            <div className="space-y-2">
                <input 
                    type="file"
                    accept={accept}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => onChange(e.target.result);
                            reader.readAsDataURL(file);
                        }
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <input 
                    type="url"
                    value={currentValue || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder || "Or enter URL"}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* === LOGO & BRANDING === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Image className="mr-2" size={20} />
                            Logo & Branding
                        </h4>
                        
                        <div className="space-y-4">
                            <FileUploadInput
                                label="Website Logo"
                                accept="image/*"
                                currentValue={style.logoUrl || ''}
                                onChange={(url) => setStyle(prev => ({...prev, logoUrl: url}))}
                                placeholder="Upload logo or enter URL"
                            />
                            
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Logo Display Style</label>
                                <select 
                                    value={style.logoStyle || 'contain'}
                                    onChange={(e) => setStyle(prev => ({...prev, logoStyle: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="contain">Fit (Contain)</option>
                                    <option value="cover">Fill (Cover)</option>
                                    <option value="stretch">Stretch</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* === COLORS === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Palette className="mr-2" size={20} />
                            Color Scheme
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Primary Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.primaryColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.primaryColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.primaryColor || '#1e293b'}
                                        onChange={(e) => setStyle(prev => ({...prev, primaryColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Accent Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.accentColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.accentColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.accentColor || '#991b1b'}
                                        onChange={(e) => setStyle(prev => ({...prev, accentColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Page Background Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.pageBackgroundColor }}
                                    >
                                        <span className="text-slate-800 font-semibold text-sm bg-white bg-opacity-80 px-2 py-1 rounded">
                                            {style.pageBackgroundColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.pageBackgroundColor || '#f1f5f9'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === TEXT STYLING === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Edit className="mr-2" size={20} />
                            Text & Typography
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Body Text Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.textColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.textColor} Sample Text
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.textColor || '#1e293b'}
                                        onChange={(e) => setStyle(prev => ({...prev, textColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Heading Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.headingColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.headingColor} Heading
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.headingColor || '#0f172a'}
                                        onChange={(e) => setStyle(prev => ({...prev, headingColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Link Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.linkColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.linkColor} Link Text
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.linkColor || '#2563eb'}
                                        onChange={(e) => setStyle(prev => ({...prev, linkColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* === GAME TICKER === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <BarChart2 className="mr-2" size={20} />
                            Game Ticker Styling
                        </h4>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Ticker Background</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.tickerColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.tickerColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.tickerColor || '#1e293b'}
                                        onChange={(e) => setStyle(prev => ({...prev, tickerColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Ticker Text Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.tickerTextColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.tickerTextColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.tickerTextColor || '#94a3b8'}
                                        onChange={(e) => setStyle(prev => ({...prev, tickerTextColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === TOP BANNER BACKGROUND === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Image className="mr-2" size={20} />
                            Top Banner Background
                        </h4>
                        
                        <div className="space-y-4">
                            <FileUploadInput
                                label="Banner Background Image"
                                accept="image/*"
                                currentValue={style.bannerImage || ''}
                                onChange={(url) => setStyle(prev => ({...prev, bannerImage: url}))}
                                placeholder="Upload banner background image or enter URL"
                            />
                            
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Banner Display Mode</label>
                                <select 
                                    value={style.bannerMode || 'cover'}
                                    onChange={(e) => setStyle(prev => ({...prev, bannerMode: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="cover">Cover (Fill entire banner)</option>
                                    <option value="contain">Contain (Fit within banner)</option>
                                    <option value="repeat">Repeat (Tile pattern)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">
                                    Banner Image Opacity: {Math.round((style.bannerOpacity !== undefined ? style.bannerOpacity : 0.3) * 100)}%
                                </label>
                                <input 
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={style.bannerOpacity !== undefined ? style.bannerOpacity : 0.3}
                                    onChange={(e) => setStyle(prev => ({...prev, bannerOpacity: parseFloat(e.target.value)}))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>Transparent</span>
                                    <span>Opaque</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Controls the darkness of the overlay on the banner image</p>
                            </div>
                        </div>
                    </div>

                    {/* === SIDEBAR BACKGROUND === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Menu className="mr-2" size={20} />
                            Navigation Sidebar Background
                        </h4>
                        
                        <div className="space-y-4">
                            <FileUploadInput
                                label="Sidebar Background Image"
                                accept="image/*"
                                currentValue={style.sidebarImage || ''}
                                onChange={(url) => setStyle(prev => ({...prev, sidebarImage: url}))}
                                placeholder="Upload sidebar background image or enter URL"
                            />
                            
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Sidebar Display Mode</label>
                                <select 
                                    value={style.sidebarMode || 'cover'}
                                    onChange={(e) => setStyle(prev => ({...prev, sidebarMode: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="cover">Cover (Fill sidebar)</option>
                                    <option value="contain">Contain (Fit within sidebar)</option>
                                    <option value="repeat">Repeat (Tile pattern)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">
                                    Sidebar Image Opacity: {Math.round((style.sidebarOpacity || 0.2) * 100)}%
                                </label>
                                <input 
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={style.sidebarOpacity || 0.2}
                                    onChange={(e) => setStyle(prev => ({...prev, sidebarOpacity: parseFloat(e.target.value)}))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>Dark Overlay</span>
                                    <span>Bright Image</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Lower opacity adds darker overlay for better text readability</p>
                            </div>
                        </div>
                    </div>

                    {/* === PAGE BACKGROUND === */}
                    <div className="border-b border-slate-200 pb-6">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">Page Background Image</h4>
                        
                        <div className="space-y-4">
                            <FileUploadInput
                                label="Background Image"
                                accept="image/*"
                                currentValue={style.backgroundImage || ''}
                                onChange={(url) => setStyle(prev => ({...prev, backgroundImage: url}))}
                                placeholder="Upload background image or enter URL"
                            />
                            
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Background Display Mode</label>
                                <select 
                                    value={style.backgroundMode || 'cover'}
                                    onChange={(e) => setStyle(prev => ({...prev, backgroundMode: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="cover">Cover (Fill entire area)</option>
                                    <option value="contain">Contain (Fit within area)</option>
                                    <option value="repeat">Repeat (Tile pattern)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">
                                    Background Opacity: {Math.round((style.backgroundOpacity || 0.1) * 100)}%
                                </label>
                                <input 
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={style.backgroundOpacity || 0.1}
                                    onChange={(e) => setStyle(prev => ({...prev, backgroundOpacity: parseFloat(e.target.value)}))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>Transparent</span>
                                    <span>Opaque</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === MUSIC === */}
                    <div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                            <Music className="mr-2" size={20} />
                            Background Music
                        </h4>
                        
                        <FileUploadInput
                            label="Background Music"
                            accept="audio/*"
                            currentValue={style.globalMusicUrl || ''}
                            onChange={(url) => setStyle(prev => ({...prev, globalMusicUrl: url}))}
                            placeholder="Upload audio file or enter URL (Spotify, SoundCloud, etc.)"
                        />
                        <p className="text-xs text-slate-500 mt-2">Supported: MP3, WAV, streaming URLs from Spotify, SoundCloud, YouTube</p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-slate-200">
                {saved && <span className="text-green-600 font-semibold mr-4">✓ Saved!</span>}
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    Save Style Settings
                </button>
            </div>
        </div>
    );
};



const AdminPage = ({ teams, setTeams, players, setPlayers, leagueSchedule, gameTickerData, setGameTickerData, currentUser, users, setUsers, websiteStyle, setWebsiteStyle, leagueInfo, setLeagueInfo }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [usersSecurityTab, setUsersSecurityTab] = useState('users'); // New state for sub-tabs
    const [settingsTab, setSettingsTab] = useState('website'); // New state for settings sub-tabs

    // Use new permission system
    const adminTabs = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: <Home size={16} />, 
            permissions: ['system.admin_access'],
            description: 'Overview and statistics'
        },
        { 
            id: 'teams', 
            label: 'Teams', 
            icon: <Users size={16} />, 
            permissions: ['teams.view'],
            description: 'Manage teams and divisions'
        },
        { 
            id: 'players', 
            label: 'Players', 
            icon: <UserCheck size={16} />, 
            permissions: ['players.view'],
            description: 'Manage player rosters'
        },
        { 
            id: 'schedule', 
            label: 'Schedule & Events', 
            icon: <Calendar size={16} />, 
            permissions: ['events.view'],
            description: 'Calendar and event management'
        },
        { 
            id: 'media', 
            label: 'Media Gallery', 
            icon: <Image size={16} />, 
            permissions: ['media.view'],
            description: 'Photos and videos'
        },
        { 
            id: 'game_ticker', 
            label: 'Game Ticker', 
            icon: <BarChart2 size={16} />, 
            permissions: ['events.edit'],
            description: 'Manage game results ticker'
        },
        { 
            id: 'users', 
            label: 'Users & Security', 
            icon: <Shield size={16} />, 
            permissions: ['users.view', 'system.roles'],
            description: 'User management and roles'
        },
        { 
            id: 'invitations', 
            label: 'Invitations', 
            icon: <Mail size={16} />, 
            permissions: ['system.invitations'],
            description: 'Send invites and manage access requests'
        },
        { 
            id: 'settings', 
            label: 'League Settings', 
            icon: <Settings size={16} />, 
            permissions: ['system.settings'],
            description: 'Website style and league info'
        }
    ];

    // Filter tabs based on permissions
    const visibleTabs = adminTabs.filter(tab => 
        hasAnyPermission(currentUser, tab.permissions)
    );

    // Set default tab to first available tab
    React.useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [visibleTabs, activeTab]);

    const AdminTab = ({ tab }) => (
        <button 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg font-semibold transition-all ${
                activeTab === tab.id 
                    ? 'bg-white text-blue-800 border-t-2 border-blue-600' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={tab.description}
        >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
        </button>
    );

    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
                    Admin Portal
                </h1>
                <p className="text-slate-600">
                    Welcome back, {currentUser.name}
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-300 flex-wrap mb-6 overflow-x-auto">
                {visibleTabs.map(tab => (
                    <AdminTab key={tab.id} tab={tab} />
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-md min-h-[600px]">
                {activeTab === 'dashboard' && hasPermission(currentUser, 'system.admin_access') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Stats Cards */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600">Total Teams</p>
                                        <p className="text-2xl font-bold text-blue-800">{teams.filter(t => t.active).length}</p>
                                    </div>
                                    <Users className="text-blue-600" size={24} />
                                </div>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600">Active Players</p>
                                        <p className="text-2xl font-bold text-green-800">{players.filter(p => p.active).length}</p>
                                    </div>
                                    <UserCheck className="text-green-600" size={24} />
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-purple-600">Total Users</p>
                                        <p className="text-2xl font-bold text-purple-800">{users.filter(u => u.active !== false).length}</p>
                                    </div>
                                    <Shield className="text-purple-600" size={24} />
                                </div>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-orange-600">This Month's Games</p>
                                        <p className="text-2xl font-bold text-orange-800">{gameTickerData.length}</p>
                                    </div>
                                    <Calendar className="text-orange-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => setActiveTab('teams')}
                                    className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Users className="mb-2" size={20} />
                                    <div className="text-sm font-semibold">Manage Teams</div>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('schedule')}
                                    className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Calendar className="mb-2" size={20} />
                                    <div className="text-sm font-semibold">Add Event</div>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('users')}
                                    className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Shield className="mb-2" size={20} />
                                    <div className="text-sm font-semibold">Manage Users</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'teams' && hasPermission(currentUser, 'teams.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Team Management</h2>
                        <TeamManager teams={teams} setTeams={setTeams} />
                    </div>
                )}

                {activeTab === 'players' && hasPermission(currentUser, 'players.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Player Management</h2>
                        <PlayerManager players={players} setPlayers={setPlayers} teams={teams} currentUser={currentUser} />
                    </div>
                )}

                {activeTab === 'schedule' && hasPermission(currentUser, 'events.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Schedule & Events Management</h2>
                        <LeagueCalendarManager teams={teams} setTeams={setTeams} />
                    </div>
                )}

                {activeTab === 'media' && hasPermission(currentUser, 'media.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Media Gallery</h2>
                        <div className="text-center py-8 text-slate-500">
                            <Image size={48} className="mx-auto mb-4" />
                            <p>Media gallery management coming soon...</p>
                            <p className="text-sm">This will consolidate photo and video management</p>
                        </div>
                    </div>
                )}

                {activeTab === 'game_ticker' && hasPermission(currentUser, 'events.edit') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Game Ticker Management</h2>
                        <ScoreManager leagueSchedule={leagueSchedule} gameTickerData={gameTickerData} setGameTickerData={setGameTickerData} teams={teams} />
                    </div>
                )}

                {activeTab === 'users' && (hasPermission(currentUser, 'users.view') || hasPermission(currentUser, 'system.roles')) && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">Users & Security</h2>
                            <div className="flex space-x-4 border-b">
                                <button 
                                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                                        usersSecurityTab === 'users' 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-slate-600 hover:text-blue-600'
                                    }`}
                                    onClick={() => setUsersSecurityTab('users')}
                                >
                                    Users
                                </button>
                                {hasPermission(currentUser, 'system.roles') && (
                                    <button 
                                        className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                                            usersSecurityTab === 'roles' 
                                                ? 'border-blue-600 text-blue-600' 
                                                : 'border-transparent text-slate-600 hover:text-blue-600'
                                        }`}
                                        onClick={() => setUsersSecurityTab('roles')}
                                    >
                                        Roles & Permissions
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Tab Content */}
                        {usersSecurityTab === 'users' && hasPermission(currentUser, 'users.view') && (
                            <UserManager users={users} setUsers={setUsers} teams={teams} />
                        )}
                        
                        {usersSecurityTab === 'roles' && hasPermission(currentUser, 'system.roles') && (
                            <RoleManager users={users} setUsers={setUsers} />
                        )}
                    </div>
                )}

                {activeTab === 'invitations' && hasPermission(currentUser, 'system.invitations') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Invitations & Access Requests</h2>
                        <div className="text-center py-8 text-slate-500">
                            <Mail size={48} className="mx-auto mb-4" />
                            <p>Invitation system coming soon...</p>
                            <p className="text-sm">Send invites and manage access requests</p>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && hasPermission(currentUser, 'system.settings') && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">League Settings</h2>
                            <div className="flex space-x-4 border-b">
                                <button 
                                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                                        settingsTab === 'website' 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-slate-600 hover:text-blue-600'
                                    }`}
                                    onClick={() => setSettingsTab('website')}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Palette size={16} />
                                        <span>Website Style</span>
                                    </div>
                                </button>
                                <button 
                                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                                        settingsTab === 'league' 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-slate-600 hover:text-blue-600'
                                    }`}
                                    onClick={() => setSettingsTab('league')}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Trophy size={16} />
                                        <span>League Info</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        {/* Tab Content */}
                        {settingsTab === 'website' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Website Appearance & Style</h3>
                                <WebsiteStyleManager websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} />
                            </div>
                        )}
                        
                        {settingsTab === 'league' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">League Information & Settings</h3>
                                <LeagueInfoManager leagueInfo={leagueInfo} setLeagueInfo={setLeagueInfo} websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} />
                            </div>
                        )}
                    </div>
                )}

                {/* Access Denied for tabs without permission */}
                {!hasAnyPermission(currentUser, adminTabs.find(t => t.id === activeTab)?.permissions || []) && (
                    <div className="p-6 text-center">
                        <Shield size={48} className="mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">Access Denied</h3>
                        <p className="text-slate-500">You don't have permission to view this section.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [page, setPage] = useState('home');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 768);
    const [showLogin, setShowLogin] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        preferredRole: 'player',
        teamId: '',
        phone: '',
        reasonForJoining: ''
    });

    const [teams, setTeams] = useState(initialTeams);
    const [players, setPlayers] = useState(initialPlayersList);
    const [gameTickerData, setGameTickerData] = useState(initialGameTickerData);
    const [leagueSchedule, setLeagueSchedule] = useState(initialLeagueSchedule);
    const [users, setUsers] = useState(initialMockUsers);
    const [leagueInfo, setLeagueInfo] = useState({
        name: "Men's Lacrosse Beer League",
        contactEmail: "admin@mlbl.org",
        social: { twitter: '#', instagram: '#', facebook: '#' }
    });
    const [websiteStyle, setWebsiteStyle] = useState({
        logoUrl: MlblLogo,
        primaryColor: '#1e293b', // slate-800
        accentColor: '#991b1b', // red-800
        logoStyle: 'contain',
        // Page & Text Colors
        pageBackgroundColor: '#f1f5f9', // slate-100
        textColor: '#1e293b', // slate-800
        headingColor: '#0f172a', // slate-900
        linkColor: '#2563eb', // blue-600
        // Background image settings
        backgroundImage: '',
        backgroundMode: 'cover', // cover, contain, tile
        backgroundOpacity: 0.1, // 0-1 for overlay opacity
        // Banner settings
        bannerColor: '#1e293b', // default to primaryColor
        bannerImage: '',
        bannerText: 'MLBL',
        bannerMode: 'cover', // cover, contain, repeat
        bannerOpacity: 0.3,
        // Music settings
        globalMusicUrl: '',
        // Sidebar settings
        sidebarImage: '',
        sidebarOpacity: 0.2,
        sidebarMode: 'cover', // cover, contain, repeat
        // Game Ticker settings (moved from LeagueInfoManager)
        tickerColor: '#1e293b',
        tickerItemColor: '#334155',
        tickerBorderColor: '#475569',
        tickerTextColor: '#94a3b8'
    });

    // Global music player state
    const [musicState, setMusicState] = useState({
        currentTrack: null, // { url: string, title: string, teamId?: string }
        isPlaying: false,
        audioRef: null
    });

    // Sidebar collapsible sections state
    const [sidebarSections, setSidebarSections] = useState({
        fieldLacrosse: true,
        boxLacrosse: true
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Call on initial load
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogin = (user) => {
        setCurrentUser(user);
        setShowLogin(false);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };
    
    const navigate = (targetPage, teamId = null) => {
        setPage(targetPage);
        setSelectedTeam(teamId);
        if (window.innerWidth < 768) setIsMenuOpen(false);
    };

    const handleAdminNav = () => {
        if (!currentUser) return;
        if (currentUser.roles.includes('admin')) {
            navigate('admin');
        } else if (currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) {
            navigate('team', currentUser.teamId);
        }
    };

    // Music control functions
    const playMusic = (url, title, teamId = null) => {
        // Stop current music if playing
        if (musicState.audioRef) {
            musicState.audioRef.pause();
        }
        
        setMusicState({
            currentTrack: { url, title, teamId },
            isPlaying: true,
            audioRef: musicState.audioRef
        });
    };

    const stopAllMusic = () => {
        if (musicState.audioRef) {
            musicState.audioRef.pause();
            musicState.audioRef.currentTime = 0;
        }
        setMusicState(prev => ({
            ...prev,
            currentTrack: null,
            isPlaying: false
        }));
    };

    // Registration handlers
    const handleRegistration = () => {
        const newUser = {
            id: Date.now(),
            name: registrationData.name,
            email: registrationData.email,
            teamId: registrationData.teamId || null,
            preferredRole: registrationData.preferredRole,
            phone: registrationData.phone,
            reasonForJoining: registrationData.reasonForJoining,
            roles: [], // Empty until approved
            roleIds: [], // Empty until approved
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        setUsers(prev => [...prev, newUser]);
        setRegistrationData({
            name: '',
            email: '',
            preferredRole: 'player',
            teamId: '',
            phone: '',
            reasonForJoining: ''
        });
        setAuthMode('login');
        alert('Registration submitted! An admin will review your application.');
    };

    const AuthModal = () => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setShowLogin(false)}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {authMode === 'login' ? (
                    // Login View
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Welcome to MLBL</h2>
                        
                        {/* Active Users Login */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Login as:</h3>
                            <div className="space-y-3">
                                {users.filter(u => u.status === 'active' && u.roles.length > 0).map(user => (
                                    <button 
                                        key={user.id} 
                                        onClick={() => handleLogin(user)} 
                                        className="w-full text-left p-3 bg-slate-100 hover:bg-red-100 rounded-md flex items-center gap-3 transition-colors"
                                    >
                                       <UserCheck className="text-slate-600" />
                                       <div>
                                           <p className="font-bold">{user.name}</p>
                                           <p className="text-sm text-slate-500 capitalize">{user.roles.join(', ')}</p>
                                       </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Registration Option */}
                        <div className="border-t pt-4">
                            <p className="text-center text-slate-600 mb-3">New to the league?</p>
                            <button 
                                onClick={() => setAuthMode('register')}
                                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors font-semibold"
                            >
                                Request Access
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => setShowLogin(false)} 
                            className="w-full mt-4 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>
                ) : (
                    // Registration View
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Request Access</h2>
                            <button 
                                onClick={() => setAuthMode('login')}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleRegistration(); }} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={registrationData.name}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={registrationData.email}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={registrationData.phone}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            {/* Preferred Role */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Preferred Role *</label>
                                <select
                                    value={registrationData.preferredRole}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, preferredRole: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="player">Player</option>
                                    <option value="coach">Coach</option>
                                </select>
                            </div>
                            
                            {/* Interested Team */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Interested Team</label>
                                <select
                                    value={registrationData.teamId}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, teamId: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">No preference</option>
                                    {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Reason for Joining */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Why do you want to join? *</label>
                                <textarea
                                    value={registrationData.reasonForJoining}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, reasonForJoining: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                                    placeholder="Tell us about your experience and why you want to join our league..."
                                    required
                                />
                            </div>
                            
                            {/* Submit Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="flex-1 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors"
                                >
                                    Back to Login
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
    
    const NavItem = ({ icon, label, pageName }) => (
        <button onClick={() => navigate(pageName)}
            className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${
                (page === pageName && !selectedTeam)
                    ? 'text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            style={{backgroundColor: (page === pageName && !selectedTeam) ? websiteStyle.accentColor : 'transparent'}}
        >
            {icon}<span>{label}</span>
        </button>
    );
    
    const renderPage = () => {
        let pageComponent;

        if (page === 'team' && selectedTeam) {
            pageComponent = <TeamDetailPage teamId={selectedTeam} teams={teams} players={players} leagueSchedule={leagueSchedule} currentUser={currentUser} setPlayers={setPlayers} setTeams={setTeams} websiteStyle={websiteStyle} playMusic={playMusic} stopAllMusic={stopAllMusic} musicState={musicState} />;
        } else {
            switch (page) {
                case 'home': pageComponent = <NewHomePage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} leagueInfo={leagueInfo} currentUser={currentUser} websiteStyle={websiteStyle} setCurrentUser={setCurrentUser} />; break;
                case 'events': pageComponent = <EventsPage teams={teams} leagueSchedule={leagueSchedule} onTeamClick={(teamId) => navigate('team', teamId)} currentUser={currentUser} websiteStyle={websiteStyle} />; break;
                case 'standings': pageComponent = <StandingsPage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} websiteStyle={websiteStyle} />; break;
                case 'league_contact': pageComponent = <LeagueContactPage websiteStyle={websiteStyle} leagueInfo={leagueInfo} />; break;
                case 'chat': 
                    pageComponent = currentUser ? <ChatPage currentUser={currentUser} /> : <div className="p-8 text-center"><h2 className="text-2xl font-bold">Access Denied</h2><p>You must be logged in to access the chat.</p></div>;
                    break;
                case 'admin':
                    pageComponent = currentUser 
                        ? <AdminPage teams={teams} setTeams={setTeams} players={players} setPlayers={setPlayers} leagueSchedule={leagueSchedule} gameTickerData={gameTickerData} setGameTickerData={setGameTickerData} currentUser={currentUser} users={users} setUsers={setUsers} websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} leagueInfo={leagueInfo} setLeagueInfo={setLeagueInfo} /> 
                        : <div className="p-8 text-center"><h2 className="text-2xl font-bold">Access Denied</h2><p>You must be logged in to view this page.</p></div>;
                    break;
                default: pageComponent = <NewHomePage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} leagueInfo={leagueInfo} currentUser={currentUser} websiteStyle={websiteStyle} setCurrentUser={setCurrentUser} />;
            }
        }
        return <div className="w-full">{pageComponent}</div>;
    };

    const backgroundStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'%3E%3Cg fill='%23d1d5db' fill-opacity='0.1'%3E%3Cpath d='M12.5 0 L50 37.5 L87.5 0 L100 12.5 L62.5 50 L100 87.5 L87.5 100 L50 62.5 L12.5 100 L0 87.5 L37.5 50 L0 12.5 Z'/%3E%3C/g%3E%3C/svg%3E")`,
    };
    
    return (
        <div className="min-h-screen bg-slate-100">
            {showLogin && <AuthModal />}
            
            {/* Fixed Sidebar */}
            <aside 
                className={`bg-slate-900 text-white w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-30 flex flex-col overflow-y-auto`} 
                style={{
                    backgroundColor: websiteStyle.primaryColor,
                    backgroundImage: websiteStyle.sidebarImage ? `linear-gradient(rgba(0,0,0,${1 - websiteStyle.sidebarOpacity}), rgba(0,0,0,${1 - websiteStyle.sidebarOpacity})), url(${websiteStyle.sidebarImage})` : 'none',
                    backgroundSize: websiteStyle.sidebarMode === 'contain' ? 'contain' : websiteStyle.sidebarMode === 'repeat' ? 'auto' : 'cover',
                    backgroundRepeat: websiteStyle.sidebarMode === 'repeat' ? 'repeat' : 'no-repeat',
                    backgroundPosition: 'center'
                }}
            >
                <div className="p-4 border-b border-slate-700 flex items-center justify-center">
                    <img src={websiteStyle.logoUrl} alt="MLBL Logo" className="h-32 max-w-full object-contain" />
                </div>
                <nav className="flex-grow">
                    <NavItem icon={<Home size={20} />} label="Home" pageName="home" />
                    <NavItem icon={<Calendar size={20} />} label="Events & Schedule" pageName="events" />
                    <NavItem icon={<Swords size={20} />} label="Standings" pageName="standings" />
                    <NavItem icon={<Mail size={20} />} label="League Contact" pageName="league_contact" />
                    {currentUser && <NavItem icon={<MessageSquare size={20} />} label="Chat" pageName="chat" />}
                    <div className="pt-4 mt-4 border-t border-slate-700">
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Teams</h2>
                      
                      {/* Field Lacrosse Teams */}
                      <div className="mb-3">
                        <button 
                            onClick={() => setSidebarSections(prev => ({...prev, fieldLacrosse: !prev.fieldLacrosse}))}
                            className="w-full text-left px-2 py-1 hover:bg-slate-700 hover:bg-opacity-50 rounded transition-colors"
                        >
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Trophy size={12} className="mr-1" /> Field Lacrosse
                                </div>
                                <div className={`transform transition-transform ${sidebarSections.fieldLacrosse ? 'rotate-180' : ''}`}>
                                    <ArrowDown size={12} />
                                </div>
                            </h3>
                        </button>
                        {sidebarSections.fieldLacrosse && (
                            <div className="space-y-1 mt-2">
                                {teams.filter(t => t.active && t.division === 'Field').sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                   <button
                                        key={team.id}
                                        onClick={() => navigate('team', team.id)}
                                        className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ml-2 ${
                                            page === 'team' && selectedTeam === team.id
                                                ? 'text-white'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                        style={{backgroundColor: (page === 'team' && selectedTeam === team.id) ? websiteStyle.accentColor : 'transparent'}}
                                    >
                                        <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                        <span className="text-sm">{team.name}</span>
                                   </button>
                                ))}
                            </div>
                        )}
                      </div>
                      
                      {/* Box Lacrosse Teams */}
                      <div>
                        <button 
                            onClick={() => setSidebarSections(prev => ({...prev, boxLacrosse: !prev.boxLacrosse}))}
                            className="w-full text-left px-2 py-1 hover:bg-slate-700 hover:bg-opacity-50 rounded transition-colors"
                        >
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Shield size={12} className="mr-1" /> Box Lacrosse
                                </div>
                                <div className={`transform transition-transform ${sidebarSections.boxLacrosse ? 'rotate-180' : ''}`}>
                                    <ArrowDown size={12} />
                                </div>
                            </h3>
                        </button>
                        {sidebarSections.boxLacrosse && (
                            <div className="space-y-1 mt-2">
                                {teams.filter(t => t.active && t.division === 'Box').sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                   <button
                                        key={team.id}
                                        onClick={() => navigate('team', team.id)}
                                        className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ml-2 ${
                                            page === 'team' && selectedTeam === team.id
                                                ? 'text-white'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                        style={{backgroundColor: (page === 'team' && selectedTeam === team.id) ? websiteStyle.accentColor : 'transparent'}}
                                    >
                                        <img src={team.logo} alt={team.name} className="w-6 h-6 rounded-full bg-white p-0.5" />
                                        <span className="text-sm">{team.name}</span>
                                   </button>
                                ))}
                            </div>
                        )}
                      </div>
                    </div>
                </nav>
                <div className="p-2 border-t border-slate-700">
                   {currentUser && 
                    <button onClick={handleAdminNav} className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${page === 'admin' ? 'text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`} style={{backgroundColor: page === 'admin' ? websiteStyle.accentColor : 'transparent'}}>
                        <Crown size={20} /><span>Admin Portal</span>
                    </button>
                   }
                   {currentUser ? (
                       <button onClick={handleLogout} className="flex items-center space-x-3 p-2 rounded-md w-full text-left text-slate-300 hover:text-white" style={{'--hover-bg': websiteStyle.accentColor}}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                           <LogOut size={20} /><span>Log Out ({currentUser.name})</span>
                       </button>
                   ) : (
                       <button onClick={() => setShowLogin(true)} className="flex items-center space-x-3 p-2 rounded-md w-full text-left text-slate-300 hover:bg-slate-700 hover:text-white mt-2">
                           <LogIn size={20} /><span>Player & Staff Login</span>
                       </button>
                   )}
                </div>
            </aside>
            
            {/* Main Content Area */}
            <div className="w-full">
                <div className={`transition-all duration-300 ease-in-out ${isMenuOpen ? 'pl-64' : 'pl-0'} min-h-screen flex flex-col`}>
                <header className="sticky top-0 z-20">
                    <div 
                        className="text-white p-4 flex justify-between items-center shadow-md relative overflow-hidden"
                        style={{
                            backgroundColor: websiteStyle.bannerColor || websiteStyle.primaryColor,
                            backgroundImage: websiteStyle.bannerImage ? `linear-gradient(rgba(0,0,0,${1 - (websiteStyle.bannerOpacity !== undefined ? websiteStyle.bannerOpacity : 0.3)}), rgba(0,0,0,${1 - (websiteStyle.bannerOpacity !== undefined ? websiteStyle.bannerOpacity : 0.3)})), url(${websiteStyle.bannerImage})` : 'none',
                            backgroundSize: websiteStyle.bannerMode === 'contain' ? 'contain' : websiteStyle.bannerMode === 'repeat' ? 'auto' : 'cover',
                            backgroundRepeat: websiteStyle.bannerMode === 'repeat' ? 'repeat' : 'no-repeat',
                            backgroundPosition: 'center'
                        }}
                    >
                         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md hover:bg-black hover:bg-opacity-20 text-white transition-colors">
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        <h1 className="text-xl font-bold tracking-wide drop-shadow-lg">
                            {websiteStyle.bannerText || "MLBL"}
                        </h1>
                        <div className="w-10"></div>
                    </div>
                    <GameTicker teams={teams} gameTickerData={gameTickerData} websiteStyle={websiteStyle} onTeamClick={(teamId) => navigate('team', teamId)} />
                </header>
                <main className="flex-1 overflow-y-auto" style={backgroundStyle}>
                    {renderPage()}
                </main>
                </div>
            </div>
            
            <div>
                {/* Global Music Player */}
                <MusicPlayer musicState={musicState} setMusicState={setMusicState} />
            </div>
        </div>
    );
}

export default App;
