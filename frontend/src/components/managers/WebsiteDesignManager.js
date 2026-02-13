import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import { SportIcon } from '../SportIcons';
import { SPORTS, SPORT_CONFIG, getAvailableSports, getSportConfig } from '../../config/sportsConfig';
import ColorExtractor from '../ColorExtractor';
import SimpleCropTool from '../SimpleCropTool';
import TickerManager from './TickerManager';

const WebsiteDesignManager = React.memo(({ websiteStyle = {}, setWebsiteStyle, teams = [], events = [] }) => {
    const [activeSection, setActiveSection] = useState('sport');
    const saveTimeoutRef = useRef(null); // Component-level timeout ref
    
    // Properly initialize editingStyle with websiteStyle data
    const [editingStyle, setEditingStyle] = useState(() => ({
        // Sport Type Setting
        sportType: websiteStyle.sportType || 'lacrosse',
        
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
        inputTextColor: websiteStyle.inputTextColor || '#1e293b',
        
        // Content Area Zone (the "white" area) - with websiteStyle fallbacks
        contentBackgroundType: websiteStyle.contentBackgroundType || 'color',
        contentBackgroundColor: websiteStyle.contentBackgroundColor || '#ffffff',
        contentBackgroundImage: websiteStyle.contentBackgroundImage || '',
        
        // Menu Zone - with websiteStyle fallbacks
        menuBackgroundType: websiteStyle.menuBackgroundType || 'color',
        menuBackgroundColor: websiteStyle.menuBackgroundColor || '#ffffff',
        menuBackgroundImage: websiteStyle.menuBackgroundImage || '',
        menuTextColor: websiteStyle.menuTextColor || '#374151',
        menuFont: websiteStyle.menuFont || 'Inter, sans-serif',
        menuFontSize: websiteStyle.menuFontSize || '16px',
        navButtonBorderColor: websiteStyle.navButtonBorderColor || websiteStyle.accentColor || '#3b82f6',
        
        // Live View Settings - with websiteStyle fallbacks
        liveViewBackgroundType: websiteStyle.liveViewBackgroundType || 'banners',
        liveViewBannerOpacity: websiteStyle.liveViewBannerOpacity || 0.3,
        liveViewUseTeamFonts: websiteStyle.liveViewUseTeamFonts !== undefined ? websiteStyle.liveViewUseTeamFonts : true,
        
        // Theme colors - with websiteStyle fallbacks
        primaryColor: websiteStyle.primaryColor || '#1e40af',
        accentColor: websiteStyle.accentColor || '#3b82f6',
        
        // PWA / Mobile App Settings
        pwaAppName: websiteStyle.pwaAppName || 'Midwest Lacrosse League',
        pwaShortName: websiteStyle.pwaShortName || 'MLBL',
        pwaDescription: websiteStyle.pwaDescription || 'League management portal for schedules, rosters, and stats',
        pwaThemeColor: websiteStyle.pwaThemeColor || '#1e40af',
        pwaBackgroundColor: websiteStyle.pwaBackgroundColor || '#f8fafc',
        pwaIconUrl: websiteStyle.pwaIconUrl || '',
        pwaInstallBannerTitle: websiteStyle.pwaInstallBannerTitle || 'Install Our App',
        pwaInstallBannerText: websiteStyle.pwaInstallBannerText || 'Add to your home screen for quick access!',
        pwaInstallBannerBgColor: websiteStyle.pwaInstallBannerBgColor || '#1e40af',
        pwaInstallBannerTextColor: websiteStyle.pwaInstallBannerTextColor || '#ffffff',
        pwaInstallBannerButtonColor: websiteStyle.pwaInstallBannerButtonColor || '#ffffff',
        pwaInstallBannerButtonTextColor: websiteStyle.pwaInstallBannerButtonTextColor || '#1e40af',
        
        // Include all existing websiteStyle properties
        ...websiteStyle
    }));

    const [showColorExtractor, setShowColorExtractor] = useState(false);
    const [extractImageUrl, setExtractImageUrl] = useState('');
    const [showCropTool, setShowCropTool] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState('');
    const [cropTarget, setCropTarget] = useState('banner');
    const [cropTargetType, setCropTargetType] = useState('banner');
    
    // Template management state
    const [savedTemplates, setSavedTemplates] = useState([]);
    const [activeTemplateId, setActiveTemplateId] = useState(null);
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [templateMessage, setTemplateMessage] = useState('');
    const [saveMode, setSaveMode] = useState('new');
    
    // Cycling config state
    const [cyclingConfig, setCyclingConfig] = useState({
        enabled: false, mode: 'fixed', templatePool: [], defaultTemplateId: null
    });
    const [savingCycling, setSavingCycling] = useState(false);
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    // Load saved templates and cycling config on mount
    useEffect(() => {
        loadTemplates();
        loadCyclingConfig();
    }, []);

    const loadTemplates = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/design-templates`);
            if (response.ok) {
                const data = await response.json();
                setSavedTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const saveTemplate = async () => {
        if (saveMode === 'new' && !newTemplateName.trim()) {
            setTemplateMessage('Please enter a template name');
            return;
        }

        try {
            if (saveMode === 'update' && activeTemplateId) {
                // Update existing template
                const response = await fetch(`${backendUrl}/api/design-templates/${activeTemplateId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ style: { ...editingStyle } })
                });

                if (response.ok) {
                    const activeTemplate = savedTemplates.find(t => t.id === activeTemplateId);
                    setTemplateMessage(`Updated "${activeTemplate?.name || 'template'}" with current settings`);
                    setShowSaveTemplateModal(false);
                    loadTemplates();
                } else {
                    setTemplateMessage('Failed to update template');
                }
            } else {
                // Save as new template
                const templateData = {
                    name: newTemplateName.trim(),
                    style: { ...editingStyle },
                    createdAt: new Date().toISOString()
                };

                const response = await fetch(`${backendUrl}/api/design-templates`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(templateData)
                });

                if (response.ok) {
                    const result = await response.json();
                    setActiveTemplateId(result.template?.id);
                    setTemplateMessage(`Saved "${newTemplateName.trim()}" as new template`);
                    setNewTemplateName('');
                    setShowSaveTemplateModal(false);
                    loadTemplates();
                } else {
                    setTemplateMessage('Failed to save template');
                }
            }
        } catch (error) {
            console.error('Error saving template:', error);
            setTemplateMessage('Error saving template');
        }
        setTimeout(() => setTemplateMessage(''), 4000);
    };

    const loadTemplate = (template) => {
        if (window.confirm(`Load "${template.name}" template? This will replace your current design settings.`)) {
            setEditingStyle(prev => ({
                ...prev,
                ...template.style
            }));
            setActiveTemplateId(template.id);
            setShowLoadTemplateModal(false);
            setTemplateMessage(`Loaded "${template.name}" — it is now the active template`);
            setTimeout(() => handleSave(), 500);
        }
        setTimeout(() => setTemplateMessage(''), 4000);
    };

    const deleteTemplate = async (templateId) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;

        try {
            const response = await fetch(`${backendUrl}/api/design-templates/${templateId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setTemplateMessage('✅ Template deleted');
                loadTemplates();
            } else {
                setTemplateMessage('❌ Failed to delete template');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            setTemplateMessage('❌ Error deleting template');
        }
        setTimeout(() => setTemplateMessage(''), 3000);
    };

    const designSections = [
        { id: 'templates', label: 'Design Templates', icon: 'customize', description: 'Save and load design presets' },
        { id: 'sport', label: 'Sport Type', icon: 'trophy', description: 'Choose your league sport for icons and scoring' },
        { id: 'navigation', label: 'Navigation & Sidebar', icon: 'players', description: 'Header navigation, sidebar, and menu styling' },
        { id: 'banner', label: 'Top Banner', icon: 'image', description: 'Main banner/hero section' },
        { id: 'content', label: 'Main Content', icon: 'text', description: 'Page background and content text' },
        { id: 'liveview', label: 'Live View & Scoring', icon: 'customize', description: 'Styling for live game views and score entry' },
        { id: 'ticker', label: 'Event Ticker', icon: 'customize', description: 'Configure the scrolling events ticker' },
        { id: 'pwa', label: 'Mobile App Settings', icon: 'admin', description: 'App icon, install banner, and home screen settings' },
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

    // Fixed save with proper state capture
    const handleSave = useCallback(async () => {
        try {
            console.log('🎨 handleSave called - capturing current state...');
            
            // Use functional setState to capture current state
            let currentState = null;
            await new Promise((resolve) => {
                setEditingStyle(state => {
                    currentState = state;
                    console.log('🎨 Current complete state captured:', {
                        navLogoUrl: state.navLogoUrl ? 'HAS_IMAGE' : 'EMPTY',
                        navBackgroundImage: state.navBackgroundImage ? 'HAS_IMAGE' : 'EMPTY',
                        bannerBackgroundImage: state.bannerBackgroundImage ? 'HAS_IMAGE' : 'EMPTY',
                        navBackgroundColor: state.navBackgroundColor,
                        bannerBackgroundColor: state.bannerBackgroundColor
                    });
                    resolve();
                    return state; // Return unchanged
                });
            });
            
            if (!process.env.REACT_APP_BACKEND_URL) {
                console.error('❌ REACT_APP_BACKEND_URL not configured');
                alert('Error: Backend URL not configured. Cannot save website style.');
                return;
            }
            
            console.log('🎨 Saving complete state to API:', Object.keys(currentState).length, 'fields');
            
            const result = await setWebsiteStyle(currentState);
            
            if (result && result.success) {
                console.log('✅ Save successful with complete state:', result.message);
                
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
    }, [setWebsiteStyle]);

    // Fixed image upload with correct field naming
    // Enhanced image upload with crop tool option
    const handleImageUpload = (file, target, zone, useCrop = false) => {
        if (!file) {
            console.log('❌ No file selected for upload');
            return;
        }
        
        console.log('📸 Starting image upload:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            target: target,
            zone: zone,
            useCrop: useCrop
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
                
                if (useCrop) {
                    // Open crop tool
                    console.log('🎯 Opening crop tool for', target, zone);
                    setCropImageUrl(imageData);
                    setCropTarget(`${zone}_${target}`);
                    
                    // Determine crop type based on target and zone
                    let cropType = 'banner';
                    if (target === 'logo') cropType = 'logo';
                    else if (target === 'background' && zone === 'banner') cropType = 'wide_banner';
                    else if (target === 'background' && zone === 'nav') cropType = 'navigation';
                    else if (target === 'background' && zone === 'menu') cropType = 'background'; // Fixed: menu should use standard background ratio
                    else if (target === 'background') cropType = 'background';
                    
                    setCropTargetType(cropType);
                    setShowCropTool(true);
                } else {
                    // Direct upload without crop
                    const fieldName = target === 'background' 
                        ? `${zone}BackgroundImage`
                        : `${zone}${target.charAt(0).toUpperCase() + target.slice(1)}Url`;
                    
                    console.log('✅ Direct upload - Image converted to data URL:', {
                        fieldName: fieldName,
                        dataLength: imageData.length,
                        correctFieldName: fieldName
                    });
                    
                    // Update the correct field
                    setEditingStyle(prev => {
                        const newState = {
                            ...prev,
                            [fieldName]: imageData
                        };
                        
                        console.log('🎨 Image field updated to correct field:', fieldName);
                        
                        return newState;
                    });
                    
                    // IMMEDIATE save after image upload
                    console.log('💾 Immediate save triggered for direct image upload');
                    handleSave();
                }
                
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

    // Handle crop completion
    const handleCropComplete = (croppedImageData) => {
        const [zone, target] = cropTarget.split('_');
        
        const fieldName = target === 'background' 
            ? `${zone}BackgroundImage`
            : `${zone}${target.charAt(0).toUpperCase() + target.slice(1)}Url`;
        
        console.log('✅ Crop completed, updating field:', fieldName);
        
        setEditingStyle(prev => ({
            ...prev,
            [fieldName]: croppedImageData
        }));
        
        setShowCropTool(false);
        setCropImageUrl('');
        
        // Save immediately after crop
        handleSave();
    };

    // Fixed color extraction - use existing image data
    const handleColorExtraction = (imageDataUrl) => {
        if (imageDataUrl) {
            console.log('🎨 Extracting colors from existing image');
            setExtractImageUrl(imageDataUrl);
            setShowColorExtractor(true);
        } else {
            console.log('❌ No image data available for color extraction');
            alert('Please upload an image first before extracting colors');
        }
    };

    // Enhanced color extraction that applies to all zones with nav logo propagation
    const handleColorsExtracted = (colors) => {
        if (colors && colors.length >= 3) {
            console.log('🎨 Raw extracted colors:', colors);
            
            // Ensure colors are hex strings, not objects
            const hexColors = colors.map(color => {
                if (typeof color === 'string' && color.startsWith('#')) {
                    return color;
                } else if (color && color.hex) {
                    return color.hex;
                } else if (color && color.color) {
                    return color.color;
                } else {
                    console.warn('⚠️ Invalid color format:', color);
                    return '#1e40af'; // fallback
                }
            });
            
            console.log('🎨 Processed hex colors:', hexColors);
            
            // Apply colors to ALL zones for comprehensive theming
            setEditingStyle(prev => {
                const newState = {
                    ...prev,
                    // Global theme colors
                    primaryColor: hexColors[0] || '#1e40af',
                    accentColor: hexColors[1] || '#3b82f6',
                    
                    // Navigation zone - ENHANCED: propagate to sidebar  
                    navBackgroundColor: hexColors[2] || '#ffffff',
                    navTextColor: hexColors[0] || '#374151',
                    navButtonBorderColor: hexColors[1] || hexColors[0] || '#3b82f6',
                    
                    // Menu/Sidebar zone - AUTO-PROPAGATE from nav logo
                    menuBackgroundColor: hexColors[2] || '#ffffff',
                    menuTextColor: hexColors[0] || '#374151',
                    
                    // Banner zone  
                    bannerBackgroundColor: hexColors[0] || '#1e40af',
                    bannerTextColor: '#ffffff',
                    
                    // Main content zone
                    mainBackgroundColor: hexColors[2] || '#f8fafc',
                    mainTextColor: hexColors[0] || '#374151',
                    
                    // PWA / Mobile App colors - AUTO-PROPAGATE from logo
                    pwaThemeColor: hexColors[0] || '#1e40af',
                    pwaBackgroundColor: hexColors[2] || '#f8fafc',
                    pwaInstallBannerBgColor: hexColors[0] || '#1e40af',
                    pwaInstallBannerTextColor: '#ffffff',
                    pwaInstallBannerButtonColor: '#ffffff',
                    pwaInstallBannerButtonTextColor: hexColors[0] || '#1e40af'
                };
                
                console.log('🎨 Colors applied to ALL zones including PWA:', {
                    primary: newState.primaryColor,
                    navBackground: newState.navBackgroundColor,
                    menuBackground: newState.menuBackgroundColor,
                    menuText: newState.menuTextColor,
                    navButtonBorder: newState.navButtonBorderColor,
                    pwaTheme: newState.pwaThemeColor
                });
                
                return newState;
            });
            
            setShowColorExtractor(false);
            setExtractImageUrl('');
            
            console.log('🎨 Color extraction complete - nav logo colors propagated to sidebar and PWA');
            
            // Save immediately after color extraction
            setTimeout(() => handleSave(), 500);
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

    // Fixed debounced update - no global timeout interference
    const updateStyle = useCallback((updates) => {
        console.log('🎨 UpdateStyle called with:', updates);
        
        setEditingStyle(prev => {
            const newState = { ...prev, ...updates };
            console.log('🎨 Style updated for fields:', Object.keys(updates));
            return newState;
        });
        
        // Clear any existing component timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            console.log('🔧 Cleared previous save timeout');
        }
        
        // Component-level debounced save  
        saveTimeoutRef.current = setTimeout(() => {
            console.log('🎨 Component-level debounced save triggered');
            handleSave();
            saveTimeoutRef.current = null;
        }, 1500);
    }, []);

    // Templates Section
    const renderTemplatesSection = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">💾 Design Templates</h3>
                <p className="text-indigo-600 text-sm">Save your current design as a template or load a previously saved one</p>
            </div>

            {/* Template Message */}
            {templateMessage && (
                <div className={`p-4 rounded-lg ${templateMessage.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                    {templateMessage}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    💾 Save Current Design as Template
                </button>
                <button
                    onClick={() => {
                        loadTemplates();
                        setShowLoadTemplateModal(true);
                    }}
                    className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                    📂 Load Saved Template
                </button>
            </div>

            {/* Saved Templates List */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800">Saved Templates ({savedTemplates.length})</h4>
                </div>
                
                {savedTemplates.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {savedTemplates.map(template => (
                            <div key={template.id} className={`p-4 hover:bg-slate-50 flex items-center justify-between ${template.id === activeTemplateId ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                                <div className="flex items-center gap-4">
                                    {/* Template Preview Colors */}
                                    <div className="flex -space-x-1">
                                        <div 
                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: template.style?.primaryColor || '#3b82f6' }}
                                            title="Primary Color"
                                        />
                                        <div 
                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: template.style?.accentColor || '#10b981' }}
                                            title="Accent Color"
                                        />
                                        <div 
                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: template.style?.navBackgroundColor || '#ffffff' }}
                                            title="Nav Background"
                                        />
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-slate-800">
                                            {template.name}
                                            {template.id === activeTemplateId && (
                                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Active</span>
                                            )}
                                        </h5>
                                        <p className="text-xs text-slate-500">
                                            Created: {new Date(template.createdAt).toLocaleDateString()}
                                            {template.updatedAt && ` · Updated: ${new Date(template.updatedAt).toLocaleDateString()}`}
                                            {template.style?.sportType && ` · ${template.style.sportType}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {template.id === activeTemplateId && (
                                        <button
                                            onClick={() => {
                                                setSaveMode('update');
                                                setShowSaveTemplateModal(true);
                                            }}
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                            data-testid={`update-template-${template.id}`}
                                        >
                                            Update
                                        </button>
                                    )}
                                    <button
                                        onClick={() => loadTemplate(template)}
                                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm font-medium"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => {
                                            deleteTemplate(template.id);
                                            if (template.id === activeTemplateId) setActiveTemplateId(null);
                                        }}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        <div className="text-4xl mb-4">📁</div>
                        <p>No saved templates yet</p>
                        <p className="text-sm mt-1">Save your current design to create your first template</p>
                    </div>
                )}
            </div>

            {/* What Gets Saved Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-2">📋 What Gets Saved in a Template</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-amber-700">
                    <span>✓ Sport Type</span>
                    <span>✓ All Colors</span>
                    <span>✓ Fonts & Sizes</span>
                    <span>✓ Logo & Images</span>
                    <span>✓ Banner Settings</span>
                    <span>✓ Navigation Style</span>
                    <span>✓ Menu Settings</span>
                    <span>✓ PWA Settings</span>
                    <span>✓ Live View Style</span>
                </div>
            </div>

            {/* Save Template Modal */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Save Design Template</h3>
                        
                        {/* Mode Selection */}
                        {activeTemplateId && (
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setSaveMode('update')}
                                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                        saveMode === 'update' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    Update Active Template
                                    <span className="block text-xs font-normal mt-0.5 opacity-75">
                                        {savedTemplates.find(t => t.id === activeTemplateId)?.name || 'Current'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setSaveMode('new')}
                                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                        saveMode === 'new' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    Save as New Template
                                </button>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            {/* Show name input for new templates (or always if no active) */}
                            {(saveMode === 'new' || !activeTemplateId) && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Template Name</label>
                                    <input
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        placeholder="e.g., Dark Theme, Summer Season, Tournament Mode..."
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus
                                    />
                                </div>
                            )}
                            
                            {/* Update mode info */}
                            {saveMode === 'update' && activeTemplateId && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                    This will overwrite <strong>"{savedTemplates.find(t => t.id === activeTemplateId)?.name}"</strong> with your current design settings.
                                </div>
                            )}
                            
                            {/* Preview of what will be saved */}
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-sm text-slate-600 mb-2">Preview:</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-1">
                                        <div 
                                            className="w-6 h-6 rounded-full border-2 border-white"
                                            style={{ backgroundColor: editingStyle.primaryColor || '#3b82f6' }}
                                        />
                                        <div 
                                            className="w-6 h-6 rounded-full border-2 border-white"
                                            style={{ backgroundColor: editingStyle.accentColor || '#10b981' }}
                                        />
                                    </div>
                                    <span className="text-sm text-slate-700" style={{ fontFamily: editingStyle.navFont }}>
                                        {editingStyle.navLeagueName || 'Your League'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowSaveTemplateModal(false);
                                        setNewTemplateName('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveTemplate}
                                    disabled={saveMode === 'new' && !newTemplateName.trim()}
                                    className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                                        saveMode === 'update' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                    data-testid="template-save-confirm"
                                >
                                    {saveMode === 'update' ? 'Update Template' : 'Save as New'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Template Modal */}
            {showLoadTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">📂 Load Design Template</h3>
                            <button
                                onClick={() => setShowLoadTemplateModal(false)}
                                className="text-slate-500 hover:text-slate-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {savedTemplates.length > 0 ? (
                                <div className="grid gap-3">
                                    {savedTemplates.map(template => (
                                        <div 
                                            key={template.id} 
                                            onClick={() => loadTemplate(template)}
                                            className="p-4 border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-1">
                                                    <div 
                                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: template.style?.primaryColor || '#3b82f6' }}
                                                    />
                                                    <div 
                                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: template.style?.accentColor || '#10b981' }}
                                                    />
                                                    <div 
                                                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: template.style?.bannerBackgroundColor || '#1e40af' }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-slate-800">{template.name}</h4>
                                                    <p className="text-sm text-slate-500">
                                                        {template.style?.sportType || 'lacrosse'} • 
                                                        {new Date(template.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-indigo-600 font-medium">
                                                    Click to Load →
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <div className="text-4xl mb-4">📁</div>
                                    <p>No saved templates</p>
                                    <p className="text-sm mt-1">Save your current design first to create templates</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Sport Type Section
    const renderSportSection = () => {
        const availableSports = getAvailableSports();
        const currentSport = getSportConfig(editingStyle.sportType || 'lacrosse');
        
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">🏆 League Sport Type</h3>
                    <p className="text-purple-600 text-sm">Select your sport to customize icons, positions, and scoring throughout the app</p>
                </div>

                {/* Sport Selection */}
                <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-md font-semibold text-slate-800 mb-4">Choose Your Sport</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {availableSports.map(sport => (
                            <button
                                key={sport.id}
                                onClick={() => updateStyle({ sportType: sport.id })}
                                className={`p-6 rounded-xl border-2 transition-all text-center ${
                                    editingStyle.sportType === sport.id
                                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className="text-4xl mb-2">{sport.icon}</div>
                                <div className={`font-semibold ${editingStyle.sportType === sport.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                    {sport.name}
                                </div>
                                {editingStyle.sportType === sport.id && (
                                    <div className="mt-2 text-xs text-blue-600 font-medium">✓ Selected</div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sport Preview */}
                <div className="bg-white border rounded-lg p-6">
                    <h4 className="text-md font-semibold text-slate-800 mb-4">
                        {currentSport.icon} {currentSport.name} Configuration Preview
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Positions */}
                        <div>
                            <h5 className="text-sm font-medium text-slate-600 mb-2">Available Positions</h5>
                            <div className="flex flex-wrap gap-2">
                                {currentSport.positions.map(pos => (
                                    <span key={pos.id} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700">
                                        {pos.abbrev} - {pos.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {/* Scoring Actions */}
                        <div>
                            <h5 className="text-sm font-medium text-slate-600 mb-2">Scoring Actions</h5>
                            <div className="flex flex-wrap gap-2">
                                {currentSport.scoringActions.map(action => (
                                    <span key={action.id} className="px-3 py-1 bg-green-100 rounded-full text-sm text-green-700">
                                        {action.emoji} {action.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {/* Game Structure */}
                        <div>
                            <h5 className="text-sm font-medium text-slate-600 mb-2">Game Structure</h5>
                            <div className="text-sm text-slate-700">
                                <p><strong>Periods:</strong> {currentSport.periods} {currentSport.periodName}s</p>
                                <p><strong>Ball/Puck:</strong> {currentSport.ballName}</p>
                            </div>
                        </div>
                        
                        {/* Terminology */}
                        <div>
                            <h5 className="text-sm font-medium text-slate-600 mb-2">Terminology</h5>
                            <div className="text-sm text-slate-700">
                                <p><strong>Score:</strong> {currentSport.terminology.score}</p>
                                <p><strong>Assist:</strong> {currentSport.terminology.assist}</p>
                                <p><strong>Save:</strong> {currentSport.terminology.save}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        data-save-button
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Save Sport Settings
                    </button>
                </div>
            </div>
        );
    };

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
                                            <button
                                                type="button"
                                                onClick={() => handleColorExtraction(editingStyle.navLogoUrl)}
                                                className="text-green-600 hover:text-green-800 text-xs bg-transparent border-none cursor-pointer"
                                            >
                                                Extract Colors from Logo
                                            </button>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <LacrosseIcon name="image" className="mx-auto mb-2 text-slate-400" style={{fontSize: '32px'}} />
                                    <p className="text-sm text-slate-600 mb-3">Upload navigation logo</p>
                                    <div className="flex justify-center space-x-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'logo', 'nav', false)}
                                            className="hidden"
                                            id="nav-logo-upload-direct"
                                        />
                                        <label 
                                            htmlFor="nav-logo-upload-direct"
                                            className="bg-blue-600 text-white px-3 py-2 text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer"
                                        >
                                            Upload Direct
                                        </label>
                                        
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'logo', 'nav', true)}
                                            className="hidden"
                                            id="nav-logo-upload-crop"
                                        />
                                        <label 
                                            htmlFor="nav-logo-upload-crop"
                                            className="bg-green-600 text-white px-3 py-2 text-xs rounded hover:bg-green-700 transition-colors cursor-pointer"
                                        >
                                            Upload & Crop
                                        </label>
                                    </div>
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

            {/* Navigation Background Image */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Background Image</h4>
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

                {editingStyle.navBackgroundType === 'image' && (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.navBackgroundImage ? (
                            <div>
                                <img src={editingStyle.navBackgroundImage} alt="Nav Background" className="w-full h-20 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ navBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove Background
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => {
                                            console.log('🎯 Opening crop tool for existing nav background');
                                            setCropImageUrl(editingStyle.navBackgroundImage);
                                            setCropTarget('nav_background');
                                            setCropTargetType('navigation');
                                            setShowCropTool(true);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        📐 Edit/Crop
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'nav', false)}
                                            className="hidden"
                                        />
                                    </label>
                                    {editingStyle.navBackgroundImage && (
                                        <>
                                            <span className="text-slate-400">|</span>
                                            <button
                                                onClick={() => handleColorExtraction(editingStyle.navBackgroundImage)}
                                                className="text-green-600 hover:text-green-800 text-xs"
                                            >
                                                Extract Colors from this Image
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload navigation background image</p>
                                <div className="flex justify-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'nav', false)}
                                        className="hidden"
                                        id="nav-bg-upload-direct"
                                    />
                                    <label 
                                        htmlFor="nav-bg-upload-direct"
                                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                                    >
                                        Upload Direct
                                    </label>
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'nav', true)}
                                        className="hidden"
                                        id="nav-bg-upload-crop"
                                    />
                                    <label 
                                        htmlFor="nav-bg-upload-crop"
                                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors cursor-pointer text-sm"
                                    >
                                        📐 Crop & Upload
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Use "Crop & Upload" to select which part of the image to display
                                </p>
                            </div>
                        )}
                    </div>
                )}
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

            {/* Sidebar/Menu Controls - MOVED from separate tab */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Sidebar & Menu Styling</h4>
                
                {/* Menu Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Menu Background Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.menuBackgroundColor || '#ffffff'}
                                onChange={(e) => updateStyle({ menuBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.menuBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ menuBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Menu Text Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.menuTextColor || '#374151'}
                                onChange={(e) => updateStyle({ menuTextColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.menuTextColor || '#374151'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ menuTextColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="#374151"
                            />
                        </div>
                    </div>
                </div>

                {/* Button Transparency */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Button Transparency</label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={editingStyle.buttonTransparency || 0.9}
                            onChange={(e) => updateStyle({ buttonTransparency: parseFloat(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-sm text-slate-600 w-12">
                            {Math.round((editingStyle.buttonTransparency || 0.9) * 100)}%
                        </span>
                    </div>
                </div>

                {/* Nav Button Border Color */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Navigation Button Border Color</label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={editingStyle.navButtonBorderColor || editingStyle.accentColor || '#3b82f6'}
                            onChange={(e) => updateStyle({ navButtonBorderColor: e.target.value })}
                            className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={editingStyle.navButtonBorderColor || editingStyle.accentColor || '#3b82f6'}
                            onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                    updateStyle({ navButtonBorderColor: e.target.value });
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="#3b82f6"
                        />
                        <button
                            onClick={() => {
                                if (editingStyle.navLogoUrl) {
                                    setExtractImageUrl(editingStyle.navLogoUrl);
                                    setShowColorExtractor(true);
                                }
                            }}
                            disabled={!editingStyle.navLogoUrl}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                editingStyle.navLogoUrl 
                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title={editingStyle.navLogoUrl ? 'Extract colors from logo' : 'Upload a logo first'}
                        >
                            🎨 From Logo
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Border color for navigation menu buttons. Click "From Logo" to extract accent colors.</p>
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
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ bannerBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => {
                                            console.log('🎯 Opening crop tool for existing banner background');
                                            setCropImageUrl(editingStyle.bannerBackgroundImage);
                                            setCropTarget('banner_background');
                                            setCropTargetType('wide_banner');
                                            setShowCropTool(true);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        📐 Edit/Crop
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'banner', false)}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => handleColorExtraction(editingStyle.bannerBackgroundImage)}
                                        className="text-purple-600 hover:text-purple-800 text-xs"
                                    >
                                        Extract Colors
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload banner background image</p>
                                <div className="flex justify-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'banner', false)}
                                        className="hidden"
                                        id="banner-bg-upload-direct"
                                    />
                                    <label 
                                        htmlFor="banner-bg-upload-direct"
                                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                                    >
                                        Upload Direct
                                    </label>
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'banner', true)}
                                        className="hidden"
                                        id="banner-bg-upload-crop"
                                    />
                                    <label 
                                        htmlFor="banner-bg-upload-crop"
                                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors cursor-pointer text-sm"
                                    >
                                        📐 Crop & Upload
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Use "Crop & Upload" to select which part of the image to display
                                </p>
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
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ mainBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => {
                                            console.log('🎯 Opening crop tool for existing main background');
                                            setCropImageUrl(editingStyle.mainBackgroundImage);
                                            setCropTarget('main_background');
                                            setCropTargetType('background');
                                            setShowCropTool(true);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        📐 Edit/Crop
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'main', false)}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => handleColorExtraction(editingStyle.mainBackgroundImage)}
                                        className="text-purple-600 hover:text-purple-800 text-xs"
                                    >
                                        Extract Colors
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload page background image</p>
                                <div className="flex justify-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'main', false)}
                                        className="hidden"
                                        id="main-bg-upload-direct"
                                    />
                                    <label 
                                        htmlFor="main-bg-upload-direct"
                                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                                    >
                                        Upload Direct
                                    </label>
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'main', true)}
                                        className="hidden"
                                        id="main-bg-upload-crop"
                                    />
                                    <label 
                                        htmlFor="main-bg-upload-crop"
                                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors cursor-pointer text-sm"
                                    >
                                        📐 Crop & Upload
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Use "Crop & Upload" to select which part of the background image to display
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.mainBackgroundColor || '#f8fafc'}
                                onChange={(e) => updateStyle({ mainBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.mainBackgroundColor || '#f8fafc'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ mainBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#f8fafc"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area Background - NEW SECTION */}
            <div className="border-t pt-6">
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-4">
                    <h4 className="text-md font-semibold text-indigo-800 mb-2">📄 Content Area Background</h4>
                    <p className="text-indigo-600 text-sm">This is the white area where page content appears. Customize it with a color or image background.</p>
                </div>
                
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('content', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.contentBackgroundType !== 'image') 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('content', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.contentBackgroundType === 'image') 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Background
                    </button>
                </div>

                {editingStyle.contentBackgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 text-center">
                        {editingStyle.contentBackgroundImage ? (
                            <div>
                                <img src={editingStyle.contentBackgroundImage} alt="Content Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ contentBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => {
                                            console.log('🎯 Opening crop tool for content background');
                                            setCropImageUrl(editingStyle.contentBackgroundImage);
                                            setCropTarget('content_background');
                                            setCropTargetType('background');
                                            setShowCropTool(true);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        📐 Edit/Crop
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'content', false)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-indigo-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload content area background image</p>
                                <div className="flex justify-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'content', false)}
                                        className="hidden"
                                        id="content-bg-upload-direct"
                                    />
                                    <label 
                                        htmlFor="content-bg-upload-direct"
                                        className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition-colors cursor-pointer text-sm"
                                    >
                                        Upload Direct
                                    </label>
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'content', true)}
                                        className="hidden"
                                        id="content-bg-upload-crop"
                                    />
                                    <label 
                                        htmlFor="content-bg-upload-crop"
                                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors cursor-pointer text-sm"
                                    >
                                        📐 Crop & Upload
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Content Area Background Color</label>
                        <div className="flex items-center space-x-3 mb-3">
                            <input
                                type="color"
                                value={editingStyle.contentBackgroundColor || '#ffffff'}
                                onChange={(e) => updateStyle({ contentBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.contentBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ contentBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="#ffffff"
                            />
                            {/* Extract colors from logo button */}
                            {editingStyle.navLogoUrl && (
                                <button
                                    onClick={() => handleColorExtraction(editingStyle.navLogoUrl)}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm whitespace-nowrap"
                                    title="Extract colors from league logo"
                                >
                                    🎨 From Logo
                                </button>
                            )}
                        </div>
                        
                        {/* Quick Color Palette - Theme colors */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-500 mb-2">Quick Colors (from theme)</label>
                            <div className="flex flex-wrap gap-2">
                                {/* White - Default */}
                                <button
                                    onClick={() => updateStyle({ contentBackgroundColor: '#ffffff' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.contentBackgroundColor === '#ffffff' 
                                            ? 'border-blue-500 ring-2 ring-blue-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#ffffff' }}
                                    title="White (Default)"
                                />
                                {/* Light Gray */}
                                <button
                                    onClick={() => updateStyle({ contentBackgroundColor: '#f8fafc' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.contentBackgroundColor === '#f8fafc' 
                                            ? 'border-blue-500 ring-2 ring-blue-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#f8fafc' }}
                                    title="Light Gray"
                                />
                                {/* Primary Color */}
                                {editingStyle.primaryColor && (
                                    <button
                                        onClick={() => updateStyle({ contentBackgroundColor: editingStyle.primaryColor })}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            editingStyle.contentBackgroundColor === editingStyle.primaryColor 
                                                ? 'border-blue-500 ring-2 ring-blue-300' 
                                                : 'border-slate-300 hover:border-slate-400'
                                        }`}
                                        style={{ backgroundColor: editingStyle.primaryColor }}
                                        title={`Primary Color (${editingStyle.primaryColor})`}
                                    />
                                )}
                                {/* Accent Color */}
                                {editingStyle.accentColor && (
                                    <button
                                        onClick={() => updateStyle({ contentBackgroundColor: editingStyle.accentColor })}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            editingStyle.contentBackgroundColor === editingStyle.accentColor 
                                                ? 'border-blue-500 ring-2 ring-blue-300' 
                                                : 'border-slate-300 hover:border-slate-400'
                                        }`}
                                        style={{ backgroundColor: editingStyle.accentColor }}
                                        title={`Accent Color (${editingStyle.accentColor})`}
                                    />
                                )}
                                {/* Nav Background Color */}
                                {editingStyle.navBackgroundColor && editingStyle.navBackgroundColor !== '#ffffff' && (
                                    <button
                                        onClick={() => updateStyle({ contentBackgroundColor: editingStyle.navBackgroundColor })}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            editingStyle.contentBackgroundColor === editingStyle.navBackgroundColor 
                                                ? 'border-blue-500 ring-2 ring-blue-300' 
                                                : 'border-slate-300 hover:border-slate-400'
                                        }`}
                                        style={{ backgroundColor: editingStyle.navBackgroundColor }}
                                        title={`Nav Color (${editingStyle.navBackgroundColor})`}
                                    />
                                )}
                                {/* Banner Background Color */}
                                {editingStyle.bannerBackgroundColor && (
                                    <button
                                        onClick={() => updateStyle({ contentBackgroundColor: editingStyle.bannerBackgroundColor })}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            editingStyle.contentBackgroundColor === editingStyle.bannerBackgroundColor 
                                                ? 'border-blue-500 ring-2 ring-blue-300' 
                                                : 'border-slate-300 hover:border-slate-400'
                                        }`}
                                        style={{ backgroundColor: editingStyle.bannerBackgroundColor }}
                                        title={`Banner Color (${editingStyle.bannerBackgroundColor})`}
                                    />
                                )}
                                {/* Dark colors */}
                                <button
                                    onClick={() => updateStyle({ contentBackgroundColor: '#1e293b' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.contentBackgroundColor === '#1e293b' 
                                            ? 'border-blue-500 ring-2 ring-blue-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#1e293b' }}
                                    title="Dark Slate"
                                />
                                <button
                                    onClick={() => updateStyle({ contentBackgroundColor: '#0f172a' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.contentBackgroundColor === '#0f172a' 
                                            ? 'border-blue-500 ring-2 ring-blue-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#0f172a' }}
                                    title="Near Black"
                                />
                            </div>
                        </div>
                        
                        <p className="text-xs text-slate-500">
                            💡 Click "From Logo" to extract colors from your league logo, or pick from the quick colors above.
                        </p>
                    </div>
                )}
            </div>

            {/* Card/Form Background Section */}
            <div className="border-t pt-6">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 mb-4">
                    <h4 className="text-md font-semibold text-emerald-800 mb-2">📋 Card & Form Background</h4>
                    <p className="text-emerald-600 text-sm">Control the background color of cards and forms. Use "Transparent" to show the content area background through.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-4">
                    <button
                        onClick={() => updateStyle({ cardBackgroundType: 'solid' })}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            editingStyle.cardBackgroundType !== 'transparent'
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Solid Color
                    </button>
                    <button
                        onClick={() => updateStyle({ cardBackgroundType: 'transparent' })}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            editingStyle.cardBackgroundType === 'transparent'
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Transparent
                    </button>
                </div>

                {editingStyle.cardBackgroundType !== 'transparent' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Card Background Color</label>
                        <div className="flex items-center space-x-3 mb-3">
                            <input
                                type="color"
                                value={editingStyle.cardBackgroundColor || '#ffffff'}
                                onChange={(e) => updateStyle({ cardBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.cardBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ cardBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                placeholder="#ffffff"
                            />
                        </div>
                        
                        {/* Card Opacity Slider */}
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Card Opacity: {Math.round((editingStyle.cardBackgroundOpacity || 1) * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={editingStyle.cardBackgroundOpacity || 1}
                                onChange={(e) => updateStyle({ cardBackgroundOpacity: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>10% (More transparent)</span>
                                <span>100% (Solid)</span>
                            </div>
                        </div>
                        
                        {/* Quick Colors for Cards */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-500 mb-2">Quick Colors</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => updateStyle({ cardBackgroundColor: '#ffffff' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.cardBackgroundColor === '#ffffff' 
                                            ? 'border-emerald-500 ring-2 ring-emerald-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#ffffff' }}
                                    title="White"
                                />
                                <button
                                    onClick={() => updateStyle({ cardBackgroundColor: '#f8fafc' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.cardBackgroundColor === '#f8fafc' 
                                            ? 'border-emerald-500 ring-2 ring-emerald-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#f8fafc' }}
                                    title="Light Gray"
                                />
                                <button
                                    onClick={() => updateStyle({ cardBackgroundColor: '#1e293b' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.cardBackgroundColor === '#1e293b' 
                                            ? 'border-emerald-500 ring-2 ring-emerald-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#1e293b' }}
                                    title="Dark Slate"
                                />
                                <button
                                    onClick={() => updateStyle({ cardBackgroundColor: '#0f172a' })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        editingStyle.cardBackgroundColor === '#0f172a' 
                                            ? 'border-emerald-500 ring-2 ring-emerald-300' 
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                    style={{ backgroundColor: '#0f172a' }}
                                    title="Near Black"
                                />
                                {editingStyle.primaryColor && (
                                    <button
                                        onClick={() => updateStyle({ cardBackgroundColor: editingStyle.primaryColor })}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                            editingStyle.cardBackgroundColor === editingStyle.primaryColor 
                                                ? 'border-emerald-500 ring-2 ring-emerald-300' 
                                                : 'border-slate-300 hover:border-slate-400'
                                        }`}
                                        style={{ backgroundColor: editingStyle.primaryColor }}
                                        title={`Primary Color`}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                <p className="text-xs text-slate-500">
                    💡 Use "Transparent" to let the content area background show through, or set a custom card color with adjustable opacity.
                </p>
            </div>

            {/* Content Area Typography Section */}
            <div className="border-t pt-6">
                <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 mb-4">
                    <h4 className="text-md font-semibold text-violet-800 mb-2">🔤 Content Area Typography</h4>
                    <p className="text-violet-600 text-sm">Set the default font and text color for the main content area.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Content Font Family */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Content Font</label>
                        <select
                            value={editingStyle.contentFont || 'Inter, sans-serif'}
                            onChange={(e) => updateStyle({ contentFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="Inter, sans-serif">Inter (Modern)</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                            <option value="'Lato', sans-serif">Lato</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                            <option value="'Nunito', sans-serif">Nunito</option>
                            <option value="'Raleway', sans-serif">Raleway</option>
                            <option value="Georgia, serif">Georgia (Serif)</option>
                            <option value="'Merriweather', serif">Merriweather (Serif)</option>
                            <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                        </select>
                    </div>

                    {/* Content Text Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Content Text Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.contentTextColor || '#374151'}
                                onChange={(e) => updateStyle({ contentTextColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.contentTextColor || '#374151'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ contentTextColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                                placeholder="#374151"
                            />
                        </div>
                        {/* Quick Colors for Text */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <button
                                onClick={() => updateStyle({ contentTextColor: '#000000' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.contentTextColor === '#000000' ? 'border-violet-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#000000' }}
                                title="Black"
                            />
                            <button
                                onClick={() => updateStyle({ contentTextColor: '#374151' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.contentTextColor === '#374151' ? 'border-violet-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#374151' }}
                                title="Dark Gray"
                            />
                            <button
                                onClick={() => updateStyle({ contentTextColor: '#6b7280' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.contentTextColor === '#6b7280' ? 'border-violet-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#6b7280' }}
                                title="Gray"
                            />
                            <button
                                onClick={() => updateStyle({ contentTextColor: '#ffffff' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.contentTextColor === '#ffffff' ? 'border-violet-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#ffffff' }}
                                title="White"
                            />
                            <button
                                onClick={() => updateStyle({ contentTextColor: '#f8fafc' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.contentTextColor === '#f8fafc' ? 'border-violet-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#f8fafc' }}
                                title="Off-White"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Typography Section */}
            <div className="border-t pt-6">
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 mb-4">
                    <h4 className="text-md font-semibold text-teal-800 mb-2">📝 Card & Form Typography</h4>
                    <p className="text-teal-600 text-sm">Set the font and text color specifically for cards and forms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card Font Family */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Card Font</label>
                        <select
                            value={editingStyle.cardFont || 'inherit'}
                            onChange={(e) => updateStyle({ cardFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="inherit">Same as Content</option>
                            <option value="Inter, sans-serif">Inter (Modern)</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                            <option value="'Lato', sans-serif">Lato</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                            <option value="'Nunito', sans-serif">Nunito</option>
                            <option value="Georgia, serif">Georgia (Serif)</option>
                            <option value="'Merriweather', serif">Merriweather (Serif)</option>
                        </select>
                    </div>

                    {/* Card Text Color */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Card Text Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.cardTextColor || '#374151'}
                                onChange={(e) => updateStyle({ cardTextColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.cardTextColor || '#374151'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ cardTextColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                placeholder="#374151"
                            />
                        </div>
                        {/* Quick Colors for Card Text */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <button
                                onClick={() => updateStyle({ cardTextColor: '#000000' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.cardTextColor === '#000000' ? 'border-teal-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#000000' }}
                                title="Black"
                            />
                            <button
                                onClick={() => updateStyle({ cardTextColor: '#374151' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.cardTextColor === '#374151' ? 'border-teal-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#374151' }}
                                title="Dark Gray"
                            />
                            <button
                                onClick={() => updateStyle({ cardTextColor: '#6b7280' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.cardTextColor === '#6b7280' ? 'border-teal-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#6b7280' }}
                                title="Gray"
                            />
                            <button
                                onClick={() => updateStyle({ cardTextColor: '#ffffff' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.cardTextColor === '#ffffff' ? 'border-teal-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#ffffff' }}
                                title="White"
                            />
                            <button
                                onClick={() => updateStyle({ cardTextColor: '#f8fafc' })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.cardTextColor === '#f8fafc' ? 'border-teal-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: '#f8fafc' }}
                                title="Off-White"
                            />
                        </div>
                    </div>
                </div>

                {/* Input Text Color */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Input / Form Text Color</label>
                    <p className="text-xs text-slate-500 mb-2">Controls the text color inside input fields, dropdowns, and text areas</p>
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={editingStyle.inputTextColor || '#1e293b'}
                            onChange={(e) => updateStyle({ inputTextColor: e.target.value })}
                            className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={editingStyle.inputTextColor || '#1e293b'}
                            onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                    updateStyle({ inputTextColor: e.target.value });
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                            placeholder="#1e293b"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {['#000000', '#1e293b', '#374151', '#6b7280'].map(c => (
                            <button key={c} onClick={() => updateStyle({ inputTextColor: c })}
                                className={`w-6 h-6 rounded border-2 ${editingStyle.inputTextColor === c ? 'border-teal-500' : 'border-slate-300'}`}
                                style={{ backgroundColor: c }} title={c}
                            />
                        ))}
                    </div>
                </div>

                {/* Card Heading Color */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Card Heading Color</label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="color"
                            value={editingStyle.cardHeadingColor || '#1f2937'}
                            onChange={(e) => updateStyle({ cardHeadingColor: e.target.value })}
                            className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={editingStyle.cardHeadingColor || '#1f2937'}
                            onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                    updateStyle({ cardHeadingColor: e.target.value });
                                }
                            }}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 max-w-xs"
                            placeholder="#1f2937"
                        />
                        {/* Quick Colors */}
                        <div className="flex gap-1">
                            <button onClick={() => updateStyle({ cardHeadingColor: '#000000' })} className="w-6 h-6 rounded border" style={{ backgroundColor: '#000000' }} title="Black" />
                            <button onClick={() => updateStyle({ cardHeadingColor: '#1f2937' })} className="w-6 h-6 rounded border" style={{ backgroundColor: '#1f2937' }} title="Slate 800" />
                            <button onClick={() => updateStyle({ cardHeadingColor: '#ffffff' })} className="w-6 h-6 rounded border" style={{ backgroundColor: '#ffffff' }} title="White" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Live View Settings Section
    const renderLiveViewSection = () => (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Live View & Scoring Styling</h3>
                <p className="text-green-600 text-sm">Customize how live game views and score entry pages look. Team banners and colors will be applied automatically.</p>
            </div>

            {/* Background Type Selection */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Background Style</h4>
                <p className="text-sm text-slate-600 mb-3">Choose how the split banner should display for home/away teams</p>
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => updateStyle({ liveViewBackgroundType: 'banners' })}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                            editingStyle.liveViewBackgroundType === 'banners'
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-slate-300 hover:border-slate-400'
                        }`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-2">🖼️</div>
                            <div className="font-medium">Team Banners</div>
                            <div className="text-xs text-slate-600 mt-1">Use team banner images</div>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => updateStyle({ liveViewBackgroundType: 'solid' })}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                            editingStyle.liveViewBackgroundType === 'solid'
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-slate-300 hover:border-slate-400'
                        }`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-2">🎨</div>
                            <div className="font-medium">Solid Colors</div>
                            <div className="text-xs text-slate-600 mt-1">Use team colors only</div>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => updateStyle({ liveViewBackgroundType: 'gradient' })}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                            editingStyle.liveViewBackgroundType === 'gradient'
                                ? 'border-blue-600 bg-blue-50' 
                                : 'border-slate-300 hover:border-slate-400'
                        }`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-2">🌈</div>
                            <div className="font-medium">Gradient</div>
                            <div className="text-xs text-slate-600 mt-1">Team color gradient</div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Banner Opacity Control */}
            {editingStyle.liveViewBackgroundType === 'banners' && (
                <div>
                    <h4 className="text-md font-semibold text-slate-800 mb-4">Banner Overlay Opacity</h4>
                    <p className="text-sm text-slate-600 mb-3">Control how transparent the team banners appear (lower = more visible)</p>
                    <div className="space-y-3">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={editingStyle.liveViewBannerOpacity || 0.3}
                            onChange={(e) => updateStyle({ liveViewBannerOpacity: parseFloat(e.target.value) })}
                            className="w-full"
                        />
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>More Visible (0)</span>
                            <span className="font-medium text-blue-600">{((editingStyle.liveViewBannerOpacity || 0.3) * 100).toFixed(0)}%</span>
                            <span>More Subtle (100)</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Team Fonts Toggle */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Typography</h4>
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                    <input
                        type="checkbox"
                        id="liveViewUseTeamFonts"
                        checked={editingStyle.liveViewUseTeamFonts !== false}
                        onChange={(e) => updateStyle({ liveViewUseTeamFonts: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="liveViewUseTeamFonts" className="flex-1 cursor-pointer">
                        <div className="font-medium text-slate-800">Use Team-Specific Fonts</div>
                        <div className="text-sm text-slate-600">Apply each team's font settings to their respective sections</div>
                    </label>
                </div>
            </div>

            {/* Preview Examples */}
            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Preview</h4>
                
                {/* Team Selection for Preview */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Home Team Preview</label>
                        <select
                            value={editingStyle.previewHomeTeam || ''}
                            onChange={(e) => updateStyle({ previewHomeTeam: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select a team...</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Away Team Preview</label>
                        <select
                            value={editingStyle.previewAwayTeam || ''}
                            onChange={(e) => updateStyle({ previewAwayTeam: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select a team...</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Live Preview with actual team data */}
                {(() => {
                    const homeTeam = teams.find(t => t.id === editingStyle.previewHomeTeam);
                    const awayTeam = teams.find(t => t.id === editingStyle.previewAwayTeam);
                    const homeBanner = homeTeam?.style?.bannerImage || homeTeam?.logo;
                    const awayBanner = awayTeam?.style?.bannerImage || awayTeam?.logo;
                    const homeColor = homeTeam?.style?.primaryColor || '#3b82f6';
                    const awayColor = awayTeam?.style?.primaryColor || '#ef4444';
                    const homeFont = homeTeam?.style?.font || 'Inter, sans-serif';
                    const awayFont = awayTeam?.style?.font || 'Inter, sans-serif';
                    
                    return (
                        <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                            <div className="flex h-40">
                                {/* Home Team Side */}
                                <div 
                                    className="flex-1 flex items-center justify-center relative overflow-hidden"
                                    style={{
                                        background: editingStyle.liveViewBackgroundType === 'banners' && homeBanner
                                            ? `linear-gradient(rgba(0, 0, 0, ${editingStyle.liveViewBannerOpacity || 0.3}), rgba(0, 0, 0, ${editingStyle.liveViewBannerOpacity || 0.3})), url('${homeBanner}')`
                                            : editingStyle.liveViewBackgroundType === 'gradient'
                                            ? `linear-gradient(to right, ${homeColor}, ${homeColor}dd)`
                                            : homeColor,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {/* Team Logo Overlay */}
                                    {homeTeam?.logo && editingStyle.liveViewBackgroundType !== 'banners' && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <img src={homeTeam.logo} alt="" className="w-24 h-24 object-contain" />
                                        </div>
                                    )}
                                    <div className="text-white text-center z-10">
                                        {homeTeam?.logo && (
                                            <img src={homeTeam.logo} alt={homeTeam?.name} className="w-12 h-12 mx-auto mb-2 object-contain rounded" />
                                        )}
                                        <div 
                                            className="text-sm mb-1 font-semibold"
                                            style={{ fontFamily: editingStyle.liveViewUseTeamFonts !== false ? homeFont : 'inherit' }}
                                        >
                                            {homeTeam?.name || 'Home Team'}
                                        </div>
                                        <div className="text-4xl font-bold">0</div>
                                    </div>
                                </div>
                                
                                {/* Center Clock */}
                                <div className="flex items-center justify-center bg-black bg-opacity-80 px-6 z-20">
                                    <div className="text-white text-center">
                                        <div className="text-3xl font-bold font-mono">15:00</div>
                                        <div className="text-xs mt-1 text-gray-300">Period 1</div>
                                    </div>
                                </div>
                                
                                {/* Away Team Side */}
                                <div 
                                    className="flex-1 flex items-center justify-center relative overflow-hidden"
                                    style={{
                                        background: editingStyle.liveViewBackgroundType === 'banners' && awayBanner
                                            ? `linear-gradient(rgba(0, 0, 0, ${editingStyle.liveViewBannerOpacity || 0.3}), rgba(0, 0, 0, ${editingStyle.liveViewBannerOpacity || 0.3})), url('${awayBanner}')`
                                            : editingStyle.liveViewBackgroundType === 'gradient'
                                            ? `linear-gradient(to left, ${awayColor}, ${awayColor}dd)`
                                            : awayColor,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {/* Team Logo Overlay */}
                                    {awayTeam?.logo && editingStyle.liveViewBackgroundType !== 'banners' && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                            <img src={awayTeam.logo} alt="" className="w-24 h-24 object-contain" />
                                        </div>
                                    )}
                                    <div className="text-white text-center z-10">
                                        {awayTeam?.logo && (
                                            <img src={awayTeam.logo} alt={awayTeam?.name} className="w-12 h-12 mx-auto mb-2 object-contain rounded" />
                                        )}
                                        <div 
                                            className="text-sm mb-1 font-semibold"
                                            style={{ fontFamily: editingStyle.liveViewUseTeamFonts !== false ? awayFont : 'inherit' }}
                                        >
                                            {awayTeam?.name || 'Away Team'}
                                        </div>
                                        <div className="text-4xl font-bold">0</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Team Info Bar */}
                            {(homeTeam || awayTeam) && (
                                <div className="bg-slate-100 px-4 py-2 flex justify-between text-xs text-slate-600">
                                    <span>{homeTeam ? `${homeTeam.name} - ${homeColor}` : 'Select home team'}</span>
                                    <span>{awayTeam ? `${awayTeam.name} - ${awayColor}` : 'Select away team'}</span>
                                </div>
                            )}
                        </div>
                    );
                })()}
                
                <p className="text-xs text-slate-500 mt-2 text-center">
                    💡 Select teams above to preview how their logos, banners, and colors will appear in live scoring view.
                </p>
            </div>
        </div>
    );

    // Event Ticker Section
    const renderTickerSection = () => (
        <div className="space-y-6">
            <TickerManager 
                websiteStyle={websiteStyle} 
                setWebsiteStyle={setWebsiteStyle} 
                teams={teams} 
                events={events} 
            />
        </div>
    );

    // Menus Section - MISSING IMPLEMENTATION ADDED
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
                                    <button
                                        onClick={() => {
                                            console.log('🎯 Opening crop tool for existing menu background');
                                            setCropImageUrl(editingStyle.menuBackgroundImage);
                                            setCropTarget('menu_background');
                                            setCropTargetType('background');
                                            setShowCropTool(true);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        📐 Edit/Crop
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'menu', false)}
                                            className="hidden"
                                        />
                                    </label>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => handleColorExtraction(editingStyle.menuBackgroundImage)}
                                        className="text-purple-600 hover:text-purple-800 text-xs"
                                    >
                                        Extract Colors
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload menu background image</p>
                                <div className="flex justify-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'menu', false)}
                                        className="hidden"
                                        id="menu-bg-upload-direct"
                                    />
                                    <label 
                                        htmlFor="menu-bg-upload-direct"
                                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                                    >
                                        Upload Direct
                                    </label>
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'menu', true)}
                                        className="hidden"
                                        id="menu-bg-upload-crop"
                                    />
                                    <label 
                                        htmlFor="menu-bg-upload-crop"
                                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors cursor-pointer text-sm"
                                    >
                                        📐 Crop & Upload
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Use "Crop & Upload" to choose which part of the image to display
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.menuBackgroundColor || '#ffffff'}
                                onChange={(e) => updateStyle({ menuBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.menuBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ menuBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Menu Typography */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Menu Typography & Buttons</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font</label>
                        <select
                            value={editingStyle.menuFont || 'Inter, sans-serif'}
                            onChange={(e) => updateStyle({ menuFont: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.menuTextColor || '#374151'}
                                onChange={(e) => updateStyle({ menuTextColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.menuTextColor || '#374151'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ menuTextColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="#374151"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Button Transparency</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={editingStyle.buttonTransparency || 0.9}
                                onChange={(e) => updateStyle({ buttonTransparency: parseFloat(e.target.value) })}
                                className="flex-1"
                            />
                            <span className="text-sm text-slate-600 w-12">
                                {Math.round((editingStyle.buttonTransparency || 0.9) * 100)}%
                            </span>
                        </div>
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
                                    color: editingStyle.menuTextColor || '#374151'
                                }}
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form Background Controls */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Form Background</h4>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('form', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.formBackgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Forms
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('form', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.formBackgroundType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Forms
                    </button>
                </div>

                {editingStyle.formBackgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.formBackgroundImage ? (
                            <div>
                                <img src={editingStyle.formBackgroundImage} alt="Form Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => updateStyle({ formBackgroundImage: '' })}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <button
                                        onClick={() => {
                                            console.log('🎯 Opening crop tool for existing form background');
                                            setCropImageUrl(editingStyle.formBackgroundImage);
                                            setCropTarget('form_background');
                                            setCropTargetType('background');
                                            setShowCropTool(true);
                                        }}
                                        className="text-green-600 hover:text-green-800 text-sm"
                                    >
                                        📐 Edit/Crop
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload form background image</p>
                                <div className="flex justify-center space-x-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'form', false)}
                                        className="hidden"
                                        id="form-bg-upload-direct"
                                    />
                                    <label 
                                        htmlFor="form-bg-upload-direct"
                                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                                    >
                                        Upload Direct
                                    </label>
                                    
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'background', 'form', true)}
                                        className="hidden"
                                        id="form-bg-upload-crop"
                                    />
                                    <label 
                                        htmlFor="form-bg-upload-crop"
                                        className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors cursor-pointer text-sm"
                                    >
                                        📐 Crop & Upload
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Form Background Color</label>
                        <div className="flex items-center space-x-3">
                            <input
                                type="color"
                                value={editingStyle.formBackgroundColor || '#ffffff'}
                                onChange={(e) => updateStyle({ formBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.formBackgroundColor || '#ffffff'}
                                onChange={(e) => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                        updateStyle({ formBackgroundColor: e.target.value });
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // PWA / Mobile App Settings Section
    const renderPWASection = () => (
        <div className="space-y-6">
            {/* App Identity */}
            <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">📱 App Identity</h3>
                <p className="text-sm text-slate-600 mb-4">
                    These settings control how your app appears when installed on users' devices.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">App Name</label>
                        <input
                            type="text"
                            value={editingStyle.pwaAppName || ''}
                            onChange={(e) => updateStyle({ pwaAppName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Midwest Lacrosse League"
                        />
                        <p className="text-xs text-slate-500 mt-1">Full name shown in app stores and install prompts</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Short Name</label>
                        <input
                            type="text"
                            value={editingStyle.pwaShortName || ''}
                            onChange={(e) => updateStyle({ pwaShortName: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="MLBL"
                            maxLength={12}
                        />
                        <p className="text-xs text-slate-500 mt-1">Shown under the app icon on home screen (max 12 chars)</p>
                    </div>
                    
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">App Description</label>
                        <textarea
                            value={editingStyle.pwaDescription || ''}
                            onChange={(e) => updateStyle({ pwaDescription: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            rows={2}
                            placeholder="League management portal for schedules, rosters, and stats"
                        />
                    </div>
                </div>
            </div>

            {/* App Icon */}
            <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">🎨 App Icon</h3>
                <p className="text-sm text-slate-600 mb-4">
                    This icon appears on users' home screens and in the install prompt. For best results, use a square image (512x512px recommended).
                </p>
                
                <div className="flex items-start gap-6">
                    {/* Icon Preview */}
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shadow-lg">
                            {editingStyle.pwaIconUrl ? (
                                <img 
                                    src={editingStyle.pwaIconUrl} 
                                    alt="App Icon" 
                                    className="w-full h-full object-cover"
                                />
                            ) : editingStyle.navLogoUrl ? (
                                <img 
                                    src={editingStyle.navLogoUrl} 
                                    alt="App Icon" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl">📱</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Home Screen Preview</p>
                    </div>
                    
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">App Icon</label>
                        
                        {/* File Upload */}
                        <div className="mb-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    try {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        formData.append('purpose', 'pwa-icon');
                                        
                                        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/api/upload/image`, {
                                            method: 'POST',
                                            body: formData
                                        });
                                        
                                        if (response.ok) {
                                            const data = await response.json();
                                            updateStyle({ pwaIconUrl: data.url });
                                        } else {
                                            alert('Failed to upload image');
                                        }
                                    } catch (err) {
                                        console.error('Upload error:', err);
                                        alert('Error uploading image');
                                    }
                                }}
                                className="hidden"
                                id="pwa-icon-upload"
                            />
                            <label
                                htmlFor="pwa-icon-upload"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload Icon Image
                            </label>
                            <span className="text-xs text-slate-500 ml-2">512x512px recommended</span>
                        </div>
                        
                        {/* URL Input */}
                        <div className="mb-2">
                            <input
                                type="url"
                                value={editingStyle.pwaIconUrl || ''}
                                onChange={(e) => updateStyle({ pwaIconUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="Or paste image URL..."
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => {
                                    if (editingStyle.navLogoUrl) {
                                        updateStyle({ pwaIconUrl: editingStyle.navLogoUrl });
                                    }
                                }}
                                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                            >
                                Use Nav Logo
                            </button>
                            <button
                                onClick={() => updateStyle({ pwaIconUrl: '' })}
                                className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme Colors */}
            <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">🎨 App Theme Colors</h3>
                        <p className="text-sm text-slate-600">
                            These colors affect the status bar and window appearance when the app is installed.
                        </p>
                    </div>
                    {(editingStyle.navLogoUrl || editingStyle.pwaIconUrl) && (
                        <button
                            onClick={() => handleColorExtraction(editingStyle.pwaIconUrl || editingStyle.navLogoUrl)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            🎨 Use Logo Colors
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Theme Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={editingStyle.pwaThemeColor || '#1e40af'}
                                onChange={(e) => updateStyle({ pwaThemeColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.pwaThemeColor || '#1e40af'}
                                onChange={(e) => updateStyle({ pwaThemeColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Status bar and title bar color</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Background Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={editingStyle.pwaBackgroundColor || '#f8fafc'}
                                onChange={(e) => updateStyle({ pwaBackgroundColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.pwaBackgroundColor || '#f8fafc'}
                                onChange={(e) => updateStyle({ pwaBackgroundColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Splash screen background when app loads</p>
                    </div>
                </div>
                
                {/* Quick color presets */}
                <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quick Presets</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { name: 'Blue', theme: '#1e40af', bg: '#f8fafc' },
                            { name: 'Green', theme: '#166534', bg: '#f0fdf4' },
                            { name: 'Red', theme: '#991b1b', bg: '#fef2f2' },
                            { name: 'Purple', theme: '#6b21a8', bg: '#faf5ff' },
                            { name: 'Orange', theme: '#c2410c', bg: '#fff7ed' },
                            { name: 'Dark', theme: '#1f2937', bg: '#111827' },
                        ].map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => {
                                    updateStyle({ pwaThemeColor: preset.theme });
                                    updateStyle({ pwaBackgroundColor: preset.bg });
                                }}
                                className="px-3 py-1 text-sm rounded-full border hover:shadow-md transition-shadow flex items-center gap-2"
                                style={{ borderColor: preset.theme }}
                            >
                                <span 
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: preset.theme }}
                                />
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Install Banner Customization */}
            <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">📲 Install Banner</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Customize the banner that prompts users to install your app on their device.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banner Title</label>
                        <input
                            type="text"
                            value={editingStyle.pwaInstallBannerTitle || ''}
                            onChange={(e) => updateStyle({ pwaInstallBannerTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Install Our App"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banner Text</label>
                        <input
                            type="text"
                            value={editingStyle.pwaInstallBannerText || ''}
                            onChange={(e) => updateStyle({ pwaInstallBannerText: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="Add to your home screen for quick access!"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banner Background</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={editingStyle.pwaInstallBannerBgColor || '#1e40af'}
                                onChange={(e) => updateStyle({ pwaInstallBannerBgColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.pwaInstallBannerBgColor || '#1e40af'}
                                onChange={(e) => updateStyle({ pwaInstallBannerBgColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Banner Text Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={editingStyle.pwaInstallBannerTextColor || '#ffffff'}
                                onChange={(e) => updateStyle({ pwaInstallBannerTextColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.pwaInstallBannerTextColor || '#ffffff'}
                                onChange={(e) => updateStyle({ pwaInstallBannerTextColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Button Background</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={editingStyle.pwaInstallBannerButtonColor || '#ffffff'}
                                onChange={(e) => updateStyle({ pwaInstallBannerButtonColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.pwaInstallBannerButtonColor || '#ffffff'}
                                onChange={(e) => updateStyle({ pwaInstallBannerButtonColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Button Text Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={editingStyle.pwaInstallBannerButtonTextColor || '#1e40af'}
                                onChange={(e) => updateStyle({ pwaInstallBannerButtonTextColor: e.target.value })}
                                className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={editingStyle.pwaInstallBannerButtonTextColor || '#1e40af'}
                                onChange={(e) => updateStyle({ pwaInstallBannerButtonTextColor: e.target.value })}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Live Preview of Install Banner */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Banner Preview</label>
                    <div 
                        className="rounded-xl p-4 shadow-lg max-w-md"
                        style={{ 
                            background: `linear-gradient(135deg, ${editingStyle.pwaInstallBannerBgColor || '#1e40af'} 0%, ${editingStyle.pwaInstallBannerBgColor || '#1e40af'}dd 100%)`,
                            color: editingStyle.pwaInstallBannerTextColor || '#ffffff'
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg flex-shrink-0">
                                {editingStyle.pwaIconUrl || editingStyle.navLogoUrl ? (
                                    <img 
                                        src={editingStyle.pwaIconUrl || editingStyle.navLogoUrl} 
                                        alt="App" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl">📱</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg">{editingStyle.pwaInstallBannerTitle || 'Install Our App'}</h4>
                                <p className="text-sm opacity-90">{editingStyle.pwaInstallBannerText || 'Add to your home screen for quick access!'}</p>
                                <button
                                    className="mt-3 w-full py-2 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                                    style={{
                                        backgroundColor: editingStyle.pwaInstallBannerButtonColor || '#ffffff',
                                        color: editingStyle.pwaInstallBannerButtonTextColor || '#1e40af'
                                    }}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Install App
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reinstall Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">📲</span>
                    <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 text-lg">How to Update / Reinstall the App</h4>
                        <p className="text-sm text-amber-800 mt-1">
                            After changing app settings (icon, name, colors), users need to reinstall the app to see the changes on their home screen.
                        </p>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="font-medium text-amber-900 mb-2">📱 iOS (iPhone/iPad)</div>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                                    <li>Delete app from home screen</li>
                                    <li>Open Safari → visit website</li>
                                    <li>Tap Share button (box with arrow)</li>
                                    <li>Tap "Add to Home Screen"</li>
                                </ol>
                            </div>
                            
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="font-medium text-amber-900 mb-2">🤖 Android</div>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                                    <li>Long-press app icon → Uninstall</li>
                                    <li>Open Chrome → visit website</li>
                                    <li>Tap menu (3 dots)</li>
                                    <li>Tap "Install app"</li>
                                </ol>
                            </div>
                            
                            <div className="bg-white/60 rounded-lg p-3">
                                <div className="font-medium text-amber-900 mb-2">💻 Desktop (Chrome)</div>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                                    <li>Go to chrome://apps</li>
                                    <li>Right-click app → Remove</li>
                                    <li>Visit website in Chrome</li>
                                    <li>Click install icon in address bar</li>
                                </ol>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-800">
                                <span>💡</span>
                                <span className="font-medium">Tip:</span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1">
                                Share these instructions with your league members after updating the app icon or name. 
                                The install banner will automatically appear for users who haven't installed the app yet.
                            </p>
                        </div>
                    </div>
                </div>
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
                    {activeSection === 'templates' && renderTemplatesSection()}
                    {activeSection === 'sport' && renderSportSection()}
                    {activeSection === 'navigation' && renderNavigationSection()}
                    {activeSection === 'banner' && renderBannerSection()}
                    {activeSection === 'content' && renderContentSection()}
                    {activeSection === 'liveview' && renderLiveViewSection()}
                    {activeSection === 'ticker' && renderTickerSection()}
                    {activeSection === 'pwa' && renderPWASection()}
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

            {/* Simple Crop Tool Modal */}
            {showCropTool && (
                <SimpleCropTool
                    imageUrl={cropImageUrl}
                    onCrop={handleCropComplete}
                    onCancel={() => {
                        setShowCropTool(false);
                        setCropImageUrl('');
                    }}
                    targetType={cropTargetType}
                />
            )}
        </div>
    );
});

export default WebsiteDesignManager;