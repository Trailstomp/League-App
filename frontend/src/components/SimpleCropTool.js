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
        square: { ratio: 1, label: 'Square (1:1)' },
        banner: { ratio: 3, label: 'Banner (3:1)' },
        background: { ratio: 16/9, label: 'Background (16:9)' },
        wide_banner: { ratio: 5, label: 'Wide Banner (5:1)' },
        navigation: { ratio: 9/16, label: 'Navigation (9:16 Vertical)' }, // Fixed: nav should be vertical
        sidebar: { ratio: 9/16, label: 'Sidebar (9:16 Vertical)' }
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

    // Draw canvas with crop space scaling
    useEffect(() => {
        if (isLoading || !imageRef.current) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = imageDisplaySize.width;
        canvas.height = imageDisplaySize.height;

        // Clear canvas and draw image at normal size
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageRef.current, 0, 0, imageDisplaySize.width, imageDisplaySize.height);

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
        ctx.lineWidth = 3;
        ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

        // Draw corner handles
        const handleSize = 12;
        ctx.fillStyle = '#3b82f6';
        [
            [cropArea.x - handleSize/2, cropArea.y - handleSize/2],
            [cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2],
            [cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2],
            [cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2]
        ].forEach(([x, y]) => {
            ctx.fillRect(x, y, handleSize, handleSize);
        });

        // Draw center crosshair
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        const centerX = cropArea.x + cropArea.width / 2;
        const centerY = cropArea.y + cropArea.height / 2;
        ctx.beginPath();
        ctx.moveTo(centerX - 15, centerY);
        ctx.lineTo(centerX + 15, centerY);
        ctx.moveTo(centerX, centerY - 15);
        ctx.lineTo(centerX, centerY + 15);
        ctx.stroke();

    }, [cropArea, imageDisplaySize, isLoading, cropScale]);

    // Helper to get coords from mouse or touch event
    const getEventCoords = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if (e.touches && e.touches.length > 0) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // Handle mouse/touch events for dragging crop area AND resizing with handles
    const handlePointerDown = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const { x, y } = getEventCoords(e, canvas);
        
        // Check if click is on resize handles (corners)
        const handleSize = 20; // Larger hit area for touch
        const handles = [
            { x: cropArea.x - handleSize/2, y: cropArea.y - handleSize/2, type: 'nw' },
            { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y - handleSize/2, type: 'ne' },
            { x: cropArea.x - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2, type: 'sw' },
            { x: cropArea.x + cropArea.width - handleSize/2, y: cropArea.y + cropArea.height - handleSize/2, type: 'se' }
        ];
        
        // Check if clicking on a handle
        for (const handle of handles) {
            if (x >= handle.x && x <= handle.x + handleSize &&
                y >= handle.y && y <= handle.y + handleSize) {
                setIsDragging(handle.type);
                setDragStart({ x, y });
                return;
            }
        }
        
        // Check if click is inside crop area for dragging
        if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
            y >= cropArea.y && y <= cropArea.y + cropArea.height) {
            setIsDragging('move');
            setDragStart({ 
                x: x - cropArea.x, 
                y: y - cropArea.y 
            });
        }
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const canvas = canvasRef.current;
        const { x, y } = getEventCoords(e, canvas);
        
        if (isDragging === 'move') {
            const newX = Math.max(0, Math.min(x - dragStart.x, imageDisplaySize.width - cropArea.width));
            const newY = Math.max(0, Math.min(y - dragStart.y, imageDisplaySize.height - cropArea.height));
            
            setCropArea(prev => ({
                ...prev,
                x: newX,
                y: newY
            }));
        } else {
            const deltaX = x - dragStart.x;
            const deltaY = y - dragStart.y;
            
            setCropArea(prev => {
                let newArea = { ...prev };
                
                if (isDragging.includes('e')) {
                    newArea.width = Math.max(50, prev.width + deltaX);
                }
                if (isDragging.includes('w')) {
                    const newWidth = Math.max(50, prev.width - deltaX);
                    newArea.x = prev.x + prev.width - newWidth;
                    newArea.width = newWidth;
                }
                if (isDragging.includes('s')) {
                    newArea.height = Math.max(30, prev.height + deltaY);
                }
                if (isDragging.includes('n')) {
                    const newHeight = Math.max(30, prev.height - deltaY);
                    newArea.y = prev.y + prev.height - newHeight;
                    newArea.height = newHeight;
                }
                
                if (targetAspect.ratio) {
                    if (newArea.width !== prev.width) {
                        newArea.height = newArea.width / targetAspect.ratio;
                    } else if (newArea.height !== prev.height) {
                        newArea.width = newArea.height * targetAspect.ratio;
                    }
                }
                
                newArea.x = Math.max(0, Math.min(newArea.x, imageDisplaySize.width - newArea.width));
                newArea.y = Math.max(0, Math.min(newArea.y, imageDisplaySize.height - newArea.height));
                
                return newArea;
            });
            
            setDragStart({ x, y });
        }
    };

    const handlePointerUp = () => {
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
            // Calculate source coordinates on original image
            const scaleX = originalImage.width / imageDisplaySize.width;
            const scaleY = originalImage.height / imageDisplaySize.height;
            
            const sourceX = cropArea.x * scaleX;
            const sourceY = cropArea.y * scaleY;
            const sourceWidth = cropArea.width * scaleX;
            const sourceHeight = cropArea.height * scaleY;

            // Minimum output resolutions per target type for crisp results
            const minOutputWidths = {
                banner: 1920,
                wide_banner: 1920,
                background: 1920,
                navigation: 800,
                sidebar: 800,
                logo: 512,
                square: 512
            };
            const minWidth = minOutputWidths[targetType] || 1200;

            // Use source (original) dimensions for output — this preserves full resolution
            // If the source crop is smaller than our minimum, scale up to minimum
            let outputWidth = Math.round(sourceWidth);
            let outputHeight = Math.round(sourceHeight);
            
            if (outputWidth < minWidth) {
                const upscale = minWidth / outputWidth;
                outputWidth = minWidth;
                outputHeight = Math.round(outputHeight * upscale);
            }

            // Create output canvas at full resolution
            const outputCanvas = document.createElement('canvas');
            outputCanvas.width = outputWidth;
            outputCanvas.height = outputHeight;
            const ctx = outputCanvas.getContext('2d');

            // Use high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw cropped portion at full resolution
            ctx.drawImage(
                originalImage,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, outputWidth, outputHeight
            );

            // Convert to data URL at high quality
            outputCanvas.toBlob((blob) => {
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        console.log('Crop completed:', outputWidth, 'x', outputHeight, 'px');
                        onCrop(e.target.result);
                    };
                    reader.readAsDataURL(blob);
                } else {
                    console.error('Failed to create blob from cropped canvas');
                    alert('Crop failed. Please try again.');
                }
            }, 'image/jpeg', 0.95);

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div className="p-3 sm:p-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm sm:text-lg font-semibold">
                            Crop for {targetAspect.label}
                        </h3>
                        <div className="text-xs text-slate-600 hidden sm:block">
                            Drag to position &bull; Drag corners to resize
                        </div>
                    </div>
                    
                    <div className="mb-4 border rounded overflow-hidden bg-slate-100">
                        <canvas
                            ref={canvasRef}
                            className="cursor-move touch-none"
                            style={{ 
                                width: '100%', 
                                maxWidth: imageDisplaySize.width,
                                height: 'auto',
                                aspectRatio: `${imageDisplaySize.width} / ${imageDisplaySize.height}`,
                                display: 'block'
                            }}
                            onMouseDown={handlePointerDown}
                            onMouseMove={handlePointerMove}
                            onMouseUp={handlePointerUp}
                            onMouseLeave={handlePointerUp}
                            onTouchStart={handlePointerDown}
                            onTouchMove={handlePointerMove}
                            onTouchEnd={handlePointerUp}
                            onTouchCancel={handlePointerUp}
                        />
                    </div>

                    <div className="text-center mb-4">
                        <p className="text-sm text-slate-600">
                            Output: {Math.round(cropArea.width * (imageRef.current ? imageRef.current.width / imageDisplaySize.width : 1))} × {Math.round(cropArea.height * (imageRef.current ? imageRef.current.height / imageDisplaySize.height : 1))}px
                            {targetAspect.ratio ? ` (${targetAspect.ratio > 1 ? targetAspect.ratio.toFixed(0) : '1'}:${targetAspect.ratio > 1 ? '1' : (1/targetAspect.ratio).toFixed(0)})` : ''}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Drag center to move &bull; Drag corner handles to resize
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