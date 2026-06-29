import { Link } from 'react-router-dom'
import { FiLock, FiArrowLeft } from 'react-icons/fi'
import BrandLogo from '../../components/dineflow/BrandLogo'
import BrandMark from '../../components/dineflow/BrandMark'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2 mb-10">
        <BrandMark size="sm" />
        <BrandLogo className="text-lg" />
      </div>

      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-6">
        <FiLock className="text-orange-500" size={28} />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
        Access denied
      </h1>
      <p className="text-slate-500 max-w-md mb-8 text-sm sm:text-base">
        You don&apos;t have permission to view this page. Sign in with the correct account
        or contact your restaurant administrator.
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
          to="/login?role=user"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
