'use client'

import {useEffect, useState} from 'react'
import {BookOpen} from 'lucide-react'

interface Heading {
  text: string
  id: string
  level: string
}

interface TableOfContentsProps {
  body: any[]
}

export default function TableOfContents({body}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from body
    const extractedHeadings: Heading[] = []
    
    body.forEach((block, index) => {
      if (block._type === 'block' && (block.style === 'h2' || block.style === 'h3')) {
        const text = block.children?.map((child: any) => child.text).join('') || ''
        if (text) {
          const id = `heading-${index}`
          extractedHeadings.push({
            text,
            id,
            level: block.style
          })
        }
      }
    })
    
    setHeadings(extractedHeadings)

    // Add IDs to actual heading elements
    const timer = setTimeout(() => {
      const headingElements = document.querySelectorAll('.prose h2, .prose h3')
      headingElements.forEach((el, index) => {
        if (extractedHeadings[index]) {
          el.id = extractedHeadings[index].id
        }
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [body])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {rootMargin: '-100px 0px -66%'}
    )

    headings.forEach(({id}) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) {
    return null
  }

  return (
    <div className="sticky top-24 bg-white border border-ps-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center space-x-2 mb-3">
        <BookOpen className="h-3.5 w-3.5 text-ps-blue" />
        <h3 className="text-xs font-display font-bold text-gray-900 uppercase tracking-wide">
          On This Page
        </h3>
      </div>
      <nav className="space-y-1.5">
        {headings.map(({text, id, level}) => (
          <a
            key={id}
            href={`#${id}`}
            className={`block text-xs leading-snug transition-colors ${
              level === 'h3' ? 'pl-2.5' : ''
            } ${
              activeId === id
                ? 'text-ps-blue font-semibold'
                : 'text-gray-600 hover:text-ps-blue'
            }`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(id)?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              })
            }}
          >
            {text}
          </a>
        ))}
      </nav>
    </div>
  )
}
