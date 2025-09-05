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
            <nav className="flex-grow p-4">
                <NavItem icon={<LacrosseIcon name="venue" />} label="Home" pageName="home" />
                <NavItem icon={<LacrosseIcon name="calendar" />} label="Events & Schedule" pageName="events" />
                <NavItem icon={<LacrosseIcon name="trophy" />} label="Standings" pageName="standings" />
                <NavItem icon={<LacrosseIcon name="email" />} label="League Contact" pageName="league_contact" />
                {currentUser && <NavItem icon={<LacrosseIcon name="social" />} label="Chat" pageName="chat" />}
                {currentUser && isAdmin(currentUser) && (
                    <NavItem icon={<LacrosseIcon name="admin" />} label="Admin Portal" pageName="admin" />
                )}
            </nav>

            {/* Teams Section - Moved up right after navigation */}
            <div className="px-4 pb-4 border-b">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <LacrosseIcon name="stick" className="mr-1" style={{fontSize: '12px'}} /> Teams
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {teams.slice(0, 8).map(team => (
                        <button
                            key={team.id} 
                            className="w-full flex items-center px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors text-left"
                            onClick={() => onNavigate && onNavigate('team', team.id)}
                        >
                            <div 
                                className="w-4 h-4 rounded mr-2 flex-shrink-0"
                                style={{ backgroundColor: team.style?.primaryColor || '#dc2626' }}
                            ></div>
                            <span className="truncate">{team.name}</span>
                        </button>
                    ))}
                    {teams.length > 8 && (
                        <div className="text-xs text-slate-500 px-2">
                            +{teams.length - 8} more teams
                        </div>
                    )}
                    {teams.length === 0 && (
                        <div className="text-xs text-slate-500 px-2 py-2 text-center">
                            No teams yet
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