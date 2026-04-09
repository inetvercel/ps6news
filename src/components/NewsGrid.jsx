import { useState, useEffect } from 'react'
import NewsCard from './NewsCard'
import { getArticles } from '../lib/sanity'

const fallbackArticles = [
  {
    _id: '1',
    title: "PS6 Release Date Leaked: Industry Insider Reveals 2028 Launch Window",
    excerpt: "A reliable industry insider has suggested that Sony is targeting a 2028 release window for the PlayStation 6, aligning with the typical console generation cycle.",
    category: "Release Date",
    publishedAt: "2026-04-08",
    author: "Sarah Johnson",
    mainImage: { asset: { url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=400&fit=crop" } }
  },
  {
    _id: '2',
    title: "Revolutionary Ray Tracing Technology Expected in PS6 Hardware",
    excerpt: "New patents filed by Sony suggest the PS6 will feature next-generation ray tracing capabilities far beyond current PS5 technology.",
    category: "Specs",
    publishedAt: "2026-04-07",
    author: "Mike Chen",
    mainImage: { asset: { url: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800&h=400&fit=crop" } }
  },
  {
    _id: '3',
    title: "PS6 Could Support 8K Gaming at 120fps, Sources Say",
    excerpt: "Multiple sources close to Sony's development team hint at impressive performance targets for the next-generation console.",
    category: "Specs",
    publishedAt: "2026-04-06",
    author: "Alex Rivera",
    mainImage: { asset: { url: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=400&fit=crop" } }
  },
  {
    _id: '4',
    title: "Exclusive: First PS6 Dev Kits Reportedly Shipped to Major Studios",
    excerpt: "Major game development studios have allegedly received early PS6 development kits, signaling that next-gen game development is underway.",
    category: "News",
    publishedAt: "2026-04-05",
    author: "Emma Thompson",
    mainImage: { asset: { url: "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=800&h=400&fit=crop" } }
  },
  {
    _id: '5',
    title: "PS6 Backward Compatibility: Will It Support PS1-PS5 Games?",
    excerpt: "Sony's commitment to backward compatibility continues, with rumors suggesting full support for previous PlayStation generations.",
    category: "Features",
    publishedAt: "2026-04-04",
    author: "David Park",
    mainImage: { asset: { url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop" } }
  },
  {
    _id: '6',
    title: "AMD Partnership Continues: Custom Chip Design for PS6 Confirmed",
    excerpt: "Sony and AMD are reportedly collaborating on a custom chip design that will power the PlayStation 6 console.",
    category: "Hardware",
    publishedAt: "2026-04-03",
    author: "Lisa Wang",
    mainImage: { asset: { url: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&h=400&fit=crop" } }
  }
]

export default function NewsGrid() {
  const [articles, setArticles] = useState(fallbackArticles)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArticles() {
      try {
        const data = await getArticles(20)
        if (data && data.length > 0) {
          setArticles(data)
        }
      } catch (error) {
        console.log('Using fallback articles:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">Latest News</h2>
        <div className="text-center py-12">
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Latest News</h2>
      <div className="grid grid-cols-1 gap-6">
        {articles.map((article) => (
          <NewsCard key={article._id} article={article} />
        ))}
      </div>
    </div>
  )
}
