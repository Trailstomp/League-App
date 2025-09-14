import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import GameTicker from './GameTicker';

const Layout = ({ 
    children, 
    currentPage, 
    onNavigate, 
    onTeamNavigate,
    currentUser, 
    onLogin,
    onLogout,
    teams = [],
    websiteStyle = {} 
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Apply global website styling
    useEffect(() => {
        const applyGlobalStyling = () => {
            const root = document.documentElement;
            
            // Apply CSS variables for global styling
            if (websiteStyle.mainBackgroundColor) {
                root.style.setProperty('--main-bg-color', websiteStyle.mainBackgroundColor);
            }
            if (websiteStyle.primaryColor) {
                root.style.setProperty('--primary-color', websiteStyle.primaryColor);
            }
            if (websiteStyle.accentColor) {
                root.style.setProperty('--accent-color', websiteStyle.accentColor);
            }
            if (websiteStyle.mainFont) {
                root.style.setProperty('--main-font', websiteStyle.mainFont);
            }
            if (websiteStyle.mainTextColor) {
                root.style.setProperty('--main-text-color', websiteStyle.mainTextColor);
            }

            // Apply banner background to body if banner image
            if (websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage) {
                document.body.style.setProperty('--banner-bg-image', `url(${websiteStyle.bannerBackgroundImage})`);
            }
        };

        applyGlobalStyling();
    }, [websiteStyle]);

    const handleNavigate = (page, teamId = null) => {
        if (page === 'team' && teamId && onTeamNavigate) {
            onTeamNavigate(teamId);
        } else if (onNavigate) {
            onNavigate(page);
        }
        // Close mobile menu on navigation
        setIsMobileMenuOpen(false);
    };

    // Get dynamic background style
    const getBackgroundStyle = () => {
        const style = {};
        
        if (websiteStyle.mainBackgroundType === 'image' && websiteStyle.mainBackgroundImage) {
            style.backgroundImage = `url(${websiteStyle.mainBackgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundColor = 'rgba(248, 250, 252, 0.9)'; // Fallback with opacity
        } else {
            style.backgroundColor = websiteStyle.mainBackgroundColor || '#f8fafc';
        }
        
        return style;
    };

    return (
        <div className="flex min-h-screen" style={getBackgroundStyle()}>
            {/* Mobile Navigation Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
            
            {/* Navigation - Hidden on mobile, shown on md+ */}
            <div className="hidden md:block">
                <Navigation 
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onLogin={onLogin}
                    onLogout={onLogout}
                    teams={teams}
                    websiteStyle={websiteStyle}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />
            </div>
            
            {/* Mobile Navigation - Slide in from left */}
            <div className={`
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                fixed inset-y-0 left-0 z-50 md:hidden
                transition-transform duration-300 ease-in-out
            `}>
                <Navigation 
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    onLogin={onLogin}
                    onLogout={onLogout}
                    teams={teams}
                    websiteStyle={websiteStyle}
                    onMobileClose={() => setIsMobileMenuOpen(false)}
                />
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full min-w-0">
                {/* Mobile Header - Only shown on mobile with dynamic styling */}
                <div 
                    className="md:hidden border-b px-4 py-3 flex items-center justify-between flex-shrink-0"
                    style={{
                        backgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
                        color: websiteStyle.navTextColor || '#374151'
                    }}
                >
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        aria-label="Open navigation menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 
                        className="text-lg font-bold"
                        style={{ 
                            fontFamily: websiteStyle.navFont || 'Inter, sans-serif',
                            color: websiteStyle.navTextColor || '#374151'
                        }}
                    >
                        🥍 {websiteStyle.navLeagueName || 'Lacrosse League'}
                    </h1>
                    <div className="w-10"></div> {/* Spacer for centering */}
                </div>

                {/* Main Content with dynamic styling */}
                <main 
                    className="flex-1 p-3 sm:p-6 overflow-x-hidden"
                    style={{
                        fontFamily: websiteStyle.mainFont || 'Inter, sans-serif',
                        fontSize: websiteStyle.mainFontSize || '16px',
                        color: websiteStyle.mainTextColor || '#374151'
                    }}
                >
                    <div className="w-full max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;