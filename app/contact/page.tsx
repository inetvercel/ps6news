'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Mail, MessageSquare, Lightbulb, AlertCircle, Send, CheckCircle2 } from 'lucide-react'

const reasons = [
  { value: 'tip', label: 'News Tip', icon: Lightbulb, desc: 'Share a leak or rumour you\'ve spotted' },
  { value: 'correction', label: 'Correction', icon: AlertCircle, desc: 'Spotted an error in one of our articles' },
  { value: 'general', label: 'General', icon: MessageSquare, desc: 'Anything else on your mind' },
  { value: 'business', label: 'Business', icon: Mail, desc: 'Partnerships, advertising or press' },
]

export default function ContactPage() {
  const [reason, setReason] = useState('general')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, message, reason}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <div className="relative border-b border-[#1F2937] overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0F1A]" />
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,112,209,0.18) 0%, transparent 70%)'}} />
        <div className="relative container mx-auto max-w-[1350px] px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0070D1]/20 border border-[#3BA3FF]/30 rounded-full text-[#3BA3FF] text-sm font-semibold mb-5">
            <Mail className="w-4 h-4" />
            Get In Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Contact Us</h1>
          <p className="text-[#9CA3AF] text-lg max-w-xl mx-auto">
            Got a tip, correction, or question? We'd love to hear from you.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-[750px] px-4 py-14">

        {submitted ? (
          /* Success State */
          <div className="bg-[#111827] border border-green-500/30 rounded-2xl p-12 text-center" style={{boxShadow:'0 0 30px rgba(34,197,94,0.08)'}}>
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-5" />
            <h2 className="text-2xl font-black text-white mb-2">Message Sent!</h2>
            <p className="text-[#9CA3AF] text-sm">Thanks for reaching out. We'll get back to you as soon as we can.</p>
            <button
              onClick={() => { setSubmitted(false); setName(''); setEmail(''); setMessage(''); setReason('general') }}
              className="mt-6 px-6 py-2.5 bg-[#1F2937] hover:bg-[#263344] text-[#9CA3AF] hover:text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Send Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Reason Selector */}
            <div>
              <label className="block text-xs font-bold text-[#3BA3FF] uppercase tracking-widest mb-3">What's this about?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {reasons.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReason(value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200 ${
                      reason === value
                        ? 'bg-[#0070D1]/20 border-[#3BA3FF]/50 text-white'
                        : 'bg-[#111827] border-[#1F2937] text-[#6B7280] hover:border-[#3BA3FF]/30 hover:text-[#9CA3AF]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#6B7280] mt-2 pl-1">
                {reasons.find(r => r.value === reason)?.desc}
              </p>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-[#111827] border border-[#1F2937] rounded-xl text-white placeholder-[#4B5563] focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-[#111827] border border-[#1F2937] rounded-xl text-white placeholder-[#4B5563] focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-widest mb-2">Message</label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                className="w-full px-4 py-3 bg-[#111827] border border-[#1F2937] rounded-xl text-white placeholder-[#4B5563] focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all text-sm resize-none"
              />
              <p className="text-xs text-[#4B5563] mt-1.5 text-right">{message.length} / 1000</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0070D1] hover:bg-[#0060BB] disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
              style={{boxShadow:'0 0 20px rgba(59,163,255,0.25)'}}
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>

            <p className="text-xs text-[#4B5563] text-center">
              We typically respond within 24–48 hours.
            </p>

          </form>
        )}
      </div>

      <Footer />
    </div>
  )
}
