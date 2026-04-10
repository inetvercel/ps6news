'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Flame, BarChart2, Newspaper } from 'lucide-react'

interface Article {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  mainImage?: { asset?: { url?: string } }
}

interface Props {
  articles: Article[]
}

function getViewCounts(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('articleViews') || '{}')
  } catch {
    return {}
  }
}

function isThisWeek(dateStr: string): boolean {
  const published = new Date(dateStr)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return published >= weekAgo
}

export default function TrendingWidgets({ articles }: Props) {
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setViewCounts(getViewCounts())
    setMounted(true)

    // Listen for storage changes (when article pages record views)
    const onStorage = () => setViewCounts(getViewCounts())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Sort all articles by view count descending → Trending
  const trending = [...articles]
    .sort((a, b) => (viewCounts[b._id] || 0) - (viewCounts[a._id] || 0))
    .slice(0, 5)

  // Filter to this week, sort by views → Most Read This Week
  const mostRead = [...articles]
    .filter(a => isThisWeek(a.publishedAt))
    .sort((a, b) => (viewCounts[b._id] || 0) - (viewCounts[a._id] || 0))
    .slice(0, 5)

  if (!mounted) return null

  return (
    <>
      {/* 🔥 Trending */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <span>Trending</span>
        </h3>
        <ul className="space-y-3">
          {trending.map((article, i) => (
            <li key={article._id}>
              <Link
                href={`/articles/${article.slug.current}`}
                className="group flex items-start gap-3"
              >
                {/* Rank number */}
                <span className={`text-base font-black shrink-0 w-6 leading-none mt-0.5 ${
                  i === 0 ? 'text-orange-400' : i === 1 ? 'text-[#9CA3AF]' : i === 2 ? 'text-amber-600' : 'text-[#4B5563]'
                }`}>{i + 1}</span>

                {/* Thumbnail */}
                {article.mainImage?.asset?.url ? (
                  <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={article.mainImage.asset.url}
                      alt={article.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 shrink-0 rounded-lg bg-[#1F2937] flex items-center justify-center">
                    <Newspaper className="w-4 h-4 text-[#4B5563]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-[#3BA3FF] transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </p>
                  {viewCounts[article._id] > 0 && (
                    <p className="text-[10px] text-[#6B7280] mt-0.5">
                      {viewCounts[article._id].toLocaleString()} views
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 📈 Most Read This Week */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest mb-4 flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-green-400" />
          <span>Most Read This Week</span>
        </h3>

        {mostRead.length === 0 ? (
          <p className="text-xs text-[#6B7280] text-center py-3">Check back soon for this week's top reads.</p>
        ) : (
          <ul className="space-y-3">
            {mostRead.map((article, i) => (
              <li key={article._id}>
                <Link
                  href={`/articles/${article.slug.current}`}
                  className="group flex items-start gap-3"
                >
                  <span className={`text-base font-black shrink-0 w-6 leading-none mt-0.5 ${
                    i === 0 ? 'text-green-400' : i === 1 ? 'text-[#9CA3AF]' : 'text-[#4B5563]'
                  }`}>{i + 1}</span>

                  {article.mainImage?.asset?.url ? (
                    <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden">
                      <Image
                        src={article.mainImage.asset.url}
                        alt={article.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 shrink-0 rounded-lg bg-[#1F2937] flex items-center justify-center">
                      <Newspaper className="w-4 h-4 text-[#4B5563]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-[#3BA3FF] transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </p>
                    {viewCounts[article._id] > 0 && (
                      <p className="text-[10px] text-[#6B7280] mt-0.5">
                        {viewCounts[article._id].toLocaleString()} views this week
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
