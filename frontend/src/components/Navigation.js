import React, { useState } from 'react';
import LacrosseIcons, { LacrosseIcon } from './LacrosseIcons';
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
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === pageName
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isCollapsed ? label : ''}
        >
            <span className="flex-shrink-0">{icon}</span>
            {!isCollapsed && <span className="ml-3">{label}</span>}
        </button>
    );

    return (
        <div className={`
            ${isCollapsed ? 'w-16' : 'w-64'} 
            bg-white shadow-sm border-r h-screen flex flex-col 
            transition-all duration-300
            max-w-full overflow-hidden
        `}>
            {/* Header with Toggle */}
            <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                            🥍 Lacrosse League
                        </h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                        title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
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

                {/* Teams Section */}
                <div className="px-4 pb-4 border-b">
                    <h3 className={`text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 ${isCollapsed ? 'text-center' : ''}`}>
                        <LacrosseIcon name="stick" className={isCollapsed ? "" : "mr-1"} style={{fontSize: '12px'}} />
                        {!isCollapsed && " Teams"}
                    </h3>
                    <div className="space-y-2">
                        {teams.map(team => (
                            <button
                                key={team.id} 
                                className={`w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left border border-transparent hover:border-slate-200 ${isCollapsed ? 'justify-center' : ''}`}
                                onClick={() => {
                                    console.log('🏆 Team clicked:', team.name, team.id);
                                    onNavigate && onNavigate('team', team.id);
                                    if (onMobileClose) onMobileClose();
                                }}
                                title={isCollapsed ? `${team.name} (${team.wins || 0}-${team.losses || 0})` : ''}
                            >
                                {/* Team Logo or Colored Circle */}
                                <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden border border-slate-200">
                                    {team.style?.logoUrl ? (
                                        <img 
                                            src={team.style.logoUrl} 
                                            alt={`${team.name} logo`}
                                            className="w-full h-full object-cover"
                                            style={{ opacity: team.style.logoOpacity || 1 }}
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
                                            display: team.style?.logoUrl ? 'none' : 'flex'
                                        }}
                                    >
                                        <LacrosseIcon name="stick" style={{fontSize: '12px', color: 'white'}} />
                                    </div>
                                </div>
                                
                                {!isCollapsed && (
                                    <>
                                        <div className="flex-1 min-w-0 ml-3">
                                            <div className="font-medium truncate">{team.name}</div>
                                            <div className="text-xs text-slate-500 truncate">{team.division || 'Field'}</div>
                                        </div>
                                        <div className="text-xs text-slate-400 ml-2 flex-shrink-0">
                                            {team.wins || 0}-{team.losses || 0}
                                        </div>
                                    </>
                                )}
                            </button>
                        ))}
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