import { itemPrice } from '../components/dineflow/MenuItemCard'

export function mapCustomerMenuItem(item) {
  const id = String(item?._id ?? item?.id ?? '')
  const categoryId = item?.category?._id || item?.category || 'uncategorized'
  return {
    id,
    _id: id,
    name: item?.name || 'Item',
    description: item?.description || '',
    price: itemPrice(item),
    image: item?.image?.url || item?.image || '',
    category: categoryId,
    categoryName: item?.category?.name || '',
    isAvailable: item?.isAvailable !== false,
    tags: item?.tags || (item?.isVeg === false ? ['Non-Veg'] : item?.isVeg ? ['Veg'] : []),
    spicy: Boolean(item?.spicy),
    rating: item?.rating || '4.5',
    prepTime: item?.prepTime || item?.preparationTime || 15,
  }
}

export function mapCustomerOrder(order) {
  if (!order) return null
  return {
    id: order.orderId || order._id,
    _id: order._id,
    orderId: order.orderId,
    status: order.status || 'pending',
    paymentStatus: order.paymentStatus || 'pending',
    paymentMethod: order.paymentMethod || 'upi',
    grandTotal: order.total ?? order.grandTotal ?? 0,
    subtotal: order.subtotal ?? 0,
    tableNumber: order.tableNumber || order.table?.tableNumber,
    items: (order.items || []).map((line) => ({
      id: line.menuItem || line._id,
      name: line.name,
      qty: line.qty,
      price: line.price,
    })),
    customerName: order.guest?.name || order.user?.name || 'Guest',
    createdAt: order.createdAt,
    estimatedMinutes: order.estimatedPrepMinutes || 15,
    restaurantName: order.restaurant?.name,
    restaurantId: order.restaurant?._id || order.restaurant,
  }
}
