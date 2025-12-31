import React, { useState, useEffect, useRef } from 'react';

// Image cache using IndexedDB for larger images
const IMAGE_CACHE_NAME = 'mlbl-image-cache';
const CACHE_VERSION = 1;

// In-memory cache for quick access
const memoryCache = new Map();

// Helper to check if URL is cacheable
const isCacheableUrl = (url) => {
  if (!url) return false;
  // Cache external images (Google Drive, etc.)
  return url.startsWith('http') || url.startsWith('//');
};

// Convert image to base64 for caching
const imageToBase64 = async (url) => {
  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Failed to cache image:', url, error);
    return null;
  }
};

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_CACHE_NAME, CACHE_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'url' });
      }
    };
  });
};

// Get cached image from IndexedDB
const getCachedImage = async (url) => {
  // Check memory cache first
  if (memoryCache.has(url)) {
    return memoryCache.get(url);
  }
  
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(url);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.data) {
          // Add to memory cache
          memoryCache.set(url, result.data);
          resolve(result.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => resolve(null);
    });
  } catch (error) {
    return null;
  }
};

// Save image to IndexedDB
const cacheImage = async (url, data) => {
  // Add to memory cache
  memoryCache.set(url, data);
  
  try {
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    store.put({ url, data, timestamp: Date.now() });
  } catch (error) {
    console.warn('Failed to cache image to IndexedDB:', error);
  }
};

/**
 * CachedImage - A component that caches images locally for faster loading
 */
const CachedImage = ({ 
  src, 
  alt = '', 
  className = '', 
  fallback = null,
  onLoad = null,
  onError = null,
  lazy = true,
  placeholder = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
        return;
      }
      
      // Check if cacheable
      if (!isCacheableUrl(src)) {
        if (isMounted) {
          setImageSrc(src);
          setLoading(false);
        }
        return;
      }

      // Try to get from cache first
      const cached = await getCachedImage(src);
      if (cached && isMounted) {
        setImageSrc(cached);
        setLoading(false);
        return;
      }

      // Load and cache the image
      try {
        const base64 = await imageToBase64(src);
        if (base64 && isMounted) {
          await cacheImage(src, base64);
          setImageSrc(base64);
        } else if (isMounted) {
          // Fallback to original URL if caching fails
          setImageSrc(src);
        }
      } catch (err) {
        if (isMounted) {
          setImageSrc(src); // Fallback to original
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    // Use Intersection Observer for lazy loading
    if (lazy && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadImage();
            observerRef.current?.disconnect();
          }
        },
        { rootMargin: '100px' }
      );
      observerRef.current.observe(imgRef.current);
    } else {
      loadImage();
    }

    return () => {
      isMounted = false;
      observerRef.current?.disconnect();
    };
  }, [src, lazy]);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
    onError?.();
  };

  // Show placeholder while loading
  if (loading) {
    return placeholder || (
      <div 
        ref={imgRef}
        className={`animate-pulse bg-slate-200 ${className}`}
        style={{ minHeight: '100px' }}
        {...props}
      />
    );
  }

  // Show fallback on error
  if (error || !imageSrc) {
    return fallback || (
      <div 
        className={`bg-slate-100 flex items-center justify-center text-slate-400 ${className}`}
        {...props}
      >
        <span>📷</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading={lazy ? 'lazy' : 'eager'}
      {...props}
    />
  );
};

/**
 * Preload images for critical paths
 */
export const preloadImages = async (urls) => {
  const promises = urls.filter(isCacheableUrl).map(async (url) => {
    const cached = await getCachedImage(url);
    if (!cached) {
      const base64 = await imageToBase64(url);
      if (base64) {
        await cacheImage(url, base64);
      }
    }
  });
  
  await Promise.allSettled(promises);
};

/**
 * Clear the image cache
 */
export const clearImageCache = async () => {
  memoryCache.clear();
  try {
    const db = await openDB();
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    store.clear();
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
};

export default CachedImage;
