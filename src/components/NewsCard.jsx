import { Calendar, User } from 'lucide-react'

export default function NewsCard({ article }) {
  const imageUrl = article.mainImage?.asset?.url || article.image || 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=400&fit=crop'
  const imageAlt = article.mainImage?.alt || article.title
  const formattedDate = article.publishedAt 
    ? new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : article.date

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <img 
        src={imageUrl} 
        alt={imageAlt}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className="px-3 py-1 bg-ps-lightblue text-white text-xs font-semibold rounded-full">
            {article.category || 'News'}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 hover:text-ps-lightblue transition-colors cursor-pointer">
          {article.title}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span>{article.author || 'PS6News Staff'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <button className="text-ps-lightblue font-semibold hover:text-ps-blue transition-colors">
            Read More →
          </button>
        </div>
      </div>
    </article>
  )
}
