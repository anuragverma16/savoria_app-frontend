import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowRight, FiMaximize2, FiBarChart2, FiUsers, FiZap,
  FiCheck, FiSend, FiCalendar, FiMail, FiPhone, FiMapPin, FiPlay,
} from 'react-icons/fi'
import SiteNavbar from '../../components/dineflow/SiteNavbar'
import SiteFooter from '../../components/dineflow/SiteFooter'
import HeroVideo from '../../components/dineflow/HeroVideo'
import SpotlightVideo from '../../components/dineflow/SpotlightVideo'
import SpoonLogo from '../../components/dineflow/SpoonLogo'
import { useLandingGsap } from '../../hooks/useLandingGsap'
import { useSavoriaGuestOptional } from '../../contexts/SavoriaGuestContext'
import { publicAPI } from '../../api/dineflow'
import OptimizedImage from '../../components/OptimizedImage'
import {
  showContactErrorToast,
  showContactSentToast,
  showContactValidationToast,
} from '../../utils/appToast'

const ORDER_ENTRY = '/order/tables?scan=1'

/** Hero food chips — local burger & noodles assets + pizza */
const BURGER_HD = 'https://i.pinimg.com/736x/32/d1/ad/32d1ad6c8cf61340797e4f536c052b9b.jpg'
const NOODLES_IMG = 'https://i.pinimg.com/736x/ac/e1/30/ace1309df3647bd066b9890809d4bc4d.jpg'
const PIZZA_IMG =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=90&fit=crop'

const FOOD = {
  fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=72&auto=format&fit=crop',
  hero: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1280&q=72&auto=format&fit=crop',
  heroPizza: PIZZA_IMG,
  heroNoodles: NOODLES_IMG,
  galleryPizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a7ca7f?w=1200&q=90&fit=crop',
  galleryBurger: BURGER_HD,
  galleryPasta: 'https://images.unsplash.com/photo-1473093290779-441010016dd3?w=800&q=72&auto=format&fit=crop',
  galleryWings: 'https://images.unsplash.com/photo-1626082897516-8afb70ce5d3a?w=800&q=72&auto=format&fit=crop',
  galleryTacos: 'https://images.unsplash.com/photo-1565299585325-38d6e1552959?w=800&q=72&auto=format&fit=crop',
  gallerySteak: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=72&auto=format&fit=crop',
  galleryDessert: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=72&auto=format&fit=crop',
  galleryRamen: NOODLES_IMG,
  diningRoom: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=72&auto=format&fit=crop',
  kitchen: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=72&auto=format&fit=crop',
  spread: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=72&auto=format&fit=crop',
  rooftop: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=72&auto=format&fit=crop',
  contact: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1280&q=72&auto=format&fit=crop',
  cta: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1280&q=72&auto=format&fit=crop',
  videoPoster: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1280&q=72&auto=format&fit=crop',
  demoVideo: '/videos/add-video.mp4',
}

const HERO_CHIPS = [
  { src: FOOD.heroPizza, label: 'Pizza' },
  { src: FOOD.galleryBurger, label: 'Burgers', portrait: true },
  { src: FOOD.heroNoodles, label: 'Noodles', portrait: true },
]

const SPOTLIGHT_VIDEOS = [
  { label: 'Pizza', poster: FOOD.galleryBurger, src: '/videos/burger.mp4' },
  { label: 'Burger', poster: FOOD.galleryPizza, src: '/videos/pizza.mp4' },
  { label: 'Chicken', poster: FOOD.kitchen, src: '/videos/kitchen.mp4' },
  { label: 'Paneer Tikka', poster: FOOD.galleryPasta, src: '/videos/pasta.mp4' },
]

const MARQUEE = [
  'QR Menus', 'Live Kitchen', 'Pizza · Burger · Noodles', 'Analytics', 'Multi-Tenant',
  'Table Ordering', 'HD Food Videos', 'Real-time Sync', 'Savoria SaaS',
]

const FEATURES = [
  { icon: FiMaximize2, title: 'QR Digital Menu', desc: 'Guests scan stunning HD menus at the table', image: FOOD.diningRoom },
  { icon: FiZap, title: 'Live Kitchen', desc: 'Orders hit the pass the second they are placed', image: FOOD.kitchen },
  { icon: FiBarChart2, title: 'Deep Analytics', desc: 'Revenue, rush hours & bestsellers in one view', image: FOOD.spread },
  { icon: FiUsers, title: 'Multi-Tenant', desc: 'One platform for cafés, chains & cloud kitchens', image: FOOD.rooftop },
]

const STATS = [
  { value: '500+', label: 'Restaurants' },
  { value: '24/7', label: 'Uptime' },
  { value: '99%', label: 'Satisfaction' },
  { value: '1M+', label: 'Orders' },
]

const PLANS = [
  { name: 'Starter', price: 'Free', period: 'forever', features: ['Digital QR menu', '50 orders/mo', '1 staff'], accent: 'from-orange-500 to-amber-600' },
  { name: 'Pro', price: '₹999', period: '/mo', popular: true, features: ['Unlimited orders', 'Kitchen display', 'Analytics', '5 staff'], accent: 'from-green-500 to-emerald-600' },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Multi-location', 'API', 'Priority support', 'Branding'], accent: 'from-lime-600 to-green-700' },
]

function HdImg({ src, alt, className = '', eager = false, width = 800, fullWidth = false }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      eager={eager}
      width={width}
      fullWidth={fullWidth}
      onError={(e) => {
        const el = e.currentTarget
        if (!el.dataset.fallback) {
          el.dataset.fallback = '1'
          el.src = FOOD.fallback
          el.removeAttribute('srcset')
        }
      }}
    />
  )
}

const EMPTY_CONTACT_FORM = {
  name: '',
  email: '',
  restaurantName: '',
  message: '',
}

export default function LandingPage() {
  const pageRef = useRef(null)
  const navigate = useNavigate()
  const guestAuth = useSavoriaGuestOptional()
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT_FORM)
  const [contactSending, setContactSending] = useState(false)
  useLandingGsap(pageRef)

  const setContactField = (key) => (e) => {
    setContactForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (contactSending) return

    const name = contactForm.name.trim()
    const email = contactForm.email.trim()
    const message = contactForm.message.trim()

    if (!name || !email || !message) {
      showContactValidationToast()
      return
    }

    setContactSending(true)
    try {
      await publicAPI.submitContact({
        name,
        email,
        restaurantName: contactForm.restaurantName.trim(),
        message,
      })
      showContactSentToast()
      setContactForm(EMPTY_CONTACT_FORM)
    } catch (err) {
      showContactErrorToast(err.response?.data?.message)
    } finally {
      setContactSending(false)
    }
  }

  const openLogin = () => {
    guestAuth?.openAuthModal({ mode: 'login', redirectPath: ORDER_ENTRY })
  }

  const scrollToDemo = () => {
    document.getElementById('video')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <SiteNavbar variant="dark" />
      <div ref={pageRef} className="df-page lp-landing flex flex-col min-h-screen overflow-x-hidden">
        {/* HERO */}
        <section className="lp-hero relative min-h-[100svh] flex items-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <HdImg
              src={FOOD.hero}
              alt=""
              eager
              width={1280}
              fullWidth
              className="lp-hero-bg absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(249,115,22,0.2),transparent_55%)]" />
            <div className="lp-orb w-80 h-80 bg-orange-500/25 top-[5%] right-[0%]" />
            <div className="lp-orb w-96 h-96 bg-amber-500/15 bottom-0 left-[-10%]" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 pt-28 pb-16 lg:pb-24">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-7">
                <div className="lp-hero-badge inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-8">
                  <SpoonLogo size={28} />
                  <span className="text-xs font-bold uppercase tracking-[0.28em] text-amber-300">Savoria SaaS · Restaurant OS</span>
                </div>

                <h1 className="lp-brand-title text-white mb-6">
                  <span className="lp-split-line block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.02]">
                    The restaurant platform
                  </span>
                  <span className="lp-split-line block text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.02] mt-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-400">
                      built for every cuisine
                    </span>
                  </span>
                </h1>

                <p className="lp-hero-sub text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed mb-10">
                  Pizza, burgers, noodles & more — run orders, kitchen, staff and analytics from one cinematic dashboard.
                </p>

                <div className="lp-hero-cta flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(ORDER_ENTRY)}
                    className="lp-nav-book-now px-8 py-4 text-base inline-flex items-center gap-2"
                  >
                    <FiCalendar size={18} />
                    Book Now
                  </button>
                  <button
                    type="button"
                    onClick={scrollToDemo}
                    className="lp-nav-cta px-8 py-4 text-base inline-flex items-center gap-2"
                  >
                    <FiPlay size={18} />
                    Watch demo video
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 hidden lg:grid grid-cols-3 gap-3 lp-hero-chips">
                {HERO_CHIPS.map((chip) => (
                  <div
                    key={chip.label}
                    className={`lp-hero-chip group ${chip.png ? 'lp-hero-chip--png' : ''} ${chip.portrait ? 'lp-hero-chip--portrait' : ''}`}
                  >
                    <HdImg
                      src={chip.src}
                      alt={chip.label}
                      className={`lp-gallery-img ${
                        chip.png
                          ? 'lp-gallery-img--contain'
                          : chip.portrait
                            ? 'lp-gallery-img--portrait'
                            : 'group-hover:scale-110 transition-transform duration-700'
                      }`}
                    />
                    <span className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/90 bg-black/50 backdrop-blur-sm py-1 rounded-md">
                      {chip.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section className="py-4 border-y border-white/10 bg-black/70">
          <div className="lp-marquee-wrap">
            <div className="lp-marquee-track px-6">
              {[...MARQUEE, ...MARQUEE].map((t, i) => (
                <span key={i} className="text-sm font-bold uppercase tracking-[0.22em] text-white/35 whitespace-nowrap flex items-center gap-3">
                  <SpoonLogo size={16} /> {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HD SPOTLIGHT — 4 food videos */}
        <section id="gallery" className="py-24 lp-mesh-bg scroll-mt-28">
          <div className="max-w-7xl mx-auto px-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 lp-reveal">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.35em] text-orange-400">Food showcase</span>
                <h2 className="lp-brand-title text-4xl sm:text-5xl font-bold text-white mt-3">
                  Every dish deserves <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">HD spotlight</span>
                </h2>
              </div>
              <p className="text-white/50 max-w-sm text-sm leading-relaxed">
                Cinematic food clips — Pizza, Burger, kitchen action &amp; more in motion.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {SPOTLIGHT_VIDEOS.map((item) => (
                <SpotlightVideo
                  key={item.src}
                  src={item.src}
                  poster={item.poster}
                  label={item.label}
                  className="lp-stagger"
                />
              ))}
            </div>
          </div>
        </section>

        {/* VIDEO */}
        <section id="video" className="py-24 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-10 lp-reveal">
              <span className="text-xs font-bold uppercase tracking-[0.35em] text-green-400">Live demo</span>
              <h2 className="lp-brand-title text-4xl sm:text-5xl font-bold text-white mt-3">
                See Savoria<span className="lp-brand-saas text-orange-400 ml-2">SaaS</span> in action
              </h2>
            </div>
            <div className="lp-video-shell lp-reveal ring-1 ring-white/10 shadow-2xl shadow-black/50">
              <HeroVideo variant="cinema" poster={FOOD.videoPoster} src={FOOD.demoVideo} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="py-16 border-y border-white/10 bg-[#030712]">
          <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="lp-stat-card lp-stagger text-center">
                <p className="lp-stat-num text-4xl sm:text-5xl font-bold text-white" data-value={s.value}>
                  {s.value}
                </p>
                <p className="text-orange-300/80 text-[10px] sm:text-xs mt-3 uppercase tracking-[0.25em] font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-24 bg-white scroll-mt-28">
          <div className="max-w-7xl mx-auto px-5">
            <div className="text-center mb-14 lp-reveal">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-orange-500">Platform</span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mt-3 lp-brand-title">Everything your restaurant needs</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="lp-feature-tile lp-stagger group overflow-hidden rounded-2xl bg-slate-50">
                  <div className="lp-gallery-cell aspect-[5/4]">
                    <HdImg src={f.image} alt={f.title} className="lp-gallery-img group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-lg">
                      <f.icon size={20} />
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900">{f.title}</h3>
                    <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-24 lp-mesh-bg scroll-mt-28">
          <div className="max-w-7xl mx-auto px-5">
            <div className="text-center mb-14 lp-reveal">
              <h2 className="lp-brand-title text-4xl font-bold text-white">Plans that scale</h2>
              <p className="text-white/45 mt-3 text-sm">Start free, upgrade when you grow</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`lp-stagger rounded-2xl overflow-hidden border ${
                    plan.popular ? 'border-orange-400/50 bg-white/10 md:-translate-y-2' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className={`h-1.5 bg-gradient-to-r ${plan.accent}`} />
                  <div className="p-8">
                    {plan.popular && <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Most popular</span>}
                    <h3 className="font-bold text-xl text-white mt-2">{plan.name}</h3>
                    <p className="mt-4 mb-8">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period && <span className="text-white/40 text-sm ml-1">{plan.period}</span>}
                    </p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                          <FiCheck className="text-green-400 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={openLogin}
                      className={`block w-full text-center py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r ${plan.accent} df-btn-press`}
                    >
                      Get started
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT — large full-width panel */}
        <section id="contact" className="lp-contact-section py-16 sm:py-20 scroll-mt-28 bg-[#030712]">
          <div className="max-w-7xl mx-auto px-5">
            <div className="lp-contact-panel relative overflow-hidden rounded-3xl min-h-[520px] lg:min-h-[560px] flex flex-col lg:flex-row">
              <div className="absolute inset-0 overflow-hidden" aria-hidden>
                <HdImg src={FOOD.contact} alt="" className="lp-contact-bg-img" />
                <div className="absolute inset-0 bg-black/55" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40 lg:to-black/25" />
              </div>

              <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12 lg:w-[42%] lg:min-w-[340px] lp-contact-info">
                <div className="lp-contact-logo">
                  <SpoonLogo size={48} className="mb-5" />
                </div>
                <h2 className="lp-contact-info-item lp-brand-title text-3xl sm:text-4xl font-bold text-white drop-shadow-md">Get in touch</h2>
                <p className="lp-contact-info-item text-white/90 mt-3 text-sm sm:text-base leading-relaxed max-w-sm">
                  Questions about onboarding, pricing or a demo? Our team replies within 24 hours.
                </p>
                <ul className="mt-8 space-y-4 text-white text-sm font-medium">
                  <li className="lp-contact-line flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0"><FiMail className="text-orange-300" /></span>
                    <span className="drop-shadow-sm">support@savoria.com</span>
                  </li>
                  <li className="lp-contact-line flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0"><FiPhone className="text-green-300" /></span>
                    <span className="drop-shadow-sm">+91 98765 43210</span>
                  </li>
                  <li className="lp-contact-line flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0"><FiMapPin className="text-amber-300" /></span>
                    <span className="drop-shadow-sm">Mumbai · Bangalore · Delhi</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 flex-1 flex items-center p-6 sm:p-10 lg:p-12">
                <form
                  className="lp-contact-form w-full max-w-lg ml-auto bg-white rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 border border-white/80 space-y-4"
                  onSubmit={handleContactSubmit}
                >
                  <h3 className="lp-contact-form-field font-bold text-xl text-slate-900 mb-1">Send a message</h3>
                  <p className="lp-contact-form-field text-slate-500 text-sm mb-4">We&apos;ll get back to you shortly.</p>
                  <input
                    className="lp-contact-form-field df-input"
                    placeholder="Your name"
                    value={contactForm.name}
                    onChange={setContactField('name')}
                    required
                  />
                  <input
                    className="lp-contact-form-field df-input"
                    type="email"
                    placeholder="Email address"
                    value={contactForm.email}
                    onChange={setContactField('email')}
                    required
                  />
                  <input
                    className="lp-contact-form-field df-input"
                    placeholder="Restaurant name"
                    value={contactForm.restaurantName}
                    onChange={setContactField('restaurantName')}
                  />
                  <textarea
                    className="lp-contact-form-field df-input min-h-[130px] resize-none"
                    placeholder="How can we help?"
                    value={contactForm.message}
                    onChange={setContactField('message')}
                    required
                  />
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="lp-contact-form-field lp-nav-cta w-full py-3.5 justify-center inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {contactSending ? 'Sending…' : 'Send Message'} <FiSend />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-5 pb-24">
          <div className="relative rounded-3xl overflow-hidden lp-reveal min-h-[340px] flex items-center justify-center text-center p-10 sm:p-14">
            <HdImg src={FOOD.cta} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-orange-950/50" />
            <div className="relative z-10 max-w-2xl">
              <SpoonLogo size={60} className="mx-auto mb-6" />
              <h2 className="lp-brand-title text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to run smarter?
              </h2>
              <p className="text-white/75 mb-8 text-lg">Sign in and open your restaurant dashboard in seconds.</p>
              <button
                type="button"
                onClick={openLogin}
                className="lp-nav-cta px-12 py-4 text-lg inline-flex items-center gap-2"
              >
                Sign in <FiArrowRight />
              </button>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  )
}
