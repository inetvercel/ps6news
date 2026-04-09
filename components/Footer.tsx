import Link from 'next/link'
import {Gamepad2, Facebook} from 'lucide-react'

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/category/news", label: "News" },
  { href: "/category/rumors-leaks", label: "Rumors" },
  { href: "/category/games-exclusives", label: "Games" },
]

const legalLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
]

export default function Footer() {
  return (
    <footer className="bg-[#0B0F1A] border-t border-[#1F2937]">
      <div className="container mx-auto max-w-[1350px] px-4 py-10">
        {/* Top section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-[#3BA3FF]" />
            <span className="text-xl font-bold text-white">PS6 News</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#9CA3AF] text-sm font-medium hover:text-[#3BA3FF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-2">
            <a 
              href="https://x.com/ps6news" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#3BA3FF] hover:bg-[#1F2937] transition-all" 
              aria-label="X (Twitter)"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a 
              href="https://www.facebook.com/ps6news" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 rounded-lg text-[#9CA3AF] hover:text-[#3BA3FF] hover:bg-[#1F2937] transition-all" 
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1F2937] mb-6" />

        {/* Disclosure */}
        <div className="mb-4 text-center text-xs text-[#4B5563] leading-relaxed">
          <span className="font-semibold text-[#6B7280]">Disclaimer: </span>Independent fan site, not affiliated with Sony or PlayStation. We may earn commission from Amazon links.
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p className="text-[#6B7280]">&copy; {new Date().getFullYear()} PS6 News. All rights reserved.</p>

          <nav className="flex items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#9CA3AF] hover:text-[#3BA3FF] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
