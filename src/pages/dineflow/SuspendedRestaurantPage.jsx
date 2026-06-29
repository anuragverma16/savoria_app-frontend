import { Link, useLocation } from 'react-router-dom'
import { FiSlash, FiArrowLeft } from 'react-icons/fi'
import BrandLogo from '../../components/dineflow/BrandLogo'
import BrandMark from '../../components/dineflow/BrandMark'
import { RESTAURANT_SUSPENDED_MESSAGE } from '../../utils/panelRole'

export default function SuspendedRestaurantPage() {
  const location = useLocation()
  const restaurantName = location.state?.restaurantName || new URLSearchParams(location.search).get('name')

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2 mb-10">
        <BrandMark size="sm" />
        <BrandLogo className="text-lg" />
      </div>

      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <FiSlash className="text-red-500" size={28} />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
        Restaurant suspended
      </h1>
      {restaurantName && (
        <p className="text-slate-700 font-medium mb-2">{restaurantName}</p>
      )}
      <p className="text-slate-500 max-w-md mb-8 text-sm sm:text-base">
        {RESTAURANT_SUSPENDED_MESSAGE}. Please contact support for assistance.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
        >
          <FiArrowLeft size={16} />
          Back to home
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
