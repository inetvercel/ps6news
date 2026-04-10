'use client'

import { useEffect, useState } from 'react'
import { Gamepad2, Info } from 'lucide-react'

const stats = [
  {
    label: 'Release Likelihood',
    value: '80%',
    bar: 80,
    tooltip: 'Based on multiple industry leaks and analyst reports pointing to a 2028–2029 launch.',
    icon: '🎯',
  },
  {
    label: 'Expected Year',
    value: '2028–2029',
    bar: null,
    tooltip: 'Sony\'s CFO confirmed the PS5 is mid-lifecycle. Bloomberg reported a potential delay to 2028–2029.',
    icon: '📅',
  },
  {
    label: 'Price Estimate',
    value: '£499–£599',
    bar: null,
    tooltip: 'Industry estimates based on component costs. Some analysts warn prices could exceed £599.',
    icon: '💰',
  },
  {
    label: 'Confidence',
    value: 'Medium',
    bar: 55,
    tooltip: 'Details are based on leaks and analyst reports. Nothing has been officially confirmed by Sony.',
    icon: '📊',
  },
]

export default function PS6Tracker() {
  const [animated, setAnimated] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="mt-6 mx-auto max-w-3xl rounded-2xl border border-[#1F2937] bg-[#0B0F1A]/80 px-5 pt-4 pb-3"
      style={{boxShadow:'0 0 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,163,255,0.06)'}}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-[#3BA3FF]" />
          <span className="text-xs font-black text-white uppercase tracking-widest">PS6 Tracker</span>
          {/* Pulsing live badge */}
          <span className="relative flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F59E0B]" />
            </span>
            Live
          </span>
        </div>
        <span className="text-[10px] text-[#4B5563]">Updated Apr 10, 2026</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-xl p-3.5 flex flex-col gap-2 border cursor-default transition-all duration-200"
            style={{
              background: hovered === i ? 'rgba(59,163,255,0.08)' : 'rgba(255,255,255,0.03)',
              borderColor: hovered === i ? 'rgba(59,163,255,0.25)' : 'rgba(255,255,255,0.05)',
              boxShadow: hovered === i ? '0 0 20px rgba(59,163,255,0.1)' : 'none',
            }}
          >
            {/* Icon + label */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold leading-none">{stat.label}</span>
              <span className="text-xs opacity-50">{stat.icon}</span>
            </div>

            {/* Value */}
            <span className="text-lg font-black leading-none text-white">{stat.value}</span>

            {/* Bar */}
            {stat.bar !== null && (
              <div className="h-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.06)'}}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: animated ? `${stat.bar}%` : '0%',
                    background: 'linear-gradient(90deg, #1F6FBF, #3BA3FF)',
                  }}
                />
              </div>
            )}

            {/* Tooltip on hover */}
            {hovered === i && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 z-10 pointer-events-none">
                <div className="rounded-xl bg-[#111827] border border-[#1F2937] px-3 py-2 text-[11px] text-[#9CA3AF] leading-relaxed shadow-2xl">
                  <div className="flex items-start gap-1.5">
                    <Info className="w-3 h-3 mt-0.5 shrink-0 text-[#4B5563]" />
                    {stat.tooltip}
                  </div>
                  {/* Arrow */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid #1F2937'}} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-[#374151] text-center">
        Based on leaks & analyst reports — not official Sony information
      </p>
    </div>
  )
}
