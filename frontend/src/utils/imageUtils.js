/**
 * Utility functions for handling image URLs, especially Google Drive URLs with CORS issues
 */

/**
 * Fix Google Drive URLs - try direct access first, proxy as fallback
 * @param {string} url - The original image URL
 * @returns {string} - The fixed URL (direct Google Drive or proxy)
 */
export const fixGoogleDriveUrl = (url) => {
    if (!url) return url;
    
    // Extract Google Drive file ID from various URL formats
    let fileId = null;
    
    // Format: https://drive.google.com/file/d/{id}/view
    if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
        fileId = url.split('/d/')[1].split('/view')[0];
    }
    // Format: https://drive.google.com/uc?id={id} - already correct format
    else if (url.includes('drive.google.com/uc?id=')) {
        return url; // Return as-is, it's already in the right format
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
    // Format: https://lh3.googleusercontent.com/... (Google Drive thumbnails)
    else if (url.includes('googleusercontent.com')) {
        return url; // Return as-is, these usually work directly
    }
    
    // If we found a Google Drive file ID, return direct Google Drive URL
    if (fileId) {
        return `https://drive.google.com/uc?id=${fileId}`;
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