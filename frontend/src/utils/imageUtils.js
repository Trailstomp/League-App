/**
 * Utility functions for handling image URLs, especially Google Drive URLs with CORS issues
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

/**
 * Get the full image URL, handling relative paths from backend
 * @param {string} url - The image URL (could be relative or absolute)
 * @returns {string} - The full URL
 */
export const getFullImageUrl = (url) => {
    if (!url) return url;
    
    // If it's already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // If it's a relative URL starting with /uploads, prepend backend URL
    if (url.startsWith('/uploads/')) {
        return `${BACKEND_URL}${url}`;
    }
    
    // If it's a relative URL starting with /, prepend backend URL
    if (url.startsWith('/')) {
        return `${BACKEND_URL}${url}`;
    }
    
    return url;
};

/**
 * Fix Google Drive URLs using backend proxy to avoid CORS
 * @param {string} url - The original image URL
 * @returns {string} - The proxied URL
 */
export const fixGoogleDriveUrl = (url) => {
    if (!url) return url;
    
    // First handle relative URLs
    url = getFullImageUrl(url);
    
    // Extract Google Drive file ID from various URL formats
    let fileId = null;
    
    // Format: https://drive.google.com/file/d/{id}/view
    if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
        fileId = url.split('/d/')[1].split('/view')[0];
    }
    // Format: https://drive.google.com/uc?id={id}
    else if (url.includes('drive.google.com/uc?id=')) {
        fileId = url.split('id=')[1].split('&')[0];
    }
    // Format: https://drive.google.com/thumbnail?id={id}
    else if (url.includes('drive.google.com/thumbnail?id=')) {
        fileId = url.split('id=')[1].split('&')[0];
    }
    // Format: Old proxy URLs or wrong domain URLs
    else if (url.includes('/drive/') && url.includes('?size=')) {
        // Extract file ID from old proxy URLs
        fileId = url.split('/drive/')[1].split('?')[0];
    }
    // Format: Already a proxy URL - return as-is
    else if (url.includes('/api/proxy-image')) {
        return url;
    }
    // Format: https://lh3.googleusercontent.com/... (Google Drive thumbnails)
    else if (url.includes('googleusercontent.com')) {
        // Use proxy for consistency
        return `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    // If we found a Google Drive file ID, use proxy
    if (fileId) {
        const driveUrl = `https://drive.google.com/uc?id=${fileId}`;
        return `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(driveUrl)}`;
    }
    
    return url;
};

/**
 * Enhanced image component that handles Google Drive CORS issues
 * @param {Object} props - React img props plus additional options
 * @returns {JSX.Element} - Enhanced img element with error handling
 */
export const EnhancedImage = ({ src, alt, onError, fallbackSrc, className, ...props }) => {
    const handleImageError = (e) => {
        // Try the fixed URL first
        const fixedUrl = fixGoogleDriveUrl(src);
        if (e.target.src !== fixedUrl) {
            e.target.src = fixedUrl;
            return;
        }
        
        // If fixed URL also fails, try fallback
        if (fallbackSrc && e.target.src !== fallbackSrc) {
            e.target.src = fallbackSrc;
            return;
        }
        
        // Call custom error handler if provided
        if (onError) {
            onError(e);
        }
        
        console.error(`Failed to load image: ${alt}`, {
            originalSrc: src,
            fixedSrc: fixedUrl,
            fallbackSrc: fallbackSrc
        });
    };
    
    return (
        <img
            src={fixGoogleDriveUrl(src)}
            alt={alt}
            className={className}
            onError={handleImageError}
            {...props}
        />
    );
};

export default { fixGoogleDriveUrl, EnhancedImage, getFullImageUrl };