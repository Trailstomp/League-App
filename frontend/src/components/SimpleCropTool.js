import React, { useState, useRef, useEffect } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

const SimpleCropTool = ({ imageUrl, onCrop, onCancel, targetType = 'banner' }) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 100 });
    const [imageDisplaySize, setImageDisplaySize] = useState({ width: 600, height: 400 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cropScale, setCropScale] = useState(1); // Scale the crop area size, not the image
    const [zoom, setZoom] = useState(1);
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

    // Target-specific aspect ratios
    const aspectRatios = {
        logo: { ratio: 1, label: 'Square Logo' },
        banner: { ratio: 3, label: 'Banner (3:1)' },
        background: { ratio: 16/9, label: 'Background (16:9)' },
        wide_banner: { ratio: 5, label: 'Wide Banner (5:1)' },
        sidebar: { ratio: 9/16, label: 'Sidebar (9:16 Vertical)' },
        navigation: { ratio: 4, label: 'Navigation (4:1)' }
    };

    const targetAspect = aspectRatios[targetType] || aspectRatios.banner;

    // Initialize image and canvas
    useEffect(() => {
        if (!imageUrl) return;
        
        setIsLoading(true);
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            imageRef.current = img;
            
            // Calculate display size (max 800x600)
            const maxWidth = 800;
            const maxHeight = 600;
            const imageAspect = img.width / img.height;
            
            let displayWidth, displayHeight;
            if (imageAspect > maxWidth / maxHeight) {
                displayWidth = maxWidth;
                displayHeight = maxWidth / imageAspect;
            } else {
                displayHeight = maxHeight;
                displayWidth = maxHeight * imageAspect;
            }
            
            setImageDisplaySize({ width: displayWidth, height: displayHeight });
            
            // Set initial crop area based on target type with proper scaling
            const baseCropSize = Math.min(displayWidth, displayHeight) * 0.6;
            let cropWidth = baseCropSize * cropScale;
            let cropHeight = baseCropSize * cropScale;
            
            // Apply aspect ratio to crop area
            if (targetAspect.ratio) {
                if (targetAspect.ratio > 1) {
                    // Wide format (banner, navigation)
                    cropHeight = cropWidth / targetAspect.ratio;
                } else {
                    // Tall format (sidebar) 
                    cropWidth = cropHeight * targetAspect.ratio;
                }
            }
            
            setCropArea({
                x: (displayWidth - cropWidth) / 2,
                y: (displayHeight - cropHeight) / 2,
                width: cropWidth,
                height: cropHeight
            });
            
            setIsLoading(false);
        };
        
        img.onerror = () => {
            setIsLoading(false);
            console.error('Failed to load image for cropping');
            alert('Failed to load image. Please try a different image.');
        };
        
        img.src = imageUrl;
    }, [imageUrl, targetType]);

    // Draw canvas with zoom support
    useEffect(() => {
        if (isLoading || !imageRef.current) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = imageDisplaySize.width;
        canvas.height = imageDisplaySize.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context for zoom and pan transformations
        ctx.save();
        
        // Apply zoom and pan
        ctx.translate(canvas.width / 2 + imageOffset.x, canvas.height / 2 + imageOffset.y);
        ctx.scale(zoom, zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Draw image with transformations
        ctx.drawImage(imageRef.current, 0, 0, imageDisplaySize.width, imageDisplaySize.height);
        
        // Restore context
        ctx.restore();

        // Draw overlay with transparent crop area
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Make crop area transparent
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
        ctx.restore();

        // Draw crop border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        // Draw center crosshair
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        const centerX = cropArea.x + cropArea.width / 2;
        const centerY = cropArea.y + cropArea.height / 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 10, centerY);
        ctx.lineTo(centerX + 10, centerY);
        ctx.moveTo(centerX, centerY - 10);
        ctx.lineTo(centerX, centerY + 10);
        ctx.stroke();

    }, [cropArea, imageDisplaySize, isLoading, zoom, imageOffset]);

    // Handle mouse events for dragging crop area
    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if click is inside crop area
        if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
            y >= cropArea.y && y <= cropArea.y + cropArea.height) {
            setIsDragging(true);
            setDragStart({ 
                x: x - cropArea.x, 
                y: y - cropArea.y 
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newX = Math.max(0, Math.min(x - dragStart.x, imageDisplaySize.width - cropArea.width));
        const newY = Math.max(0, Math.min(y - dragStart.y, imageDisplaySize.height - cropArea.height));
        
        setCropArea(prev => ({
            ...prev,
            x: newX,
            y: newY
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Handle crop operation
    const handleCrop = () => {
        const originalImage = imageRef.current;
        if (!originalImage) {
            console.error('No image available for cropping');
            return;
        }

        try {
            // Create output canvas with target dimensions
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = cropArea.width;
            outputCanvas.height = cropArea.height;
            const ctx = outputCanvas.getContext('2d');

            // Calculate source coordinates on original image with zoom and pan
            const scaleX = originalImage.width / imageDisplaySize.width;
            const scaleY = originalImage.height / imageDisplaySize.height;
            
            // Account for zoom and pan transformations
            const adjustedCropX = (cropArea.x - imageOffset.x - imageDisplaySize.width * (zoom - 1) / 2) / zoom;
            const adjustedCropY = (cropArea.y - imageOffset.y - imageDisplaySize.height * (zoom - 1) / 2) / zoom;
            const adjustedCropWidth = cropArea.width / zoom;
            const adjustedCropHeight = cropArea.height / zoom;
            
            const sourceX = Math.max(0, adjustedCropX * scaleX);
            const sourceY = Math.max(0, adjustedCropY * scaleY);
            const sourceWidth = Math.min(originalImage.width - sourceX, adjustedCropWidth * scaleX);
            const sourceHeight = Math.min(originalImage.height - sourceY, adjustedCropHeight * scaleY);
            
            console.log('🎯 Crop coordinates with zoom:', {
                zoom: zoom,
                imageOffset: imageOffset,
                sourceX: sourceX,
                sourceY: sourceY,
                sourceWidth: sourceWidth,
                sourceHeight: sourceHeight
            });

            // Draw cropped portion
            ctx.drawImage(
                originalImage,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, cropArea.width, cropArea.height
            );

            // Convert to data URL
            outputCanvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        console.log('✅ Crop completed successfully');
                        onCrop(e.target.result);
                    };
                    reader.readAsDataURL(blob);
                } else {
                    console.error('Failed to create blob from cropped canvas');
                    alert('Crop failed. Please try again.');
                }
            }, 'image/jpeg', 0.9);

        } catch (error) {
            console.error('Error during crop:', error);
            alert('Crop failed. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
                <div className="bg-white rounded-lg p-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                        <p>Loading image for cropping...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Crop Image for {targetAspect.label}
                        </h3>
                        <div className="text-sm text-slate-600">
                            Drag the crop area to select the portion you want
                        </div>
                    </div>
                    
                    <div className="mb-4 border rounded overflow-hidden bg-slate-100">
                        <canvas
                            ref={canvasRef}
                            className="cursor-move"
                            style={{ 
                                width: imageDisplaySize.width, 
                                height: imageDisplaySize.height,
                                display: 'block'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    </div>

                    {/* Zoom Controls */}
                    <div className="mb-4">
                        <div className="flex justify-center items-center space-x-4">
                            <button
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                                className="px-3 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors font-medium"
                                disabled={zoom <= 0.5}
                            >
                                🔍- Zoom Out
                            </button>
                            
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-slate-600 w-16 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3"
                                    step="0.1"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="w-32"
                                />
                            </div>
                            
                            <button
                                onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                                className="px-3 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors font-medium"
                                disabled={zoom >= 3}
                            >
                                🔍+ Zoom In
                            </button>
                            
                            <button
                                onClick={() => {
                                    setZoom(1);
                                    setImageOffset({ x: 0, y: 0 });
                                    console.log('🎯 Reset zoom and pan');
                                }}
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                            >
                                Reset View
                            </button>
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <p className="text-sm text-slate-600">
                            Crop area: {cropArea.width} × {cropArea.height} pixels 
                            (aspect ratio: {targetAspect.ratio ? targetAspect.ratio.toFixed(1) : 'free'}:1)
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            💡 Use zoom controls to get closer to the area you want, then drag to position
                        </p>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCrop}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                        >
                            <LacrosseIcon name="save" className="mr-2" style={{fontSize: '16px'}} />
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleCropTool;