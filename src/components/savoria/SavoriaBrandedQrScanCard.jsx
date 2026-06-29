import { QRCodeSVG } from 'qrcode.react'

export default function SavoriaBrandedQrScanCard({
  onClick,
  restaurantName = 'SAVORIA',
  hint = 'Tap to open scanner',
  className = '',
  compact = false,
}) {
  const brand = String(restaurantName || 'SAVORIA').toUpperCase().trim()
  const initial = brand.charAt(0) || 'S'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`sv-branded-qr-scan-card group ${compact ? 'sv-branded-qr-scan-card--compact' : ''} ${className}`}
      aria-label="Scan table QR code"
    >
      <div className="sv-branded-qr-scan-frame">
        <div className="sv-branded-qr-scan-code">
          <QRCodeSVG
            value="SAVORIA-TABLE-SCAN"
            size={compact ? 168 : 220}
            level="M"
            bgColor="#ffffff"
            fgColor="#111111"
            className="sv-branded-qr-scan-matrix"
          />
          <div className="sv-branded-qr-scan-center" aria-hidden>
            <span className="sv-branded-qr-scan-initial">{initial}</span>
            <span className="sv-branded-qr-scan-cta">SCAN TO VIEW MENU &amp; PAY</span>
          </div>
        </div>
        <div className="sv-branded-qr-scan-brand">
          <p className="sv-branded-qr-scan-name">{brand}</p>
          <p className="sv-branded-qr-scan-type">RESTAURANT</p>
        </div>
      </div>
      <p className="sv-branded-qr-scan-hint">{hint}</p>
    </button>
  )
}
