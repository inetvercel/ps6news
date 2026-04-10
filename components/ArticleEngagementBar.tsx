'use client'

import { useState, useEffect } from 'react'
import { ThumbsUp, Bookmark, Share2 } from 'lucide-react'

interface Props {
  articleId: string
  articleTitle: string
  articleSlug: string
}

export default function ArticleEngagementBar({ articleId, articleTitle, articleSlug }: Props) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const [shared, setShared] = useState(false)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)

  // Track view on mount
  useEffect(() => {
    try {
      const views: Record<string, number> = JSON.parse(localStorage.getItem('articleViews') || '{}')
      views[articleId] = (views[articleId] || 0) + 1
      localStorage.setItem('articleViews', JSON.stringify(views))
      // Notify other tabs/components
      window.dispatchEvent(new Event('storage'))
    } catch {}
  }, [articleId])

  useEffect(() => {
    function onScroll() {
      const el = document.querySelector('article')
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const windowH = window.innerHeight
      const scrolled = Math.max(0, windowH - top)
      const pct = Math.min(100, Math.round((scrolled / height) * 100))
      setProgress(pct)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const likedKey = `liked_${articleId}`
    const savedKey = `saved_${articleId}`
    const countKey = `likeCount_${articleId}`

    const storedLiked = localStorage.getItem(likedKey) === 'true'
    const storedSaved = localStorage.getItem(savedKey) === 'true'
    const storedCount = parseInt(localStorage.getItem(countKey) || '0', 10)

    setLiked(storedLiked)
    setSaved(storedSaved)
    setLikeCount(storedCount)
  }, [articleId])

  function handleLike() {
    const likedKey = `liked_${articleId}`
    const countKey = `likeCount_${articleId}`
    const newLiked = !liked
    const newCount = newLiked ? likeCount + 1 : Math.max(0, likeCount - 1)
    setLiked(newLiked)
    setLikeCount(newCount)
    localStorage.setItem(likedKey, String(newLiked))
    localStorage.setItem(countKey, String(newCount))
  }

  function handleSave() {
    const savedKey = `saved_${articleId}`
    const newSaved = !saved
    setSaved(newSaved)
    localStorage.setItem(savedKey, String(newSaved))

    // Maintain a saved articles list
    const savedList: string[] = JSON.parse(localStorage.getItem('savedArticles') || '[]')
    if (newSaved) {
      if (!savedList.includes(articleSlug)) savedList.push(articleSlug)
    } else {
      const idx = savedList.indexOf(articleSlug)
      if (idx > -1) savedList.splice(idx, 1)
    }
    localStorage.setItem('savedArticles', JSON.stringify(savedList))
  }

  async function handleShare() {
    const url = `https://ps6news.com/${articleSlug}`
    if (navigator.share) {
      try {
        await navigator.share({ title: articleTitle, url })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const circumference = 2 * Math.PI * 16
  const strokeDash = circumference - (progress / 100) * circumference

  return (
    <div className="sticky top-24 flex flex-col items-center gap-2">
      {/* Like */}
      <button
        onClick={handleLike}
        title={liked ? 'Unlike' : 'Mark as helpful'}
        className={`group flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl border transition-all duration-200 ${
          liked
            ? 'bg-[#0070D1]/20 border-[#3BA3FF]/40 text-[#3BA3FF]'
            : 'bg-[#111827] border-[#1F2937] text-[#6B7280] hover:border-[#3BA3FF]/40 hover:text-[#3BA3FF] hover:bg-[#0070D1]/10'
        }`}
      >
        <ThumbsUp className={`w-5 h-5 transition-transform duration-150 ${liked ? 'scale-110' : 'group-hover:scale-110'}`} fill={liked ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold leading-none">{likeCount > 0 ? likeCount : 'Like'}</span>
      </button>

      {/* Save / Bookmark */}
      <button
        onClick={handleSave}
        title={saved ? 'Remove from saved' : 'Save article'}
        className={`group flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl border transition-all duration-200 ${
          saved
            ? 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]'
            : 'bg-[#111827] border-[#1F2937] text-[#6B7280] hover:border-[#F59E0B]/40 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10'
        }`}
      >
        <Bookmark className={`w-5 h-5 transition-transform duration-150 ${saved ? 'scale-110' : 'group-hover:scale-110'}`} fill={saved ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold leading-none">{saved ? 'Saved' : 'Save'}</span>
      </button>

      {/* Reading Progress Ring */}
      <div
        title={`${progress}% read`}
        className="flex flex-col items-center gap-1 w-12 py-2 rounded-xl border bg-[#111827] border-[#1F2937] cursor-default"
      >
        <svg width="28" height="28" viewBox="0 0 40 40" className="-rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="#1F2937" strokeWidth="4" />
          <circle
            cx="20" cy="20" r="16" fill="none"
            stroke={progress === 100 ? '#22C55E' : '#3BA3FF'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{transition:'stroke-dashoffset 0.2s ease'}}
          />
        </svg>
        <span className={`text-[10px] font-bold leading-none ${progress === 100 ? 'text-green-400' : 'text-[#6B7280]'}`}>
          {progress}%
        </span>
      </div>

      {/* Share */}
      <button
        onClick={handleShare}
        title="Share article"
        className={`group flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl border transition-all duration-200 ${
          copied || shared
            ? 'bg-green-500/10 border-green-500/40 text-green-400'
            : 'bg-[#111827] border-[#1F2937] text-[#6B7280] hover:border-[#3BA3FF]/40 hover:text-[#3BA3FF] hover:bg-[#0070D1]/10'
        }`}
      >
        <Share2 className={`w-5 h-5 group-hover:scale-110 transition-transform duration-150`} />
        <span className="text-[10px] font-bold leading-none">
          {copied ? 'Copied!' : shared ? 'Shared!' : 'Share'}
        </span>
      </button>

      {/* Divider */}
      <div className="w-6 h-px bg-[#1F2937] my-1" />

      {/* X share shortcut */}
      <a
        href={`https://x.com/intent/post?url=https://ps6news.com/${articleSlug}&text=${encodeURIComponent(articleTitle)}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on X"
        className="group flex flex-col items-center gap-1 w-12 py-2.5 rounded-xl border bg-[#111827] border-[#1F2937] text-[#6B7280] hover:border-[#3BA3FF]/40 hover:text-white hover:bg-[#1F2937] transition-all duration-200"
      >
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-[10px] font-bold leading-none">Post</span>
      </a>
    </div>
  )
}
