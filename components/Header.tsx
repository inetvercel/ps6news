'use client'

import {useState, useEffect, useRef} from 'react'
import {usePathname} from 'next/navigation'
import {Menu, Gamepad2, Newspaper, TrendingUp, Search, X, Loader2, Megaphone} from 'lucide-react'
import Link from 'next/link'

const navItems = [
  { href: "/category/announcements", label: "Announcements", icon: Megaphone },
  { href: "/category/games", label: "Games", icon: Gamepad2 },
  { href: "/category/rumors-leaks", label: "Rumors & Leaks", icon: TrendingUp },
]

interface SearchResult {
  _id: string
  _type: string
  title: string
  slug: { current: string }
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Search effect with debounce
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const results: SearchResult[] = await res.json()
        setSearchResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      }
      setIsSearching(false)
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([])
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setMobileMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-[1350px] flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Gamepad2 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PS6 News</span>
          </Link>

          {/* Desktop Nav - Centered */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isActive(item.href) 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Toggle */}
            <button
              onClick={() => {
                setSearchOpen(!searchOpen)
                if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100)
              }}
              className={`p-2 rounded-lg transition-colors ${
                searchOpen
                  ? 'bg-gray-100 text-blue-600'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar - Slide down */}
      <div className={`transition-all duration-300 ${searchOpen ? 'max-h-[500px] overflow-visible' : 'max-h-0 overflow-hidden'}`}>
        <div className="bg-gray-50 border-b border-gray-200 py-3">
          <div className="container mx-auto max-w-[1350px] px-4">
            <div ref={searchContainerRef} className="relative max-w-2xl mx-auto">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search articles, news, guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 pl-11 pr-10 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
              )}

              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No results found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((result) => {
                        const href = `/articles/${result.slug.current}`
                        return (
                          <Link
                            key={result._id}
                            href={href}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Newspaper className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 line-clamp-1 text-sm">
                                {result.title}
                              </h4>
                              <p className="text-xs text-gray-500 capitalize">
                                Article
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-200">
          <nav className="container mx-auto max-w-[1350px] px-4 py-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href) 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
