import { authAPI } from '../api/dineflow'

export function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  return digits.length >= 10 ? `+${digits}` : null
}

export function maskPhone(phone) {
  const n = normalizePhone(phone)
  if (!n) return phone
  return `${n.slice(0, 3)} •••• ••${n.slice(-2)}`
}

function otpError(err, fallback) {
  let message = err.response?.data?.message || err.message || fallback

  if (/please wait \d+s/i.test(message)) {
    const error = new Error(message)
    if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
    return error
  }

  if (/channel|whatsapp|14155238886/i.test(message)) {
    message = 'Could not send OTP. Check your number and try again.'
  } else if (/invalid.*phone|10-digit/i.test(message)) {
    message = 'Enter a valid 10-digit mobile number.'
  }

  const error = new Error(message)
  if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
  return error
}

export async function sendOtp(phone) {
  const normalized = normalizePhone(phone)
  if (!normalized || normalized.length < 12) {
    throw new Error('Enter a valid 10-digit mobile number')
  }

  try {
    const { data } = await authAPI.sendOtp({ phone: normalized })
    return data
  } catch (err) {
    throw otpError(err, 'Could not send OTP to your number. Check the number and try again.')
  }
}

export async function verifyOtp(phone, code, profile = {}) {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    throw new Error('Enter a valid mobile number')
  }

  try {
    const { data } = await authAPI.verifyOtp({
      phone: normalized,
      code: String(code).trim(),
      name: profile.name,
      restaurantName: profile.restaurantName,
    })
    return data.user
  } catch (err) {
    throw otpError(err, 'Invalid OTP. Please check the code and try again.')
  }
}
