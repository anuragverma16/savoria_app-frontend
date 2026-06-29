import { Link } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import BrandLogo from './BrandLogo'
import BrandMark from './BrandMark'

const COLUMNS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'QR Menu', href: '/#features' },
    { label: 'Analytics', href: '/#features' },
  ],
  Company: [
    { label: 'Gallery', href: '/#gallery' },
    { label: 'Careers', href: '/#contact' },
    { label: 'Contact Us', href: '/#contact' },
  ],
  Resources: [
    { label: 'Help Center', href: '/#contact' },
    { label: 'Documentation', href: '/#contact' },
    { label: 'API', href: '/#contact' },
    { label: 'Status', href: '/#contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/#contact' },
    { label: 'Terms of Service', href: '/#contact' },
    { label: 'Cookie Policy', href: '/#contact' },
    { label: 'GDPR', href: '/#contact' },
  ],
}

export default function SiteFooter() {
  return (
    <footer className="df-footer mt-auto">
      <div className="max-w-7xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-14">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5 text-white">
              <BrandMark size="md" />
              <BrandLogo className="text-xl" accentClass="text-orange-400" />
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
              Savoria SaaS — all-in-one restaurant platform. QR orders, live kitchen, analytics.
            </p>
            <div className="space-y-2.5 text-sm text-white/45">
              <p className="flex items-center gap-2"><FiMail className="text-orange-400" /> support@savoria.com</p>
              <p className="flex items-center gap-2"><FiPhone className="text-blue-400" /> +91 98765 43210</p>
              <p className="flex items-center gap-2"><FiMapPin className="text-green-400" /> Mumbai, India</p>
            </div>
          </div>

          {Object.entries(COLUMNS).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link to={item.to} className="text-white/45 text-sm hover:text-orange-400 transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <a href={item.href} className="text-white/45 text-sm hover:text-orange-400 transition-colors">
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/35 text-xs">© {new Date().getFullYear()} Savoria SaaS. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              All systems live
            </span>
            <span>Orange · Blue · Green</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
