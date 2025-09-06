import React, { useState, useRef, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import EnhancedColorPicker from '../EnhancedColorPicker';
import ColorExtractor from '../ColorExtractor';

// Fixed Image Crop Tool Component
const ImageCropTool = ({ imageUrl, onCrop, onCancel, aspectRatio: initialAspectRatio = 'free', targetArea = 'banner' }) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0 });
    const [currentAspectRatio, setCurrentAspectRatio] = useState(initialAspectRatio || 'free');
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
    const [imageScale, setImageScale] = useState(1);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });

    // Target-specific aspect ratios
    const getAspectRatiosForTarget = (target) => {
        const common = {
            'free': { ratio: null, label: 'Free Form' },
            '1:1': { ratio: 1, label: '1:1 Square' },
            '16:9': { ratio: 16/9, label: '16:9 Wide' },
            '4:3': { ratio: 4/3, label: '4:3 Standard' }
        };

        switch(target) {
            case 'banner':
                return {
                    ...common,
                    '5:1': { ratio: 5/1, label: '5:1 Header Banner' },
                    '3:1': { ratio: 3/1, label: '3:1 Wide Banner' },
                    '2:1': { ratio: 2/1, label: '2:1 Banner' }
                };
            case 'logo':
                return {
                    ...common,
                    '2:1': { ratio: 2/1, label: '2:1 Wide Logo' }
                };
            case 'background':
                return {
                    ...common,
                    '21:9': { ratio: 21/9, label: '21:9 Ultra Wide' }
                };
            default:
                return common;
        }
    };

    const aspectRatios = getAspectRatiosForTarget(targetArea);

    // Fixed canvas drawing
    const drawCanvas = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image || isLoading) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context for image transformations
        ctx.save();
        
        // Apply transformations
        ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
        ctx.scale(imageScale, imageScale);
        ctx.translate(-canvasSize.width / 2 + imagePan.x, -canvasSize.height / 2 + imagePan.y);

        // Draw image
        ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);
        ctx.restore();

        // Draw crop overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Clear crop area
        ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        // Draw crop border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        // Draw corner handles
        const handleSize = 10;
        ctx.fillStyle = '#3b82f6';
        [
            [cropArea.x - handleSize/2, cropArea.y - handleSize/2],
            [cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2],
            [cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2],
            [cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2]
        ].forEach(([x, y]) => {
            ctx.fillRect(x, y, handleSize, handleSize);
        });
    };

    // Fixed image initialization
    useEffect(() => {
        if (!imageUrl) return;
        
        setIsLoading(true);
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            imageRef.current = img;
            
            // Calculate display size
            const maxWidth = 600;
            const maxHeight = 400;
            const imageAspect = img.width / img.height;
            
            let displayWidth, displayHeight;
            if (imageAspect > maxWidth / maxHeight) {
                displayWidth = maxWidth;
                displayHeight = maxWidth / imageAspect;
            } else {
                displayHeight = maxHeight;
                displayWidth = maxHeight * imageAspect;
            }
            
            setCanvasSize({ width: displayWidth, height: displayHeight });
            setImageScale(1);
            setImagePan({ x: 0, y: 0 });
            
            // Set initial crop area
            const cropSize = Math.min(displayWidth, displayHeight) * 0.6;
            setCropArea({
                x: (displayWidth - cropSize) / 2,
                y: (displayHeight - cropSize) / 2,
                width: cropSize,
                height: cropSize
            });
            
            setIsLoading(false);
        };
        
        img.onerror = () => {
            setIsLoading(false);
            console.error('Failed to load image for cropping');
        };
        
        img.src = imageUrl;
    }, [imageUrl]);

    // Redraw when crop area changes
    useEffect(() => {
        if (!isLoading) {
            drawCanvas();
        }
    }, [cropArea, canvasSize, imageScale, imagePan, isLoading]);

    // Fixed crop handler
    const handleCrop = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) {
            console.error('Canvas or image not available for cropping');
            return;
        }

        try {
            // Create output canvas
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = cropArea.width;
            outputCanvas.height = cropArea.height;
            const ctx = outputCanvas.getContext('2d');

            // Calculate source coordinates accounting for transformations
            const scaleX = image.width / canvasSize.width;
            const scaleY = image.height / canvasSize.height;
            
            const sourceX = Math.max(0, (cropArea.x - imagePan.x) * scaleX / imageScale);
            const sourceY = Math.max(0, (cropArea.y - imagePan.y) * scaleY / imageScale);
            const sourceWidth = Math.min(image.width - sourceX, cropArea.width * scaleX / imageScale);
            const sourceHeight = Math.min(image.height - sourceY, cropArea.height * scaleY / imageScale);

            // Draw cropped portion
            ctx.drawImage(
                image,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, cropArea.width, cropArea.height
            );

            // Convert to blob and create URL
            outputCanvas.toBlob((blob) => {
                if (blob) {
                    const croppedUrl = URL.createObjectURL(blob);
                    console.log('✅ Image cropped successfully:', croppedUrl);
                    onCrop(croppedUrl);
                } else {
                    console.error('Failed to create blob from cropped canvas');
                }
            }, 'image/jpeg', 0.9);
            
        } catch (error) {
            console.error('Error during image cropping:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-white rounded-lg p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        Loading image...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Crop Image for {targetArea}</h3>
                        <div className="flex space-x-2">
                            <select
                                value={currentAspectRatio}
                                onChange={(e) => setCurrentAspectRatio(e.target.value)}
                                className="px-3 py-1 border rounded text-sm"
                            >
                                {Object.entries(aspectRatios).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-4 border rounded overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            className="cursor-crosshair max-w-full"
                            style={{ width: canvasSize.width, height: canvasSize.height }}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setImageScale(Math.max(0.5, imageScale - 0.1))}
                                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                            >
                                Zoom Out
                            </button>
                            <button
                                onClick={() => setImageScale(Math.min(3, imageScale + 0.1))}
                                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                            >
                                Zoom In
                            </button>
                            <button
                                onClick={() => { setImageScale(1); setImagePan({ x: 0, y: 0 }); }}
                                className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCrop}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                                Apply Crop
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WebsiteDesignManager = ({ websiteStyle = {}, setWebsiteStyle }) => {
    const [activeSection, setActiveSection] = useState('navigation');
    const [editingStyle, setEditingStyle] = useState({
        // Navigation Zone
        navBackgroundType: 'color',
        navBackgroundColor: '#ffffff',
        navBackgroundImage: '',
        navTextColor: '#374151',
        navFont: 'Inter, sans-serif',
        navFontSize: '16px',
        navLeagueName: 'Your League Name',
        navLogoUrl: '',
        
        // Banner Zone  
        bannerBackgroundType: 'color',
        bannerBackgroundColor: '#1e40af',
        bannerBackgroundImage: '',
        bannerTextColor: '#ffffff',
        bannerFont: 'Inter, sans-serif',
        bannerFontSize: '32px',
        bannerTitle: 'Welcome to Our League',
        bannerSubtitle: 'Professional Competition',
        
        // Main Content Zone
        mainBackgroundType: 'color',
        mainBackgroundColor: '#f8fafc',
        mainBackgroundImage: '',
        mainTextColor: '#374151',
        mainFont: 'Inter, sans-serif',
        mainFontSize: '16px',
        
        // Menu Zone
        menuBackgroundType: 'color',
        menuBackgroundColor: '#ffffff',
        menuBackgroundImage: '',
        menuTextColor: '#374151',
        menuFont: 'Inter, sans-serif',
        menuFontSize: '16px',
        
        // Theme colors
        primaryColor: '#1e40af',
        accentColor: '#3b82f6',
        
        ...websiteStyle
    });
    
    const [showCropTool, setShowCropTool] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState('');
    const [cropTarget, setCropTarget] = useState('banner');
    const [showColorExtractor, setShowColorExtractor] = useState(false);
    const [extractImageUrl, setExtractImageUrl] = useState('');

    const designSections = [
        { id: 'navigation', label: 'Navigation Bar', icon: 'players', description: 'Header navigation and logo area' },
        { id: 'banner', label: 'Top Banner', icon: 'image', description: 'Main banner/hero section' },
        { id: 'content', label: 'Main Content', icon: 'text', description: 'Page background and content text' },
        { id: 'menus', label: 'Menus & Sidebar', icon: 'settings', description: 'Menu styling and sidebar' },
        { id: 'preview', label: 'Live Preview', icon: 'customize', description: 'See all changes applied' }
    ];

    const themes = [
        { id: 'professional', name: 'Professional', colors: { primary: '#1e40af', accent: '#3b82f6', background: '#f8fafc' } },
        { id: 'sport', name: 'Sport Dynamic', colors: { primary: '#dc2626', accent: '#ef4444', background: '#fef2f2' } },
        { id: 'modern', name: 'Modern Clean', colors: { primary: '#059669', accent: '#10b981', background: '#ecfdf5' } },
        { id: 'classic', name: 'Classic Blue', colors: { primary: '#2563eb', accent: '#3b82f6', background: '#eff6ff' } },
        { id: 'dark', name: 'Dark Mode', colors: { primary: '#6366f1', accent: '#8b5cf6', background: '#1e293b' } }
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

    // Enhanced save functionality with API integration
    const handleSave = async () => {
        try {
            console.log('🎨 Saving website style...', editingStyle);
            
            // Update parent state
            setWebsiteStyle(editingStyle);
            
            // Save to backend API
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
            const response = await fetch(`${backendUrl}/api/league-data/websiteStyle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingStyle)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Website style saved successfully:', result);
                
                // Show temporary success message
                const originalSaveText = 'Save Changes';
                document.querySelector('[data-save-button]').textContent = 'Saved!';
                setTimeout(() => {
                    const saveButton = document.querySelector('[data-save-button]');
                    if (saveButton) saveButton.textContent = originalSaveText;
                }, 2000);
            } else {
                console.error('❌ Failed to save website style:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Error saving website style:', error);
        }
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
                backgroundColor: colors[2]
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
        setEditingStyle(prev => ({ ...prev, ...updates }));
        setTimeout(() => handleSave(), 500);
    };

    const handleThemeSelect = (theme) => {
        setEditingStyle({
            ...editingStyle,
            theme: theme.id,
            primaryColor: theme.colors.primary,
            accentColor: theme.colors.accent,
            backgroundColor: theme.colors.background
        });
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

    const renderThemeSection = () => (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Quick Theme Selection</h3>
                <p className="text-slate-600 text-sm">Choose from pre-built themes or extract colors from your images</p>
            </div>

            <div>
                <h4 className="text-md font-semibold text-slate-800 mb-4">Pre-built Themes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { id: 'professional', name: 'Professional', colors: { primary: '#1e40af', accent: '#3b82f6', background: '#f8fafc' } },
                        { id: 'sport', name: 'Sport Dynamic', colors: { primary: '#dc2626', accent: '#ef4444', background: '#fef2f2' } },
                        { id: 'modern', name: 'Modern Clean', colors: { primary: '#059669', accent: '#10b981', background: '#ecfdf5' } },
                        { id: 'classic', name: 'Classic Blue', colors: { primary: '#2563eb', accent: '#3b82f6', background: '#eff6ff' } },
                        { id: 'dark', name: 'Dark Mode', colors: { primary: '#6366f1', accent: '#8b5cf6', background: '#1e293b' } }
                    ].map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => updateStyle({
                                primaryColor: theme.colors.primary,
                                accentColor: theme.colors.accent,
                                navBackgroundColor: theme.colors.background,
                                mainBackgroundColor: theme.colors.background,
                                bannerBackgroundColor: theme.colors.primary
                            })}
                            className={`p-4 border-2 rounded-lg text-left transition-colors hover:border-blue-300`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-800">{theme.name}</h4>
                            </div>
                            <div className="flex space-x-2">
                                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.primary }}></div>
                                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.accent }}></div>
                                <div className="w-8 h-8 rounded border" style={{ backgroundColor: theme.colors.background }}></div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Extraction */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Smart Color Extraction</h4>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                    <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                    <p className="text-slate-600 mb-3">Upload an image to extract colors for your theme</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleColorExtraction(e.target.files[0], 'theme')}
                        className="hidden"
                        id="color-extract-upload"
                    />
                    <label 
                        htmlFor="color-extract-upload"
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                    >
                        Extract Colors from Image
                    </label>
                </div>
            </div>

            {/* Current Colors */}
            <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-slate-800 mb-4">Current Theme Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.primaryColor || '#1e40af'}
                            onChange={(color) => updateStyle({ primaryColor: color })}
                            label="Primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.accentColor || '#3b82f6'}
                            onChange={(color) => updateStyle({ accentColor: color })}
                            label="Accent"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Theme Preview</h3>
                <div 
                    className="border rounded-lg p-6 min-h-32"
                    style={{ 
                        backgroundColor: editingStyle.mainBackgroundColor || '#f8fafc'
                    }}
                >
                    <h4 className="text-xl font-bold mb-2" style={{ color: editingStyle.primaryColor }}>
                        Sample Header
                    </h4>
                    <p className="text-slate-600 mb-3">This preview shows your current color theme in action.</p>
                    <button 
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: editingStyle.accentColor || '#3b82f6' }}
                    >
                        Sample Button
                    </button>
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
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            onClick={() => handleThemeSelect(theme)}
                            className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                editingStyle.theme === theme.id 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-slate-800">{theme.name}</h4>
                                {editingStyle.theme === theme.id && (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.primary }}></div>
                                <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.colors.accent }}></div>
                                <div className="w-8 h-8 rounded border" style={{ backgroundColor: theme.colors.background }}></div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Custom Colors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Primary Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.primaryColor || '#1e40af'}
                            onChange={(color) => setEditingStyle({...editingStyle, primaryColor: color})}
                            label="Primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Accent Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.accentColor || '#3b82f6'}
                            onChange={(color) => setEditingStyle({...editingStyle, accentColor: color})}
                            label="Accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.backgroundColor || '#f8fafc'}
                            onChange={(color) => setEditingStyle({...editingStyle, backgroundColor: color})}
                            label="Background"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Preview</h3>
                <div 
                    className="border rounded-lg p-6 min-h-32"
                    style={{ 
                        backgroundColor: editingStyle.backgroundColor || '#f8fafc',
                        color: editingStyle.primaryColor || '#1e40af'
                    }}
                >
                    <h4 className="text-xl font-bold mb-2" style={{ color: editingStyle.primaryColor }}>
                        Sample Header
                    </h4>
                    <p className="text-slate-600 mb-3">This is how your website content will look with the selected colors.</p>
                    <button 
                        className="px-4 py-2 rounded-lg text-white"
                        style={{ backgroundColor: editingStyle.accentColor || '#3b82f6' }}
                    >
                        Sample Button
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBrandingSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">League Branding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">League Name</label>
                        <input
                            type="text"
                            value={editingStyle.leagueName || ''}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, leagueName: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Midwest Lacrosse League"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Tagline</label>
                        <input
                            type="text"
                            value={editingStyle.tagline || ''}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, tagline: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Professional Competition"
                        />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Logo & Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* League Logo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            League Logo
                            <span className="text-xs text-slate-500 ml-2">(appears in header and navigation)</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                            {editingStyle.logoUrl ? (
                                <div>
                                    <img src={editingStyle.logoUrl} alt="League Logo" className="w-20 h-20 mx-auto mb-3 object-contain" />
                                    <div className="flex justify-center space-x-2">
                                        <button 
                                            onClick={() => setEditingStyle({...editingStyle, logoUrl: ''})}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove Logo
                                        </button>
                                        <span className="text-slate-400">|</span>
                                        <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                            Replace Logo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                    <p className="text-slate-600 mb-3">Upload league logo</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label 
                                        htmlFor="logo-upload"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        Choose File & Crop
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Banner Image */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Banner Image
                            <span className="text-xs text-slate-500 ml-2">(appears in page headers)</span>
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                            {editingStyle.bannerUrl ? (
                                <div>
                                    <img src={editingStyle.bannerUrl} alt="Banner" className="w-full h-20 mx-auto mb-3 object-cover rounded" />
                                    <div className="flex justify-center space-x-2">
                                        <button 
                                            onClick={() => setEditingStyle({...editingStyle, bannerUrl: ''})}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove Banner
                                        </button>
                                        <span className="text-slate-400">|</span>
                                        <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                            Replace Banner
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                    <p className="text-slate-600 mb-3">Upload banner image</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e.target.files[0], 'banner')}
                                        className="hidden"
                                        id="banner-upload"
                                    />
                                    <label 
                                        htmlFor="banner-upload"
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                    >
                                        Choose File & Crop
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Preview of Logo/Banner Placement */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Logo & Banner Preview</h3>
                <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-100 p-4 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded border flex items-center justify-center">
                                {editingStyle.logoUrl ? (
                                    <img src={editingStyle.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <LacrosseIcon name="image" className="text-slate-400" style={{fontSize: '16px'}} />
                                )}
                            </div>
                            <span className="font-medium text-slate-700">
                                {editingStyle.leagueName || 'Your League Name'} • Header Logo
                            </span>
                        </div>
                    </div>
                    <div className="relative h-32 bg-gradient-to-r from-slate-600 to-slate-800 flex items-center justify-center">
                        {editingStyle.bannerUrl ? (
                            <img src={editingStyle.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center text-white">
                                <h2 className="text-2xl font-bold mb-1">{editingStyle.leagueName || 'Your League Name'}</h2>
                                <p className="text-slate-200">{editingStyle.tagline || 'Your tagline here'}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBackgroundsSection = () => (
        <div className="space-y-6">
            {/* Page Background */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Page Background</h3>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('main', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.backgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('main', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.backgroundType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Background
                    </button>
                </div>

                {editingStyle.backgroundType === 'image' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                        {editingStyle.backgroundImageUrl ? (
                            <div>
                                <img src={editingStyle.backgroundImageUrl} alt="Background" className="w-full h-32 mx-auto mb-3 object-cover rounded" />
                                <div className="flex justify-center space-x-2">
                                    <button 
                                        onClick={() => setEditingStyle({...editingStyle, backgroundImageUrl: ''})}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Remove Background
                                    </button>
                                    <span className="text-slate-400">|</span>
                                    <label className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
                                        Replace Background
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e.target.files[0], 'backgroundImage')}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <LacrosseIcon name="image" className="mx-auto mb-3 text-slate-400" style={{fontSize: '48px'}} />
                                <p className="text-slate-600 mb-3">Upload background image</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e.target.files[0], 'backgroundImage')}
                                    className="hidden"
                                    id="background-upload"
                                />
                                <label 
                                    htmlFor="background-upload"
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
                            color={editingStyle.backgroundColor || '#f8fafc'}
                            onChange={(color) => {
                                setEditingStyle({...editingStyle, backgroundColor: color});
                                setTimeout(() => handleSave(), 500);
                            }}
                            label="Background"
                        />
                    </div>
                )}
            </div>

            {/* Banner Styling */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Banner Styling</h3>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => toggleBackgroundType('banner', 'color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.bannerType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Banner
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('banner', 'image')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.bannerType === 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Image Banner
                    </button>
                </div>

                {editingStyle.bannerType === 'image' ? (
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                        Banner image is configured in the Branding section above. Use this section to set banner text styling.
                    </p>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Banner Background Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.bannerColor || '#1e40af'}
                            onChange={(color) => {
                                setEditingStyle({...editingStyle, bannerColor: color});
                                setTimeout(() => handleSave(), 500);
                            }}
                            label="Banner Background"
                        />
                    </div>
                )}
            </div>

            {/* Background Preview */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Background Preview</h3>
                <div 
                    className="border rounded-lg p-6 min-h-40 flex items-center justify-center"
                    style={{ 
                        backgroundColor: editingStyle.backgroundType === 'image' ? 'transparent' : (editingStyle.backgroundColor || '#f8fafc'),
                        backgroundImage: editingStyle.backgroundType === 'image' && editingStyle.backgroundImageUrl 
                            ? `url(${editingStyle.backgroundImageUrl})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="text-center p-6 bg-white bg-opacity-90 rounded-lg">
                        <h4 className="text-xl font-bold mb-2">Sample Content</h4>
                        <p className="text-slate-600">This shows how your background will look behind content</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMenusSection = () => (
        <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Menus & Sidebar Zone</h3>
                <p className="text-purple-600 text-sm">Customize menu styling, sidebar appearance, and navigation elements</p>
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
                    className="border rounded-lg p-4"
                    style={{
                        backgroundColor: editingStyle.menuBackgroundType === 'image' ? 'transparent' : (editingStyle.menuBackgroundColor || '#ffffff'),
                        backgroundImage: editingStyle.menuBackgroundType === 'image' && editingStyle.menuBackgroundImage 
                            ? `url(${editingStyle.menuBackgroundImage})` 
                            : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <div className="space-y-2">
                        <div 
                            className="p-2 rounded hover:bg-slate-100 cursor-pointer"
                            style={{ 
                                fontFamily: editingStyle.menuFont || 'Inter, sans-serif',
                                fontSize: editingStyle.menuFontSize || '16px',
                                color: editingStyle.menuTextColor || '#374151'
                            }}
                        >
                            📊 Dashboard
                        </div>
                        <div 
                            className="p-2 rounded hover:bg-slate-100 cursor-pointer"
                            style={{ 
                                fontFamily: editingStyle.menuFont || 'Inter, sans-serif',
                                fontSize: editingStyle.menuFontSize || '16px',
                                color: editingStyle.menuTextColor || '#374151'
                            }}
                        >
                            👥 Teams
                        </div>
                        <div 
                            className="p-2 rounded hover:bg-slate-100 cursor-pointer"
                            style={{ 
                                fontFamily: editingStyle.menuFont || 'Inter, sans-serif',
                                fontSize: editingStyle.menuFontSize || '16px',
                                color: editingStyle.menuTextColor || '#374151'
                            }}
                        >
                            📅 Schedule
                        </div>
                        <div 
                            className="p-2 rounded hover:bg-slate-100 cursor-pointer"
                            style={{ 
                                fontFamily: editingStyle.menuFont || 'Inter, sans-serif',
                                fontSize: editingStyle.menuFontSize || '16px',
                                color: editingStyle.menuTextColor || '#374151'
                            }}
                        >
                            🏆 Standings
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTypographySection = () => (
        <div className="space-y-6">
            {/* Banner Text Styling */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Banner Text</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Family</label>
                        <select
                            value={editingStyle.bannerFont || 'Inter, sans-serif'}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, bannerFont: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                        <select
                            value={editingStyle.bannerFontSize || '32px'}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, bannerFontSize: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            onChange={(color) => {
                                setEditingStyle({...editingStyle, bannerTextColor: color});
                                setTimeout(() => handleSave(), 500);
                            }}
                            label="Banner Text"
                        />
                    </div>
                </div>
            </div>

            {/* Content Text Styling */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Content Text</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Family</label>
                        <select
                            value={editingStyle.contentFont || 'Inter, sans-serif'}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, contentFont: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                        <select
                            value={editingStyle.contentFontSize || '16px'}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, contentFontSize: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {fontSizes.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.contentTextColor || '#374151'}
                            onChange={(color) => {
                                setEditingStyle({...editingStyle, contentTextColor: color});
                                setTimeout(() => handleSave(), 500);
                            }}
                            label="Content Text"
                        />
                    </div>
                </div>
            </div>

            {/* Heading Text Styling */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Heading Text</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Family</label>
                        <select
                            value={editingStyle.headingFont || 'Inter, sans-serif'}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, headingFont: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {fontFamilies.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Font Size</label>
                        <select
                            value={editingStyle.headingFontSize || '24px'}
                            onChange={(e) => {
                                setEditingStyle({...editingStyle, headingFontSize: e.target.value});
                                setTimeout(() => handleSave(), 500);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            {fontSizes.map(size => (
                                <option key={size.value} value={size.value}>{size.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Text Color</label>
                        <EnhancedColorPicker
                            color={editingStyle.headingTextColor || '#1f2937'}
                            onChange={(color) => {
                                setEditingStyle({...editingStyle, headingTextColor: color});
                                setTimeout(() => handleSave(), 500);
                            }}
                            label="Heading Text"
                        />
                    </div>
                </div>
            </div>

            {/* Typography Preview */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Typography Preview</h3>
                <div className="border rounded-lg p-6 space-y-4">
                    {/* Banner Text Sample */}
                    <div 
                        className="p-4 rounded-lg text-center"
                        style={{ 
                            backgroundColor: editingStyle.bannerColor || '#1e40af',
                            fontFamily: editingStyle.bannerFont || 'Inter, sans-serif',
                            fontSize: editingStyle.bannerFontSize || '32px',
                            color: editingStyle.bannerTextColor || '#ffffff'
                        }}
                    >
                        {editingStyle.leagueName || 'Your League Name'}
                    </div>
                    
                    {/* Heading Sample */}
                    <h2 
                        style={{ 
                            fontFamily: editingStyle.headingFont || 'Inter, sans-serif',
                            fontSize: editingStyle.headingFontSize || '24px',
                            color: editingStyle.headingTextColor || '#1f2937'
                        }}
                    >
                        Sample Heading Text
                    </h2>
                    
                    {/* Content Sample */}
                    <p 
                        style={{ 
                            fontFamily: editingStyle.contentFont || 'Inter, sans-serif',
                            fontSize: editingStyle.contentFontSize || '16px',
                            color: editingStyle.contentTextColor || '#374151'
                        }}
                    >
                        This is how your content text will appear throughout the website. You can customize the font family, size, and color to match your league's branding.
                    </p>
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
                    <div className="bg-slate-100 border-b p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {editingStyle.logoUrl ? (
                                    <img src={editingStyle.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 bg-slate-300 rounded flex items-center justify-center">
                                        <LacrosseIcon name="image" style={{fontSize: '16px'}} className="text-slate-500" />
                                    </div>
                                )}
                                <span className="font-semibold" style={{ fontFamily: editingStyle.contentFont }}>
                                    {editingStyle.leagueName || 'Your League Name'}
                                </span>
                            </div>
                            <nav className="flex space-x-4 text-sm">
                                <span>Home</span>
                                <span>Teams</span>
                                <span>Schedule</span>
                                <span>Standings</span>
                            </nav>
                        </div>
                    </div>

                    {/* Banner Preview */}
                    <div 
                        className="relative h-48 flex items-center justify-center"
                        style={{
                            backgroundColor: editingStyle.bannerType === 'image' ? 'transparent' : (editingStyle.bannerColor || '#1e40af'),
                            backgroundImage: editingStyle.bannerType === 'image' && editingStyle.bannerUrl 
                                ? `url(${editingStyle.bannerUrl})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="text-center">
                            <h1 
                                className="text-4xl font-bold mb-2"
                                style={{ 
                                    fontFamily: editingStyle.bannerFont || 'Inter, sans-serif',
                                    fontSize: editingStyle.bannerFontSize || '32px',
                                    color: editingStyle.bannerTextColor || '#ffffff'
                                }}
                            >
                                {editingStyle.leagueName || 'Your League Name'}
                            </h1>
                            <p 
                                className="text-lg"
                                style={{ 
                                    fontFamily: editingStyle.contentFont || 'Inter, sans-serif',
                                    color: editingStyle.bannerTextColor || '#ffffff'
                                }}
                            >
                                {editingStyle.tagline || 'Your tagline here'}
                            </p>
                        </div>
                    </div>

                    {/* Content Preview */}
                    <div 
                        className="p-6"
                        style={{
                            backgroundColor: editingStyle.backgroundType === 'image' ? 'rgba(255,255,255,0.9)' : (editingStyle.backgroundColor || '#f8fafc'),
                            backgroundImage: editingStyle.backgroundType === 'image' && editingStyle.backgroundImageUrl 
                                ? `url(${editingStyle.backgroundImageUrl})` 
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <h2 
                            className="text-2xl font-bold mb-4"
                            style={{ 
                                fontFamily: editingStyle.headingFont || 'Inter, sans-serif',
                                fontSize: editingStyle.headingFontSize || '24px',
                                color: editingStyle.headingTextColor || '#1f2937'
                            }}
                        >
                            Welcome to Our League
                        </h2>
                        <p 
                            style={{ 
                                fontFamily: editingStyle.contentFont || 'Inter, sans-serif',
                                fontSize: editingStyle.contentFontSize || '16px',
                                color: editingStyle.contentTextColor || '#374151'
                            }}
                        >
                            This is a preview of how your website will look with the current design settings. Your league's branding, colors, and typography choices are displayed throughout the site.
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
                    {activeSection === 'content' && renderBackgroundsSection()}
                    {activeSection === 'menus' && renderMenusSection()}
                    {activeSection === 'preview' && renderPreviewSection()}
                </div>
            </div>

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