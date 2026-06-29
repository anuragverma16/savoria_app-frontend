import { Outlet } from 'react-router-dom'
import SavoriaThemeToggle from '../components/savoria/SavoriaThemeToggle'
import SavoriaFloatingCart from '../components/savoria/SavoriaFloatingCart'
import '../savoria-guest.css'

function SavoriaShell() {
  return (
    <div className="sv-page min-h-[100dvh] relative">
      <div className="fixed top-4 right-4 z-30">
        <SavoriaThemeToggle />
      </div>
      <div className="sv-page-inner">
        <Outlet />
      </div>
      <SavoriaFloatingCart />
    </div>
  )
}

export default function SavoriaGuestLayout() {
  return <SavoriaShell />
}
