import {TrendingUp, Tag} from 'lucide-react'
import Link from 'next/link'

export default function Sidebar() {
  const categories = [
    { name: "News", slug: "news" },
    { name: "Rumors & Leaks", slug: "rumors-leaks" },
    { name: "Hardware", slug: "hardware" },
    { name: "Games & Exclusives", slug: "games-exclusives" },
    { name: "Announcements", slug: "announcements" },
    { name: "Other", slug: "other" }
  ]

  const popularPosts = [
    "PS6 Specifications: What to Expect",
    "Will the PS6 Have a Disc Drive?",
    "How Much Will the PS6 Cost?",
    "GTA 6 and the PS6",
    "PS6 Early Specs Leak"
  ]

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
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
        <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>Popular Posts</span>
        </h3>
        <ul className="space-y-3">
          {popularPosts.map((post, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-xs font-bold text-[#0070D1] mt-0.5 shrink-0 w-4">{index + 1}</span>
              <a href="#" className="text-sm text-[#9CA3AF] hover:text-white transition-colors line-clamp-2 leading-snug">
                {post}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Newsletter */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5" style={{boxShadow:'0 0 30px rgba(0,112,209,0.10)'}}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#3BA3FF]" style={{boxShadow:'0 0 8px rgba(59,163,255,0.8)'}} />
          <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest">Stay Updated</h3>
        </div>
        <p className="text-sm text-[#9CA3AF] mb-4 mt-2">Get the latest PS6 news in your inbox</p>
        <input 
          type="email" 
          placeholder="Your email"
          className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F1A] border border-[#1F2937] text-white placeholder-[#4B5563] mb-3 focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all"
        />
        <button className="w-full bg-[#0070D1] hover:bg-[#0060BB] text-white font-bold py-2.5 rounded-lg transition-colors" style={{boxShadow:'0 0 16px rgba(59,163,255,0.3)'}}>
          Subscribe
        </button>
      </div>
    </div>
  )
}
