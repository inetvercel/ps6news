'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {ChevronLeft, ChevronRight} from 'lucide-react'

interface Slide {
  url: string
  alt?: string
  caption?: string
}

interface ImageSliderProps {
  title?: string
  slides: Slide[]
}

export default function ImageSlider({title, slides}: ImageSliderProps) {
  const [index, setIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const count = slides.length

  const go = useCallback(
    (next: number) => {
      setIndex((prev) => {
        const total = count
        return ((next % total) + total) % total
      })
    },
    [count],
  )

  const prev = useCallback(() => go(index - 1), [go, index])
  const next = useCallback(() => go(index + 1), [go, index])

  // Keyboard navigation when the slider is focused/hovered
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [prev, next])

  if (!count) return null

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) {
      if (delta < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  const current = slides[index]

  return (
    <figure className="not-prose my-8">
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#3BA3FF] inline-block" style={{boxShadow: '0 0 8px rgba(59,163,255,0.7)'}} />
          <h3 className="text-base font-bold text-white m-0">{title}</h3>
        </div>
      )}

      <div
        ref={containerRef}
        tabIndex={0}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="group relative w-full overflow-hidden rounded-2xl bg-[#0B0F1A] outline-none"
        style={{
          aspectRatio: '16 / 9',
          border: '1px solid rgba(59,163,255,0.18)',
          boxShadow: '0 0 40px rgba(0,112,209,0.15), 0 8px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Sliding track */}
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {slides.map((s, i) => (
            <div key={i} className="relative h-full w-full shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.url}
                alt={s.alt || ''}
                className="h-full w-full object-cover"
                draggable={false}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Caption + bottom gradient */}
        {current?.caption && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 p-4 pt-12"
            style={{background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'}}
          >
            <p className="m-0 text-sm text-white/95 font-medium drop-shadow">{current.caption}</p>
          </div>
        )}

        {/* Counter */}
        {count > 1 && (
          <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {index + 1} / {count}
          </div>
        )}

        {/* Arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-[#0070D1] hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100"
              style={{boxShadow: '0 0 16px rgba(0,0,0,0.4)'}}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all hover:bg-[#0070D1] hover:scale-110 opacity-0 group-hover:opacity-100 focus:opacity-100"
              style={{boxShadow: '0 0 16px rgba(0,0,0,0.4)'}}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {count > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 22 : 8,
                  background: i === index ? '#3BA3FF' : 'rgba(255,255,255,0.55)',
                  boxShadow: i === index ? '0 0 10px rgba(59,163,255,0.8)' : 'none',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Preview slide ${i + 1}`}
              className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-all"
              style={{
                border: i === index ? '2px solid #3BA3FF' : '2px solid transparent',
                opacity: i === index ? 1 : 0.55,
                boxShadow: i === index ? '0 0 12px rgba(59,163,255,0.5)' : 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={s.alt || ''} className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}
