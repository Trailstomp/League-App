import React from 'react';
import { LacrosseIcon } from './LacrosseIcons';
import { isAdmin } from './PermissionsSystem';

const BottomNavbar = ({ 
    currentPage, 
    onNavigate, 
    currentUser,
    websiteStyle = {},
    onLogin
}) => {
    // Define navigation items
    const navItems = [
        { 
            id: 'home', 
            label: 'Home', 
            icon: '🏠',
            show: true 
        },
        { 
            id: 'events', 
            label: 'Events', 
            icon: '📅',
            show: true 
        },
        { 
            id: 'standings', 
            label: 'Standings', 
            icon: '🏆',
            show: true 
        },
        { 
            id: 'admin', 
            label: 'Admin', 
            icon: '⚙️',
            show: currentUser && isAdmin(currentUser)
        }
    ];

    const visibleItems = navItems.filter(item => item.show);

    return (
        <nav 
            className="fixed bottom-0 left-0 right-0 z-50 shadow-lg border-t safe-area-bottom"
            style={{
                backgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
                borderTopColor: websiteStyle.primaryColor || '#e2e8f0'
            }}
        >
            <div className="flex justify-around items-center h-16 px-2">
                {visibleItems.map(item => {
                    const isActive = currentPage === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`
                                flex flex-col items-center justify-center 
                                flex-1 py-2 px-1
                                transition-all duration-200
                                ${isActive ? 'transform scale-105' : ''}
                            `}
                            style={{
                                color: isActive 
                                    ? (websiteStyle.primaryColor || '#3b82f6')
                                    : (websiteStyle.menuTextColor || '#6b7280')
                            }}
                        >
                            {/* Icon */}
                            <span 
                                className={`
                                    text-2xl mb-1
                                    ${isActive ? 'transform scale-110' : ''}
                                    transition-transform duration-200
                                `}
                            >
                                {item.icon}
                            </span>
                            
                            {/* Label */}
                            <span 
                                className={`
                                    text-xs font-medium
                                    ${isActive ? 'font-bold' : ''}
                                `}
                            >
                                {item.label}
                            </span>
                            
                            {/* Active indicator */}
                            {isActive && (
                                <div 
                                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-t-full"
                                    style={{
                                        backgroundColor: websiteStyle.primaryColor || '#3b82f6'
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
                
                {/* Login button if not logged in */}
                {!currentUser && (
                    <button
                        onClick={onLogin}
                        className="flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all duration-200"
                        style={{
                            color: websiteStyle.menuTextColor || '#6b7280'
                        }}
                    >
                        <span className="text-2xl mb-1">👤</span>
                        <span className="text-xs font-medium">Login</span>
                    </button>
                )}
            </div>
        </nav>
    );
};

export default BottomNavbar;
