import { platformAPI } from '../api/dineflow'

export function normalizeProvisionPhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(0, 10)
}

export function maskProvisionPhone(phone) {
  const digits = normalizeProvisionPhone(phone)
  if (digits.length < 4) return digits
  return `******${digits.slice(-4)}`
}

export async function sendProvisionWhatsAppOtp(phone) {
  try {
    const { data } = await platformAPI.sendProvisionWhatsAppOtp({
      phone: normalizeProvisionPhone(phone),
    })
    return data
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Could not send WhatsApp code'
    const error = new Error(message)
    if (err.response?.data?.resendIn) error.resendIn = err.response.data.resendIn
    throw error
  }
}

export function validateProvisionForm(createMode, form) {
  const phone = normalizeProvisionPhone(form.adminPhone)
  if (phone.length < 10) {
    return 'Enter a valid 10-digit mobile number'
  }
  if (!form.adminName?.trim()) {
    return 'Enter the person\'s full name'
  }
  if (!form.adminEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) {
    return 'Enter a valid email address'
  }
  if (createMode === 'restaurant') {
    if (!form.restaurantName?.trim()) return 'Restaurant name is required'
    if (!form.city?.trim()) return 'City is required'
  }
  return null
}
