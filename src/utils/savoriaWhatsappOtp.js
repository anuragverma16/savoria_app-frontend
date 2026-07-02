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

  if (/not registered|sign up first|already registered|please log in/i.test(message)) {
    const error = new Error(message)
    if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
    return error
  }

  if (/join.*415.*523.*8886|sandbox|whatsapp is not active|twilio console/i.test(message)) {
    const error = new Error(message)
    if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
    return error
  }

  if (/invalid.*phone|10-digit/i.test(message)) {
    message = 'Enter a valid 10-digit mobile number.'
  }

  const error = new Error(message)
  if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
  return error
}

export async function sendWhatsappOtp(phone, purpose = 'login', loginRole) {
  const normalized = normalizePhone(phone)
  if (!normalized || normalized.length < 12) {
    throw new Error('Enter a valid 10-digit mobile number')
  }

  try {
    const payload = { phone: normalized, purpose }
    if (loginRole === 'admin' || loginRole === 'staff') {
      payload.loginRole = loginRole
    }
    const { data } = await authAPI.sendWhatsappOtp(payload)
    return data
  } catch (err) {
    throw otpError(err, 'Could not send WhatsApp OTP. Check the number and try again.')
  }
}

export async function verifyWhatsappOtp(phone, code, profile = {}, purpose = 'login', loginRole) {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    throw new Error('Enter a valid mobile number')
  }

  try {
    const payload = {
      phone: normalized,
      code: String(code).trim(),
      purpose,
      name: profile.name,
      email: profile.email,
      restaurantName: profile.restaurantName,
    }
    if (loginRole === 'admin' || loginRole === 'staff') {
      payload.loginRole = loginRole
    }
    const { data } = await authAPI.verifyWhatsappOtp(payload)
    return data
  } catch (err) {
    throw otpError(err, 'Invalid OTP. Please check the code and try again.')
  }
}
