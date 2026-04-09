'use client'

import {useState, useEffect} from 'react'
import {BarChart3, Vote, CheckCircle2, Loader2} from 'lucide-react'

interface PollOption {
  _key: string
  text: string
  votes: number
}

interface Poll {
  _id: string
  question: string
  options: PollOption[]
  totalVotes: number
}

interface ArticlePollProps {
  articleId: string
  articleTitle: string
  articleExcerpt?: string
}

export default function ArticlePoll({articleId, articleTitle, articleExcerpt}: ArticlePollProps) {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check localStorage for previous vote
  useEffect(() => {
    const voted = localStorage.getItem(`poll-voted-${articleId}`)
    if (voted) {
      setHasVoted(true)
      setSelectedOption(voted)
    }
  }, [articleId])

  // Fetch existing poll
  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await fetch(`/api/poll/${articleId}`)
        const data = await res.json()
        if (data.poll) {
          setPoll(data.poll)
        }
      } catch (err) {
        console.error('Failed to fetch poll:', err)
      }
      setLoading(false)
    }
    fetchPoll()
  }, [articleId])

  // Auto-generate poll if none exists
  useEffect(() => {
    if (!loading && !poll && !generating && !error) {
      generatePoll()
    }
  }, [loading, poll])

  const generatePoll = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/poll/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          articleId,
          title: articleTitle,
          excerpt: articleExcerpt,
        }),
      })
      const data = await res.json()
      if (data.poll) {
        setPoll(data.poll)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to generate poll')
    }
    setGenerating(false)
  }

  const handleVote = async (optionKey: string) => {
    if (hasVoted || voting || !poll) return

    setVoting(true)
    try {
      const res = await fetch('/api/poll/vote', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({pollId: poll._id, optionKey}),
      })
      const data = await res.json()
      if (data.poll) {
        setPoll({
          ...poll,
          options: data.poll.options,
          totalVotes: data.poll.totalVotes,
        })
        setHasVoted(true)
        setSelectedOption(optionKey)
        localStorage.setItem(`poll-voted-${articleId}`, optionKey)
      }
    } catch (err) {
      console.error('Vote failed:', err)
    }
    setVoting(false)
  }

  // Loading state
  if (loading || generating) {
    return (
      <div className="bg-[#111827] rounded-2xl p-6 border border-[#1F2937]" style={{boxShadow:'0 0 24px rgba(0,112,209,0.1)'}}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0070D1] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#D1D5DB]">Quick Poll</h3>
            <p className="text-xs text-[#6B7280]">{generating ? 'Generating poll...' : 'Loading...'}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#4B5563]" />
        </div>
      </div>
    )
  }

  // Error state — don't show anything broken
  if (error || !poll) {
    return null
  }

  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1)

  return (
    <div className="bg-[#111827] rounded-2xl p-6 border border-[#1F2937]" style={{boxShadow:'0 0 24px rgba(0,112,209,0.1)'}}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#0070D1] flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white">Quick Poll</h3>
          <p className="text-xs text-[#6B7280]">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Question */}
      <p className="font-semibold text-white mb-4 text-[15px] leading-snug">
        {poll.question}
      </p>

      {/* Options */}
      <div className="space-y-2.5">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
          const isSelected = selectedOption === option._key
          const isWinning = option.votes === maxVotes && poll.totalVotes > 0

          if (hasVoted) {
            // Results view
            return (
              <div key={option._key} className="relative">
                <div
                  className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-[#3BA3FF] bg-[#1a2535]'
                      : 'border-transparent bg-[#0D1220]'
                  }`}
                >
                  {/* Progress bar */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                      isSelected ? 'bg-[#0070D1]/25' : 'bg-[#1F2937]/60'
                    }`}
                    style={{width: `${percentage}%`}}
                  />
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#3BA3FF] shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-[#D1D5DB]'}`}>
                        {option.text}
                      </span>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ml-2 ${
                      isWinning ? 'text-[#3BA3FF]' : 'text-[#6B7280]'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            )
          }

          // Voting view
          return (
            <button
              key={option._key}
              onClick={() => handleVote(option._key)}
              disabled={voting}
              className="w-full text-left px-4 py-3 rounded-xl border-2 border-[#1F2937] bg-[#0D1220] hover:border-[#3BA3FF]/60 hover:bg-[#1a2535] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-[#374151] group-hover:border-[#3BA3FF] transition-colors shrink-0" />
                <span className="text-sm font-medium text-[#D1D5DB] group-hover:text-white">
                  {option.text}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {!hasVoted && (
        <p className="text-xs text-[#4B5563] mt-3 flex items-center gap-1">
          <Vote className="w-3 h-3" />
          Click an option to vote
        </p>
      )}
    </div>
  )
}
