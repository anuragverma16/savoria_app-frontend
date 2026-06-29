import { buildImageSrcSet, defaultSizes, optimizeImageUrl } from '../utils/optimizeImageUrl'

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  eager = false,
  width = 800,
  quality = 72,
  sizes,
  fullWidth = false,
  onError,
}) {
  const optimized = optimizeImageUrl(src, { width, quality })
  const srcSet = buildImageSrcSet(src)
  const resolvedSizes = sizes || defaultSizes(fullWidth)

  return (
    <img
      src={optimized}
      srcSet={srcSet}
      sizes={srcSet ? resolvedSizes : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      className={className}
      onError={onError}
    />
  )
}
