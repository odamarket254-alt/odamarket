import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';

export const DEFAULT_FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23F8FAFC"><rect width="400" height="400" fill="%23F1F5F9"/><path d="M160 170a30 30 0 1 0 0-60 30 30 0 0 0 0 60zm-50 130h180l-55-73.33-40 53.33-30-40L110 300z" fill="%23CBD5E1"/><text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394A3B8">Image not available</text></svg>`;

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: string;
  imageType?: 'banner' | 'product' | 'category' | 'general';
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  imgClassName,
  fallback = DEFAULT_FALLBACK_IMAGE,
  imageType = 'general',
  priority = false,
  onLoad: propOnLoad,
  onError: propOnError,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const getOptimizedUrl = (url?: string | null, width: number = 800) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    
    // Direct Supabase storage URLs - never proxy these
    if (
      url.includes('supabase.co') || 
      url.includes('supabase.in') || 
      url.includes('supabase.net') || 
      url.includes('/storage/v1/object/')
    ) {
      return url;
    }

    // Local static images
    if (url.startsWith('/')) {
      return url;
    }
    
    // Direct Unsplash with query params
    if (url.includes('unsplash.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${width}&q=80&fm=webp&auto=format`;
    }
    
    return `/api/image?url=${encodeURIComponent(url)}&w=${width}&q=80`;
  };

  // Inspect the DOM image element state immediately (handles cached images)
  const checkImageComplete = useCallback((element: HTMLImageElement | null) => {
    if (!element) return;
    if (element.complete) {
      if (element.naturalWidth > 0) {
        setIsLoaded(true);
        setHasError(false);
      } else if (element.naturalWidth === 0 && element.src && !element.src.includes('data:image/svg')) {
        setHasError(true);
        setIsLoaded(true);
      }
    }
  }, []);

  // Ref callback to capture instant cache hits on mount
  const setRef = useCallback((element: HTMLImageElement | null) => {
    imgRef.current = element;
    checkImageComplete(element);
  }, [checkImageComplete]);

  // When src changes, evaluate cache or reset state
  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoaded(true);
      return;
    }

    const element = imgRef.current;
    if (element && element.complete && element.naturalWidth > 0) {
      setIsLoaded(true);
      setHasError(false);
      return;
    }

    setIsLoaded(false);
    setHasError(false);

    // Timeout safety fallback: prevent loading skeleton from getting stuck permanently
    const safetyTimer = setTimeout(() => {
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        setIsLoaded(true);
      } else if (!isLoaded) {
        setIsLoaded(true);
      }
    }, 6000);

    return () => clearTimeout(safetyTimer);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    setHasError(false);
    if (propOnLoad) propOnLoad(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const failedUrl = (e.currentTarget as HTMLImageElement)?.src || src || 'unknown';
    console.error(`[Image Load Failed] Type: ${imageType} | Alt: "${alt}" | URL: "${failedUrl}"`);
    setHasError(true);
    setIsLoaded(true); // Always end the loading state
    if (propOnError) propOnError(e);
  };

  const isFallback = hasError || !src;
  const currentSrc = isFallback ? fallback : src;
  const isSupabaseUrl = currentSrc?.includes('supabase.co') || currentSrc?.startsWith('data:') || currentSrc?.startsWith('blob:') || currentSrc?.startsWith('/');
  
  const srcSet = (!isFallback && !isSupabaseUrl && currentSrc) ? `
    ${getOptimizedUrl(currentSrc, 400)} 400w,
    ${getOptimizedUrl(currentSrc, 800)} 800w,
    ${getOptimizedUrl(currentSrc, 1200)} 1200w
  ` : undefined;

  const defaultSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";
  const isEager = priority || props.loading === 'eager';

  return (
    <div className={cn("relative overflow-hidden bg-slate-100 flex items-center justify-center", className)}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}
      
      <img
        ref={setRef}
        src={getOptimizedUrl(currentSrc, 800)}
        srcSet={srcSet}
        sizes={props.sizes || defaultSizes}
        alt={alt}
        loading={isEager ? "eager" : (props.loading || "lazy")}
        decoding={isEager ? "sync" : "async"}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300 w-full h-full object-cover",
          isLoaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        {...props}
      />
    </div>
  );
}

