import React, { useState, useEffect } from 'react';

// Color Extractor Component - Extracts top 3 colors from uploaded images
const ColorExtractor = ({ imageUrl, onColorsExtracted, isVisible = true }) => {
    const [extractedColors, setExtractedColors] = useState([]);
    const [isExtracting, setIsExtracting] = useState(false);

    // Convert RGB to Hex
    const rgbToHex = (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    // Calculate color brightness (for readability)
    const getColorBrightness = (hex) => {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    };

    // Extract dominant colors from image
    const extractColors = async (imageUrl) => {
        if (!imageUrl) return;

        setIsExtracting(true);
        
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Check if it's a Google Drive URL that needs proxying
            let finalImageUrl = imageUrl;
            if (imageUrl.includes('drive.google.com') || imageUrl.includes('googleusercontent.com')) {
                const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
                finalImageUrl = `${backendUrl}/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
                console.log('🔄 Using proxy for Google Drive image:', finalImageUrl);
            }
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Resize canvas for faster processing
                const maxSize = 100;
                const ratio = Math.min(maxSize / img.width, maxSize / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                
                // Count color frequency
                const colorMap = new Map();
                
                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const alpha = pixels[i + 3];
                    
                    // Skip transparent pixels and very light/dark pixels
                    if (alpha < 125 || (r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) {
                        continue;
                    }
                    
                    // Reduce color precision for better grouping
                    const reducedR = Math.floor(r / 10) * 10;
                    const reducedG = Math.floor(g / 10) * 10;
                    const reducedB = Math.floor(b / 10) * 10;
                    
                    const colorKey = `${reducedR},${reducedG},${reducedB}`;
                    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
                }
                
                // Sort colors by frequency and get top 3
                const sortedColors = Array.from(colorMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([colorKey]) => {
                        const [r, g, b] = colorKey.split(',').map(Number);
                        return {
                            hex: rgbToHex(r, g, b),
                            rgb: { r, g, b },
                            brightness: getColorBrightness(rgbToHex(r, g, b))
                        };
                    });

                // Auto-assign colors based on brightness and characteristics
                const assignedColors = autoAssignColors(sortedColors);
                
                setExtractedColors(assignedColors);
                onColorsExtracted(assignedColors);
                setIsExtracting(false);
            };
            
            img.onerror = () => {
                console.error('Failed to load image for color extraction');
                setIsExtracting(false);
            };
            
            img.src = finalImageUrl;
            
        } catch (error) {
            console.error('Color extraction failed:', error);
            setIsExtracting(false);
        }
    };

    // Auto-assign colors to different features based on characteristics
    const autoAssignColors = (colors) => {
        if (colors.length === 0) return [];

        const assignments = [
            {
                name: 'Primary Color',
                description: 'Main team color (headers, buttons)',
                key: 'primaryColor',
                icon: '🎯'
            },
            {
                name: 'Background Color',
                description: 'Card backgrounds and subtle areas',
                key: 'backgroundColor',
                icon: '🎨'
            },
            {
                name: 'Accent Color',
                description: 'Highlights and secondary elements',
                key: 'accentColor',
                icon: '✨'
            }
        ];

        // Sort colors by brightness (darkest to lightest)
        const sortedByBrightness = [...colors].sort((a, b) => a.brightness - b.brightness);
        
        return assignments.map((assignment, index) => {
            const color = sortedByBrightness[index] || sortedByBrightness[0];
            
            // For background color, create a lighter version
            if (assignment.key === 'backgroundColor' && color) {
                const lightHex = lightenColor(color.hex, 85); // Much lighter for backgrounds
                return {
                    ...assignment,
                    hex: lightHex,
                    originalHex: color.hex,
                    isLightened: true
                };
            }
            
            return {
                ...assignment,
                hex: color?.hex || '#64748b',
                originalHex: color?.hex || '#64748b',
                isLightened: false
            };
        });
    };

    // Lighten a color by a percentage
    const lightenColor = (hex, percent) => {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    // Extract colors when image URL changes
    useEffect(() => {
        if (imageUrl) {
            extractColors(imageUrl);
        }
    }, [imageUrl]);

    if (!isVisible || (!imageUrl && extractedColors.length === 0)) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800 flex items-center">
                    🎨 Smart Color Extraction
                    {isExtracting && (
                        <span className="ml-2 animate-spin">⚡</span>
                    )}
                </h4>
                <button
                    onClick={() => extractColors(imageUrl)}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                    disabled={isExtracting}
                >
                    {isExtracting ? 'Extracting...' : 'Re-extract'}
                </button>
            </div>
            
            {isExtracting ? (
                <div className="text-center py-4">
                    <div className="animate-pulse text-blue-600">Analyzing logo colors...</div>
                </div>
            ) : (
                <>
                    <p className="text-sm text-blue-700 mb-4">
                        Colors automatically extracted from your logo and assigned to team features:
                    </p>
                    
                    <div className="space-y-3">
                        {extractedColors.map((colorAssignment, index) => (
                            <ColorAssignmentCard
                                key={index}
                                assignment={colorAssignment}
                                allColors={extractedColors}
                                onColorChange={(newHex) => {
                                    const updatedColors = extractedColors.map((c, i) => 
                                        i === index ? { ...c, hex: newHex } : c
                                    );
                                    setExtractedColors(updatedColors);
                                    onColorsExtracted(updatedColors);
                                }}
                            />
                        ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-800">
                        💡 <strong>Tip:</strong> Click on any color circle to choose a different color from your logo, or use the color pickers above for custom colors.
                    </div>
                </>
            )}
        </div>
    );
};

// Individual color assignment card
const ColorAssignmentCard = ({ assignment, allColors, onColorChange }) => {
    const [showColorOptions, setShowColorOptions] = useState(false);

    return (
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <button
                        onClick={() => setShowColorOptions(!showColorOptions)}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: assignment.hex }}
                        title="Click to choose different color"
                    />
                    
                    {/* Color options dropdown */}
                    {showColorOptions && (
                        <div className="absolute top-10 left-0 bg-white border rounded-lg shadow-lg p-2 z-20">
                            <div className="flex space-x-1">
                                {allColors.map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            onColorChange(color.originalHex);
                                            setShowColorOptions(false);
                                        }}
                                        className="w-6 h-6 rounded-full border border-gray-300 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: color.originalHex }}
                                        title={`Use ${color.originalHex}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div>
                    <div className="font-medium text-gray-800 text-sm flex items-center">
                        <span className="mr-1">{assignment.icon}</span>
                        {assignment.name}
                    </div>
                    <div className="text-xs text-gray-500">{assignment.description}</div>
                    {assignment.isLightened && (
                        <div className="text-xs text-blue-600">✨ Auto-lightened for readability</div>
                    )}
                </div>
            </div>
            
            <div className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {assignment.hex.toUpperCase()}
            </div>
        </div>
    );
};

export default ColorExtractor;