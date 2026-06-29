import toast from 'react-hot-toast'
import { FiAlertCircle, FiCheckCircle, FiMail, FiX } from 'react-icons/fi'

const TONE_STYLES = {
  success: {
    wrap: 'bg-emerald-50 border-emerald-200/80 text-emerald-950',
    icon: 'bg-emerald-500 text-white',
  },
  error: {
    wrap: 'bg-red-50 border-red-200/80 text-red-950',
    icon: 'bg-red-500 text-white',
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200/80 text-amber-950',
    icon: 'bg-amber-500 text-white',
  },
  info: {
    wrap: 'bg-slate-50 border-slate-200/80 text-slate-950',
    icon: 'bg-slate-700 text-white',
  },
}

function RichToast({ t, tone, icon: Icon, title, message, highlight }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.info

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } pointer-events-auto flex w-full min-w-[280px] max-w-[min(100vw-2rem,380px)] items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl shadow-black/15 ${styles.wrap}`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-semibold text-sm leading-snug">{title}</p>
        {highlight ? (
          <p className="mt-2 font-mono text-2xl font-bold tracking-[0.35em] text-emerald-700">{highlight}</p>
        ) : null}
        {message ? <p className="mt-1 text-xs leading-relaxed opacity-90">{message}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 rounded-lg p-1 opacity-50 transition hover:bg-black/5 hover:opacity-100"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>
    </div>
  )
}

function showRichToast(tone, { title, message, icon, highlight, duration = 5000 }) {
  return toast.custom(
    (t) => (
      <RichToast t={t} tone={tone} icon={icon} title={title} message={message} highlight={highlight} />
    ),
    { duration },
  )
}

export function showSuccessToast(title, message, options = {}) {
  return showRichToast('success', {
    title,
    message,
    icon: FiCheckCircle,
    duration: options.duration ?? 5000,
  })
}

export function showErrorToast(title, message, options = {}) {
  return showRichToast('error', {
    title,
    message,
    icon: FiAlertCircle,
    duration: options.duration ?? 5500,
  })
}

export function showContactSentToast() {
  return showRichToast('success', {
    title: 'Message sent!',
    message: null,
    icon: FiMail,
    duration: 3500,
  })
}

export function showContactValidationToast() {
  return showErrorToast('Fill name, email & message', null, { duration: 3500 })
}

export function showContactErrorToast(serverMessage) {
  const msg = String(serverMessage || '').trim()
  if (/too many/i.test(msg)) {
    return showErrorToast('Too many tries — wait a bit', null, { duration: 4000 })
  }
  if (/email/i.test(msg)) {
    return showErrorToast('Enter a valid email', null, { duration: 3500 })
  }
  if (/name/i.test(msg)) {
    return showErrorToast('Name is required', null, { duration: 3500 })
  }
  if (/message/i.test(msg)) {
    return showErrorToast('Message is too short', null, { duration: 3500 })
  }
  return showErrorToast('Send failed — try again', null, { duration: 4000 })
}

export function showOtpSentToast(maskedTarget, { whatsapp = true, label, sender } = {}) {
  const channel = label || (whatsapp ? 'WhatsApp' : 'email')
  const fromLine = sender ? ` from ${sender}` : ''
  return showSuccessToast(
    `Code sent to your ${channel}`,
    `Check ${channel === 'email' ? 'inbox' : channel}${fromLine} at ${maskedTarget}`,
    { duration: 8000 },
  )
}

export function showOtpDevToast(code) {
  return showRichToast('warning', {
    title: 'Your verification code',
    highlight: code,
    message: 'Email not configured. Use this code below, or add EMAIL_USER + EMAIL_PASS to backend/.env',
    icon: FiCheckCircle,
    duration: 30000,
  })
}

export function showOtpErrorToast(message) {
  const msg = String(message || 'Could not send OTP. Please try again.').trim()
  return showErrorToast('OTP failed', msg, { duration: 8000 })
}

export function showOtpVerifyErrorToast(message) {
  const msg = String(message || 'Invalid OTP. Please try again.').trim()
  return showErrorToast('Verification failed', msg, { duration: 6000 })
}
