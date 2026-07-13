/** Format menu item rating for display */
export function formatMenuRating(rating, count) {
  const avg = Number(rating?.average ?? rating ?? 0)
  const c = Number(rating?.count ?? count ?? 0)
  if (!c || !avg) {
    return { label: null, average: 0, count: 0, hasReviews: false }
  }
  return {
    label: avg.toFixed(1),
    average: avg,
    count: c,
    hasReviews: true,
  }
}

export function formatReviewDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
