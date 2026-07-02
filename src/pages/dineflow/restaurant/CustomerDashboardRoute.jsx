import { useSelector } from 'react-redux'
import { isSuperAdminUser } from '../../../utils/panelRole'
import UserDashboard from './UserDashboard'
import SuperAdminCustomerDashboard from './SuperAdminCustomerDashboard'

/** Real customers see UserDashboard; super admin preview sees customer insights. */
export default function CustomerDashboardRoute() {
  const { user } = useSelector((s) => s.auth)
  const { impersonating } = useSelector((s) => s.tenant)

  if (isSuperAdminUser(user) && impersonating) {
    return <SuperAdminCustomerDashboard />
  }

  return <UserDashboard />
}
