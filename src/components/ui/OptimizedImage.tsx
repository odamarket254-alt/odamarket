import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  imgClassName,
  fallback = 'https://placehold.co/400x400/F8FAFC/3A2418?text=Image',
  onLoad: propOnLoad,
  onError: propOnError,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const imgRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setError(false);
  }, [src]);

  const getOptimizedUrl = (url: string, width: number) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    
    if (url.includes('unsplash.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}w=${width}&q=80&fm=webp&auto=format`;
    }

    if (url.startsWith('/')) {
       return url; // local images
    }
    
    if (url.includes('supabase.co')) {
      return url; // Return exact uploaded image
    }
    
    return `/api/image?url=${encodeURIComponent(url)}&w=${width}&q=80`;
  };

  // Only generate srcSet if it's not the fallback
  const isFallback = error || !imgSrc;
  const currentSrc = isFallback ? fallback : imgSrc;
  
  const isSupabaseUrl = currentSrc?.includes('supabase.co') || currentSrc?.startsWith('data:') || currentSrc?.startsWith('blob:') || currentSrc?.startsWith('/');
  
  const srcSet = (!isFallback && !isSupabaseUrl) ? `
    ${getOptimizedUrl(currentSrc, 400)} 400w,
    ${getOptimizedUrl(currentSrc, 800)} 800w,
    ${getOptimizedUrl(currentSrc, 1200)} 1200w
  ` : undefined;

  const defaultSizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";

  return (
    <div className={cn("relative overflow-hidden bg-slate-100 flex items-center justify-center", className)}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}
      
      <img
        src={getOptimizedUrl(currentSrc, 800)} // Default fallback width
        srcSet={srcSet}
        sizes={props.sizes || defaultSizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          setIsLoaded(true);
          if (propOnLoad) propOnLoad(e);
        }}
        onError={(e) => {
          setError(true);
          setIsLoaded(true);
          if (propOnError) propOnError(e);
        }}
        className={cn(
          "transition-opacity duration-300 w-full h-full object-cover",
          isLoaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        ref={imgRef}
        {...props}
      />
    </div>
  );
}
