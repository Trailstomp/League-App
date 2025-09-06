import React, { useState, useRef, useEffect } from 'react';
import { LacrosseIcon } from '../LacrosseIcons';
import EnhancedColorPicker from '../EnhancedColorPicker';

// Image Crop Tool Component
const ImageCropTool = ({ imageUrl, onCrop, onCancel, aspectRatio: initialAspectRatio = 'free', targetArea = 'banner' }) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState('');
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

    // Initialize and draw canvas functionality
    const drawCanvas = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply image transformations
        ctx.save();
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

        // Draw resize handles
        const handleSize = 8;
        const handles = [
            { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2 },
            { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y - handleSize/2 },
            { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 },
            { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2 }
        ];

        ctx.fillStyle = '#3b82f6';
        handles.forEach(handle => {
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
        });
    };

    // Initialize image
    useEffect(() => {
        if (imageUrl) {
            setIsLoading(true);
            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                const canvas = canvasRef.current;
                if (canvas) {
                    const container = canvas.parentElement;
                    const maxWidth = Math.min(container.clientWidth - 32, 800);
                    const maxHeight = Math.min(container.clientHeight - 32, 600);
                    
                    const imageAspect = img.width / img.height;
                    let displayWidth, displayHeight;
                    
                    if (imageAspect > maxWidth / maxHeight) {
                        displayWidth = maxWidth;
                        displayHeight = maxWidth / imageAspect;
                    } else {
                        displayHeight = maxHeight;
                        displayWidth = maxHeight * imageAspect;
                    }
                    
                    setImageScale(1);
                    setImagePan({ x: 0, y: 0 });
                    
                    const cropSize = Math.min(displayWidth, displayHeight) * 0.6;
                    let cropWidth = cropSize;
                    let cropHeight = cropSize;
                    
                    const ratioConfig = aspectRatios[currentAspectRatio];
                    if (ratioConfig && ratioConfig.ratio) {
                        cropHeight = cropWidth / ratioConfig.ratio;
                    }
                    
                    const newCropArea = {
                        x: (displayWidth - cropWidth) / 2,
                        y: (displayHeight - cropHeight) / 2,
                        width: cropWidth,
                        height: cropHeight
                    };
                    
                    setCanvasSize({ width: displayWidth, height: displayHeight });
                    setCropArea(newCropArea);
                    setIsLoading(false);
                }
            };
            img.src = imageUrl;
        }
    }, [imageUrl]);

    useEffect(() => {
        drawCanvas();
    }, [cropArea, canvasSize, imageScale, imagePan]);

    const handleCrop = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) return;

        // Create output canvas
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = cropArea.width;
        outputCanvas.height = cropArea.height;
        const ctx = outputCanvas.getContext('2d');

        // Calculate source coordinates
        const scaleX = image.width / canvasSize.width;
        const scaleY = image.height / canvasSize.height;
        
        const sourceX = (cropArea.x - imagePan.x) * scaleX / imageScale;
        const sourceY = (cropArea.y - imagePan.y) * scaleY / imageScale;
        const sourceWidth = cropArea.width * scaleX / imageScale;
        const sourceHeight = cropArea.height * scaleY / imageScale;

        // Draw cropped image
        ctx.drawImage(
            image,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, cropArea.width, cropArea.height
        );

        outputCanvas.toBlob((blob) => {
            if (blob) {
                const croppedUrl = URL.createObjectURL(blob);
                onCrop(croppedUrl);
            }
        }, 'image/jpeg', 0.9);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-white rounded-lg p-8">
                    <div className="text-center">Loading image...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Crop Image for {targetArea}</h3>
                        <div className="flex space-x-2">
                            <select
                                value={currentAspectRatio}
                                onChange={(e) => setCurrentAspectRatio(e.target.value)}
                                className="px-3 py-1 border rounded"
                            >
                                {Object.entries(aspectRatios).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="mb-4" style={{ width: canvasSize.width, height: canvasSize.height }}>
                        <canvas
                            ref={canvasRef}
                            className="border cursor-crosshair"
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>

                    <div className="flex justify-between">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setImageScale(Math.max(0.5, imageScale - 0.1))}
                                className="px-3 py-1 bg-gray-200 rounded"
                            >
                                Zoom Out
                            </button>
                            <button
                                onClick={() => setImageScale(Math.min(3, imageScale + 0.1))}
                                className="px-3 py-1 bg-gray-200 rounded"
                            >
                                Zoom In
                            </button>
                            <button
                                onClick={() => { setImageScale(1); setImagePan({ x: 0, y: 0 }); }}
                                className="px-3 py-1 bg-gray-200 rounded"
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
    const [activeSection, setActiveSection] = useState('theme');
    const [editingStyle, setEditingStyle] = useState(websiteStyle);
    const [showCropTool, setShowCropTool] = useState(false);
    const [cropImageUrl, setCropImageUrl] = useState('');
    const [cropTarget, setCropTarget] = useState('banner');
    const [isEditing, setIsEditing] = useState(false);

    const designSections = [
        { id: 'theme', label: 'Theme & Colors', icon: 'view' },
        { id: 'branding', label: 'Branding & Logos', icon: 'image' },
        { id: 'backgrounds', label: 'Backgrounds & Banners', icon: 'image' },
        { id: 'typography', label: 'Typography & Text', icon: 'text' },
        { id: 'preview', label: 'Live Preview', icon: 'customize' }
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

    const handleSave = () => {
        setWebsiteStyle(editingStyle);
        // Auto-save - no need for edit mode toggle
        console.log('Website style saved:', editingStyle);
    };

    const handleCancel = () => {
        setEditingStyle(websiteStyle);
        setIsEditing(false);
    };

    const handleImageUpload = (file, target) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCropImageUrl(e.target.result);
                setCropTarget(target);
                setShowCropTool(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImageUrl) => {
        setEditingStyle(prev => ({
            ...prev,
            [`${cropTarget}Url`]: croppedImageUrl
        }));
        setShowCropTool(false);
        setCropImageUrl('');
        // Auto-save after crop
        setTimeout(() => handleSave(), 100);
    };

    const toggleBackgroundType = (type) => {
        if (type === 'color') {
            setEditingStyle(prev => ({
                ...prev,
                backgroundType: 'color',
                backgroundImageUrl: ''
            }));
        } else {
            setEditingStyle(prev => ({
                ...prev,
                backgroundType: 'image'
            }));
        }
    };

    const toggleBannerType = (type) => {
        if (type === 'color') {
            setEditingStyle(prev => ({
                ...prev,
                bannerType: 'color',
                bannerImageUrl: ''
            }));
        } else {
            setEditingStyle(prev => ({
                ...prev,
                bannerType: 'image'
            }));
        }
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

    const renderThemeSection = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Pre-built Themes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        onClick={() => toggleBackgroundType('color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.backgroundType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Background
                    </button>
                    <button
                        onClick={() => toggleBackgroundType('image')}
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
                        onClick={() => toggleBannerType('color')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            (editingStyle.bannerType !== 'image') 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                    >
                        Color Banner
                    </button>
                    <button
                        onClick={() => toggleBannerType('image')}
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
                <div className="space-x-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <LacrosseIcon name="edit" className="mr-2" style={{fontSize: '16px'}} />
                            Edit Design
                        </button>
                    )}
                </div>
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
                    {!isEditing ? (
                        <div className="text-center py-8 text-slate-500">
                            <LacrosseIcon name="customize" style={{fontSize: '48px'}} className="mx-auto mb-4 opacity-50" />
                            <p>Click "Edit Design" to customize your website appearance</p>
                        </div>
                    ) : (
                        <>
                            {activeSection === 'theme' && renderThemeSection()}
                            {activeSection === 'branding' && renderBrandingSection()}
                            {activeSection === 'backgrounds' && renderBackgroundsSection()}
                            {activeSection === 'typography' && renderTypographySection()}
                            {activeSection === 'preview' && renderPreviewSection()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebsiteDesignManager;