import React from 'react';
import LacrosseIcons, { LacrosseIcon } from './LacrosseIcons';
import { isAdmin } from './PermissionsSystem';

const Navigation = ({ currentPage, onNavigate, currentUser, onLogin, onLogout, teams = [] }) => {
    const NavItem = ({ icon, label, pageName, onClick }) => (
        <button
            onClick={() => onClick ? onClick() : onNavigate(pageName)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                currentPage === pageName
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
            <span className="mr-3 flex-shrink-0">{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="w-64 bg-white shadow-sm border-r min-h-screen flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <h1 className="text-xl font-bold text-slate-800">
                    🥍 Lacrosse League
                </h1>
                {currentUser ? (
                    <div className="mt-2">
                        <p className="text-sm text-slate-600">
                            Welcome, {currentUser.name}
                        </p>
                        <p className="text-xs text-blue-600">
                            {(currentUser.roles || [currentUser.role]).filter(Boolean).join(', ')}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 mt-1">
                        Browsing as guest
                    </p>
                )}
            </div>

            {/* Navigation */}
            <nav className="p-4">
                <NavItem icon={<LacrosseIcon name="venue" />} label="Home" pageName="home" />
                <NavItem icon={<LacrosseIcon name="calendar" />} label="Events & Schedule" pageName="events" />
                <NavItem icon={<LacrosseIcon name="trophy" />} label="Standings" pageName="standings" />
                <NavItem icon={<LacrosseIcon name="email" />} label="League Contact" pageName="league_contact" />
                {currentUser && <NavItem icon={<LacrosseIcon name="social" />} label="Chat" pageName="chat" />}
                {currentUser && isAdmin(currentUser) && (
                    <NavItem icon={<LacrosseIcon name="admin" />} label="Admin Portal" pageName="admin" />
                )}
            </nav>

            {/* Teams Section - Right under league section */}
            <div className="px-4 pb-4 border-b flex-grow">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    <LacrosseIcon name="stick" className="mr-1" style={{fontSize: '12px'}} /> Teams
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {teams.slice(0, 8).map(team => (
                        <button
                            key={team.id} 
                            className="w-full flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-left border border-transparent hover:border-slate-200"
                            onClick={() => {
                                console.log('🏆 Team clicked:', team.name, team.id);
                                onNavigate && onNavigate('team', team.id);
                            }}
                        >
                            {/* Team Logo or Colored Circle */}
                            <div className="w-6 h-6 rounded-full mr-3 flex-shrink-0 overflow-hidden border border-slate-200">
                                {team.style?.logoUrl ? (
                                    <img 
                                        src={team.style.logoUrl} 
                                        alt={`${team.name} logo`}
                                        className="w-full h-full object-cover"
                                        style={{ opacity: team.style.logoOpacity || 1 }}
                                        onError={(e) => {
                                            // Fallback to colored circle if logo fails to load
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
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
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{team.name}</div>
                                <div className="text-xs text-slate-500 truncate">{team.division || 'Field'}</div>
                            </div>
                            {/* Team record indicator */}
                            <div className="text-xs text-slate-400 ml-2">
                                {team.wins || 0}-{team.losses || 0}
                            </div>
                        </button>
                    ))}
                    {teams.length > 8 && (
                        <div className="text-xs text-slate-500 px-3 py-2 text-center bg-slate-50 rounded">
                            +{teams.length - 8} more teams
                        </div>
                    )}
                    {teams.length === 0 && (
                        <div className="text-xs text-slate-500 px-3 py-4 text-center bg-slate-50 rounded">
                            <LacrosseIcon name="teams" className="mx-auto mb-2" style={{fontSize: '24px'}} />
                            <div>No teams yet</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Authentication Actions - Bottom */}
            <div className="p-4 border-t">
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