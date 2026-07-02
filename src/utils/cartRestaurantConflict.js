export function getCartRestaurantConflict(cartState, nextRestaurantId) {
  const currentRid = cartState?.restaurantId
  const hasItems = (cartState?.items?.length || 0) > 0
  if (!hasItems || !currentRid || !nextRestaurantId) return null
  if (String(currentRid) === String(nextRestaurantId)) return null
  return { currentRestaurantId: currentRid }
}
