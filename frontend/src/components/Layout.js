import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import EventsTicker from './EventsTicker';
import BottomNavbar from './BottomNavbar';

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
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [isNavCollapsed, setIsNavCollapsed] = useState(false);
    
    // Check for mobile view on mount and resize
    useEffect(() => {
        const checkMobileView = () => {
            const isMobile = window.innerWidth < 768;
            console.log('🔍 Mobile check:', window.innerWidth, 'Mobile:', isMobile);
            setIsMobileView(isMobile);
        };
        
        // Initial check
        checkMobileView();
        
        // Add resize listener
        window.addEventListener('resize', checkMobileView);
        
        return () => window.removeEventListener('resize', checkMobileView);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            // Restore scrolling
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [isMobileMenuOpen]);

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

    // Get dynamic background style for the outer container
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

    // Get content area background style (the "white" area user mentioned)
    const getContentBackgroundStyle = () => {
        const style = {};
        
        if (websiteStyle.contentBackgroundType === 'image' && websiteStyle.contentBackgroundImage) {
            style.backgroundImage = `url(${websiteStyle.contentBackgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundAttachment = 'fixed';
        } else if (websiteStyle.contentBackgroundColor) {
            style.backgroundColor = websiteStyle.contentBackgroundColor;
        } else {
            style.backgroundColor = '#ffffff'; // Default white
        }
        
        return style;
    };

    return (
        <div className="min-h-screen" style={{...getBackgroundStyle()}}>
            {/* Fixed Header Container - ticker and banner to the right of navigation */}
            <div 
                className="fixed top-0 right-0 z-50 transition-all duration-300"
                style={{
                    left: isMobileView ? '0' : (isNavCollapsed ? '80px' : '320px'), // Use actual nav maxWidth
                    height: '200px' // Ticker (120px) + Banner (80px)
                }}
            >
                {/* Event Ticker */}
                <div 
                    className="w-full bg-slate-800 text-white shadow-sm" 
                    style={{ 
                        height: '120px',
                        display: 'block',
                        position: 'relative',
                        zIndex: 100,
                        overflow: 'hidden'
                    }}
                >
                    <EventsTicker 
                        events={events}
                        teams={teams}
                        websiteStyle={websiteStyle}
                        onEventClick={onEventClick}
                        onTeamClick={onTeamClick}
                    />
                </div>
                
                {/* League Banner */}
                <div 
                    className="w-full px-4 py-3 border-b shadow-sm flex items-center"
                    style={{
                        height: '80px',
                        display: 'block',
                        position: 'relative',
                        zIndex: 99,
                        backgroundColor: websiteStyle.bannerBackgroundType === 'image' ? 'transparent' : (websiteStyle.bannerBackgroundColor || '#ffffff'),
                        backgroundImage: websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage 
                            ? `url(${websiteStyle.bannerBackgroundImage})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Overlay for image banners */}
                    {websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 z-0"></div>
                    )}
                    
                    <div className="flex items-center justify-between relative z-10 max-w-7xl mx-auto w-full">
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
            </div>

            {/* Mobile Navigation Overlay */}
            {isMobileView && isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    style={{top: '0'}} // Cover full screen
                    onClick={() => setIsMobileMenuOpen(false)}
                    onTouchStart={(e) => e.stopPropagation()}
                />
            )}
            
            {/* Navigation - Fixed position from TOP, full height */}
            {!isMobileView && (
                <div 
                    className="fixed left-0 top-0 z-60 overflow-hidden transition-all duration-300"
                    style={{
                        height: '100vh',
                        width: isNavCollapsed ? '80px' : '320px' // Fixed widths for consistent alignment
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
                        onCollapseChange={setIsNavCollapsed}
                    />
                </div>
            )}
            
            {/* Mobile Navigation - Full height from top */}
            {isMobileView && (
                <div className={`
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                    fixed left-0 top-0 z-50 bg-white shadow-lg
                    transition-transform duration-300 ease-in-out
                    overflow-y-auto
                `}
            style={{
                height: '100vh',
                width: '75vw',
                maxWidth: '320px'
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}>
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
            )}
            
            {/* Main Content Area - starts at top with padding to account for fixed header */}
            <div 
                className="main-content-area transition-all duration-300" 
                style={{
                    marginLeft: isMobileView ? '0' : (isNavCollapsed ? '80px' : '320px'), // Use actual nav maxWidth
                    paddingTop: '200px', // Account for fixed header (ticker 120px + banner 80px)
                    minHeight: '100vh',
                    width: isMobileView ? '100vw' : (isNavCollapsed ? 'calc(100vw - 80px)' : 'calc(100vw - 320px)')
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile Navigation Button - Fixed at top left for mobile */}
                    {isMobileView && (
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            onTouchStart={(e) => {
                                e.stopPropagation();
                                setIsMobileMenuOpen(true);
                            }}
                            className="fixed z-60 p-4 rounded-lg shadow-2xl transition-all duration-200 hover:scale-110 mobile-nav-button touch-manipulation"
                        style={{
                            top: '210px', // Just below header with padding
                            left: '16px', // Fixed position from left
                            backgroundColor: websiteStyle.primaryColor || '#3b82f6',
                            color: '#ffffff',
                            border: '3px solid #ffffff',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 0 0 4px rgba(59, 130, 246, 0.2)'
                        }}
                        aria-label="Open navigation menu"
                    >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}

                    {/* Main Content Container */}
                    <main 
                        className="flex-1 overflow-x-hidden w-full"
                        style={{
                            fontFamily: websiteStyle.mainFont || 'Inter, sans-serif',
                            fontSize: websiteStyle.mainFontSize || '16px',
                            color: websiteStyle.mainTextColor || '#374151',
                            minHeight: 'calc(100vh - 200px)', // Ensure full height below header
                            padding: '0' // Remove padding to eliminate gaps
                        }}
                    >
                        <div className="w-full h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;