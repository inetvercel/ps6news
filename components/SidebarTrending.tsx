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
  guidePosts: Post[]
}

export default function SidebarTrending({ trendingPosts, guidePosts }: SidebarTrendingProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'guides'>('trending')

  const posts = activeTab === 'trending' ? trendingPosts : guidePosts

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
          onClick={() => setActiveTab('guides')}
          className={`text-xs font-bold uppercase tracking-wide transition-colors pb-2 -mb-[13px] ${
            activeTab === 'guides'
              ? 'text-white border-b-2 border-[#3BA3FF]'
              : 'text-[#6B7280] hover:text-[#9CA3AF]'
          }`}
        >
          How-To Guides
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
                {activeTab === 'trending' ? `Trending #${index + 1}` : `Guide #${index + 1}`}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Button */}
      <Link
        href="/"
        className="mt-4 block text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg transition-colors"
      >
        View All {activeTab === 'trending' ? 'Articles' : 'Guides'}
      </Link>
    </div>
  )
}
