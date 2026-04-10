'use client'

import {useState, useEffect} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {Calendar, TrendingUp, ChevronLeft, ChevronRight} from 'lucide-react'

interface Article {
  _id: string
  title: string
  slug: {current: string}
  excerpt: string
  publishedAt: string
  category?: string
  mainImage?: {
    asset?: {
      url?: string
    }
    alt?: string
  }
}

interface FeaturedGridProps {
  articles: Article[]
}

export default function FeaturedGrid({articles}: FeaturedGridProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const featuredArticles = articles.slice(0, 5)
  const mainArticle = featuredArticles[currentSlide]
  const sideArticles = featuredArticles.filter((_, i) => i !== currentSlide).slice(0, 3)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [featuredArticles.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredArticles.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredArticles.length) % featuredArticles.length)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white border-b border-ps-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Featured Article */}
          <div className="lg:col-span-2 relative group">
            <Link href={`/${mainArticle.slug.current}`}>
              <div className="relative h-[500px] rounded-2xl overflow-hidden bg-gray-900">
                {mainArticle.mainImage?.asset?.url && (
                  <Image
                    src={mainArticle.mainImage.asset.url}
                    alt={mainArticle.mainImage.alt || mainArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  {mainArticle.category && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-ps-blue text-white text-xs font-bold rounded-md uppercase tracking-wide">
                        {mainArticle.category}
                      </span>
                    </div>
                  )}
                  
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 leading-tight group-hover:text-ps-accent transition-colors">
                    {mainArticle.title}
                  </h2>
                  
                  <p className="text-gray-200 text-lg mb-4 line-clamp-2 leading-relaxed">
                    {mainArticle.excerpt}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-300">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(mainArticle.publishedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>Featured</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    prevSlide()
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    nextSlide()
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {featuredArticles.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentSlide(index)
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentSlide
                          ? 'w-8 bg-white'
                          : 'w-1.5 bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </Link>
          </div>

          {/* Side Articles Grid */}
          <div className="space-y-6">
            {sideArticles.map((article) => (
              <Link
                key={article._id}
                href={`/${article.slug.current}`}
                className="group block"
              >
                <div className="bg-white border border-ps-border rounded-xl overflow-hidden hover:shadow-xl hover:border-ps-blue/30 transition-all duration-300">
                  <div className="flex">
                    {article.mainImage?.asset?.url && (
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <Image
                          src={article.mainImage.asset.url}
                          alt={article.mainImage.alt || article.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="128px"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1">
                      {article.category && (
                        <span className="inline-block px-2 py-0.5 bg-ps-blue text-white text-xs font-bold rounded uppercase tracking-wide mb-2">
                          {article.category}
                        </span>
                      )}
                      <h3 className="text-base font-display font-bold text-gray-900 group-hover:text-ps-blue transition-colors line-clamp-2 leading-tight mb-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(article.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
