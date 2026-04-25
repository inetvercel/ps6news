'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

const TAGS = [
  { label: '🔥 PS6 Release Date', href: '/ps6-specs' },
  { label: '⚙️ PS6 Specs',        href: '/ps6-specs' },
  { label: '💰 PS6 Price',         href: '/ps6-cost' },
  { label: '📰 PS6 News',          href: '/category/news' },
  { label: '🕵️ PS6 Leaks',         href: '/ps6-early-specs-leak-amd-power-promises-8k-gaming-at-60-fps' },
  { label: '🎨 PS6 Design',        href: '/what-will-the-ps6-look-like' },
  { label: '🎮 PS6 Controller',    href: '/what-will-the-ps6-look-like' },
  { label: '📅 PS6 Launch Date',   href: '/how-to-prepare-for-the-ps6-launch' },
  { label: '💡 PS6 Concept',       href: '/what-will-the-ps6-look-like' },
]

const QUESTIONS = [
  { label: 'When Is PS6 Coming Out?',  href: '/how-to-prepare-for-the-ps6-launch', hot: true,  icon: '📅' },
  { label: 'What Will PS6 Look Like?', href: '/what-will-the-ps6-look-like',        hot: false, icon: '🎨' },
  { label: 'Is PS6 Coming Out Soon?',  href: '/ps6-specs',                          hot: false, icon: '⚡' },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function HotTopics() {
  const [visibleTags, setVisibleTags] = useState(TAGS.slice(0, 5))
  const [expanded, setExpanded] = useState(false)
  const [allShuffled, setAllShuffled] = useState(TAGS)

  useEffect(() => {
    const s = shuffle(TAGS)
    setAllShuffled(s)
    setVisibleTags(s.slice(0, 5))
  }, [])

  function toggleExpand() {
    if (expanded) {
      setVisibleTags(allShuffled.slice(0, 5))
    } else {
      setVisibleTags(allShuffled)
    }
    setExpanded(!expanded)
  }

  return (
    <div className="space-y-3">
      {/* Keyword tags row */}
      <div className="flex flex-wrap justify-center items-center gap-2">
        {visibleTags.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#111827] border border-[#1F2937] text-[#9CA3AF] hover:text-white hover:border-[#3BA3FF]/50 hover:bg-[#0070D1]/10 transition-all duration-200"
          >
            {label}
          </Link>
        ))}

        {/* Expand / collapse arrow */}
        <button
          onClick={toggleExpand}
          title={expanded ? 'Show less' : 'See more topics'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1F2937] border border-[#374151] text-[#6B7280] hover:text-[#3BA3FF] hover:border-[#3BA3FF]/40 transition-all duration-200"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> More</>
          )}
        </button>
      </div>

      {/* Question pills */}
      <div className="flex flex-wrap justify-center gap-2.5">
        {QUESTIONS.map(({ label, href, hot, icon }) => (
          <Link
            key={label}
            href={href}
            className="relative inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold border transition-all duration-200 text-white bg-[#0070D1]/20 border-[#3BA3FF]/50 hover:bg-[#0070D1]/35 hover:border-[#3BA3FF] hover:scale-105"
            style={{boxShadow:'0 0 16px rgba(59,163,255,0.25), inset 0 1px 0 rgba(255,255,255,0.05)'}}
          >
            {hot && (
              <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-orange-500 text-white leading-none tracking-wide uppercase">
                Popular
              </span>
            )}
            <span>{icon}</span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
