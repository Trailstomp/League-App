/**
 * Utility functions for handling image URLs, especially Google Drive URLs with CORS issues
 */

/**
 * Fix Google Drive URLs to use backend proxy to avoid CORS issues
 * @param {string} url - The original image URL
 * @returns {string} - The fixed URL that routes through proxy if needed
 */
export const fixGoogleDriveUrl = (url) => {
    if (!url) return url;
    
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
    
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
    // Format: https://lh3.googleusercontent.com/... (Google Drive thumbnails)
    else if (url.includes('googleusercontent.com')) {
        // These sometimes work directly, but let's proxy them for consistency
        return `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    // If we found a Google Drive file ID, use the proxy
    if (fileId) {
        return `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(`https://drive.google.com/uc?id=${fileId}`)}`;
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

export default { fixGoogleDriveUrl, EnhancedImage };