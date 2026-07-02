import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import SavoriaPublicBootstrap from '../components/SavoriaPublicBootstrap'
import SavoriaGuestLayout from './SavoriaGuestLayout'
import { useTableSessionGuard } from '../hooks/useTableSessionGuard'
import { loadSavoriaSession } from '../utils/savoriaGuestSession'

function CustomerOrderShell() {
  const { activeRestaurant } = useSelector((s) => s.tenant)
  const { user, accessToken } = useSelector((s) => s.auth)
  const session = loadSavoriaSession()
  const rid = activeRestaurant?._id || session?.rid
  const isLoggedIn = Boolean(accessToken && user)

  useTableSessionGuard(rid, {
    enabled: Boolean(isLoggedIn && rid && session?.qrLinked),
    restaurant: activeRestaurant || { _id: rid, slug: session?.slug, name: session?.restaurantName },
  })

  return <SavoriaGuestLayout />
}

export default function CustomerOrderLayout() {
  return (
    <SavoriaPublicBootstrap>
      <CustomerOrderShell />
    </SavoriaPublicBootstrap>
  )
}
