import {
  sendWhatsappOtp,
  verifyWhatsappOtp,
  maskPhone,
} from './savoriaWhatsappOtp'
import { platformAPI } from '../api/dineflow'

export function normalizeProvisionPhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(0, 10)
}

export function maskProvisionPhone(phone) {
  return maskPhone(normalizeProvisionPhone(phone))
}

/** Same WhatsApp OTP pipeline as super-admin login */
export async function sendProvisionWhatsAppOtp(phone) {
  const digits = normalizeProvisionPhone(phone)
  if (digits.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number')
  }
  return sendWhatsappOtp(digits, 'provision')
}

export async function verifyProvisionWhatsAppOtp(phone, code) {
  const digits = normalizeProvisionPhone(phone)
  if (digits.length !== 10) {
    throw new Error('Enter a valid 10-digit mobile number')
  }
  return verifyWhatsappOtp(digits, code, {}, 'provision')
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

/** Validate staff/admin can be added before sending OTP */
export async function precheckRestaurantProvision(restaurantId, { name, email, phone, role }) {
  if (!restaurantId) {
    throw new Error('Select a restaurant first')
  }
  await platformAPI.precheckRestaurantProvision(restaurantId, {
    name: String(name || '').trim(),
    email: String(email || '').trim().toLowerCase(),
    phone: normalizeProvisionPhone(phone),
    role,
  })
}
