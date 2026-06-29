import { authAPI } from '../api/dineflow'

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return digits.length >= 10 ? `+${digits}` : null
}

function otpError(err, fallback) {
  let message = err.response?.data?.message || err.message || fallback

  if (/not configured|not set up|EMAIL_USER|setEmailOtpConfig|server\.js/i.test(message)) {
    message = 'Email is not set up yet. The site owner must add Gmail credentials in backend/server.js and restart the server.'
  }

  if (/please wait \d+s/i.test(message)) {
    const error = new Error(message)
    if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
    return error
  }

  const error = new Error(message)
  if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
  return error
}

export async function sendEmailOtp(email, purpose, phone) {
  const trimmed = String(email || '').trim().toLowerCase()
  if (!trimmed || !trimmed.includes('@')) {
    throw new Error('Enter a valid email address')
  }

  const payload = { email: trimmed, purpose }
  if (purpose === 'login') {
    const normalized = normalizePhone(phone)
    if (!normalized) throw new Error('Enter a valid 10-digit mobile number')
    payload.phone = normalized
  }

  try {
    const { data } = await authAPI.sendEmailOtp(payload)
    return data
  } catch (err) {
    throw otpError(err, 'Could not send verification code')
  }
}

export async function verifyEmailSignup({ email, phone, code, name, restaurantName, password }) {
  const normalized = normalizePhone(phone)
  if (!normalized) throw new Error('Enter a valid mobile number')

  try {
    const { data } = await authAPI.verifyEmailSignup({
      email: String(email).trim().toLowerCase(),
      phone: normalized,
      code: String(code).trim(),
      name: String(name).trim(),
      restaurantName: String(restaurantName).trim(),
      password,
    })
    return data
  } catch (err) {
    throw otpError(err, 'Sign up failed')
  }
}

export async function verifyEmailLogin(email, phone, code) {
  const normalized = normalizePhone(phone)
  if (!normalized) throw new Error('Enter a valid mobile number')

  try {
    const { data } = await authAPI.verifyEmailLogin({
      email: String(email).trim().toLowerCase(),
      phone: normalized,
      code: String(code).trim(),
    })
    return data
  } catch (err) {
    throw otpError(err, 'Login failed')
  }
}
