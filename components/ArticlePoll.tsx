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
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Quick Poll</h3>
            <p className="text-xs text-gray-500">{generating ? 'Generating poll...' : 'Loading...'}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Quick Poll</h3>
          <p className="text-xs text-gray-500">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Question */}
      <p className="font-semibold text-gray-900 mb-4 text-[15px] leading-snug">
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
                      ? 'border-blue-500 bg-white'
                      : 'border-transparent bg-white/70'
                  }`}
                >
                  {/* Progress bar */}
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                    style={{width: `${percentage}%`}}
                  />
                  <div className="relative flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                        {option.text}
                      </span>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ml-2 ${
                      isWinning ? 'text-blue-600' : 'text-gray-500'
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
              className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-blue-500 transition-colors shrink-0" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {option.text}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      {!hasVoted && (
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Vote className="w-3 h-3" />
          Click an option to vote
        </p>
      )}
    </div>
  )
}
