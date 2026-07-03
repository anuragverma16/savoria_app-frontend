import { optimizeImageUrl } from '../../utils/optimizeImageUrl'

function labelFromVideoSrc(src) {
  const base = src.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
  return base
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function SpotlightVideo({ src, poster, label, className = '' }) {
  const displayLabel = label ?? labelFromVideoSrc(src)
  const resolvedPoster = poster ? optimizeImageUrl(poster, { width: 640, quality: 65 }) : undefined

  return (
    <div className={`lp-gallery-cell lp-spotlight-video min-h-[200px] sm:min-h-[260px] ${className}`}>
      <video
        className="lp-gallery-img lp-spotlight-video__media"
        autoPlay
        loop
        muted
        defaultMuted
        playsInline
        preload="metadata"
        poster={resolvedPoster}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none z-[1]" />
      <span className="absolute bottom-3 left-3 text-[11px] font-bold uppercase tracking-wider text-white z-[2] drop-shadow-lg">
        {displayLabel}
      </span>
    </div>
  )
}