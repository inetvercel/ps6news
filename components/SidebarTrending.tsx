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
    <div className="bg-white rounded-lg p-5">
      {/* Tabs */}
      <div className="flex items-center gap-6 mb-4 border-b border-gray-100 pb-3">
        <button
          onClick={() => setActiveTab('trending')}
          className={`text-xs font-bold uppercase tracking-wide transition-colors pb-2 -mb-[13px] ${
            activeTab === 'trending'
              ? 'text-slate-900 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveTab('guides')}
          className={`text-xs font-bold uppercase tracking-wide transition-colors pb-2 -mb-[13px] ${
            activeTab === 'guides'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
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
              <div className="w-[65px] h-[65px] shrink-0 rounded bg-slate-100 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-slate-300" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm text-slate-800 group-hover:text-[#0066cc] transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h4>
              <span className="text-[11px] text-slate-400 mt-1 block">
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
