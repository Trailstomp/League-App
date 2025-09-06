import React, { useState, useRef, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import EnhancedColorPicker from '../EnhancedColorPicker';
import ColorExtractor from '../ColorExtractor';

const WebsiteDesignManager = ({ websiteStyle = {}, setWebsiteStyle }) => {
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

    // Font options for typography
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

    // Update editingStyle when websiteStyle prop changes
    useEffect(() => {
        setEditingStyle(prev => ({
            ...prev,
            ...websiteStyle,
            // Ensure banner fields are preserved
            bannerTitle: websiteStyle.bannerTitle || prev.bannerTitle,
            bannerSubtitle: websiteStyle.bannerSubtitle || prev.bannerSubtitle,
            navLeagueName: websiteStyle.navLeagueName || websiteStyle.leagueName || prev.navLeagueName
        }));
    }, [websiteStyle]);

    // Enhanced save functionality with proper feedback
    const handleSave = async () => {
        setEditingStyle(currentState => {
            console.log('🎨 handleSave called with current state:', currentState);
            handleSaveWithState(currentState);
            return currentState; // Return unchanged state
        });
    };

    const handleImageUpload = (file, target, zone) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCropImageUrl(e.target.result);
                setCropTarget(`${zone}_${target}`);
                setShowCropTool(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImageUrl) => {
        const [zone, type] = cropTarget.split('_');
        
        setEditingStyle(prev => ({
            ...prev,
            [`${zone}${type.charAt(0).toUpperCase() + type.slice(1)}Url`]: croppedImageUrl
        }));
        
        setShowCropTool(false);
        setCropImageUrl('');
        
        // Auto-save after crop
        setTimeout(() => handleSave(), 100);
    };

    const handleColorExtraction = (imageFile, zone) => {
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
            
            // Auto-save after color extraction
            setTimeout(() => handleSave(), 100);
        }
    };

    const toggleBackgroundType = (zone, type) => {
        setEditingStyle(prev => ({
            ...prev,
            [`${zone}BackgroundType`]: type,
            [`${zone}BackgroundImage`]: type === 'color' ? '' : prev[`${zone}BackgroundImage`]
        }));
        setTimeout(() => handleSave(), 500);
    };

    const updateStyle = (updates) => {
        console.log('🔧 updateStyle called with:', updates);
        
        setEditingStyle(prevState => {
            const newState = {
                ...prevState,
                ...updates
            };
            console.log('🔧 Previous editingStyle state:', prevState);
            console.log('🔧 New editingStyle state after update:', newState);
            console.log('🔧 Banner fields in new state:', {
                bannerTitle: newState.bannerTitle,
                bannerSubtitle: newState.bannerSubtitle,
                bannerBackgroundColor: newState.bannerBackgroundColor,
                bannerTextColor: newState.bannerTextColor
            });
            
            return newState;
        });
        
        // Use a ref to capture the latest state for save
        setTimeout(() => {
            setEditingStyle(currentState => {
                console.log('🔧 Auto-save triggered with current state:', currentState);
                handleSaveWithState(currentState);
                return currentState; // Return unchanged state
            });
        }, 500);
    };

    // New save function that accepts state parameter
    const handleSaveWithState = async (stateToSave) => {
        try {
            console.log('🎨 handleSaveWithState called with:', stateToSave);
            console.log('🎨 Banner fields being saved:', {
                bannerTitle: stateToSave.bannerTitle,
                bannerSubtitle: stateToSave.bannerSubtitle,
                bannerBackgroundColor: stateToSave.bannerBackgroundColor,
                bannerTextColor: stateToSave.bannerTextColor
            });
            
            // Call the parent's save function
            const result = await setWebsiteStyle(stateToSave);
            
            if (result && result.success) {
                console.log('✅ Save successful:', result.message);
                
                // Show success feedback
                const saveButtons = document.querySelectorAll('[data-save-button]');
                saveButtons.forEach(button => {
                    const originalText = button.textContent;
                    button.textContent = result.message || 'Saved!';
                    button.style.backgroundColor = '#10b981'; // Green color
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.style.backgroundColor = ''; // Reset color
                    }, 3000);
                });
            } else {
                console.error('❌ Save failed:', result?.message || 'Unknown error');
            }
        } catch (error) {
            console.error('❌ Error saving website style:', error);
        }
    };

    // Zone-based render methods
    const renderNavigationSection = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Navigation Bar Zone</h3>
                <p className="text-blue-600 text-sm">Customize your site header, navigation, and logo area</p>
            </div>

            {/* Navigation Background */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Background</h4>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('nav', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.navBackgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('nav', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.navBackgroundType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Background
                    </button>
                </div>

                {editingStyle.navBackgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.navBackgroundImage ? (
                            <div>
                                <img src={editingStyle.navBackgroundImage} alt="Nav Background" className="w-full h-20 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ navBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'nav')}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload navigation background</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'nav')}
                                    className="hidden"
                                    id="nav-bg-upload"
                                />
                                <label 
                                    htmlFor="nav-bg-upload"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    Choose File & Crop
                                </label>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.navBackgroundColor || '#ffffff'}
                            onChange={(color) => updateStyle({ navBackgroundColor: color })}
                            label="Navigation Background"
                        />
                    </div>
                )}
            </div>

            {/* Navigation Text & Logo */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Text & Logo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* League Name */}
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

                    {/* Logo Upload */}
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
                                                onChange={(e) => handleColorExtraction(e.target.files[0], 'nav')}
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
                                        Upload & Crop
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Typography */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Typography</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font</label>
                        <select
                            value={editingStyle.navFont || 'Inter, sans-serif'}
                            onChange={(e) => updateStyle({ navFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                        <select
                            value={editingStyle.navFontSize || '16px'}
                            onChange={(e) => updateStyle({ navFontSize: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontSizes.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.navTextColor || '#374151'}
                            onChange={(color) => updateStyle({ navTextColor: color })}
                            label="Nav Text"
                        />
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Navigation Preview</h4>
                <div 
                    className="border rounded-lg p-4 flex items-center justify-between"
                    style={{
                        backgroundColor: editingStyle.navBackgroundType === 'image' ? 'transparent' : (editingStyle.navBackgroundColor || '#ffffff'),
                        backgroundImage: editingStyle.navBackgroundType === 'image' && editingStyle.navBackgroundImage 
                            ? `url(${editingStyle.navBackgroundImage})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
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
                    <nav 
                        className="flex space-x-4 text-sm"
                        style={{ 
                            fontFamily: editingStyle.navFont || 'Inter, sans-serif',
                            color: editingStyle.navTextColor || '#374151'
                        }}
                    >
                        <span>Home</span>
                        <span>Teams</span>
                        <span>Schedule</span>
                        <span>Standings</span>
                    </nav>
                </div>
            </div>
        </div>
    );

    const renderBannerSection = () => (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Top Banner Zone</h3>
                <p className="text-green-600 text-sm">Customize your main banner/hero section at the top of pages</p>
            </div>

            {/* Banner Background */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Background</h4>
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

                {editingStyle.bannerBackgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.bannerBackgroundImage ? (
                            <div>
                                <img src={editingStyle.bannerBackgroundImage} alt="Banner Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ bannerBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'banner')}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload banner background image</p>
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
                                    Choose File & Crop
                                </label>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.bannerBackgroundColor || '#1e40af'}
                            onChange={(color) => updateStyle({ bannerBackgroundColor: color })}
                            label="Banner Background"
                        />
                    </div>
                )}
            </div>

            {/* Banner Text Content */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Text Content</h4>
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
                        <label className="block text-sm font-medium text-slate-700 mb-2">Subtitle/Tagline</label>
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

            {/* Banner Typography */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Typography</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font</label>
                        <select
                            value={editingStyle.bannerFont || 'Inter, sans-serif'}
                            onChange={(e) => updateStyle({ bannerFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                        <select
                            value={editingStyle.bannerFontSize || '32px'}
                            onChange={(e) => updateStyle({ bannerFontSize: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontSizes.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.bannerTextColor || '#ffffff'}
                            onChange={(color) => updateStyle({ bannerTextColor: color })}
                            label="Banner Text"
                        />
                    </div>
                </div>
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

    const renderContentSection = () => (
        <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Main Content Zone</h3>
                <p className="text-purple-600 text-sm">Customize the main page background and content text styling</p>
            </div>

            {/* Main Background */}
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
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ mainBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'main')}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
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
                                    Choose File & Crop
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

            {/* Content Typography */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Content Typography</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font</label>
                        <select
                            value={editingStyle.mainFont || 'Inter, sans-serif'}
                            onChange={(e) => updateStyle({ mainFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                        <select
                            value={editingStyle.mainFontSize || '16px'}
                            onChange={(e) => updateStyle({ mainFontSize: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontSizes.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.mainTextColor || '#374151'}
                            onChange={(color) => updateStyle({ mainTextColor: color })}
                            label="Main Text"
                        />
                    </div>
                </div>
            </div>

            {/* Content Preview */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Content Preview</h4>
                <div 
                    className="border rounded-lg p-8"
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
                        className="text-2xl font-bold mb-4"
                        style={{ 
                            fontFamily: editingStyle.mainFont || 'Inter, sans-serif',
                            color: editingStyle.mainTextColor || '#374151'
                        }}
                    >
                        Sample Page Content
                    </h2>
                    <p 
                        className="mb-4"
                        style={{ 
                            fontFamily: editingStyle.mainFont || 'Inter, sans-serif',
                            fontSize: editingStyle.mainFontSize || '16px',
                            color: editingStyle.mainTextColor || '#374151'
                        }}
                    >
                        This is how your main content text will appear throughout the website. The background and typography settings you choose here will be applied to all content areas.
                    </p>
                    <p 
                        style={{ 
                            fontFamily: editingStyle.mainFont || 'Inter, sans-serif',
                            fontSize: editingStyle.mainFontSize || '16px',
                            color: editingStyle.mainTextColor || '#374151'
                        }}
                    >
                        You can customize the background color or image, font family, size, and text color to match your league's branding perfectly.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderMenusSection = () => (
        <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Menus & Sidebar Zone</h3>
                <p className="text-orange-600 text-sm">Customize your sidebar navigation, menus, and secondary elements</p>
            </div>

            {/* Menu Background */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Menu Background</h4>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('menu', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.menuBackgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('menu', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.menuBackgroundType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Background
                    </button>
                </div>

                {editingStyle.menuBackgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.menuBackgroundImage ? (
                            <div>
                                <img src={editingStyle.menuBackgroundImage} alt="Menu Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ menuBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'menu')}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload menu background image</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'menu')}
                                    className="hidden"
                                    id="menu-bg-upload"
                                />
                                <label 
                                    htmlFor="menu-bg-upload"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                >
                                    Choose File & Crop
                                </label>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.menuBackgroundColor || '#ffffff'}
                            onChange={(color) => updateStyle({ menuBackgroundColor: color })}
                            label="Menu Background"
                        />
                    </div>
                )}
            </div>

            {/* Menu Typography */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Menu Typography</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font</label>
                        <select
                            value={editingStyle.menuFont || 'Inter, sans-serif'}
                            onChange={(e) => updateStyle({ menuFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Size</label>
                        <select
                            value={editingStyle.menuFontSize || '16px'}
                            onChange={(e) => updateStyle({ menuFontSize: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            {fontSizes.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.menuTextColor || '#374151'}
                            onChange={(color) => updateStyle({ menuTextColor: color })}
                            label="Menu Text"
                        />
                    </div>
                </div>
            </div>

            {/* Menu Preview */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Menu Preview</h4>
                <div 
                    className="border rounded-lg p-4 w-64"
                    style={{
                        backgroundColor: editingStyle.menuBackgroundType === 'image' ? 'transparent' : (editingStyle.menuBackgroundColor || '#ffffff'),
                        backgroundImage: editingStyle.menuBackgroundType === 'image' && editingStyle.menuBackgroundImage 
                            ? `url(${editingStyle.menuBackgroundImage})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="space-y-3">
                        <div 
                            className="font-semibold border-b pb-2 mb-2"
                            style={{ 
                                fontFamily: editingStyle.menuFont || 'Inter, sans-serif',
                                fontSize: editingStyle.menuFontSize || '16px',
                                color: editingStyle.menuTextColor || '#374151'
                            }}
                        >
                            MENU SECTION
                        </div>
                        {['Home', 'Events & Schedule', 'Standings', 'Teams', 'Admin'].map(item => (
                            <div 
                                key={item}
                                className="py-1 hover:bg-gray-100 rounded px-2 cursor-pointer"
                                style={{ 
                                    fontFamily: editingStyle.menuFont || 'Inter, sans-serif',
                                    fontSize: editingStyle.menuFontSize || '16px',
                                    color: editingStyle.menuTextColor || '#374151'
                                }}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPreviewSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Live Website Preview</h3>
                <div className="border rounded-lg overflow-hidden bg-white">
                    {/* Header Preview */}
                    <div 
                        className="border-b p-4"
                        style={{
                            backgroundColor: editingStyle.navBackgroundType === 'image' ? 'transparent' : (editingStyle.navBackgroundColor || '#ffffff'),
                            backgroundImage: editingStyle.navBackgroundType === 'image' && editingStyle.navBackgroundImage 
                                ? `url(${editingStyle.navBackgroundImage})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
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
                            <nav 
                                className="flex space-x-4 text-sm"
                                style={{ 
                                    fontFamily: editingStyle.navFont || 'Inter, sans-serif',
                                    color: editingStyle.navTextColor || '#374151'
                                }}
                            >
                                <span>Home</span>
                                <span>Teams</span>
                                <span>Schedule</span>
                                <span>Standings</span>
                            </nav>
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
                            Sample Page Content
                        </h2>
                        <p 
                            className="mb-4"
                            style={{ 
                                fontFamily: editingStyle.mainFont || 'Inter, sans-serif',
                                fontSize: editingStyle.mainFontSize || '16px',
                                color: editingStyle.mainTextColor || '#374151'
                            }}
                        >
                            This preview shows how all your design choices work together. The navigation, banner, and content areas all reflect your customizations.
                        </p>
                        <button 
                            className="px-4 py-2 rounded-lg text-white"
                            style={{ backgroundColor: editingStyle.accentColor || '#3b82f6' }}
                        >
                            Sample Button
                        </button>
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
                    {activeSection === 'menus' && renderMenusSection()}
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

            {/* Image Crop Tool */}
            {showCropTool && (
                <ImageCropTool
                    imageUrl={cropImageUrl}
                    onCrop={handleCropComplete}
                    onCancel={() => {
                        setShowCropTool(false);
                        setCropImageUrl('');
                    }}
                    aspectRatio="free"
                    targetArea={cropTarget}
                />
            )}
        </div>
    );
};

export default WebsiteDesignManager;