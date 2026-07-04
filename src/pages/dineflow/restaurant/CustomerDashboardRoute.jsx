import { useSelector } from 'react-redux'
import { isSuperAdminUser } from '../../../utils/panelRole'
import SuperAdminCustomerDashboard from './SuperAdminCustomerDashboard'
import OrderUserRedirect from '../../../components/OrderUserRedirect'

/** Super admin preview only; real customers use /order/* */
export default function CustomerDashboardRoute() {
  const { user } = useSelector((s) => s.auth)
  const { impersonating } = useSelector((s) => s.tenant)

  if (isSuperAdminUser(user) && impersonating) {
    return <SuperAdminCustomerDashboard />
  }

  return <OrderUserRedirect segment="dashboard" />
}
