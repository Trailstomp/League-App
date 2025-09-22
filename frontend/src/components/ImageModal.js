import React, { useEffect } from 'react';

const ImageModal = ({ imageUrl, imageAlt, onClose }) => {
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

    if (!imageUrl) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                <img 
                    src={imageUrl}
                    alt={imageAlt || 'Gallery image'}
                    className="max-w-full max-h-full object-contain cursor-pointer shadow-2xl"
                    onClick={handleImageClick}
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