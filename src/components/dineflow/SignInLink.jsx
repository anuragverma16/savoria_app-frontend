import { Link } from 'react-router-dom'
import { resetPageLocks } from '../../utils/resetPageLocks'

export default function SignInLink({ to = '/login', className = '', children, onClick }) {
  return (
    <Link
      to={to}
      className={className}
      onClick={(e) => {
        resetPageLocks()
        onClick?.(e)
      }}
    >
      {children}
    </Link>
  )
}
