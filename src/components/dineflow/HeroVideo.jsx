const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1920&q=90&auto=format&fit=crop'

export default function HeroVideo({ variant = 'default', poster = DEFAULT_POSTER, src = '/videos/pizza.mp4' }) {
  const isCinema = variant === 'cinema'

  return (
    <div
      className={
        isCinema
          ? 'lp-cinema-video relative w-full h-full min-h-[240px] sm:min-h-[300px] lg:min-h-[360px] bg-black'
          : 'df-hero-video relative aspect-video w-full bg-slate-900'
      }
    >
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        defaultMuted
        playsInline
        preload="auto"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
    </div>
  )
}
