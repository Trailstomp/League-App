import React, { useState, useEffect } from 'react';

// Enhanced Color Picker Component with Eyedropper
const AdvancedColorPicker = ({ 
    label, 
    value, 
    onChange, 
    showEyedropper = true,
    presetColors = [],
    className = "" 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [eyedropperSupported, setEyedropperSupported] = useState(false);
    
    useEffect(() => {
        // Check if EyeDropper API is supported
        setEyedropperSupported('EyeDropper' in window);
    }, []);
    
    const handleEyedropper = async () => {
        if (!eyedropperSupported) {
            alert('Eyedropper is not supported in this browser. Try Chrome 95+ or Edge 95+');
            return;
        }
        
        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            onChange(result.sRGBHex);
        } catch (err) {
            console.log('Eyedropper was cancelled or failed:', err);
        }
    };
    
    const defaultPresets = [
        '#1e293b', '#991b1b', '#2563eb', '#059669', '#7c2d12', '#7c3aed',
        '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#9333ea',
        '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff'
    ];
    
    const allPresets = presetColors.length > 0 ? presetColors : defaultPresets;
    
    return (
        <div className={`relative ${className}`}>
            <label className="block font-semibold text-slate-700 mb-2">{label}</label>
            
            <div className="flex gap-2">
                {/* Color Display & Input */}
                <div className="relative flex-1">
                    <div 
                        className="w-full h-12 border-2 border-slate-300 rounded-lg cursor-pointer flex items-center px-3 hover:border-slate-400 transition-colors"
                        style={{ backgroundColor: value }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span 
                            className="font-semibold text-sm px-2 py-1 rounded shadow-sm"
                            style={{ 
                                color: value === '#ffffff' || value === '#f8fafc' ? '#000000' : '#ffffff',
                                backgroundColor: value === '#ffffff' || value === '#f8fafc' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'
                            }}
                        >
                            {value.toUpperCase()}
                        </span>
                    </div>
                    
                    {/* Hidden HTML color input for fallback */}
                    <input 
                        type="color" 
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                
                {/* Eyedropper Button */}
                {showEyedropper && (
                    <button
                        type="button"
                        onClick={handleEyedropper}
                        className="px-4 h-12 bg-slate-100 border-2 border-slate-300 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                        title={eyedropperSupported ? "Pick color from screen" : "Eyedropper not supported in this browser"}
                        disabled={!eyedropperSupported}
                    >
                        🎨
                    </button>
                )}
            </div>
            
            {/* Color Preset Palette */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-20 p-4">
                    <div className="mb-3">
                        <p className="text-sm font-medium text-slate-700 mb-2">Quick Colors</p>
                        <div className="grid grid-cols-6 gap-2">
                            {allPresets.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                                        value === color ? 'border-slate-800 shadow-md' : 'border-slate-300'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        onChange(color);
                                        setIsOpen(false);
                                    }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-2">Custom Color</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
                                        onChange(val);
                                    }
                                }}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                placeholder="#1e293b"
                            />
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-2 bg-slate-600 text-white rounded-lg text-sm hover:bg-slate-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Backdrop to close popup */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default AdvancedColorPicker;