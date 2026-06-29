import SavoriaUserAuthForm from './SavoriaUserAuthForm'

export default function SavoriaAuthPanel({ mode = 'login', onSuccess }) {
  return (
    <div className={`sv-auth-box ${mode === 'signup' ? 'sv-auth-box--signup' : 'sv-auth-box--user'}`}>
      <SavoriaUserAuthForm mode={mode} onSuccess={onSuccess} />
    </div>
  )
}
