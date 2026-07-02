import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import WhatsappOtpAuthForm from '../../components/dineflow/WhatsappOtpAuthForm'
import { hydrateTenantAfterAuth, getRedirectAfterLogin } from '../../utils/panelRole'
import { resetPageLocks } from '../../utils/resetPageLocks'
import toast from 'react-hot-toast'

const ORDER_ENTRY = '/order/tables?scan=1'

function resolveReturnPath(location) {
  const from = location.state?.from
  if (from?.pathname?.startsWith('/order')) {
    return `${from.pathname}${from.search || ''}`
  }
  return ORDER_ENTRY
}

export default function UserSignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const handleSuccess = (result) => {
    const user = result.user
    const memberships = result.memberships
    const { membership } = hydrateTenantAfterAuth(dispatch, { user, memberships, loginRole: 'user' }, 'user')
    const path = getRedirectAfterLogin(user, membership) || resolveReturnPath(location)
    toast.success(`Welcome, ${user?.name?.split(' ')[0] || 'Guest'}!`)
    resetPageLocks()
    navigate(path, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">User sign in</h1>
        <p className="text-slate-500 text-sm mb-6">
          WhatsApp OTP is required — enter the 6-digit code to continue.
        </p>
        <WhatsappOtpAuthForm mode="login" onSuccess={handleSuccess} dispatchCredentials />
      </div>
    </div>
  )
}
