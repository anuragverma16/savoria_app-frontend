import { useSavoriaGuest } from '../contexts/SavoriaGuestContext'
import SavoriaAuthGateModal from './savoria/SavoriaAuthGateModal'

/** Global auth popup — mounted once at app root */
export default function AppAuthModal() {
  const {
    authGateOpen,
    authGateMode,
    authGateRedirect,
    closeAuthModal,
  } = useSavoriaGuest()

  return (
    <SavoriaAuthGateModal
      open={authGateOpen}
      mode={authGateMode}
      redirectPath={authGateRedirect}
      onClose={closeAuthModal}
    />
  )
}
