/**
 * Smaller, webp-friendly URLs for external images (Unsplash, etc.)
 */
export function optimizeImageUrl(url, { width = 800, quality = 72 } = {}) {
  if (!url || typeof url !== 'string') return url

  if (url.includes('images.unsplash.com')) {
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

  return url
}

export function buildImageSrcSet(url, widths = [400, 640, 960, 1280]) {
  if (!url?.includes('images.unsplash.com')) return undefined
  return widths.map((w) => `${optimizeImageUrl(url, { width: w })} ${w}w`).join(', ')
}

export function defaultSizes(fullWidth = false) {
  return fullWidth
    ? '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1280px'
    : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px'
}
