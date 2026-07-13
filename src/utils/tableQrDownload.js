/** Download table QR as PNG (converts SVG data URLs to real PNG) */
export function downloadQrPng(table, restaurantName) {
  if (!table?.qrCodeUrl) return

  const filename = `${String(restaurantName || 'Savoria').replace(/\s+/g, '-')}-Table-${table.tableNumber}-QR.png`
  const src = table.qrCodeUrl

  if (src.startsWith('data:image/png')) {
    const a = document.createElement('a')
    a.href = src
    a.download = filename
    a.click()
    return
  }

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }
  img.onerror = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = filename
    a.click()
  }
  img.src = src
}
