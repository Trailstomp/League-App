import React, { useState, useEffect, useCallback } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import ColorExtractor from '../ColorExtractor';

const WebsiteDesignManager = React.memo(({ websiteStyle = {}, setWebsiteStyle }) => {
    const [activeSection, setActiveSection] = useState('navigation');
    
    // Properly initialize editingStyle with websiteStyle data
    const [editingStyle, setEditingStyle] = useState(() => ({
        // Navigation Zone - with websiteStyle fallbacks
        navBackgroundType: websiteStyle.navBackgroundType || 'color',
        navBackgroundColor: websiteStyle.navBackgroundColor || '#ffffff',
        navBackgroundImage: websiteStyle.navBackgroundImage || '',
        navTextColor: websiteStyle.navTextColor || '#374151',
        navFont: websiteStyle.navFont || 'Inter, sans-serif',
        navFontSize: websiteStyle.navFontSize || '16px',
        navLeagueName: websiteStyle.navLeagueName || websiteStyle.leagueName || 'Your League Name',
        navLogoUrl: websiteStyle.navLogoUrl || websiteStyle.logoUrl || '',
        
        // Banner Zone - with websiteStyle fallbacks
        bannerBackgroundType: websiteStyle.bannerBackgroundType || 'color',
        bannerBackgroundColor: websiteStyle.bannerBackgroundColor || '#1e40af',
        bannerBackgroundImage: websiteStyle.bannerBackgroundImage || '',
        bannerTextColor: websiteStyle.bannerTextColor || '#ffffff',
        bannerFont: websiteStyle.bannerFont || 'Inter, sans-serif',
        bannerFontSize: websiteStyle.bannerFontSize || '32px',
        bannerTitle: websiteStyle.bannerTitle || 'Welcome to Our League',
        bannerSubtitle: websiteStyle.bannerSubtitle || 'Professional Competition',
        
        // Main Content Zone - with websiteStyle fallbacks
        mainBackgroundType: websiteStyle.mainBackgroundType || 'color',
        mainBackgroundColor: websiteStyle.mainBackgroundColor || websiteStyle.backgroundColor || '#f8fafc',
        mainBackgroundImage: websiteStyle.mainBackgroundImage || '',
        mainTextColor: websiteStyle.mainTextColor || '#374151',
        mainFont: websiteStyle.mainFont || 'Inter, sans-serif',
        mainFontSize: websiteStyle.mainFontSize || '16px',
        
        // Menu Zone - with websiteStyle fallbacks
        menuBackgroundType: websiteStyle.menuBackgroundType || 'color',
        menuBackgroundColor: websiteStyle.menuBackgroundColor || '#ffffff',
        menuBackgroundImage: websiteStyle.menuBackgroundImage || '',
        menuTextColor: websiteStyle.menuTextColor || '#374151',
        menuFont: websiteStyle.menuFont || 'Inter, sans-serif',
        menuFontSize: websiteStyle.menuFontSize || '16px',
        
        // Theme colors - with websiteStyle fallbacks
        primaryColor: websiteStyle.primaryColor || '#1e40af',
        accentColor: websiteStyle.accentColor || '#3b82f6',
        
        // Include all existing websiteStyle properties
        ...websiteStyle
    }));

    const [showColorExtractor, setShowColorExtractor] = useState(false);
    const [extractImageUrl, setExtractImageUrl] = useState('');

    const designSections = [
        { id: 'navigation', label: 'Navigation Bar', icon: 'players', description: 'Header navigation and logo area' },
        { id: 'banner', label: 'Top Banner', icon: 'image', description: 'Main banner/hero section' },
        { id: 'content', label: 'Main Content', icon: 'text', description: 'Page background and content text' },
        { id: 'menus', label: 'Menus & Sidebar', icon: 'settings', description: 'Menu styling and sidebar' },
        { id: 'preview', label: 'Live Preview', icon: 'customize', description: 'See all changes applied' }
    ];

    // Font options
    const fontFamilies = [
        { value: 'Inter, sans-serif', label: 'Inter (Modern Sans)' },
        { value: 'Roboto, sans-serif', label: 'Roboto (Clean Sans)' },
        { value: 'Georgia, serif', label: 'Georgia (Classic Serif)' },
        { value: 'Times New Roman, serif', label: 'Times New Roman (Traditional)' },
        { value: 'Arial, sans-serif', label: 'Arial (Standard Sans)' },
        { value: 'Helvetica, sans-serif', label: 'Helvetica (Professional)' },
        { value: 'Playfair Display, serif', label: 'Playfair (Elegant Serif)' },
        { value: 'Open Sans, sans-serif', label: 'Open Sans (Friendly)' }
    ];

    const fontSizes = [
        { value: '12px', label: 'Small (12px)' },
        { value: '14px', label: 'Regular (14px)' },
        { value: '16px', label: 'Medium (16px)' },
        { value: '18px', label: 'Large (18px)' },
        { value: '20px', label: 'X-Large (20px)' },
        { value: '24px', label: 'XX-Large (24px)' },
        { value: '32px', label: 'Huge (32px)' },
        { value: '48px', label: 'Banner (48px)' }
    ];

    // Update editingStyle when websiteStyle prop changes - PRESERVE IMAGE FIELDS
    useEffect(() => {
        setEditingStyle(prev => ({
            ...prev,
            ...websiteStyle,
            // Preserve text fields
            bannerTitle: websiteStyle.bannerTitle || prev.bannerTitle,
            bannerSubtitle: websiteStyle.bannerSubtitle || prev.bannerSubtitle,
            navLeagueName: websiteStyle.navLeagueName || websiteStyle.leagueName || prev.navLeagueName,
            // CRITICAL: Preserve image fields that might not be in websiteStyle yet
            navLogoUrl: websiteStyle.navLogoUrl || prev.navLogoUrl,
            bannerBackgroundImage: websiteStyle.bannerBackgroundImage || prev.bannerBackgroundImage,
            mainBackgroundImage: websiteStyle.mainBackgroundImage || prev.mainBackgroundImage,
            menuBackgroundImage: websiteStyle.menuBackgroundImage || prev.menuBackgroundImage
        }));
    }, [websiteStyle]);

    // Fixed save with production error checking
    const handleSave = async () => {
        try {
            console.log('🎨 Saving website style...');
            
            if (!process.env.REACT_APP_BACKEND_URL) {
                console.error('❌ REACT_APP_BACKEND_URL not configured');
                alert('Error: Backend URL not configured. Cannot save website style.');
                return;
            }
            
            const result = await setWebsiteStyle(editingStyle);
            
            if (result && result.success) {
                console.log('✅ Save successful:', result.message);
                
                const saveButtons = document.querySelectorAll('[data-save-button]');
                saveButtons.forEach(button => {
                    const originalText = button.textContent;
                    button.textContent = 'Saved!';
                    button.style.backgroundColor = '#10b981';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = '';
                    }, 3000);
                });
            } else {
                console.error('❌ Save failed:', result?.message || 'Unknown error');
                alert(`Save failed: ${result?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error saving website style:', error);
            alert(`Error saving: ${error.message}`);
        }
    };

    // Fixed image upload with better error handling
    const handleImageUpload = (file, target, zone) => {
        if (!file) {
            console.log('❌ No file selected for upload');
            return;
        }
        
        console.log('📸 Starting image upload:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            target: target,
            zone: zone
        });
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file is too large. Please choose an image under 5MB.');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const imageData = e.target.result;
                const fieldName = `${zone}${target.charAt(0).toUpperCase() + target.slice(1)}Url`;
                
                console.log('✅ Image converted to data URL:', {
                    fieldName: fieldName,
                    dataLength: imageData.length,
                    dataPreview: imageData.substring(0, 50) + '...'
                });
                
                // Update the correct field
                setEditingStyle(prev => ({
                    ...prev,
                    [fieldName]: imageData
                }));
                
                console.log('🎨 Image field updated:', fieldName);
                
                // Auto-save after successful image upload
                setTimeout(() => {
                    console.log('💾 Auto-saving after image upload');
                    handleSave();
                }, 1000);
                
            } catch (error) {
                console.error('❌ Error processing image data:', error);
                alert('Error processing image. Please try again.');
            }
        };
        
        reader.onerror = (e) => {
            console.error('❌ Failed to read image file:', e);
            alert('Failed to read image file. Please try a different image.');
        };
        
        reader.readAsDataURL(file);
    };

    const handleColorExtraction = (imageFile) => {
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setExtractImageUrl(e.target.result);
                setShowColorExtractor(true);
            };
            reader.readAsDataURL(imageFile);
        }
    };

    const handleColorsExtracted = (colors) => {
        if (colors && colors.length >= 3) {
            setEditingStyle(prev => ({
                ...prev,
                primaryColor: colors[0],
                accentColor: colors[1],
                navBackgroundColor: colors[2],
                mainBackgroundColor: colors[2]
            }));
            
            setShowColorExtractor(false);
            setExtractImageUrl('');
            
            setTimeout(() => handleSave(), 100);
        }
    };

    // Optimized toggle to prevent screen flashing
    const toggleBackgroundType = useCallback((zone, type) => {
        console.log('🔄 Toggling background type for', zone, 'to', type);
        
        setEditingStyle(prev => {
            // Only update if actually changing to prevent unnecessary re-renders
            if (prev[`${zone}BackgroundType`] === type) {
                console.log('🔄 Background type already set, no change needed');
                return prev; // Return same object to prevent re-render
            }
            
            const newState = {
                ...prev,
                [`${zone}BackgroundType`]: type,
                [`${zone}BackgroundImage`]: type === 'color' ? '' : prev[`${zone}BackgroundImage`]
            };
            
            console.log('🔄 Background type changed:', {
                zone,
                oldType: prev[`${zone}BackgroundType`],
                newType: type
            });
            
            return newState;
        });
    }, []);

    // Optimized update function - prevent multiple rapid saves
    const updateStyle = useCallback((updates) => {
        console.log('🎨 UpdateStyle called with:', updates);
        
        setEditingStyle(prev => {
            const newState = { ...prev, ...updates };
            console.log('🎨 Style updated for fields:', Object.keys(updates));
            return newState;
        });
        
        // Clear any existing timeout to prevent multiple saves
        if (window.websiteStyleSaveTimeout) {
            clearTimeout(window.websiteStyleSaveTimeout);
        }
        
        // Debounced single save
        window.websiteStyleSaveTimeout = setTimeout(() => {
            console.log('🎨 Debounced save triggered');
            handleSave();
            delete window.websiteStyleSaveTimeout;
        }, 2000);
    }, []);

    // Navigation Section
    const renderNavigationSection = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Navigation Bar Zone</h3>
                <p className="text-blue-600 text-sm">Customize your site header, navigation, and logo area</p>
            </div>

            {/* Navigation Text & Logo */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Text & Logo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">League Name</label>
                        <input
                            type="text"
                            value={editingStyle.navLeagueName || ''}
                            onChange={(e) => updateStyle({ navLeagueName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Your League Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Navigation Logo</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                            {editingStyle.navLogoUrl ? (
                                <div>
                                    <img src={editingStyle.navLogoUrl} alt="Nav Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                                    <div className="flex justify-center space-x-2">
                                        <button 
                                            onClick={() => updateStyle({ navLogoUrl: '' })}
                                            className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                            Remove
                                        </button>
                                        <span className="text-slate-400">|</span>
                                        <label className="text-blue-600 hover:text-blue-800 text-xs cursor-pointer">
                                            Replace
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e.target.files[0], 'logo', 'nav')}
                                                className="hidden"
                                            />
                                        </label>
                                        <span className="text-slate-400">|</span>
                                        <label className="text-green-600 hover:text-green-800 text-xs cursor-pointer">
                                            Extract Colors
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleColorExtraction(e.target.files[0])}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <LacrosseIcon name="image" className="mx-auto mb-2 text-slate-400" style={{fontSize: '32px'}} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'logo', 'nav')}
                                        className="hidden"
                                        id="nav-logo-upload"
                                    />
                                    <label 
                                        htmlFor="nav-logo-upload"
                                        className="bg-blue-600 text-white px-3 py-2 text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        Upload Logo
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Colors */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Colors & Typography</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.navBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    console.log('🎨 Navigation background color changed to:', e.target.value);
                                    updateStyle({ navBackgroundColor: e.target.value });
                                }}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.navBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        console.log('🎨 Navigation background color (text) changed to:', e.target.value);
                                        updateStyle({ navBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.navTextColor || '#374151'}
                                onChange={(e) => {
                                    console.log('🎨 Navigation text color changed to:', e.target.value);
                                    updateStyle({ navTextColor: e.target.value });
                                }}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.navTextColor || '#374151'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        console.log('🎨 Navigation text color (text) changed to:', e.target.value);
                                        updateStyle({ navTextColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#374151"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Preview */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Navigation Preview</h4>
                <div 
                    className="border rounded-lg p-4 flex items-center justify-between"
                    style={{
                        backgroundColor: editingStyle.navBackgroundColor || '#ffffff'
                    }}
                >
                    <div className="flex items-center space-x-3">
                        {editingStyle.navLogoUrl ? (
                            <img src={editingStyle.navLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                        ) : (
                            <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">
                                <LacrosseIcon name="image" style={{fontSize: '16px'}} className="text-slate-500" />
                            </div>
                        )}
                        <span 
                            className="font-medium"
                            style={{ 
                                fontFamily: editingStyle.navFont || 'Inter, sans-serif',
                                fontSize: editingStyle.navFontSize || '16px',
                                color: editingStyle.navTextColor || '#374151'
                            }}
                        >
                            {editingStyle.navLeagueName || 'Your League Name'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Banner Section
    const renderBannerSection = () => (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Top Banner Zone</h3>
                <p className="text-green-600 text-sm">Customize your main banner/hero section</p>
            </div>

            {/* Banner Text Content */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Banner Text</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Main Title</label>
                        <input
                            type="text"
                            value={editingStyle.bannerTitle || ''}
                            onChange={(e) => updateStyle({ bannerTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Welcome to Our League"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle</label>
                        <input
                            type="text"
                            value={editingStyle.bannerSubtitle || ''}
                            onChange={(e) => updateStyle({ bannerSubtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Professional Competition"
                        />
                    </div>
                </div>
            </div>

            {/* Banner Colors */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Banner Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.bannerBackgroundColor || '#1e40af'}
                                onChange={(e) => {
                                    console.log('🎨 Banner background color changed to:', e.target.value);
                                    updateStyle({ bannerBackgroundColor: e.target.value });
                                }}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.bannerBackgroundColor || '#1e40af'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        console.log('🎨 Banner background color (text) changed to:', e.target.value);
                                        updateStyle({ bannerBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#1e40af"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.bannerTextColor || '#ffffff'}
                                onChange={(e) => {
                                    console.log('🎨 Banner text color changed to:', e.target.value);
                                    updateStyle({ bannerTextColor: e.target.value });
                                }}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.bannerTextColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        console.log('🎨 Banner text color (text) changed to:', e.target.value);
                                        updateStyle({ bannerTextColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Image Upload - NO CROP */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Banner Background Image</h4>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('banner', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.bannerBackgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('banner', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.bannerBackgroundType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Background
                    </button>
                </div>

                {editingStyle.bannerBackgroundType === 'image' && (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.bannerBackgroundImage ? (
                            <div>
                                <img src={editingStyle.bannerBackgroundImage} alt="Banner Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <button 
                                    onClick={() => updateStyle({ bannerBackgroundImage: '' })}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove Background Image
                                </button>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload banner background (will be used as-is, no cropping)</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'banner')}
                                    className="hidden"
                                    id="banner-bg-upload"
                                />
                                <label 
                                    htmlFor="banner-bg-upload"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    Choose Image
                                </label>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Banner Preview */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Banner Preview</h4>
                <div 
                    className="border rounded-lg h-48 flex items-center justify-center relative"
                    style={{
                        backgroundColor: editingStyle.bannerBackgroundType === 'image' ? 'transparent' : (editingStyle.bannerBackgroundColor || '#1e40af'),
                        backgroundImage: editingStyle.bannerBackgroundType === 'image' && editingStyle.bannerBackgroundImage 
                            ? `url(${editingStyle.bannerBackgroundImage})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="text-center z-10">
                        <h1 
                            className="text-4xl font-bold mb-2"
                            style={{ 
                                fontFamily: editingStyle.bannerFont || 'Inter, sans-serif',
                                fontSize: editingStyle.bannerFontSize || '32px',
                                color: editingStyle.bannerTextColor || '#ffffff'
                            }}
                        >
                            {editingStyle.bannerTitle || 'Welcome to Our League'}
                        </h1>
                        <p 
                            className="text-lg"
                            style={{ 
                                fontFamily: editingStyle.bannerFont || 'Inter, sans-serif',
                                color: editingStyle.bannerTextColor || '#ffffff'
                            }}
                        >
                            {editingStyle.bannerSubtitle || 'Professional Competition'}
                        </p>
                    </div>
                    {editingStyle.bannerBackgroundType === 'image' && editingStyle.bannerBackgroundImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg"></div>
                    )}
                </div>
            </div>
        </div>
    );

    // Content Section  
    const renderContentSection = () => (
        <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Main Content Zone</h3>
                <p className="text-purple-600 text-sm">Customize the main page background and content text styling</p>
            </div>

            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Page Background</h4>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('main', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.mainBackgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('main', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.mainBackgroundType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Background
                    </button>
                </div>

                {editingStyle.mainBackgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.mainBackgroundImage ? (
                            <div>
                                <img src={editingStyle.mainBackgroundImage} alt="Main Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <button 
                                    onClick={() => updateStyle({ mainBackgroundImage: '' })}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                >
                                    Remove Background Image
                                </button>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload page background image</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'main')}
                                    className="hidden"
                                    id="main-bg-upload"
                                />
                                <label 
                                    htmlFor="main-bg-upload"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    Choose Image
                                </label>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.mainBackgroundColor || '#f8fafc'}
                            onChange={(color) => updateStyle({ mainBackgroundColor: color })}
                            label="Main Background"
                        />
                    </div>
                )}
            </div>
        </div>
    );

    // Live Preview Section
    const renderPreviewSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Website Preview</h3>
                <div className="border rounded-lg overflow-hidden bg-white">
                    {/* Header Preview */}
                    <div 
                        className="border-b p-4"
                        style={{
                            backgroundColor: editingStyle.navBackgroundColor || '#ffffff'
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {editingStyle.navLogoUrl ? (
                                    <img src={editingStyle.navLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">
                                        <LacrosseIcon name="image" style={{fontSize: '16px'}} className="text-slate-500" />
                                    </div>
                                )}
                                <span 
                                    className="font-medium"
                                    style={{ 
                                        fontFamily: editingStyle.navFont || 'Inter, sans-serif',
                                        fontSize: editingStyle.navFontSize || '16px',
                                        color: editingStyle.navTextColor || '#374151'
                                    }}
                                >
                                    {editingStyle.navLeagueName || 'Your League Name'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Banner Preview */}
                    <div 
                        className="h-32 flex items-center justify-center relative"
                        style={{
                            backgroundColor: editingStyle.bannerBackgroundType === 'image' ? 'transparent' : (editingStyle.bannerBackgroundColor || '#1e40af'),
                            backgroundImage: editingStyle.bannerBackgroundType === 'image' && editingStyle.bannerBackgroundImage 
                                ? `url(${editingStyle.bannerBackgroundImage})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="text-center z-10">
                            <h1 
                                className="text-2xl font-bold mb-1"
                                style={{ 
                                    fontFamily: editingStyle.bannerFont || 'Inter, sans-serif',
                                    fontSize: editingStyle.bannerFontSize || '32px',
                                    color: editingStyle.bannerTextColor || '#ffffff'
                                }}
                            >
                                {editingStyle.bannerTitle || 'Welcome to Our League'}
                            </h1>
                            <p 
                                style={{ 
                                    fontFamily: editingStyle.bannerFont || 'Inter, sans-serif',
                                    color: editingStyle.bannerTextColor || '#ffffff'
                                }}
                            >
                                {editingStyle.bannerSubtitle || 'Professional Competition'}
                            </p>
                        </div>
                        {editingStyle.bannerBackgroundType === 'image' && editingStyle.bannerBackgroundImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                        )}
                    </div>
                    
                    {/* Content Preview */}
                    <div 
                        className="p-6"
                        style={{
                            backgroundColor: editingStyle.mainBackgroundType === 'image' ? 'rgba(255,255,255,0.9)' : (editingStyle.mainBackgroundColor || '#f8fafc'),
                            backgroundImage: editingStyle.mainBackgroundType === 'image' && editingStyle.mainBackgroundImage 
                                ? `url(${editingStyle.mainBackgroundImage})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <h2 
                            className="text-xl font-bold mb-3" 
                            style={{ 
                                fontFamily: editingStyle.mainFont || 'Inter, sans-serif',
                                color: editingStyle.primaryColor || '#1e40af'
                            }}
                        >
                            Sample Content
                        </h2>
                        <p 
                            className="mb-4"
                            style={{ 
                                fontFamily: editingStyle.mainFont || 'Inter, sans-serif',
                                fontSize: editingStyle.mainFontSize || '16px',
                                color: editingStyle.mainTextColor || '#374151'
                            }}
                        >
                            This preview shows how your design choices work together.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={handleSave}
                    data-save-button
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    Save All Changes
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Website Design</h2>
                <button
                    onClick={handleSave}
                    data-save-button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <LacrosseIcon name="save" className="mr-2" style={{fontSize: '16px'}} />
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                {/* Section Navigation */}
                <div className="border-b">
                    <div className="flex overflow-x-auto">
                        {designSections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    activeSection === section.id
                                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <LacrosseIcon name={section.icon} className="mr-2" style={{fontSize: '16px'}} />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section Content */}
                <div className="p-6">
                    {activeSection === 'navigation' && renderNavigationSection()}
                    {activeSection === 'banner' && renderBannerSection()}
                    {activeSection === 'content' && renderContentSection()}
                    {activeSection === 'preview' && renderPreviewSection()}
                </div>
            </div>

            {/* Color Extractor Modal */}
            {showColorExtractor && (
                <ColorExtractor
                    imageUrl={extractImageUrl}
                    onColorsExtracted={handleColorsExtracted}
                    onCancel={() => {
                        setShowColorExtractor(false);
                        setExtractImageUrl('');
                    }}
                />
            )}
        </div>
    );
});

export default WebsiteDesignManager;