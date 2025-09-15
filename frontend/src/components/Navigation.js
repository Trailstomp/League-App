import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

// Teams grouped by division component
const TeamsByDivision = ({ teams, websiteStyle, isCollapsed, onNavigate, onMobileClose }) => {
    const [collapsedDivisions, setCollapsedDivisions] = useState(new Set());

    // Group teams by division with specific order: Field, Box, External, then others
    const groupTeamsByDivision = () => {
        const grouped = {};
        teams.forEach(team => {
            const division = team.division || 'Field';
            if (!grouped[division]) grouped[division] = [];
            grouped[division].push(team);
        });

        // Sort teams within each division alphabetically
        Object.keys(grouped).forEach(division => {
            grouped[division].sort((a, b) => a.name.localeCompare(b.name));
        });

        return grouped;
    };

    // Get ordered division keys: Field, Box, External, then others alphabetically
    const getOrderedDivisions = (groupedTeams) => {
        const divisions = Object.keys(groupedTeams);
        const orderedDivisions = [];
        
        if (divisions.includes('Field')) orderedDivisions.push('Field');
        if (divisions.includes('Box')) orderedDivisions.push('Box');
        if (divisions.includes('External')) orderedDivisions.push('External');
        
        const remaining = divisions.filter(d => !['Field', 'Box', 'External'].includes(d)).sort();
        return [...orderedDivisions, ...remaining];
    };

    const toggleDivision = (division) => {
        const newCollapsed = new Set(collapsedDivisions);
        if (newCollapsed.has(division)) {
            newCollapsed.delete(division);
        } else {
            newCollapsed.add(division);
        }
        setCollapsedDivisions(newCollapsed);
    };

    const groupedTeams = groupTeamsByDivision();
    const orderedDivisions = getOrderedDivisions(groupedTeams);

    return (
        <div className="px-4 pb-4 border-b">
            <h3 
                className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isCollapsed ? 'text-center' : ''}`}
                style={{ color: websiteStyle.menuTextColor || '#6b7280' }}
            >
                <LacrosseIcon name="stick" className={isCollapsed ? "" : "mr-1"} style={{fontSize: '14px'}} />
                {!isCollapsed && " Teams"}
            </h3>
            
            {orderedDivisions.map(division => {
                const divisionTeams = groupedTeams[division];
                const isCollapsed = collapsedDivisions.has(division);
                
                return (
                    <div key={division} className="mb-4">
                        {/* Division Header */}
                        <button
                            onClick={() => toggleDivision(division)}
                            className="w-full flex items-center justify-between px-3 py-2 mb-2 text-sm font-medium rounded-lg border transition-all duration-200"
                            style={{
                                color: websiteStyle.menuTextColor || '#374151',
                                backgroundColor: `${websiteStyle.menuBackgroundColor || '#f1f5f9'}${Math.round((websiteStyle.buttonTransparency || 0.9) * 255).toString(16).padStart(2, '0')}`,
                                border: `1px solid ${websiteStyle.menuTextColor || '#e2e8f0'}60`
                            }}
                        >
                            <span className="flex items-center">
                                <span className="mr-2">
                                    {division === 'Field' ? '🥍' : division === 'Box' ? '📦' : division === 'External' ? '🌐' : '🏆'}
                                </span>
                                {division} ({divisionTeams.length})
                            </span>
                            <span className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
                                ▶
                            </span>
                        </button>
                        
                        {/* Division Teams */}
                        {!isCollapsed && (
                            <div className="space-y-2 ml-2">
                                {divisionTeams.map(team => (
                                    <button
                                        key={team.id}
                                        className="w-full flex items-center px-4 py-3 text-sm rounded-full transition-all duration-200 text-left border hover:shadow-sm hover:transform hover:scale-102"
                                        style={{ 
                                            color: websiteStyle.menuTextColor || '#374151',
                                            backgroundColor: `${websiteStyle.menuBackgroundColor || '#f8fafc'}${Math.round((websiteStyle.buttonTransparency || 0.8) * 255).toString(16).padStart(2, '0')}`,
                                            border: `1px solid ${websiteStyle.menuTextColor || '#e2e8f0'}40`
                                        }}
                                        onClick={() => {
                                            console.log('🏆 Team clicked:', team.name, team.id);
                                            onNavigate && onNavigate('team', team.id);
                                            if (onMobileClose) onMobileClose();
                                        }}
                                        title={`${team.name} (${team.wins || 0}-${team.losses || 0})`}
                                    >
                                        {/* Team Logo */}
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-slate-200">
                                            {team.style?.logoUrl ? (
                                                <img 
                                                    src={team.style.logoUrl} 
                                                    alt={`${team.name} logo`}
                                                    className="w-full h-full object-contain"
                                                    style={{ 
                                                        opacity: team.style.logoOpacity || 1,
                                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div 
                                                className="w-full h-full rounded-full flex items-center justify-center"
                                                style={{ 
                                                    backgroundColor: team.style?.primaryColor || '#dc2626',
                                                    opacity: websiteStyle.buttonTransparency || 0.9,
                                                    display: team.style?.logoUrl ? 'none' : 'flex'
                                                }}
                                            >
                                                <LacrosseIcon name="stick" style={{fontSize: '14px', color: 'white'}} />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 ml-3">
                                            <div 
                                                className="font-medium truncate text-sm"
                                                style={{ color: websiteStyle.menuTextColor || '#374151' }}
                                            >
                                                {team.name}
                                            </div>
                                        </div>
                                        <div 
                                            className="text-xs ml-2 flex-shrink-0"
                                            style={{ color: websiteStyle.menuTextColor || '#9ca3af' }}
                                        >
                                            {team.wins || 0}-{team.losses || 0}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            
            {teams.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                    No teams available
                </div>
            )}
        </div>
    );
};
import { isAdmin } from './PermissionsSystem';

const Navigation = ({ currentPage, onNavigate, currentUser, onLogin, onLogout, teams = [], websiteStyle = {}, onMobileClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const NavItem = ({ icon, label, pageName, onClick }) => (
        <button
            onClick={() => {
                if (onClick) onClick();
                else onNavigate(pageName);
                // Close mobile menu when item is clicked
                if (onMobileClose) onMobileClose();
            }}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 ${
                currentPage === pageName
                    ? 'shadow-md transform scale-105'
                    : 'hover:shadow-sm hover:transform hover:scale-102'
            }`}
            style={{
                color: currentPage === pageName 
                    ? '#ffffff' 
                    : (websiteStyle.menuTextColor || '#64748b'),
                backgroundColor: currentPage === pageName 
                    ? `${websiteStyle.primaryColor || '#3b82f6'}${Math.round((websiteStyle.buttonTransparency || 0.9) * 255).toString(16).padStart(2, '0')}` 
                    : `${websiteStyle.menuBackgroundColor || 'transparent'}${Math.round((websiteStyle.buttonTransparency || 0.7) * 255).toString(16).padStart(2, '0')}`,
                border: currentPage === pageName 
                    ? `2px solid ${websiteStyle.primaryColor || '#3b82f6'}` 
                    : `1px solid ${websiteStyle.menuTextColor || '#e2e8f0'}40`
            }}
            title={isCollapsed ? label : ''}
        >
            <span className="flex-shrink-0" style={{fontSize: '20px'}}>{icon}</span>
            {!isCollapsed && <span className="ml-3 font-medium">{label}</span>}
        </button>
    );

    return (
        <div 
            className={`
                ${isCollapsed ? 'w-16' : 'w-64'} 
                shadow-sm border-r h-screen flex flex-col 
                transition-all duration-300
                max-w-full overflow-hidden
            `}
            style={{
                backgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
                backgroundImage: websiteStyle.navBackgroundType === 'image' && websiteStyle.navBackgroundImage 
                    ? `url(${websiteStyle.navBackgroundImage})` 
                    : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Header with Toggle */}
            <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <h1 
                            className="text-lg sm:text-xl font-bold truncate"
                            style={{
                                fontFamily: websiteStyle.navFont || 'Inter, sans-serif',
                                fontSize: websiteStyle.navFontSize || '18px',
                                color: websiteStyle.navTextColor || '#1f2937'
                            }}
                        >
                            {websiteStyle.navLogoUrl ? (
                                <div className="flex items-center space-x-2">
                                    <img src={websiteStyle.navLogoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                                    <span>{websiteStyle.navLeagueName || 'Lacrosse League'}</span>
                                </div>
                            ) : (
                                <>🥍 {websiteStyle.navLeagueName || 'Lacrosse League'}</>
                            )}
                        </h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                        title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                        style={{
                            color: websiteStyle.navTextColor || '#374151'
                        }}
                    >
                        <svg 
                            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
                
                {!isCollapsed && currentUser ? (
                    <div className="mt-2">
                        <p className="text-sm text-slate-600 truncate">
                            Welcome, {currentUser.name}
                        </p>
                        <p className="text-xs text-blue-600 truncate">
                            {(currentUser.roles || [currentUser.role]).filter(Boolean).join(', ')}
                        </p>
                    </div>
                ) : !isCollapsed ? (
                    <p className="text-sm text-slate-500 mt-1 truncate">
                        Browsing as guest
                    </p>
                ) : null}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {/* Navigation */}
                <nav className="p-4 border-b flex-shrink-0">
                    <div className="space-y-1">
                        <NavItem icon={<LacrosseIcon name="venue" />} label="Home" pageName="home" />
                        <NavItem icon={<LacrosseIcon name="calendar" />} label="Events & Schedule" pageName="events" />
                        <NavItem icon={<LacrosseIcon name="trophy" />} label="Standings" pageName="standings" />
                        <NavItem icon={<LacrosseIcon name="email" />} label="League Contact" pageName="league_contact" />
                        {currentUser && <NavItem icon={<LacrosseIcon name="social" />} label="Chat" pageName="chat" />}
                        {currentUser && isAdmin(currentUser) && (
                            <NavItem icon={<LacrosseIcon name="admin" />} label="Admin Portal" pageName="admin" />
                        )}
                    </div>
                </nav>

                {/* Teams Section - Grouped by Division */}
                <TeamsByDivision 
                    teams={teams}
                    websiteStyle={websiteStyle}
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                    onMobileClose={onMobileClose}
                />
                        {!isCollapsed && teams.length === 0 && (
                            <div className="text-xs text-slate-500 px-3 py-4 text-center bg-slate-50 rounded">
                                <LacrosseIcon name="teams" className="mx-auto mb-2" style={{fontSize: '24px'}} />
                                <div>No teams yet</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Authentication Actions - Fixed at bottom */}
            <div className="p-4 border-t flex-shrink-0">
                {currentUser ? (
                    <NavItem 
                        icon={<LacrosseIcon name="logout" />} 
                        label="Logout" 
                        onClick={onLogout}
                    />
                ) : (
                    <NavItem 
                        icon={<LacrosseIcon name="login" />} 
                        label="Login" 
                        onClick={onLogin}
                    />
                )}
            </div>
        </div>
    );
};

export default Navigation;