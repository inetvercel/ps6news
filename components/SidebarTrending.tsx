'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'

interface Post {
  _id: string
  title: string
  slug: { current: string }
  mainImage?: { asset?: { url?: string } }
}

interface SidebarTrendingProps {
  trendingPosts: Post[]
  rumourPosts: Post[]
}

export default function SidebarTrending({ trendingPosts, rumourPosts }: SidebarTrendingProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'rumours'>('trending')

  const posts = activeTab === 'trending' ? trendingPosts : rumourPosts

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-4 border-b border-[#1F2937] pb-3">
        <button
          onClick={() => setActiveTab('trending')}
          className={`text-xs font-bold uppercase tracking-wide transition-colors pb-2 -mb-[13px] ${
            activeTab === 'trending'
              ? 'text-white border-b-2 border-[#3BA3FF]'
              : 'text-[#6B7280] hover:text-[#9CA3AF]'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveTab('rumours')}
          className={`text-xs font-bold uppercase tracking-wide transition-colors pb-2 -mb-[13px] ${
            activeTab === 'rumours'
              ? 'text-white border-b-2 border-[#3BA3FF]'
              : 'text-[#6B7280] hover:text-[#9CA3AF]'
          }`}
        >
          Rumours
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.slice(0, 4).map((post, index) => (
          <Link
            key={post._id}
            href={`/articles/${post.slug.current}`}
            className="group flex items-start gap-3"
          >
            {post.mainImage?.asset?.url ? (
              <div className="w-[65px] h-[65px] shrink-0 overflow-hidden rounded">
                <Image
                  src={post.mainImage.asset.url}
                  alt={post.title}
                  width={65}
                  height={65}
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              </div>
            ) : (
              <div className="w-[65px] h-[65px] shrink-0 rounded bg-[#1F2937] flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-[#4B5563]" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm text-white group-hover:text-[#3BA3FF] transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h4>
              <span className="text-[11px] text-[#6B7280] mt-1 block">
                {activeTab === 'trending' ? `Trending #${index + 1}` : `Rumour #${index + 1}`}
              </span>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="text-[#6B7280] text-xs text-center py-4">No {activeTab === 'rumours' ? 'rumours' : 'articles'} found.</p>
        )}
      </div>

      {/* View All Button */}
      <Link
        href={activeTab === 'rumours' ? '/category/rumors-leaks' : '/'}
        className="mt-4 block text-center text-sm font-semibold text-white bg-[#0070D1] hover:bg-[#0060BB] py-2.5 rounded-lg transition-colors"
        style={{boxShadow:'0 0 14px rgba(59,163,255,0.25)'}}
      >
        View All {activeTab === 'trending' ? 'Articles' : 'Rumours'}
      </Link>
    </div>
  )
}
