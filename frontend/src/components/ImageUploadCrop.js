import React, { useState, useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

/**
 * ImageUploadCrop - A reusable component for uploading and cropping images
 * 
 * Props:
 * - onImageSelected: (url, file) => void - Called when image is selected and cropped
 * - currentImage: string - Current image URL to display
 * - aspectRatio: number - Aspect ratio for cropping (e.g., 1 for square, 16/9 for banner)
 * - label: string - Label for the upload button
 * - uploadType: string - Type of upload (logo, banner, player) - used for folder organization
 * - maxSize: number - Maximum file size in MB (default: 5)
 * - circularCrop: boolean - Use circular crop mask (default: false)
 * - placeholder: React.Node - Placeholder content when no image
 */
const ImageUploadCrop = ({
    onImageSelected,
    currentImage,
    aspectRatio = 1,
    label = 'Upload Image',
    uploadType = 'general',
    maxSize = 5,
    circularCrop = false,
    placeholder = null,
    className = ''
}) => {
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const imageRef = useRef(null);
    const fileInputRef = useRef(null);
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

    const handleFileSelect = (e) => {
        setError('');
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        // Read file and open crop modal
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);
        
        // Reset file input so same file can be selected again
        e.target.value = '';
    };

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        
        // Calculate initial crop centered on image
        const cropWidth = Math.min(width, height * aspectRatio);
        const cropHeight = cropWidth / aspectRatio;
        
        const x = (width - cropWidth) / 2;
        const y = (height - cropHeight) / 2;

        const initialCrop = {
            unit: 'px',
            x,
            y,
            width: cropWidth,
            height: cropHeight
        };
        
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
    }, [aspectRatio]);

    const getCroppedImage = useCallback(async () => {
        console.log('🖼️ getCroppedImage called');
        console.log('🖼️ imageRef.current:', imageRef.current);
        console.log('🖼️ completedCrop:', completedCrop);
        
        if (!imageRef.current || !completedCrop) {
            console.error('🖼️ Missing imageRef or completedCrop');
            return null;
        }

        const image = imageRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate scale between displayed and natural image size
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        console.log('🖼️ Image dimensions:', { 
            natural: { w: image.naturalWidth, h: image.naturalHeight },
            displayed: { w: image.width, h: image.height },
            scale: { x: scaleX, y: scaleY }
        });
        console.log('🖼️ Crop area:', completedCrop);

        // Set canvas size to cropped area (at natural resolution)
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        
        // Check if canvas has valid dimensions
        if (canvas.width <= 0 || canvas.height <= 0) {
            console.error('🖼️ Invalid canvas dimensions:', { w: canvas.width, h: canvas.height });
            return null;
        }

        // Draw cropped portion
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        // Convert to blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                console.log('🖼️ Canvas blob created:', blob ? `${blob.size} bytes` : 'null');
                if (blob) {
                    resolve(blob);
                } else {
                    resolve(null);
                }
            }, 'image/jpeg', 0.9);
        });
    }, [completedCrop]);

    const handleCropConfirm = async () => {
        console.log('🖼️ Starting crop confirmation...');
        console.log('🖼️ completedCrop:', completedCrop);
        console.log('🖼️ imageRef.current:', imageRef.current ? 'exists' : 'null');
        
        setError('');
        setUploading(true);

        try {
            const croppedBlob = await getCroppedImage();
            console.log('🖼️ croppedBlob:', croppedBlob ? `${croppedBlob.size} bytes` : 'null');
            
            if (!croppedBlob) {
                setError('Failed to crop image');
                setUploading(false);
                return;
            }

            // Create form data and upload
            const formData = new FormData();
            formData.append('file', croppedBlob, `${uploadType}_${Date.now()}.jpg`);
            formData.append('type', uploadType);

            console.log('🖼️ Uploading to:', `${backendUrl}/api/upload/image`);
            
            const response = await fetch(`${backendUrl}/api/upload/image`, {
                method: 'POST',
                body: formData
            });

            console.log('🖼️ Upload response status:', response.status);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Upload failed');
            }

            const data = await response.json();
            console.log('🖼️ Upload successful:', data);
            const imageUrl = data.url;
            
            // Call the callback with the new URL
            console.log('🖼️ Calling onImageSelected with:', imageUrl);
            if (typeof onImageSelected !== 'function') {
                console.error('🖼️ ERROR: onImageSelected is not a function!', onImageSelected);
                throw new Error('Callback function not provided');
            }
            onImageSelected(imageUrl, croppedBlob);
            
            // Close modal
            setShowCropModal(false);
            setImageSrc(null);
            setCrop(undefined);
            setCompletedCrop(null);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        setShowCropModal(false);
        setImageSrc(null);
        setCrop(undefined);
        setCompletedCrop(null);
        setError('');
    };

    return (
        <div className={`image-upload-crop ${className}`}>
            {/* Current Image Preview or Placeholder */}
            <div 
                className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
            >
                {currentImage ? (
                    <div className="relative">
                        <img 
                            src={currentImage} 
                            alt="Current" 
                            className={`w-full ${circularCrop ? 'rounded-full' : ''} object-contain max-h-32`}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-sm font-medium">Change Image</span>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center">
                        {placeholder || (
                            <>
                                <svg className="w-8 h-8 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-slate-500">{label}</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Error Message */}
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}

            {/* Crop Modal */}
            {showCropModal && (
                <div 
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    onClick={handleCancel}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">Crop Image</h3>
                            <button 
                                onClick={handleCancel}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Crop Area */}
                        <div className="p-4 flex items-center justify-center bg-slate-100" style={{ maxHeight: '60vh' }}>
                            {imageSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={aspectRatio}
                                    circularCrop={circularCrop}
                                >
                                    <img
                                        ref={imageRef}
                                        src={imageSrc}
                                        alt="Crop preview"
                                        onLoad={onImageLoad}
                                        style={{ maxHeight: '55vh', maxWidth: '100%' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t bg-slate-50 flex justify-between items-center">
                            <p className="text-sm text-slate-500">
                                Drag to reposition, resize corners to adjust
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                                    disabled={uploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCropConfirm}
                                    disabled={uploading || !completedCrop}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Crop & Upload'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploadCrop;
