import React, { useState, useRef, useEffect } from 'react';
import { LacrosseIcon } from './LacrosseIcons';

const AdvancedColorPicker = ({ color = '#1e40af', onChange, label = 'Color' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [pickerColor, setPickerColor] = useState(color);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Convert hex to HSV for color picker calculations
    const hexToHsv = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        let h = 0;
        if (diff) {
            if (max === r) h = ((g - b) / diff) % 6;
            else if (max === g) h = (b - r) / diff + 2;
            else h = (r - g) / diff + 4;
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;

        const s = max === 0 ? 0 : diff / max;
        const v = max;

        return { h, s: s * 100, v: v * 100 };
    };

    // Convert HSV to hex
    const hsvToHex = (h, s, v) => {
        s /= 100;
        v /= 100;

        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;

        let r, g, b;
        if (h < 60) [r, g, b] = [c, x, 0];
        else if (h < 120) [r, g, b] = [x, c, 0];
        else if (h < 180) [r, g, b] = [0, c, x];
        else if (h < 240) [r, g, b] = [0, x, c];
        else if (h < 300) [r, g, b] = [x, 0, c];
        else [r, g, b] = [c, 0, x];

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const [hsv, setHsv] = useState(() => hexToHsv(color));

    useEffect(() => {
        setPickerColor(color);
        setHsv(hexToHsv(color));
    }, [color]);

    // Preset colors
    const presetColors = [
        '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a',
        '#059669', '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
        '#a21caf', '#be185d', '#e11d48', '#374151', '#6b7280', '#000000'
    ];

    // Draw color picker canvas
    useEffect(() => {
        if (!canvasRef.current || !isOpen) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Create saturation/brightness gradient
        const gradient1 = ctx.createLinearGradient(0, 0, width, 0);
        gradient1.addColorStop(0, '#ffffff');
        gradient1.addColorStop(1, hsvToHex(hsv.h, 100, 100));

        const gradient2 = ctx.createLinearGradient(0, 0, 0, height);
        gradient2.addColorStop(0, 'rgba(0,0,0,0)');
        gradient2.addColorStop(1, '#000000');

        ctx.fillStyle = gradient1;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = gradient2;
        ctx.fillRect(0, 0, width, height);
    }, [hsv.h, isOpen]);

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const s = (x / canvas.width) * 100;
        const v = ((canvas.height - y) / canvas.height) * 100;

        const newColor = hsvToHex(hsv.h, s, v);
        setPickerColor(newColor);
        setHsv({ ...hsv, s, v });
        onChange(newColor);
    };

    const handleHueChange = (e) => {
        const h = parseInt(e.target.value);
        const newColor = hsvToHex(h, hsv.s, hsv.v);
        setPickerColor(newColor);
        setHsv({ ...hsv, h });
        onChange(newColor);
    };

    const handleHexChange = (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            setPickerColor(hex);
            setHsv(hexToHsv(hex));
            onChange(hex);
        }
    };

    const handleEyedropper = async () => {
        if (!window.EyeDropper) {
            alert('Eyedropper is not supported in this browser. Please use Chrome 95+ or Edge 95+');
            return;
        }

        try {
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            const selectedColor = result.sRGBHex;
            setPickerColor(selectedColor);
            setHsv(hexToHsv(selectedColor));
            onChange(selectedColor);
        } catch (e) {
            // User cancelled eyedropper
        }
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Color Display Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-12 border-2 border-slate-300 rounded-lg flex items-center px-3 hover:border-slate-400 transition-colors bg-white"
            >
                <div 
                    className="w-8 h-8 rounded border border-slate-200 mr-3 flex-shrink-0"
                    style={{ backgroundColor: pickerColor }}
                ></div>
                <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-slate-800">{label}</div>
                    <div className="text-xs font-mono text-slate-500">{pickerColor}</div>
                </div>
                <LacrosseIcon name="edit" className="text-slate-400" style={{fontSize: '16px'}} />
            </button>

            {/* Color Picker Dropdown */}
            {isOpen && (
                <div className="absolute top-14 left-0 z-50 bg-white border border-slate-300 rounded-lg shadow-xl p-4 w-80">
                    {/* Color Canvas */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Color Picker</label>
                        <canvas
                            ref={canvasRef}
                            width={272}
                            height={150}
                            className="border border-slate-200 rounded cursor-crosshair w-full"
                            onClick={handleCanvasClick}
                        />
                    </div>

                    {/* Hue Slider */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Hue</label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={hsv.h}
                            onChange={handleHueChange}
                            className="w-full h-6 rounded-lg appearance-none cursor-pointer"
                            style={{
                                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                            }}
                        />
                    </div>

                    {/* Hex Input and Eyedropper */}
                    <div className="flex items-end space-x-2 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Hex Color</label>
                            <input
                                type="text"
                                value={pickerColor}
                                onChange={handleHexChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="#000000"
                            />
                        </div>
                        <button
                            onClick={handleEyedropper}
                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center"
                            title="Pick color from screen (Eyedropper)"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3v18M15 3v18a4 4 0 004-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2z" />
                            </svg>
                        </button>
                    </div>

                    {/* Preset Colors */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Preset Colors</label>
                        <div className="grid grid-cols-9 gap-1">
                            {presetColors.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    onClick={() => {
                                        setPickerColor(presetColor);
                                        setHsv(hexToHsv(presetColor));
                                        onChange(presetColor);
                                    }}
                                    className="w-7 h-7 rounded border-2 border-slate-200 hover:border-slate-400 transition-all hover:scale-110"
                                    style={{ backgroundColor: presetColor }}
                                    title={presetColor}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Apply Button */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-xs text-slate-500">
                            Click in the color box above to pick colors
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedColorPicker;