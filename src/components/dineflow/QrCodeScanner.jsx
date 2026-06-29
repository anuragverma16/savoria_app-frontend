import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCamera, FiRefreshCw, FiZap } from 'react-icons/fi'
import { parseTableQr } from '../../utils/parseTableQr'

const SCAN_CONFIG = {
  fps: 12,
  qrbox: (vw, vh) => {
    const size = Math.min(vw, vh, 320) * 0.72
    return { width: Math.floor(size), height: Math.floor(size) }
  },
}

const FULLSCREEN_SCAN_CONFIG = {
  fps: 15,
  qrbox: (vw, vh) => {
    const size = Math.min(vw, vh) * 0.68
    return { width: Math.floor(size), height: Math.floor(size) }
  },
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

function pickRearCamera(cameras) {
  if (!cameras?.length) return null
  const rear = cameras.find((c) => /back|rear|environment/i.test(c.label))
  if (rear) return rear.id
  return cameras[cameras.length - 1].id
}

function pickWebcam(cameras) {
  if (!cameras?.length) return null
  const builtIn = cameras.find((c) => /integrated|webcam|usb/i.test(c.label))
  if (builtIn) return builtIn.id
  const front = cameras.find((c) => /front|user|face/i.test(c.label))
  if (front) return front.id
  return cameras[0].id
}

function isValidTableQr(parsed) {
  if (!parsed) return false
  if (parsed.restaurantId && parsed.tableId) return true
  if (parsed.tableId || parsed.tableToken) return true
  return false
}

function cameraErrorMessage(err) {
  const name = err?.name || ''
  const msg = String(err?.message || err || '')

  if (!window.isSecureContext) {
    return {
      title: 'Use localhost or HTTPS',
      detail: 'Open the app via localhost or HTTPS so the camera can work.',
    }
  }

  if (name === 'NotAllowedError') {
    return {
      title: 'Camera blocked',
      detail: 'Allow camera access in your browser settings, then try again.',
    }
  }

  if (name === 'NotFoundError' || /no camera|not found/i.test(msg)) {
    return { title: 'No camera found', detail: 'Use a device with a camera to scan.' }
  }

  if (name === 'NotReadableError' || name === 'TrackStartError' || /in use/i.test(msg)) {
    return { title: 'Camera is busy', detail: 'Close other apps using the camera and retry.' }
  }

  return {
    title: 'Could not open camera',
    detail: 'Tap retry to open the scanner again.',
  }
}

async function waitForElement(id) {
  for (let i = 0; i < 40; i += 1) {
    if (document.getElementById(id)) return
    await new Promise((r) => requestAnimationFrame(r))
  }
}

function clearRegion(regionId) {
  const el = document.getElementById(regionId)
  if (el) el.innerHTML = ''
}

async function warmUpCamera(preferRear) {
  const constraints = preferRear
    ? [{ video: { facingMode: 'environment' } }, { video: { facingMode: 'user' } }, { video: true }]
    : [{ video: { facingMode: 'user' } }, { video: true }]

  let lastErr
  for (const c of constraints) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(c)
      stream.getTracks().forEach((t) => t.stop())
      return
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('Could not access camera')
}

async function startScannerCamera(html5Qr, onDecoded, preferRear, fullscreen) {
  const onScan = (text) => onDecoded(text)
  const config = fullscreen ? FULLSCREEN_SCAN_CONFIG : SCAN_CONFIG
  const cameras = await Html5Qrcode.getCameras().catch(() => [])

  if (cameras.length > 0) {
    const cameraId = preferRear ? pickRearCamera(cameras) : pickWebcam(cameras)
    try {
      await html5Qr.start(cameraId, config, onScan, () => {})
      return
    } catch (err) {
      if (html5Qr.isScanning) await html5Qr.stop().catch(() => {})
      const fallbackId = cameras.find((c) => c.id !== cameraId)?.id
      if (fallbackId) {
        await html5Qr.start(fallbackId, config, onScan, () => {})
        return
      }
      throw err
    }
  }

  await html5Qr.start({ facingMode: preferRear ? 'environment' : 'user' }, config, onScan, () => {})
}

export default function QrCodeScanner({
  active = true,
  paused = false,
  autoStart = false,
  fullscreen = false,
  restaurantId,
  restaurantSlug,
  onScan,
  onError,
}) {
  const reactId = useId().replace(/:/g, '')
  const regionId = `qr-scanner-${reactId}`
  const scannerRef = useRef(null)
  const scannedRef = useRef(false)
  const startingRef = useRef(false)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  const preferRear = useRef(isMobileDevice())
  const torchTrackRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const [needsTap, setNeedsTap] = useState(!autoStart)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)

  onScanRef.current = onScan
  onErrorRef.current = onError

  const stopScanner = useCallback(async () => {
    if (torchTrackRef.current) {
      try {
        await torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] })
      } catch { /* ignore */ }
      torchTrackRef.current = null
    }
    setTorchOn(false)
    setTorchAvailable(false)

    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner?.isScanning) await scanner.stop().catch(() => {})
    if (scanner) await scanner.clear().catch(() => {})
    clearRegion(regionId)
    setCameraOn(false)
  }, [regionId])

  const detectTorch = useCallback(() => {
    const video = document.querySelector(`#${regionId} video`)
    const track = video?.srcObject?.getVideoTracks?.()?.[0]
    if (track?.getCapabilities?.()?.torch) {
      torchTrackRef.current = track
      setTorchAvailable(true)
    }
  }, [regionId])

  const startCamera = useCallback(async () => {
    if (startingRef.current) return
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = cameraErrorMessage({ name: 'NotFoundError' })
      setError(err)
      onErrorRef.current?.(err)
      return
    }
    if (!window.isSecureContext) {
      const err = cameraErrorMessage({})
      setError(err)
      onErrorRef.current?.(err)
      return
    }

    startingRef.current = true
    scannedRef.current = false
    setStarting(true)
    setError(null)
    setNeedsTap(false)

    try {
      await stopScanner()
      await waitForElement(regionId)
      clearRegion(regionId)
      await warmUpCamera(preferRear.current)

      const html5Qr = new Html5Qrcode(regionId, { verbose: false })
      scannerRef.current = html5Qr

      const onDecoded = (decodedText) => {
        if (scannedRef.current || paused) return

        const parsed = parseTableQr(decodedText)
        if (!isValidTableQr(parsed)) {
          const err = { title: 'Invalid QR', detail: 'Scan the QR code on your restaurant table.' }
          setError(err)
          onErrorRef.current?.(err)
          return
        }

        if (parsed.rid && restaurantId && String(parsed.rid) !== String(restaurantId)) {
          const err = { title: 'Wrong restaurant', detail: 'This QR belongs to another restaurant.' }
          setError(err)
          onErrorRef.current?.(err)
          return
        }

        if (parsed.slug && restaurantSlug && parsed.slug !== restaurantSlug) {
          const err = { title: 'Wrong restaurant', detail: 'This QR belongs to another restaurant.' }
          setError(err)
          onErrorRef.current?.(err)
          return
        }

        scannedRef.current = true
        stopScanner()
        onScanRef.current(parsed)
      }

      await startScannerCamera(html5Qr, onDecoded, preferRear.current, fullscreen)
      setCameraOn(true)
      setTimeout(detectTorch, 400)
    } catch (err) {
      const mapped = cameraErrorMessage(err)
      setError(mapped)
      onErrorRef.current?.(mapped)
      setCameraOn(false)
      setNeedsTap(true)
    } finally {
      setStarting(false)
      startingRef.current = false
    }
  }, [regionId, restaurantId, restaurantSlug, paused, fullscreen, stopScanner, detectTorch])

  const toggleTorch = async () => {
    const track = torchTrackRef.current
    if (!track) return
    try {
      const next = !torchOn
      await track.applyConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch { /* ignore */ }
  }

  useEffect(() => () => { stopScanner() }, [stopScanner])

  useEffect(() => {
    if (!active || paused) stopScanner()
  }, [active, paused, stopScanner])

  useEffect(() => {
    if (active && autoStart && !cameraOn && !starting) {
      const t = setTimeout(() => startCamera(), 120)
      return () => clearTimeout(t)
    }
    return undefined
  }, [active, autoStart, cameraOn, starting, startCamera])

  const handleStart = () => {
    scannedRef.current = false
    startCamera()
  }

  const frameSize = fullscreen ? 'min(78vw, 78vh)' : 'min(72vw, 280px)'

  const scannerBody = (
    <div className={`relative w-full ${fullscreen ? 'h-full min-h-0' : 'max-w-md mx-auto'}`}>
      <div className={`relative overflow-hidden ${fullscreen ? 'h-full bg-black' : 'rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl shadow-emerald-500/10'}`}>
        <div className={`relative bg-black ${fullscreen ? 'absolute inset-0' : 'aspect-[4/5] sm:aspect-square min-h-[280px]'}`}>
          <div
            id={regionId}
            className={`absolute inset-0 z-0 [&_video]:!object-cover [&_video]:!w-full [&_video]:!h-full ${fullscreen ? 'sv-scanner-video-full' : ''}`}
          />

          {fullscreen && cameraOn && (
            <div className="absolute inset-0 z-[5] pointer-events-none sv-scanner-dim" />
          )}

          {needsTap && !cameraOn && !starting && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center ${fullscreen ? 'bg-black' : 'bg-slate-950/85 backdrop-blur-sm'}`}>
              <FiCamera className="text-emerald-400 mb-4" size={fullscreen ? 56 : 44} />
              <p className="text-white font-medium text-base mb-1">Scan table QR</p>
              <p className="text-white/45 text-sm mb-6 max-w-xs">
                {fullscreen ? 'Allow camera access to scan like a payment app' : 'Tap to open camera'}
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30"
              >
                <FiCamera size={18} />
                Open scanner
              </button>
            </div>
          )}

          {starting && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 rounded-full border-[3px] border-emerald-400/25 border-t-emerald-400 mb-4"
              />
              <p className="text-white/80 text-sm font-medium">Starting camera…</p>
            </div>
          )}

          {cameraOn && !paused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <motion.div
                className="relative"
                style={{ width: frameSize, height: frameSize }}
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <span className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl" />
                <span className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl" />
                <span className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl" />
                <span className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl" />
                <motion.div
                  className="absolute left-3 right-3 h-[3px] bg-emerald-400 rounded-full shadow-[0_0_16px_rgba(52,211,153,0.9)]"
                  animate={{ top: ['10%', '88%', '10%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>
          )}
        </div>

        {!fullscreen && (
          <div className="px-5 py-4 border-t border-white/10 bg-white/[0.03] backdrop-blur-md">
            <p className="text-center text-white/70 text-sm font-medium">Align the table QR inside the frame</p>
          </div>
        )}
      </div>

      {error && !fullscreen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-center"
        >
          <p className="text-red-300 font-semibold text-sm">{error.title}</p>
          <p className="text-red-200/70 text-xs mt-1">{error.detail}</p>
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
          >
            <FiRefreshCw size={15} /> Retry
          </button>
        </motion.div>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="sv-mobile-scanner-camera flex-1 min-h-0 relative flex flex-col">
        {scannerBody}
        {torchAvailable && cameraOn && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`sv-mobile-scanner-torch ${torchOn ? 'sv-mobile-scanner-torch--on' : ''}`}
            aria-label="Toggle flashlight"
          >
            <FiZap size={22} />
          </button>
        )}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-28 left-4 right-4 z-30 p-4 rounded-2xl bg-red-500/90 text-white text-center"
            >
              <p className="font-semibold text-sm">{error.title}</p>
              <p className="text-xs mt-1 opacity-90">{error.detail}</p>
              <button type="button" onClick={handleStart} className="mt-3 px-5 py-2 rounded-full bg-white text-red-600 text-xs font-bold">
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return scannerBody
}
