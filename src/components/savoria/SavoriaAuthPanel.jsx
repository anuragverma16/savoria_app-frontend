import SavoriaUserAuthForm from './SavoriaUserAuthForm'

export default function SavoriaAuthPanel({ mode = 'login', loginRole, onSuccess }) {
  return (
    <div className={`sv-auth-box ${mode === 'signup' ? 'sv-auth-box--signup' : 'sv-auth-box--user'}`}>
      <SavoriaUserAuthForm mode={mode} loginRole={loginRole} onSuccess={onSuccess} />
    </div>
  )
}
