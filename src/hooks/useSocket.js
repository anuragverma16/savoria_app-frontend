import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_API_URL.replace('/api','')

/**
 * useSocket — connects to Socket.io server and listens for real-time order events.
 * @param {object} user  - current auth user
 * @param {function} onOrderUpdate - callback when staff/manager receives status updates
 */
export function useSocket(user, onOrderUpdate) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) return

    // Connect
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id)

      // Join user-specific room
      socket.emit('join-user-room', user.id || user._id)

      // Staff/manager joins kitchen room for all order events
      if (user.role === 'staff' || user.role === 'manager') {
        socket.emit('join-kitchen')
      }
    })

    // ── For regular users: their order status changed ───────
    socket.on('my-order-updated', ({ orderId, status }) => {
      const statusLabels = {
        confirmed: 'Your order has been confirmed! 🎉',
        preparing: 'Your order is being prepared 👨‍🍳',
        ready:     'Your order is ready! 🍽️',
        delivered: 'Order delivered. Enjoy your meal! ✅',
        cancelled: 'Your order was cancelled ❌',
      }
      toast(statusLabels[status] || `Order ${orderId} is now ${status}`, {
        style: { background: '#1a1a1a', color: '#f5f5f0', border: '1px solid rgba(212,175,55,0.2)' },
        duration: 5000,
      })
    })

    // ── For staff/manager: new order placed ─────────────────
    socket.on('new-order', (order) => {
      if (onOrderUpdate) onOrderUpdate(order)
      toast(`🆕 New order #${order.orderId} — ₹${order.total}`, {
        style: { background: '#1a1a1a', color: '#f5f5f0', border: '1px solid rgba(39,174,96,0.3)' },
        duration: 6000,
      })
    })

    // ── Order status changed (broadcast to all) ─────────────
    socket.on('order-status-updated', (data) => {
      if (onOrderUpdate) onOrderUpdate(data)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected')
    })

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message)
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id || user?._id])

  return socketRef.current
}
