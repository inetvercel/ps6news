'use client'

import {useState} from 'react'
import {CheckCircle2, Loader2} from 'lucide-react'

interface NewsletterSignupProps {
  /** Tailwind classes for the outer card. */
  className?: string
  /** Description shown under the heading. */
  description?: string
}

export default function NewsletterSignup({
  className = 'bg-[#111827] border border-[#1F2937] rounded-2xl p-6',
  description = 'Get the latest PS6 news delivered to your inbox',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className={className} style={{boxShadow: '0 0 30px rgba(0,112,209,0.12)'}}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-[#3BA3FF]" style={{boxShadow: '0 0 8px rgba(59,163,255,0.8)'}} />
        <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest">Stay Updated</h3>
      </div>
      {status === 'success' ? (
        <div className="flex items-center gap-2 mt-4 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          You&apos;re subscribed! Thanks for joining.
        </div>
      ) : (
        <form onSubmit={handleSubscribe}>
          <p className="text-[#9CA3AF] text-sm mb-4 mt-2">{description}</p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F1A] border border-[#1F2937] text-white placeholder-[#4B5563] mb-3 focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all text-sm"
          />
          {status === 'error' && <p className="text-red-400 text-xs mb-2">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#0070D1] hover:bg-[#0060BB] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            style={{boxShadow: '0 0 16px rgba(59,163,255,0.3)'}}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Subscribing...
              </>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
      )}
    </div>
  )
}
