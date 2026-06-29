import { SiGooglepay, SiPhonepe, SiPaytm } from 'react-icons/si'
import { FiCreditCard, FiDollarSign, FiSmartphone } from 'react-icons/fi'

const PAYMENT_OPTIONS = [
  { id: 'upi', label: 'UPI', icon: FiSmartphone, color: '#6366f1' },
  { id: 'gpay', label: 'Google Pay', icon: SiGooglepay, color: '#4285F4' },
  { id: 'phonepe', label: 'PhonePe', icon: SiPhonepe, color: '#5f259f' },
  { id: 'paytm', label: 'Paytm', icon: SiPaytm, color: '#00BAF2' },
  { id: 'card', label: 'Credit / Debit Card', icon: FiCreditCard, color: '#f97316' },
  { id: 'cash', label: 'Cash at Table', icon: FiDollarSign, color: '#16a34a' },
]

export default function SavoriaPaymentSelector({ selected, onSelect }) {
  return (
    <div className="space-y-2">
      {PAYMENT_OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isSelected = selected === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`sv-payment-option w-full ${isSelected ? 'selected' : ''}`}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${opt.color}18`, color: opt.color }}
            >
              <Icon size={22} />
            </div>
            <span className="font-medium text-[var(--sv-text)]">{opt.label}</span>
            <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[var(--sv-accent)] bg-[var(--sv-accent)]' : 'border-[var(--sv-border)]'}`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-[#1a1510]" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export { PAYMENT_OPTIONS }
