import {Calendar, MessageCircle} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Article {
  _id: string
  title: string
  slug: {current: string}
  excerpt: string
  publishedAt: string
  author?: string
  category?: string
  mainImage?: {
    asset?: {
      url?: string
    }
    alt?: string
  }
}

interface NewsCardProps {
  article: Article
}

export default function NewsCard({article}: NewsCardProps) {
  const imageUrl = article.mainImage?.asset?.url || 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=400&fit=crop'
  const imageAlt = article.mainImage?.alt || article.title
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <article className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="flex flex-col md:flex-row">
        {/* Content - Left Side */}
        <div className="flex-1 p-6 md:p-8 flex flex-col">
          {article.category && (
            <div className="mb-3">
              <Link 
                href={`/category/${article.category.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-')}`}
                className="inline-block px-3 py-1 bg-ps-blue hover:bg-ps-darkblue text-white text-xs font-bold rounded-md uppercase tracking-wide transition-colors"
              >
                {article.category}
              </Link>
            </div>
          )}
          
          <Link href={`/articles/${article.slug.current}`}>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-4 group-hover:text-ps-blue transition-colors line-clamp-3 leading-tight">
              {article.title}
            </h3>
          </Link>
          
          <p className="text-base text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-grow">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-1 font-medium">
              <Calendar className="h-4 w-4" />
              <time dateTime={article.publishedAt}>{formattedDate}</time>
            </div>
            <Link 
              href={`/articles/${article.slug.current}`}
              className="flex items-center space-x-1 text-ps-blue font-semibold hover:underline"
            >
              <span>Read More</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Image - Right Side */}
        <Link href={`/articles/${article.slug.current}`} className="md:w-80 lg:w-96 flex-shrink-0">
          <div className="relative w-full h-64 md:h-full overflow-hidden bg-gray-100">
            <Image 
              src={imageUrl} 
              alt={imageAlt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 384px"
            />
          </div>
        </Link>
      </div>
    </article>
  )
}
