import React, { useEffect, useState } from 'react';

const ImageModal = ({ imageUrl, imageAlt, onClose }) => {
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
    const [hasError, setHasError] = useState(false);

    // Helper function to fix Google Drive URLs using proxy
    const fixGoogleDriveUrl = (url) => {
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
        
        // If we found a Google Drive file ID, use the proxy
        if (fileId) {
            return `${BACKEND_URL}/api/proxy-image?url=${encodeURIComponent(`https://drive.google.com/uc?id=${fileId}`)}`;
        }
        
        return url;
    };

    useEffect(() => {
        setCurrentImageUrl(fixGoogleDriveUrl(imageUrl));
        setHasError(false);
    }, [imageUrl]);

    const handleImageError = () => {
        console.error('Failed to load image:', currentImageUrl);
        
        if (!hasError) {
            setHasError(true);
            
            // Try to extract file ID and use proxy as fallback
            if (currentImageUrl?.includes('drive.google.com')) {
                let fileId = null;
                
                // Extract file ID from various Google Drive URL formats
                if (currentImageUrl.includes('/d/')) {
                    fileId = currentImageUrl.split('/d/')[1].split('/')[0];
                } else if (currentImageUrl.includes('id=')) {
                    fileId = currentImageUrl.split('id=')[1].split('&')[0];
                }
                
                if (fileId) {
                    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
                    const proxyUrl = `${BACKEND_URL}/api/media/drive/${fileId}?size=w800-h600`;
                    console.log('Trying proxy URL as fallback:', proxyUrl);
                    setCurrentImageUrl(proxyUrl);
                    return;
                }
            }
            
            // If no fallback worked, we'll show the broken image
            console.error('No fallback available for image URL:', currentImageUrl);
        }
    };
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleImageClick = (e) => {
        e.stopPropagation();
        onClose(); // Close when clicking the image itself
    };

    if (!currentImageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                <img 
                    src={currentImageUrl}
                    alt={imageAlt || 'Gallery image'}
                    className="max-w-full max-h-full object-contain cursor-pointer shadow-2xl"
                    onClick={handleImageClick}
                    onError={handleImageError}
                />
                
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ImageModal;