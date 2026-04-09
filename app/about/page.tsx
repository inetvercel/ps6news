import { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Gamepad2, Newspaper, TrendingUp, Shield, Mail, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About | PS6 News',
  description: 'Learn about PS6 News — the independent fan resource dedicated to covering everything about the PlayStation 6.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <div className="relative border-b border-[#1F2937] overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0F1A]" />
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,112,209,0.18) 0%, transparent 70%)'}} />
        <div className="relative container mx-auto max-w-[1350px] px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070D1]/20 border border-[#3BA3FF]/30 rounded-full text-[#3BA3FF] text-sm font-semibold mb-6">
            <Gamepad2 className="w-4 h-4" />
            Independent PS6 Fan Resource
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            About PS6 News
          </h1>
          <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto">
            Your go-to independent source for PlayStation 6 news, rumours, specs, and everything in between.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-[900px] px-4 py-14 space-y-10">

        {/* Who We Are */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#0070D1]/20 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-[#3BA3FF]" />
            </div>
            <h2 className="text-xl font-black text-white">Who We Are</h2>
          </div>
          <div className="space-y-4 text-[#9CA3AF] leading-relaxed">
            <p>
              PS6 News is an independent fan-run website dedicated to tracking, analysing, and reporting everything known — and speculated — about Sony's next-generation PlayStation console.
            </p>
            <p>
              We cover the latest leaks, official announcements, hardware rumours, game reveals, and industry analysis — all in one place. Whether you're a hardcore gamer or just curious about what's coming next from PlayStation, we've got you covered.
            </p>
          </div>
        </div>

        {/* What We Cover */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#0070D1]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#3BA3FF]" />
            </div>
            <h2 className="text-xl font-black text-white">What We Cover</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Hardware & Specs', desc: 'Deep dives into confirmed and rumoured PS6 specifications.' },
              { label: 'Rumours & Leaks', desc: 'The latest industry leaks, sourced and analysed carefully.' },
              { label: 'Games & Exclusives', desc: 'What titles will define the PS6 launch and beyond.' },
              { label: 'Announcements', desc: 'Official Sony news and PlayStation event coverage.' },
              { label: 'Pricing & Release', desc: 'Everything we know about cost and release windows.' },
              { label: 'Industry Analysis', desc: 'Context and commentary on what it all means for gamers.' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4 bg-[#0D1220] rounded-xl border border-[#1F2937]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3BA3FF] mt-2 shrink-0" style={{boxShadow:'0 0 6px rgba(59,163,255,0.6)'}} />
                <div>
                  <p className="text-white font-semibold text-sm">{item.label}</p>
                  <p className="text-[#6B7280] text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-[#0D1220] border border-[#1F2937] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h2 className="text-xl font-black text-white">Disclaimer</h2>
          </div>
          <div className="space-y-3 text-[#9CA3AF] text-sm leading-relaxed">
            <p>
              PS6 News is an <strong className="text-white">independent fan resource</strong> and is in no way affiliated with, endorsed by, or connected to Sony Interactive Entertainment, the PlayStation brand, or any of their subsidiaries.
            </p>
            <p>
              PlayStation and PS6 are trademarks of Sony Interactive Entertainment LLC. All product names, logos, and brands are property of their respective owners.
            </p>
            <p>
              Content published on this site is based on publicly available information, industry reports, and community speculation. We always aim to clearly distinguish between confirmed facts and rumour.
            </p>
            <div className="mt-4 pt-4 border-t border-[#1F2937]">
              <p className="text-xs text-[#6B7280]">
                <span className="font-semibold text-[#9CA3AF]">Affiliate Disclosure: </span>
                We participate in the Amazon Associates Programme and may earn a small commission from qualifying purchases via our links, at no extra cost to you.
              </p>
            </div>
          </div>
        </div>

        {/* Contact / CTA */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center" style={{boxShadow:'0 0 30px rgba(0,112,209,0.08)'}}>
          <Mail className="w-8 h-8 text-[#3BA3FF] mx-auto mb-4" />
          <h2 className="text-xl font-black text-white mb-2">Get In Touch</h2>
          <p className="text-[#9CA3AF] text-sm mb-6">Have a tip, correction, or just want to say hello?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0070D1] hover:bg-[#0060BB] text-white font-bold rounded-lg transition-colors text-sm"
              style={{boxShadow:'0 0 16px rgba(59,163,255,0.3)'}}
            >
              Contact Us
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1F2937] hover:bg-[#263344] text-[#9CA3AF] hover:text-white font-bold rounded-lg transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Read Latest News
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  )
}
