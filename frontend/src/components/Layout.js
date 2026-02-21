import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import EventsTicker from './EventsTicker';
import BottomNavbar from './BottomNavbar';
import CachedImage from './CachedImage';
import UserPreferences from './UserPreferences';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper to generate background styles for zones that support color/image/texture
const getZoneBgStyle = (ws, zone) => {
    const bgType = ws[`${zone}BackgroundType`];
    const bgColor = ws[`${zone}BackgroundColor`];
    const bgImage = ws[`${zone}BackgroundImage`];
    const bgTexture = ws[`${zone}BackgroundTexture`];
    
    if (bgType === 'texture' && bgTexture) {
        return {
            backgroundColor: bgColor || 'transparent',
            backgroundImage: `url(${BACKEND_URL}/api/uploads/textures/${bgTexture}.png)`,
            backgroundSize: '256px 256px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'top left'
        };
    }
    if (bgType === 'image' && bgImage) {
        return {
            backgroundColor: 'transparent',
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        };
    }
    return {
        backgroundColor: bgColor || '#ffffff',
        backgroundImage: 'none'
    };
};

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
    onStyleChange,
    events = [],
    onEventClick,
    onTeamClick,
    tickerConfig = {}
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

    // Cycling template logic moved to App.js where it can update websiteStyle state

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
            if (websiteStyle.inputTextColor) {
                root.style.setProperty('--input-text-color', websiteStyle.inputTextColor);
            }
            if (websiteStyle.secondaryTextColor) {
                root.style.setProperty('--secondary-text-color', websiteStyle.secondaryTextColor);
            }
            if (websiteStyle.accentTextColor) {
                root.style.setProperty('--accent-text-color', websiteStyle.accentTextColor);
            }

            // Apply banner background to body if banner image
            if (websiteStyle.bannerBackgroundType === 'image' && websiteStyle.bannerBackgroundImage) {
                document.body.style.setProperty('--banner-bg-image', `url(${websiteStyle.bannerBackgroundImage})`);
            }
            
            // Update browser favicon to use the league's logo (with cache busting)
            const logoUrl = websiteStyle.pwaIconUrl || websiteStyle.navLogoUrl || websiteStyle.logoUrl;
            if (logoUrl) {
                const cacheBuster = `?v=${Date.now()}`;
                const faviconUrl = logoUrl.includes('?') ? `${logoUrl}&_cb=${Date.now()}` : `${logoUrl}${cacheBuster}`;
                
                const existingFavicon = document.querySelector('link[rel="icon"]');
                if (existingFavicon) {
                    existingFavicon.href = faviconUrl;
                } else {
                    const link = document.createElement('link');
                    link.rel = 'icon';
                    link.type = 'image/png';
                    link.href = faviconUrl;
                    document.head.appendChild(link);
                }
                // Also update apple-touch-icon
                const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
                if (appleIcon) {
                    appleIcon.href = faviconUrl;
                }
                
                // Update PWA manifest dynamically for icon refresh
                try {
                    const manifestBlob = new Blob([JSON.stringify({
                        short_name: websiteStyle.navLeagueName || 'League',
                        name: websiteStyle.bannerTitle || websiteStyle.navLeagueName || 'League Portal',
                        icons: [
                            { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
                            { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
                        ],
                        start_url: '/',
                        display: 'standalone',
                        theme_color: websiteStyle.primaryColor || '#1e40af',
                        background_color: websiteStyle.mainBgColor || '#f8fafc'
                    })], { type: 'application/json' });
                    const manifestUrl = URL.createObjectURL(manifestBlob);
                    let manifestLink = document.querySelector('link[rel="manifest"]');
                    if (manifestLink) {
                        manifestLink.href = manifestUrl;
                    } else {
                        manifestLink = document.createElement('link');
                        manifestLink.rel = 'manifest';
                        manifestLink.href = manifestUrl;
                        document.head.appendChild(manifestLink);
                    }
                } catch (e) {
                    console.warn('Could not update manifest:', e);
                }
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
        if (websiteStyle.mainBackgroundType === 'texture' && websiteStyle.mainBackgroundTexture) {
            return {
                backgroundImage: `url(${BACKEND_URL}/api/uploads/textures/${websiteStyle.mainBackgroundTexture}.png)`,
                backgroundSize: '256px 256px',
                backgroundRepeat: 'repeat',
                backgroundPosition: 'top left',
                backgroundColor: websiteStyle.mainBackgroundColor || '#f8fafc'
            };
        }
        if (websiteStyle.mainBackgroundType === 'image' && websiteStyle.mainBackgroundImage) {
            return {
                backgroundImage: `url(${websiteStyle.mainBackgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: 'rgba(248, 250, 252, 0.9)'
            };
        }
        return { backgroundColor: websiteStyle.mainBackgroundColor || '#f8fafc' };
    };

    // Get content area background style (the "white" area user mentioned)
    const getContentBackgroundStyle = () => {
        const style = {};
        
        // Debug log
        console.log('🎨 Content Background Style:', {
            type: websiteStyle.contentBackgroundType,
            color: websiteStyle.contentBackgroundColor,
            image: websiteStyle.contentBackgroundImage
        });
        
        // Check if using image AND image is valid
        if (websiteStyle.contentBackgroundType === 'image' && websiteStyle.contentBackgroundImage) {
            style.backgroundImage = `url(${websiteStyle.contentBackgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
            style.backgroundAttachment = 'fixed';
        }
        
        // Always apply background color (as fallback or primary if type is 'color')
        if (websiteStyle.contentBackgroundColor && websiteStyle.contentBackgroundColor !== '#ffffff') {
            style.backgroundColor = websiteStyle.contentBackgroundColor;
        } else {
            style.backgroundColor = '#ffffff'; // Default white
        }
        
        // Add CSS custom properties for card backgrounds
        const cardBgColor = websiteStyle.cardBackgroundColor || '#ffffff';
        const cardOpacity = websiteStyle.cardBackgroundOpacity || 1;
        const isTransparent = websiteStyle.cardBackgroundType === 'transparent';
        
        // Convert hex to rgba for opacity support
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        style['--card-bg'] = isTransparent ? 'transparent' : hexToRgba(cardBgColor, cardOpacity);
        style['--card-bg-solid'] = isTransparent ? 'transparent' : cardBgColor;
        style['--card-opacity'] = isTransparent ? '0' : cardOpacity;
        
        // Typography CSS custom properties
        style['--content-font'] = websiteStyle.contentFont || 'Inter, sans-serif';
        style['--content-text-color'] = websiteStyle.contentTextColor || '#374151';
        style['--card-font'] = websiteStyle.cardFont === 'inherit' ? 'inherit' : (websiteStyle.cardFont || 'inherit');
        style['--card-text-color'] = websiteStyle.cardTextColor || '#374151';
        style['--card-heading-color'] = websiteStyle.cardHeadingColor || '#1f2937';
        
        return style;
    };

    return (
        <div className="min-h-screen" style={{...getBackgroundStyle()}}>
            {/* Desktop Header - banner full height with ticker overlay */}
            {!isMobileView && (
                <div 
                    className="fixed top-0 right-0 z-50 transition-all duration-300"
                    style={{
                        left: isNavCollapsed ? '80px' : '320px',
                        height: '200px'
                    }}
                >
                    {/* Banner - extends full height behind ticker */}
                    <div 
                        className="absolute inset-0 w-full flex items-end px-4 py-3 border-b shadow-sm"
                        style={{
                            zIndex: 98,
                            ...getZoneBgStyle(websiteStyle, 'banner')
                        }}
                    >
                        {/* Overlay for image/texture banners */}
                        {(websiteStyle.bannerBackgroundType === 'image' || websiteStyle.bannerBackgroundType === 'texture') && (websiteStyle.bannerBackgroundImage || websiteStyle.bannerBackgroundTexture) && (
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

                    {/* Event Ticker - overlays top of banner */}
                    <div 
                        className="w-full text-white shadow-sm relative" 
                        style={{ 
                            height: '120px',
                            display: 'block',
                            position: 'relative',
                            zIndex: 100,
                            overflow: 'hidden',
                            backgroundColor: websiteStyle.tickerTransparent 
                                ? 'transparent' 
                                : (websiteStyle.tickerColor || '#1e293b')
                        }}
                    >
                        <EventsTicker 
                            events={events}
                            teams={teams}
                            websiteStyle={websiteStyle}
                            tickerConfig={tickerConfig}
                            onEventClick={onEventClick}
                            onTeamClick={onTeamClick}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Header - Logo, league name, and ticker (no hamburger) */}
            {isMobileView && (
                <div className="fixed top-0 left-0 right-0 z-50 shadow-md">
                    {/* Mobile banner bar */}
                    <div
                        className="flex items-center px-4 relative"
                        style={{
                            height: '56px',
                            ...getZoneBgStyle(websiteStyle, 'banner')
                        }}
                    >
                        {(websiteStyle.bannerBackgroundType === 'image' || websiteStyle.bannerBackgroundType === 'texture') && (websiteStyle.bannerBackgroundImage || websiteStyle.bannerBackgroundTexture) && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>
                        )}
                        <div className="flex items-center space-x-3 relative z-10 w-full">
                            {websiteStyle.navLogoUrl ? (
                                <CachedImage 
                                    src={websiteStyle.navLogoUrl} 
                                    alt="Logo" 
                                    className="w-9 h-9 object-contain rounded-lg flex-shrink-0"
                                    fallback={<span className="text-xl">🥍</span>}
                                />
                            ) : (
                                <span className="text-xl flex-shrink-0">🥍</span>
                            )}
                            <h1 
                                className="text-base font-bold leading-tight"
                                style={{
                                    fontFamily: websiteStyle.bannerFont || 'Inter, sans-serif',
                                    color: websiteStyle.bannerTextColor || '#ffffff',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                }}
                            >
                                {websiteStyle.navLeagueName || websiteStyle.bannerTitle || 'League'}
                            </h1>
                        </div>
                    </div>

                    {/* Mobile Ticker - uses full card rendering like desktop */}
                    <div
                        className="w-full overflow-hidden"
                        style={{ height: '100px', backgroundColor: websiteStyle?.tickerTransparent ? 'transparent' : (websiteStyle?.tickerColor || '#1e293b') }}
                    >
                        <EventsTicker 
                            events={events}
                            teams={teams}
                            websiteStyle={websiteStyle}
                            tickerConfig={tickerConfig}
                            onEventClick={onEventClick}
                            onTeamClick={onTeamClick}
                            compact={false}
                        />
                    </div>
                </div>
            )}

            {/* Mobile Navigation Overlay - no longer needed, nav is in bottom bar */}
            
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
            
            {/* Mobile Navigation handled by BottomNavbar */}
            
            {/* Main Content Area - starts at top with padding to account for fixed header */}
            <div 
                className="main-content-area transition-all duration-300" 
                style={{
                    marginLeft: isMobileView ? '0' : (isNavCollapsed ? '80px' : '320px'), // Use actual nav maxWidth
                    paddingTop: isMobileView ? '164px' : '200px', // 56px header + 100px ticker + 8px gap
                    paddingBottom: isMobileView ? '80px' : '0', // Space for bottom navbar on mobile
                    minHeight: '100vh',
                    width: isMobileView ? '100vw' : (isNavCollapsed ? 'calc(100vw - 80px)' : 'calc(100vw - 320px)')
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Main Content Container with customizable background */}
                    <main 
                        className="flex-1 overflow-x-hidden w-full"
                        style={{
                            fontFamily: websiteStyle.mainFont || 'Inter, sans-serif',
                            fontSize: websiteStyle.mainFontSize || '16px',
                            color: websiteStyle.mainTextColor || '#374151',
                            minHeight: isMobileView ? 'calc(100vh - 220px)' : 'calc(100vh - 200px)',
                            padding: isMobileView ? '0.5rem' : '1rem',
                            ...getContentBackgroundStyle()
                        }}
                    >
                        {children}
                    </main>
                </div>
            </div>

            {/* Bottom Navigation Bar for Mobile */}
            {isMobileView && (
                <BottomNavbar
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                    currentUser={currentUser}
                    websiteStyle={websiteStyle}
                    onLogin={onLogin}
                />
            )}

            {/* Floating Preferences Button */}
            <UserPreferences
                websiteStyle={websiteStyle}
                onStyleChange={onStyleChange}
                currentUser={currentUser}
                currentPage={currentPage}
                onNavigate={onNavigate}
            />
        </div>
    );
};

export default Layout;