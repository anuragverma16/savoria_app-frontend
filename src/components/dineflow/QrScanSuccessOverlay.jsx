import { motion } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

export default function QrScanSuccessOverlay({ tableNumber, onDone }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-white/[0.06] backdrop-blur-2xl p-8 text-center shadow-2xl shadow-emerald-500/20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 18 }}
          className="mx-auto mb-5 w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center"
        >
          <FiCheck className="text-emerald-300" size={36} strokeWidth={3} />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Table linked!</h2>
        <p className="text-emerald-300 text-lg font-semibold mt-2">
          Table #{tableNumber || '—'}
        </p>
        <p className="text-white/45 text-sm mt-2">Opening menu…</p>
        <motion.div className="mt-6 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-emerald-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            onAnimationComplete={onDone}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
