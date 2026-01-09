/**
 * Color extraction utility using ColorThief
 * Extracts dominant colors from images for theme generation
 */

import ColorThief from 'colorthief';

const colorThief = new ColorThief();

/**
 * Extract the dominant color from an image
 * @param {HTMLImageElement|string} imageOrUrl - Image element or URL
 * @returns {Promise<{rgb: number[], hex: string}>}
 */
export const getDominantColor = async (imageOrUrl) => {
    const img = await loadImage(imageOrUrl);
    const rgb = colorThief.getColor(img);
    return {
        rgb,
        hex: rgbToHex(rgb)
    };
};

/**
 * Extract a color palette from an image
 * @param {HTMLImageElement|string} imageOrUrl - Image element or URL
 * @param {number} colorCount - Number of colors to extract (default: 5)
 * @returns {Promise<Array<{rgb: number[], hex: string}>>}
 */
export const getColorPalette = async (imageOrUrl, colorCount = 5) => {
    const img = await loadImage(imageOrUrl);
    const palette = colorThief.getPalette(img, colorCount);
    return palette.map(rgb => ({
        rgb,
        hex: rgbToHex(rgb)
    }));
};

/**
 * Extract theme colors from an image (primary, accent, background)
 * @param {HTMLImageElement|string} imageOrUrl - Image element or URL
 * @returns {Promise<{primaryColor: string, accentColor: string, backgroundColor: string, textColor: string}>}
 */
export const extractThemeColors = async (imageOrUrl) => {
    try {
        const palette = await getColorPalette(imageOrUrl, 6);
        
        if (!palette || palette.length < 2) {
            return null;
        }

        // Sort by vibrancy (saturation * brightness)
        const sortedByVibrancy = [...palette].sort((a, b) => {
            const vibA = getVibrancy(a.rgb);
            const vibB = getVibrancy(b.rgb);
            return vibB - vibA;
        });

        // Primary color is the most vibrant
        const primaryColor = sortedByVibrancy[0].hex;

        // Accent color is the second most vibrant (but different enough)
        let accentColor = sortedByVibrancy[1].hex;
        for (let i = 1; i < sortedByVibrancy.length; i++) {
            if (colorDifference(sortedByVibrancy[0].rgb, sortedByVibrancy[i].rgb) > 50) {
                accentColor = sortedByVibrancy[i].hex;
                break;
            }
        }

        // Background color - lightest color or white-adjusted version of primary
        const lightest = [...palette].sort((a, b) => {
            const brightA = getBrightness(a.rgb);
            const brightB = getBrightness(b.rgb);
            return brightB - brightA;
        })[0];
        
        // Make background light enough
        let backgroundColor = lightest.hex;
        if (getBrightness(lightest.rgb) < 200) {
            // Lighten the primary color for background
            backgroundColor = lightenColor(primaryColor, 0.9);
        }

        // Text color - determine based on background brightness
        const textColor = getBrightness(hexToRgb(backgroundColor)) > 128 ? '#1e293b' : '#ffffff';

        return {
            primaryColor,
            accentColor,
            backgroundColor,
            textColor
        };
    } catch (error) {
        console.error('Error extracting theme colors:', error);
        return null;
    }
};

/**
 * Load an image from URL or return the image element
 */
const loadImage = (imageOrUrl) => {
    return new Promise((resolve, reject) => {
        if (imageOrUrl instanceof HTMLImageElement) {
            if (imageOrUrl.complete) {
                resolve(imageOrUrl);
            } else {
                imageOrUrl.onload = () => resolve(imageOrUrl);
                imageOrUrl.onerror = reject;
            }
            return;
        }

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageOrUrl;
    });
};

/**
 * Convert RGB array to hex string
 */
const rgbToHex = (rgb) => {
    return '#' + rgb.map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

/**
 * Convert hex string to RGB array
 */
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
};

/**
 * Get brightness of RGB color (0-255)
 */
const getBrightness = (rgb) => {
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
};

/**
 * Get vibrancy/saturation of RGB color
 */
const getVibrancy = (rgb) => {
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = max / 255;
    return saturation * brightness * 100;
};

/**
 * Calculate color difference between two RGB colors
 */
const colorDifference = (rgb1, rgb2) => {
    return Math.sqrt(
        Math.pow(rgb1[0] - rgb2[0], 2) +
        Math.pow(rgb1[1] - rgb2[1], 2) +
        Math.pow(rgb1[2] - rgb2[2], 2)
    );
};

/**
 * Lighten a hex color by a factor
 */
const lightenColor = (hex, factor) => {
    const rgb = hexToRgb(hex);
    const lightened = rgb.map(c => Math.round(c + (255 - c) * factor));
    return rgbToHex(lightened);
};

export default {
    getDominantColor,
    getColorPalette,
    extractThemeColors
};
