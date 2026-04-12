'use client'

import {TrendingUp, Tag, CheckCircle2, Loader2} from 'lucide-react'
import Link from 'next/link'
import {useState, useEffect} from 'react'
import {client} from '@/sanity/lib/client'

const categories = [
  { name: "News", slug: "news" },
  { name: "Rumors & Leaks", slug: "rumors-leaks" },
  { name: "Hardware", slug: "hardware" },
  { name: "Games & Exclusives", slug: "games" },
  { name: "Announcements", slug: "announcements" },
]

interface PopularPost { title: string; slug: string }

function NewsletterWidget() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setStatus('success')
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5" style={{boxShadow:'0 0 30px rgba(0,112,209,0.10)'}}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-[#3BA3FF]" style={{boxShadow:'0 0 8px rgba(59,163,255,0.8)'}} />
        <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest">Stay Updated</h3>
      </div>
      {status === 'success' ? (
        <div className="flex items-center gap-2 mt-4 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          You're subscribed!
        </div>
      ) : (
        <form onSubmit={handleSubscribe}>
          <p className="text-sm text-[#9CA3AF] mb-4 mt-2">Get the latest PS6 news in your inbox</p>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Your email"
            className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F1A] border border-[#1F2937] text-white placeholder-[#4B5563] mb-3 focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all text-sm"
          />
          {status === 'error' && <p className="text-red-400 text-xs mb-2">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-[#0070D1] hover:bg-[#0060BB] disabled:opacity-60 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            style={{boxShadow:'0 0 16px rgba(59,163,255,0.3)'}}
          >
            {status === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing...</> : 'Subscribe'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function Sidebar() {
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([])

  useEffect(() => {
    client.fetch<PopularPost[]>(
      `*[_type=="article" && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...5] { title, "slug": slug.current }`
    ).then(setPopularPosts).catch(() => {})
  }, [])

  return (
    <div className="space-y-6 sticky top-24">
      {/* Categories */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          <span>Categories</span>
        </h3>
        <ul className="space-y-1">
          {categories.map((category, index) => (
            <li key={index}>
              <Link href={`/category/${category.slug}`} className="flex items-center justify-between py-2 px-3 rounded-lg text-sm text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-all group">
                <span>{category.name}</span>
                <span className="text-[#4B5563] group-hover:text-[#3BA3FF] transition-colors">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular Posts */}
      {popularPosts.length > 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Popular News</span>
          </h3>
          <ul className="space-y-3">
            {popularPosts.map((post, index) => (
              <li key={post.slug} className="flex items-start gap-3">
                <span className="text-xs font-bold text-[#0070D1] mt-0.5 shrink-0 w-4">{index + 1}</span>
                <Link href={`/${post.slug}`} className="text-sm text-[#9CA3AF] hover:text-white transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Newsletter */}
      <NewsletterWidget />
    </div>
  )
}
