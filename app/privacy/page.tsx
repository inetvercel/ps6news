import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Shield, Cookie, BarChart2, Link2, Mail } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | PS6 News',
  description: 'Privacy Policy for PS6 News — how we collect, use, and protect your data.',
}

const lastUpdated = 'April 9, 2025'

function Section({ icon: Icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0070D1]/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#3BA3FF]" />
        </div>
        <h2 className="text-lg font-black text-white">{title}</h2>
      </div>
      <div className="text-[#9CA3AF] text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <div className="relative border-b border-[#1F2937] overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0F1A]" />
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,112,209,0.18) 0%, transparent 70%)'}} />
        <div className="relative container mx-auto max-w-[1350px] px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070D1]/20 border border-[#3BA3FF]/30 rounded-full text-[#3BA3FF] text-sm font-semibold mb-5">
            <Shield className="w-4 h-4" />
            Your Privacy Matters
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-[#6B7280] text-sm">Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-[800px] px-4 py-14 space-y-6">

        {/* Intro */}
        <div className="bg-[#0D1220] border border-[#1F2937] rounded-2xl p-6 text-sm text-[#9CA3AF] leading-relaxed">
          PS6 News ("we", "our", "us") operates <span className="text-white font-semibold">ps6news.com</span>. This policy explains what information we collect, how we use it, and your rights around it. By using our site you agree to this policy.
        </div>

        <Section icon={BarChart2} title="Information We Collect">
          <p>We collect minimal data to operate and improve the site:</p>
          <ul className="space-y-2 mt-2">
            {[
              { label: 'Analytics data', detail: 'Pages visited, time on site, referral source, browser/device type — collected anonymously via Google Analytics.' },
              { label: 'Contact form submissions', detail: 'Your name, email, and message when you choose to contact us.' },
              { label: 'Newsletter sign-ups', detail: 'Your email address if you opt in to receive updates.' },
              { label: 'Cookies', detail: 'Small files placed on your device for site functionality and analytics. See the Cookies section below.' },
            ].map(item => (
              <li key={item.label} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3BA3FF] mt-1.5 shrink-0" />
                <span><span className="text-white font-semibold">{item.label}:</span> {item.detail}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Shield} title="How We Use Your Information">
          <p>We use the data we collect only for the following purposes:</p>
          <ul className="space-y-2 mt-2">
            {[
              'To understand how visitors use our site and improve content.',
              'To respond to messages sent via our contact form.',
              'To send newsletters to subscribers who have opted in.',
              'To ensure the site operates correctly and securely.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3BA3FF] mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">We do <span className="text-white font-semibold">not</span> sell, trade, or rent your personal information to any third party.</p>
        </Section>

        <Section icon={Cookie} title="Cookies">
          <p>We use cookies to make the site work and to understand traffic patterns. The types of cookies we use:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {[
              { name: 'Essential', desc: 'Required for the site to function. Cannot be disabled.' },
              { name: 'Analytics', desc: 'Anonymous usage data via Google Analytics to improve content.' },
              { name: 'Preferences', desc: 'Remembers things like your saved articles (stored locally).' },
              { name: 'Advertising', desc: 'May be set by affiliate partners (e.g. Amazon Associates).' },
            ].map(c => (
              <div key={c.name} className="p-3 bg-[#0D1220] rounded-xl border border-[#1F2937]">
                <p className="text-white font-semibold text-xs mb-1">{c.name}</p>
                <p className="text-[#6B7280] text-xs">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-3">You can control or disable cookies through your browser settings at any time. Disabling cookies may affect some site functionality.</p>
        </Section>

        <Section icon={Link2} title="Third-Party Services & Affiliate Links">
          <p>Our site uses the following third-party services, each with their own privacy policies:</p>
          <ul className="space-y-2 mt-2">
            {[
              { name: 'Google Analytics', url: 'https://policies.google.com/privacy' },
              { name: 'Amazon Associates', url: 'https://www.amazon.co.uk/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ' },
              { name: 'Sanity.io (CMS)', url: 'https://www.sanity.io/legal/privacy' },
            ].map(s => (
              <li key={s.name} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3BA3FF] shrink-0" />
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#3BA3FF] hover:text-white transition-colors underline underline-offset-2">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3">Some articles contain affiliate links to Amazon. If you click and purchase, we may earn a small commission at no extra cost to you. This helps us keep the site running.</p>
        </Section>

        <Section icon={Shield} title="Your Rights">
          <p>You have the right to:</p>
          <ul className="space-y-2 mt-2">
            {[
              'Request access to any personal data we hold about you.',
              'Request correction or deletion of your personal data.',
              'Opt out of any newsletter or marketing emails at any time.',
              'Withdraw consent for cookies by adjusting your browser settings.',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3BA3FF] mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Contact */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
          <Mail className="w-8 h-8 text-[#3BA3FF] mx-auto mb-4" />
          <h2 className="text-lg font-black text-white mb-2">Questions About This Policy?</h2>
          <p className="text-[#9CA3AF] text-sm mb-5">We're happy to clarify anything.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0070D1] hover:bg-[#0060BB] text-white font-bold rounded-lg transition-colors text-sm"
            style={{boxShadow:'0 0 16px rgba(59,163,255,0.25)'}}
          >
            Contact Us
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  )
}
