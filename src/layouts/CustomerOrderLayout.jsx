import { Outlet } from 'react-router-dom'
import SavoriaPublicBootstrap from '../components/SavoriaPublicBootstrap'
import SavoriaGuestLayout from './SavoriaGuestLayout'

export default function CustomerOrderLayout() {
  return (
    <SavoriaPublicBootstrap>
      <SavoriaGuestLayout />
    </SavoriaPublicBootstrap>
  )
}
