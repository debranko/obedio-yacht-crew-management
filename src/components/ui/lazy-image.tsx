/**
 * Lazy Image Component
 * Loads images only when they're visible in viewport
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blur?: boolean;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
  threshold?: number; // How far from viewport to start loading (0-1)
}

export function LazyImage({
  src,
  alt,
  placeholder,
  blur = true,
  fallback = '/placeholder-image.png',
  onLoad,
  onError,
  threshold = 0.1,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallback : isInView ? src : placeholder;

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        'transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
        blur && !isLoaded && 'blur-sm',
        className
      )}
      {...props}
    />
  );
}

/**
 * Progressive Image Component
 * Shows low-res placeholder, then loads high-res image
 */
interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholderSrc: string;
  alt: string;
}

export function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={cn(
        'transition-all duration-300',
        isLoading && 'blur-sm scale-105',
        className
      )}
      {...props}
    />
  );
}

/**
 * Responsive Image Component
 * Loads appropriate image size based on container width
 */
interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: {
    small: string;
    medium: string;
    large: string;
  };
  alt: string;
  breakpoints?: {
    small: number;
    medium: number;
  };
}

export function ResponsiveImage({
  src,
  alt,
  breakpoints = { small: 640, medium: 1024 },
  className,
  ...props
}: ResponsiveImageProps) {
  const [imageSrc, setImageSrc] = useState(src.small);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateImageSrc = () => {
      const width = containerRef.current?.offsetWidth || 0;

      if (width >= breakpoints.medium) {
        setImageSrc(src.large);
      } else if (width >= breakpoints.small) {
        setImageSrc(src.medium);
      } else {
        setImageSrc(src.small);
      }
    };

    updateImageSrc();

    const observer = new ResizeObserver(updateImageSrc);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [src, breakpoints]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <img src={imageSrc} alt={alt} className={className} {...props} />
    </div>
  );
}

/**
 * Image with Skeleton Loader
 */
interface ImageWithSkeletonProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: string; // e.g., "16/9", "1/1", "4/3"
}

export function ImageWithSkeleton({
  src,
  alt,
  aspectRatio = '16/9',
  className,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn('relative w-full overflow-hidden bg-muted', className)}
      style={{ aspectRatio }}
    >
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
