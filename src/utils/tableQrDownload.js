import { jsPDF } from 'jspdf'

export function downloadQrPng(table, restaurantName) {
  if (!table?.qrCodeUrl) return
  const a = document.createElement('a')
  a.href = table.qrCodeUrl
  a.download = `${restaurantName || 'Savoria'}-Table-${table.tableNumber}-QR.png`
  a.click()
}

export function downloadQrPdf(table, restaurantName) {
  if (!table?.qrCodeUrl) return
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
  const title = String(restaurantName || 'Savoria').toUpperCase()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 74, 18, { align: 'center' })
  doc.setFontSize(11)
  doc.text(`Table ${table.tableNumber}`, 74, 26, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Scan to view menu & pay', 74, 32, { align: 'center' })

  const format = table.qrCodeUrl.includes('image/svg') ? 'SVG' : 'PNG'
  try {
    doc.addImage(table.qrCodeUrl, format, 34, 38, 80, 80)
  } catch {
    doc.text('QR preview unavailable — download PNG instead', 20, 50)
  }

  doc.save(`${title}-Table-${table.tableNumber}-QR.pdf`)
}

export function printQr(table, restaurantName) {
  if (!table?.qrCodeUrl) return
  const win = window.open('', '_blank', 'width=480,height=640')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html>
    <html><head><title>Table ${table.tableNumber} QR</title>
    <style>
      body { font-family: Georgia, serif; text-align: center; padding: 24px; }
      h1 { font-size: 22px; letter-spacing: 0.15em; margin: 0 0 4px; }
      h2 { font-size: 12px; font-weight: normal; color: #555; margin: 0 0 16px; letter-spacing: 0.2em; }
      img { width: 280px; height: 280px; }
      p { font-size: 11px; color: #666; margin-top: 12px; }
    </style></head><body>
      <h1>${String(restaurantName || 'SAVORIA').toUpperCase()}</h1>
      <h2>RESTAURANT · TABLE ${table.tableNumber}</h2>
      <img src="${table.qrCodeUrl}" alt="Table QR" />
      <p>Scan to view menu &amp; pay</p>
      <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `)
  win.document.close()
}
