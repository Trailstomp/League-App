import React from 'react';
import { isAdmin } from './PermissionsSystem';

const BottomNavbar = ({ 
    currentPage, 
    onNavigate, 
    currentUser,
    websiteStyle = {},
    onLogin
}) => {
    // Build navigation items based on user state
    const navItems = [
        { id: 'home', label: 'Home', icon: '🏠', show: true },
        { id: 'events', label: 'Events', icon: '📅', show: true },
        { id: 'standings', label: 'Standings', icon: '🏆', show: true },
        { 
            id: 'team', 
            label: 'My Team', 
            icon: '🥍',
            show: !!(currentUser && (currentUser.teamAssignments?.[0]?.teamId || currentUser.teamId)),
            teamId: currentUser?.teamAssignments?.[0]?.teamId || currentUser?.teamId
        },
        { 
            id: 'player-dashboard', 
            label: 'Dashboard', 
            icon: '📊',
            show: !!currentUser
        },
        { 
            id: 'email', 
            label: 'Email', 
            icon: '📧',
            show: !!(currentUser && hasPermission(currentUser, 'nav.email'))
        },
        { 
            id: 'site-style', 
            label: 'Style', 
            icon: '⚙️',
            show: true,
            action: () => {
                if (window.__togglePreferences) window.__togglePreferences();
            }
        },
        { 
            id: 'admin', 
            label: 'Admin', 
            icon: '🛠️',
            show: !!(currentUser && isAdmin(currentUser))
        }
    ];

    const visibleItems = navItems.filter(item => item.show);

    // If not logged in, add login button
    if (!currentUser) {
        visibleItems.push({ id: 'login', label: 'Login', icon: '👤', show: true, action: onLogin });
    }

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-50 shadow-lg border-t safe-area-bottom"
            data-testid="bottom-navbar"
            style={{
                backgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
                borderTopColor: websiteStyle.primaryColor || '#e2e8f0'
            }}
        >
            <div className="flex justify-around items-center px-1 overflow-x-auto" style={{ height: '60px' }}>
                {visibleItems.map(item => {
                    const isActive = currentPage === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            data-testid={`bottom-nav-${item.id}`}
                            onClick={() => {
                                if (item.action) {
                                    item.action();
                                } else if (item.teamId) {
                                    onNavigate('team', item.teamId);
                                } else {
                                    onNavigate(item.id);
                                }
                            }}
                            className="flex flex-col items-center justify-center py-1 px-1 min-w-0 flex-1 transition-all duration-200 relative"
                            style={{
                                color: isActive 
                                    ? (websiteStyle.primaryColor || '#3b82f6')
                                    : (websiteStyle.menuTextColor || '#6b7280'),
                                maxWidth: `${100 / visibleItems.length}%`
                            }}
                        >
                            <span className={`text-lg leading-none ${isActive ? 'transform scale-110' : ''} transition-transform duration-200`}>
                                {item.icon}
                            </span>
                            <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'font-bold' : 'font-medium'} truncate w-full text-center`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div 
                                    className="absolute bottom-0 w-8 h-0.5 rounded-t-full"
                                    style={{ backgroundColor: websiteStyle.primaryColor || '#3b82f6' }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavbar;
