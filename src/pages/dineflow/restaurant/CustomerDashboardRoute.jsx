import { useSelector } from 'react-redux'
import { isSuperAdminUser } from '../../../utils/panelRole'
import SuperAdminCustomerDashboard from './SuperAdminCustomerDashboard'
import OrderUserRedirect from '../../../components/OrderUserRedirect'

/** Super admin preview only; real customers use /order/* */
export default function CustomerDashboardRoute() {
  const { user } = useSelector((s) => s.auth)

  if (isSuperAdminUser(user)) {
    return <SuperAdminCustomerDashboard />
  }

  return <OrderUserRedirect segment="dashboard" />
}
