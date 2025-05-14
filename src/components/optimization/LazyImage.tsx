import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  fallbackSrc?: string;
  width?: number | string;
  height?: number | string;
  threshold?: number;
  rootMargin?: string;
  effect?: 'blur' | 'fade' | 'none';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * LazyImage component that only loads images when they enter the viewport
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Loading placeholders
 * - Error fallbacks
 * - Blur/fade-in effects
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholderSrc = '',
  fallbackSrc = '',
  width,
  height,
  threshold = 0.1,
  rootMargin = '0px',
  effect = 'blur',
  onLoad,
  onError,
  className,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc || '');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    // Skip if no IntersectionObserver support or if
    // the image is already loaded or has an error
    if (!('IntersectionObserver' in window) || isLoaded || hasError) {
      return;
    }
    
    let isUnmounted = false;
    
    // Handler when image enters viewport
    const loadImage = () => {
      if (isUnmounted) return;
      
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        if (isUnmounted) return;
        
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        if (isUnmounted) return;
        
        setHasError(true);
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
        onError?.();
      };
    };
    
    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadImage();
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );
    
    // Start observing the image
    if (imageRef.current) {
      observer.observe(imageRef.current);
    }
    
    // Cleanup function
    return () => {
      isUnmounted = true;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src, fallbackSrc, isLoaded, hasError, threshold, rootMargin, onLoad, onError]);

  // If browser doesn't support IntersectionObserver, load immediately
  useEffect(() => {
    if (!('IntersectionObserver' in window) && !isLoaded && !hasError) {
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        onLoad?.();
      };
      
      img.onerror = () => {
        setHasError(true);
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
        onError?.();
      };
    }
  }, [src, fallbackSrc, isLoaded, hasError, onLoad, onError]);

  // Generate CSS classes based on loading state and effects
  const imageClasses = [
    className || '',
    isLoaded ? 'is-loaded' : 'is-loading',
    hasError ? 'has-error' : '',
    effect !== 'none' ? `effect-${effect}` : ''
  ].filter(Boolean).join(' ');

  // Generate inline styles based on effect
  const getImageStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      width: width,
      height: height,
      objectFit: 'cover',
      transition: 'opacity 0.3s ease, filter 0.5s ease'
    };

    if (!isLoaded) {
      if (effect === 'blur') {
        return {
          ...baseStyle,
          filter: 'blur(10px)',
          opacity: placeholderSrc ? 1 : 0,
        };
      }
      if (effect === 'fade') {
        return {
          ...baseStyle,
          opacity: placeholderSrc ? 0.6 : 0,
        };
      }
    }

    return {
      ...baseStyle,
      filter: 'blur(0)',
      opacity: 1,
    };
  };

  return (
    <img
      ref={imageRef}
      src={imageSrc || placeholderSrc}
      alt={alt}
      width={width}
      height={height}
      className={imageClasses}
      style={getImageStyle()}
      {...rest}
    />
  );
};

export default LazyImage; 