import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import EventsTicker from './EventsTicker';

const Layout = ({ 
    children, 
    currentPage, 
    onNavigate, 
    onTeamNavigate,
    currentUser, 
    onLogin,
    onLogout,
    teams = [],
    websiteStyle = {},
    events = [],
    onEventClick,
    onTeamClick
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
        <div>
            {/* Fixed Header Container - Event Ticker (Top) + League Banner (Below) */}
            <div className="fixed top-0 left-0 right-0 z-40 flex flex-col">
                {/* Event Ticker - At Very Top */}
                <div className="bg-slate-800 text-white shadow-sm">
                    <EventsTicker 
                        events={events}
                        teams={teams}
                        websiteStyle={websiteStyle}
                        onEventClick={onEventClick}
                        onTeamClick={onTeamClick}
                    />
                </div>
                
                {/* League Banner - Below Ticker */}
                <div 
                    className="px-4 py-3 border-b shadow-sm"
                    style={{
                        backgroundColor: websiteStyle.bannerBackgroundType === 'image' ? 'transparent' : (websiteStyle.bannerBackgroundColor || '#ffffff'),
                        backgroundImage: websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage 
                            ? `url(${websiteStyle.bannerBackgroundImage})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                    }}
                >
                    {/* Overlay for image banners */}
                    {websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                    )}
                    
                    <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto">
                        <div className="flex items-center space-x-4">
                            <div className="text-3xl">🥍</div>
                            <div>
                                <h1 
                                    className="text-xl md:text-2xl font-bold"
                                    style={{
                                        fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                        color: websiteStyle.bannerTextColor || '#1f2937'
                                    }}
                                >
                                    {websiteStyle.bannerTitle || 'Lacrosse League'}
                                </h1>
                                <p 
                                    className="text-sm hidden md:block"
                                    style={{
                                        fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                        color: websiteStyle.bannerTextColor || '#6b7280'
                                    }}
                                >
                                    {websiteStyle.bannerSubtitle || 'Manage your league with style and efficiency'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Ticker - Below Banner */}
                <EventsTicker 
                    events={events}
                    teams={teams}
                    websiteStyle={websiteStyle}
                    onEventClick={onEventClick}
                    onTeamClick={onTeamClick}
                />
            </div>

            {/* Main Layout Container with proper spacing for fixed header */}
            <div className="flex min-h-screen" style={{...getBackgroundStyle(), paddingTop: '140px'}}>
                {/* Mobile Navigation Overlay */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{top: '140px'}} // Position below full header (banner + ticker)
                    />
                )}
                
                {/* Navigation - Fixed position for desktop, goes to bottom of full header */}
                <div className="hidden md:block">
                    <div 
                        className="fixed left-0 z-20 overflow-hidden"
                        style={{
                            top: '140px', // Position below full header (banner + ticker)
                            bottom: '0',
                            height: 'calc(100vh - 140px)'
                        }}
                    >
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
                </div>
                
                {/* Mobile Navigation - Slide in from left, positioned below full header */}
                <div className={`
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                    fixed left-0 z-50 md:hidden
                    transition-transform duration-300 ease-in-out
                `}
                style={{
                    top: '140px', // Position below full header (banner + ticker)
                    bottom: '0',
                    height: 'calc(100vh - 140px)'
                }}>
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
                <div className="flex-1 flex flex-col w-full min-w-0 md:ml-64">
                    {/* Mobile Navigation Button - Fixed at top left for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="md:hidden fixed z-40 p-2 rounded-lg shadow-lg transition-colors mobile-nav-button"
                        style={{top: '150px', left: '1rem'}}
                        style={{
                            backgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
                            color: websiteStyle.navTextColor || '#374151'
                        }}
                        aria-label="Open navigation menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Main Content Container */}
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
        </div>
    );
};

export default Layout;