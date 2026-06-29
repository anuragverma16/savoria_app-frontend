import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const TEMPLATE_PATH = '/invoice-template.pdf'

function formatAddress(address = {}) {
  return [
    address.street,
    [address.city, address.state].filter(Boolean).join(', '),
    address.pincode,
    address.country,
  ].filter(Boolean).join('\n')
}

function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sanitizeFilePart(value, fallback = 'Guest') {
  const cleaned = String(value || fallback).replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return cleaned || fallback
}

export function getInvoiceFileName({ order, restaurant, guestName }) {
  const rest = sanitizeFilePart(restaurant?.name, 'Savoria')
  const guest = sanitizeFilePart(guestName || order?.guest?.name, 'Guest')
  const id = order?.orderId || 'ORDER'
  return `${rest}-Invoice-${id}-${guest}.pdf`
}

function couponDiscount(order) {
  return Math.max(0, (Number(order?.discount) || 0) - (Number(order?.welcomeDiscount) || 0))
}

function buildInvoiceDoc({ order, restaurant, guestName, guestPhone }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  let y = 18
  const name = guestName || order.guest?.name || 'Guest'
  const phone = guestPhone || order.guest?.phone || '—'
  const tableId = order.table?._id || order.table
  const taxRate = restaurant?.settings?.taxRate || 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(restaurant?.name || 'Restaurant', margin, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  y += 7
  const address = formatAddress(restaurant?.address)
  if (address) {
    doc.text(address.split('\n'), margin, y)
    y += address.split('\n').length * 4.5
  }
  if (restaurant?.phone) {
    doc.text(`Phone: ${restaurant.phone}`, margin, y)
    y += 4.5
  }
  if (restaurant?.email) {
    doc.text(`Email: ${restaurant.email}`, margin, y)
    y += 4.5
  }
  if (restaurant?.gstNumber) {
    doc.text(`GSTIN: ${restaurant.gstNumber}`, margin, y)
    y += 4.5
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('TAX INVOICE', pageWidth - margin, 18, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let ry = 26
  doc.text(`Invoice No: ${order.orderId}`, pageWidth - margin, ry, { align: 'right' })
  ry += 5
  doc.text(`Date: ${formatDate(order.createdAt || new Date())}`, pageWidth - margin, ry, { align: 'right' })
  ry += 5
  doc.text(`Status: ${order.status || 'pending'}`, pageWidth - margin, ry, { align: 'right' })
  ry += 5
  doc.text(`Order type: ${order.orderType || 'dine-in'}`, pageWidth - margin, ry, { align: 'right' })
  if (order.tableNumber) {
    ry += 5
    doc.text(`Table No: ${order.tableNumber}`, pageWidth - margin, ry, { align: 'right' })
  }
  if (tableId) {
    ry += 5
    doc.text(`Table ID: ${tableId}`, pageWidth - margin, ry, { align: 'right' })
  }

  y = Math.max(y + 6, ry + 4)
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Bill To', margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(name, margin, y)
  y += 4.5
  doc.text(`Phone: ${phone}`, margin, y)
  y += 4.5
  if (order.guest?.guestCount) {
    doc.text(`Guests: ${order.guest.guestCount}`, margin, y)
    y += 4.5
  }
  if (order.specialInstructions) {
    doc.text(`Note: ${order.specialInstructions}`, margin, y, { maxWidth: pageWidth - margin * 2 })
    y += 8
  } else {
    y += 4
  }

  const rows = (order.items || []).map((item) => [
    item.name,
    String(item.qty),
    `₹${item.price}`,
    `₹${(Number(item.price) || 0) * (Number(item.qty) || 1)}`,
  ])

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Rate (₹)', 'Amount (₹)']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    margin: { left: margin, right: margin },
  })

  y = doc.lastAutoTable.finalY + 8
  const summaryX = pageWidth - margin - 72

  const addRow = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 11 : 9)
    doc.text(label, summaryX, y)
    doc.text(value, pageWidth - margin, y, { align: 'right' })
    y += bold ? 6 : 5
  }

  addRow('Subtotal', `₹${order.subtotal ?? 0}`)
  addRow(`GST (${taxRate}%)`, `₹${order.tax ?? 0}`)
  if (order.serviceCharge > 0) addRow('Service charge', `₹${order.serviceCharge}`)
  if (order.welcomeDiscount > 0) addRow('Welcome discount', `−₹${order.welcomeDiscount}`)
  const coupon = couponDiscount(order)
  if (coupon > 0) addRow(`Coupon${order.couponCode ? ` (${order.couponCode})` : ''}`, `−₹${coupon}`)
  y += 2
  doc.setDrawColor(200, 200, 200)
  doc.line(summaryX, y - 2, pageWidth - margin, y - 2)
  addRow('Grand Total', `₹${order.total ?? 0}`, true)

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Payment method: ${(order.paymentMethod || 'upi').toUpperCase()}`, margin, y)
  y += 4.5
  doc.text(`Payment status: ${order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}`, margin, y)
  if (order.razorpayPaymentId) {
    y += 4.5
    doc.text(`Transaction ID: ${order.razorpayPaymentId}`, margin, y)
  }

  y += 10
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Computer-generated invoice. Thank you for dining with us!', margin, y)

  return doc
}

async function tryTemplateOverlay(payload) {
  try {
    const res = await fetch(TEMPLATE_PATH, { method: 'HEAD' })
    if (!res.ok) return null
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const bytes = await fetch(TEMPLATE_PATH).then((r) => r.arrayBuffer())
    const pdfDoc = await PDFDocument.load(bytes)
    const page = pdfDoc.getPages()[0]
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const { order, restaurant, guestName, guestPhone } = payload
    const name = guestName || order.guest?.name || 'Guest'
    const phone = guestPhone || order.guest?.phone || ''
    const tableId = order.table?._id || order.table

    const lines = [
      { text: restaurant?.name || 'Restaurant', x: 50, y: 750, size: 14, f: bold },
      { text: `Invoice: ${order.orderId}`, x: 50, y: 730, size: 10, f: font },
      { text: `Date: ${formatDate(order.createdAt)}`, x: 50, y: 715, size: 10, f: font },
      { text: `Guest: ${name}`, x: 50, y: 695, size: 10, f: font },
      { text: `Phone: ${phone}`, x: 50, y: 680, size: 10, f: font },
      { text: `Table: ${order.tableNumber || '—'}`, x: 50, y: 665, size: 10, f: font },
      { text: `Table ID: ${tableId || '—'}`, x: 50, y: 650, size: 10, f: font },
      { text: `Total: ₹${order.total ?? 0}`, x: 50, y: 630, size: 12, f: bold },
      { text: `Payment: ${(order.paymentMethod || 'upi').toUpperCase()} · ${order.paymentStatus || 'paid'}`, x: 50, y: 615, size: 9, f: font },
    ]

    lines.forEach(({ text, x, y, size, f }) => {
      page.drawText(text, { x, y, size, font: f, color: rgb(0.1, 0.1, 0.1) })
    })

    const itemLines = (order.items || []).slice(0, 12).map((item, i) =>
      `${item.qty}x ${item.name} — ₹${(item.price || 0) * (item.qty || 1)}`,
    )
    itemLines.forEach((line, i) => {
      page.drawText(line, { x: 50, y: 590 - i * 14, size: 9, font, color: rgb(0.2, 0.2, 0.2) })
    })

    return pdfDoc.save()
  } catch {
    return null
  }
}

export async function downloadOrderInvoice(payload) {
  const fileName = getInvoiceFileName(payload)
  const templateBytes = await tryTemplateOverlay(payload)

  if (templateBytes) {
    const blob = new Blob([templateBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const doc = buildInvoiceDoc(payload)
  doc.save(fileName)
}
