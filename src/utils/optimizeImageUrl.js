/** Shared food placeholder (small, webp via Unsplash CDN) */
export const IMAGE_FALLBACK = 'https://images.unsplash.com/photo-1512621776951-a41bdfeb9303'

const UNSPLASH_HOST = 'images.unsplash.com'

/**
 * Smaller, webp-friendly URLs for external images (Unsplash, Cloudinary, etc.)
 */
export function optimizeImageUrl(url, { width = 800, quality = 70 } = {}) {
  if (!url || typeof url !== 'string') return url

  if (url.startsWith('/') || url.startsWith('data:')) return url

  if (url.includes(UNSPLASH_HOST)) {
    try {
      const base = url.split('?')[0]
      const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '')
      params.set('w', String(width))
      params.set('q', String(quality))
      params.set('auto', 'format')
      params.set('fit', params.get('fit') || 'crop')
      return `${base}?${params.toString()}`
    } catch {
      return url
    }
  }

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_${quality},w_${width}/`)
  }

  if (url.includes('i.pinimg.com')) {
    return url.replace(/\/\d+x\//, `/${Math.min(width, 736)}x/`)
  }

  return url
}

export function buildImageSrcSet(url, widths = [320, 480, 640, 960, 1280]) {
  if (!url?.includes(UNSPLASH_HOST)) return undefined
  const capped = widths.filter((w) => w <= 1920)
  return capped.map((w) => `${optimizeImageUrl(url, { width: w })} ${w}w`).join(', ')
}

export function buildBlurPlaceholder(url, width = 24) {
  if (!url?.includes(UNSPLASH_HOST)) return undefined
  return optimizeImageUrl(url, { width, quality: 20 })
}

export function defaultSizes(fullWidth = false) {
  return fullWidth
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px'
    : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px'
}

export function preloadImage(url, { width = 1280, quality = 70 } = {}) {
  if (!url || typeof document === 'undefined') return () => {}
  const href = optimizeImageUrl(url, { width, quality })
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = href
  document.head.appendChild(link)
  return () => link.remove()
}
