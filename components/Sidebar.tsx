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
      <div className="bg-white border border-ps-border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <Tag className="h-5 w-5 text-ps-blue" />
          <span>Categories</span>
        </h3>
        <ul className="space-y-2">
          {categories.map((category, index) => (
            <li key={index}>
              <Link href={`/category/${category.slug}`} className="text-sm text-gray-700 hover:text-ps-blue transition-colors flex items-center justify-between group">
                <span>{category.name}</span>
                <span className="text-xs text-gray-400 group-hover:text-ps-blue">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-ps-border rounded-xl p-5 shadow-sm">
        <h3 className="text-lg font-display font-bold text-gray-900 mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-ps-blue" />
          <span>Popular Posts</span>
        </h3>
        <ul className="space-y-3">
          {popularPosts.map((post, index) => (
            <li key={index}>
              <a href="#" className="text-sm text-gray-700 hover:text-ps-blue transition-colors line-clamp-2">
                {post}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-ps-blue text-white rounded-xl p-5 shadow-lg">
        <h3 className="text-lg font-display font-bold mb-3">Newsletter</h3>
        <p className="text-sm text-blue-100 mb-4">Get the latest PS6 news in your inbox</p>
        <input 
          type="email" 
          placeholder="Your email"
          className="w-full px-4 py-2 rounded-md text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button className="w-full bg-white text-ps-blue font-semibold py-2 rounded-md hover:bg-gray-100 transition-colors">
          Subscribe
        </button>
      </div>
    </div>
  )
}
