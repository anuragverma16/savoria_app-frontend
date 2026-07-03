import { useEffect, useRef, useState } from 'react'
import {
  IMAGE_FALLBACK,
  buildImageSrcSet,
  defaultSizes,
  optimizeImageUrl,
} from '../utils/optimizeImageUrl'

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  eager = false,
  width = 800,
  quality = 70,
  sizes,
  fullWidth = false,
  onError,
}) {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(eager)
  const [failed, setFailed] = useState(false)
  const resolvedSrc = failed ? IMAGE_FALLBACK : src
  const optimized = optimizeImageUrl(resolvedSrc, { width, quality })
  const srcSet = buildImageSrcSet(resolvedSrc)
  const resolvedSizes = sizes || defaultSizes(fullWidth)

  useEffect(() => {
    setLoaded(eager)
    setFailed(false)
  }, [src, eager])

  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true)
    }
  }, [optimized, srcSet])

  const handleError = (e) => {
    if (!failed) {
      setFailed(true)
      return
    }
    const el = e.currentTarget
    if (!el.dataset.fallback) {
      el.dataset.fallback = '1'
      el.removeAttribute('srcset')
    }
    setLoaded(true)
    onError?.(e)
  }

  return (
    <img
      ref={imgRef}
      src={optimized}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      width={width}
      height={Math.round(width * 0.75)}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={handleError}
    />
  )
}
