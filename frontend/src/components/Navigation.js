import React, { useState, useEffect } from 'react';
import { LacrosseIcon } from './LacrosseIcons';
import CachedImage from './CachedImage';
import { fixGoogleDriveUrl } from '../utils/imageUtils';
import NotificationBell from './NotificationBell';

// Custom hook for PWA install functionality
const usePWAInstall = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        // Check if already installed
        const standalone = window.matchMedia('(display-mode: standalone)').matches 
            || window.navigator.standalone;
        setIsInstalled(standalone);

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        // Check if mobile device
        const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || window.innerWidth < 768;
        setIsMobile(mobile);

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => setIsInstalled(true));

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const promptInstall = async () => {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstallPrompt(null);
            }
        }
    };

    // Show button if: has install prompt, is iOS, or is mobile (for Android Chrome guidance)
    return { canInstall: !!installPrompt || isIOS || isMobile, isInstalled, isIOS, isMobile, hasPrompt: !!installPrompt, promptInstall };
};

// Teams grouped by division component
const TeamsByDivision = ({ teams, websiteStyle, isCollapsed, onNavigate, onMobileClose }) => {
    const [collapsedDivisions, setCollapsedDivisions] = useState(new Set());

    // Filter out external teams and group by division
    const groupTeamsByDivision = () => {
        const grouped = {};
        const internalTeams = teams.filter(t => !t.isExternal && t.division?.toLowerCase() !== 'external');
        internalTeams.forEach(team => {
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
                                                <CachedImage 
                                                    src={fixGoogleDriveUrl(team.style.logoUrl)} 
                                                    alt={`${team.name} logo`}
                                                    className="w-full h-full object-contain"
                                                    style={{ 
                                                        opacity: team.style.logoOpacity || 1,
                                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                                    }}
                                                    fallback={
                                                        <div 
                                                            className="w-full h-full rounded-full flex items-center justify-center"
                                                            style={{ 
                                                                backgroundColor: team.style?.primaryColor || '#dc2626',
                                                                opacity: websiteStyle.buttonTransparency || 0.9
                                                            }}
                                                        >
                                                            <span className="text-white font-semibold text-xs">
                                                                {team.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                    }
                                                />
                                            ) : null}
                                            {!team.style?.logoUrl && (
                                            <div 
                                                className="w-full h-full rounded-full flex items-center justify-center"
                                                style={{ 
                                                    backgroundColor: team.style?.primaryColor || '#dc2626',
                                                    opacity: websiteStyle.buttonTransparency || 0.9
                                                }}
                                            >
                                                <LacrosseIcon name="stick" style={{fontSize: '14px', color: 'white'}} />
                                            </div>
                                            )}
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
import { isAdmin, isCoach, hasPermission } from './PermissionsSystem';

const Navigation = ({ currentPage, onNavigate, currentUser, onLogin, onLogout, teams = [], websiteStyle = {}, onMobileClose, onCollapseChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);
    const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
    const { canInstall, isInstalled, isIOS, isMobile, hasPrompt, promptInstall } = usePWAInstall();

    // Notify parent when collapse state changes
    useEffect(() => {
        if (onCollapseChange) {
            onCollapseChange(isCollapsed);
        }
    }, [isCollapsed, onCollapseChange]);

    const handleInstallClick = () => {
        if (hasPrompt) {
            // Chrome/Edge with beforeinstallprompt
            promptInstall();
        } else if (isIOS) {
            setShowIOSInstructions(true);
        } else if (isMobile) {
            // Android without prompt (show instructions)
            setShowAndroidInstructions(true);
        }
    };

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
                    ? `2px solid ${websiteStyle.navButtonBorderColor || websiteStyle.primaryColor || '#3b82f6'}` 
                    : `2px solid ${websiteStyle.navButtonBorderColor || websiteStyle.accentColor || '#e2e8f0'}`
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
                shadow-sm border-r flex flex-col 
                transition-all duration-300
                max-w-full overflow-hidden
                h-full
            `}
            style={{
                backgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
                backgroundImage: websiteStyle.navBackgroundType === 'image' && websiteStyle.navBackgroundImage 
                    ? `url(${websiteStyle.navBackgroundImage})`
                    : websiteStyle.navBackgroundType === 'texture' && websiteStyle.navBackgroundTexture
                    ? `url(${process.env.REACT_APP_BACKEND_URL}/api/uploads/textures/${websiteStyle.navBackgroundTexture}.png)`
                    : 'none',
                backgroundSize: websiteStyle.navBackgroundType === 'texture' ? '256px 256px' : 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: websiteStyle.navBackgroundType === 'texture' ? 'repeat' : 'no-repeat',
                height: '100%'
            }}
        >
            {/* Mobile Close Button */}
            {onMobileClose && (
                <div className="md:hidden p-4 border-b flex justify-end"
                    style={{borderColor: websiteStyle.navBorderColor || '#e2e8f0'}}
                >
                    <button
                        onClick={onMobileClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Close navigation menu"
                        style={{
                            color: websiteStyle.navTextColor || '#374151'
                        }}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            
            {/* Header with Large Logo - SAME HEIGHT AS TICKER + BANNER (200px) */}
            <div 
                className="flex-shrink-0 relative border-b" 
                style={{
                    height: '200px', // Match ticker (120px) + banner (80px)
                    borderColor: websiteStyle.navBorderColor || '#e2e8f0'
                }}
            >
                <div className="h-full flex flex-col items-center justify-center p-2">
                    {!isCollapsed && (
                        <div className="flex flex-col items-center w-full h-full">
                            {/* Large Logo - fills available space */}
                            <div className="flex-1 flex items-center justify-center w-full">
                                {websiteStyle.navLogoUrl ? (
                                    <CachedImage 
                                        src={websiteStyle.navLogoUrl} 
                                        alt="League Logo" 
                                        className="object-contain drop-shadow-lg"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: websiteStyle.navLeagueName ? '150px' : '180px',
                                            width: 'auto',
                                            height: 'auto',
                                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
                                        }}
                                        fallback={
                                            <div 
                                                className="flex items-center justify-center rounded-2xl"
                                                style={{
                                                    width: '160px',
                                                    height: '160px',
                                                    background: `linear-gradient(135deg, ${websiteStyle.primaryColor || '#2563eb'} 0%, ${websiteStyle.accentColor || '#3b82f6'} 100%)`,
                                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '5rem' }}>
                                                    🥍
                                                </span>
                                            </div>
                                        }
                                    />
                                ) : (
                                    <div 
                                        className="flex items-center justify-center rounded-2xl"
                                        style={{
                                            width: '160px',
                                            height: '160px',
                                            background: `linear-gradient(135deg, ${websiteStyle.primaryColor || '#2563eb'} 0%, ${websiteStyle.accentColor || '#3b82f6'} 100%)`,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <span className="text-white font-bold drop-shadow-lg" style={{ fontSize: '5rem' }}>
                                            🥍
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* League Name - only if set */}
                            {websiteStyle.navLeagueName && (
                                <h1 
                                    className="text-center font-bold leading-tight mt-1 px-2"
                                    style={{
                                        fontFamily: websiteStyle.navFont || 'Inter, sans-serif',
                                        fontSize: '16px',
                                        color: websiteStyle.navTextColor || '#1f2937',
                                        wordWrap: 'break-word'
                                    }}
                                >
                                    {websiteStyle.navLeagueName}
                                </h1>
                            )}
                        </div>
                    )}
                    
                    {/* Collapsed state - small logo */}
                    {isCollapsed && (
                        <div className="flex items-center justify-center w-full">
                            {websiteStyle.navLogoUrl ? (
                                <CachedImage 
                                    src={websiteStyle.navLogoUrl} 
                                    alt="Logo" 
                                    className="object-contain"
                                    style={{ width: '48px', height: '48px' }}
                                    fallback={<span className="text-4xl">🥍</span>}
                                />
                            ) : (
                                <span className="text-4xl">🥍</span>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Toggle Button - positioned at bottom right of header */}
                <div className="absolute bottom-4 right-4">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
                
                {!isCollapsed && currentUser && (
                    <div className="absolute bottom-4 left-4 right-14 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-600 truncate">
                                Welcome, {currentUser.name}
                            </p>
                            <p className="text-xs text-blue-600 truncate">
                                {(currentUser.roles || [currentUser.role]).filter(Boolean).join(', ')}
                            </p>
                        </div>
                        <NotificationBell currentUser={currentUser} onNavigate={onNavigate} />
                    </div>
                )}
                {!isCollapsed && !currentUser && (
                    <p className="absolute bottom-4 left-4 text-sm text-slate-500 truncate">
                        Browsing as guest
                    </p>
                )}
            </div>

            {/* Scrollable Content Area - Only scrolls when hovering over navigation */}
            <div 
                className="flex-1 overflow-y-auto overflow-x-hidden nav-scroll"
            >
                {/* Navigation */}
                <nav className="p-4 border-b flex-shrink-0">
                    <div className="space-y-1">
                        <NavItem icon={<LacrosseIcon name="venue" />} label="Home" pageName="home" />
                        <NavItem icon={<LacrosseIcon name="calendar" />} label="Events & Schedule" pageName="events" />
                        <NavItem icon={<LacrosseIcon name="trophy" />} label="Standings" pageName="standings" />
                        {currentUser && (() => {
                            const userTeamId = currentUser.teamAssignments?.[0]?.teamId || currentUser.teamId;
                            if (userTeamId) {
                                return (
                                    <NavItem 
                                        icon={<LacrosseIcon name="teams" />} 
                                        label="My Team" 
                                        pageName="team"
                                        onClick={() => {
                                            onNavigate('team', userTeamId);
                                            if (onMobileClose) onMobileClose();
                                        }}
                                    />
                                );
                            }
                            return null;
                        })()}
                        {currentUser && (
                            <NavItem icon={<span>📊</span>} label="My Dashboard" pageName="player-dashboard" />
                        )}
                        {currentUser && hasPermission(currentUser, 'nav.league_chat') && (
                            <NavItem icon={<span>💬</span>} label="League Chat" pageName="chat" />
                        )}
                        {currentUser && isAdmin(currentUser) && (
                            <NavItem icon={<LacrosseIcon name="admin" />} label="Admin Portal" pageName="admin" />
                        )}
                        {currentUser && isCoach(currentUser) && !isAdmin(currentUser) && (
                            <NavItem icon={<span>🏆</span>} label="Team Admin" pageName="team-admin" />
                        )}
                        <NavItem icon={<span>📚</span>} label="Help & Docs" pageName="help" />
                        
                        {/* Install App Button - only show if not already installed */}
                        {!isInstalled && canInstall && (
                            <button
                                onClick={handleInstallClick}
                                data-testid="install-app-btn"
                                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 hover:shadow-sm hover:transform hover:scale-102 mt-2"
                                style={{
                                    color: websiteStyle.menuTextColor || '#64748b',
                                    backgroundColor: `${websiteStyle.primaryColor || '#3b82f6'}15`,
                                    border: `2px solid ${websiteStyle.primaryColor || '#3b82f6'}`
                                }}
                                title={isCollapsed ? 'Install App' : ''}
                            >
                                <span className="flex-shrink-0" style={{fontSize: '20px'}}>📲</span>
                                {!isCollapsed && <span className="ml-3 font-medium">Install App</span>}
                            </button>
                        )}
                    </div>
                    
                    {/* Authentication Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
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
                </nav>

                {/* Teams Section - Grouped by Division */}
                <TeamsByDivision 
                    teams={teams}
                    websiteStyle={websiteStyle}
                    isCollapsed={isCollapsed}
                    onNavigate={onNavigate}
                    onMobileClose={onMobileClose}
                />
            </div>

            {/* Authentication moved above - this section removed */}
            
            {/* iOS Install Instructions Modal */}
            {showIOSInstructions && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowIOSInstructions(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Add to Home Screen</h3>
                            <button 
                                onClick={() => setShowIOSInstructions(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow">
                                {websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl ? (
                                    <img 
                                        src={websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl} 
                                        alt="App" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl">📱</span>
                                )}
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">
                                    {websiteStyle.pwaAppName || websiteStyle.navLeagueName || 'Install App'}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {websiteStyle.pwaShortName || 'App'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm text-slate-700">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">1</div>
                                <div>
                                    Tap the <strong>Share</strong> button 
                                    <span className="inline-flex items-center ml-1">
                                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2L12 14M12 2L8 6M12 2L16 6M4 14V20H20V14" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        </svg>
                                    </span>
                                    at the bottom of Safari
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">2</div>
                                <div>Scroll down and tap <strong>"Add to Home Screen"</strong></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">3</div>
                                <div>Tap <strong>"Add"</strong> in the top right corner</div>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowIOSInstructions(false)}
                            className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
            
            {/* Android Install Instructions Modal */}
            {showAndroidInstructions && (
                <div 
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowAndroidInstructions(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Add to Home Screen</h3>
                            <button 
                                onClick={() => setShowAndroidInstructions(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shadow">
                                {websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl ? (
                                    <img 
                                        src={websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl} 
                                        alt="App" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl">📱</span>
                                )}
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">
                                    {websiteStyle.pwaAppName || websiteStyle.navLeagueName || 'Install App'}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {websiteStyle.pwaShortName || 'App'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-3 text-sm text-slate-700">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">1</div>
                                <div>
                                    Tap the <strong>Menu</strong> button 
                                    <span className="inline-flex items-center ml-1">
                                        <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                            <circle cx="12" cy="5" r="2"/>
                                            <circle cx="12" cy="12" r="2"/>
                                            <circle cx="12" cy="19" r="2"/>
                                        </svg>
                                    </span>
                                    in Chrome (top right)
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">2</div>
                                <div>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">3</div>
                                <div>Tap <strong>"Install"</strong> or <strong>"Add"</strong></div>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowAndroidInstructions(false)}
                            className="w-full mt-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navigation;