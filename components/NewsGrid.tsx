import NewsCard from './NewsCard'

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

interface NewsGridProps {
  articles: Article[]
}

export default function NewsGrid({articles}: NewsGridProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Latest Posts</h2>
        <div className="text-center py-12 bg-gray-50 border border-ps-border rounded-lg">
          <p className="text-gray-600">No articles found. Add content in Sanity Studio!</p>
          <a href="/studio" className="text-ps-blue hover:underline font-semibold mt-4 inline-block">
            Go to Studio →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display font-bold text-gray-900 mb-6 tracking-tight">Latest Posts</h2>
      <div className="grid grid-cols-1 gap-6">
        {articles.map((article) => (
          <NewsCard key={article._id} article={article} />
        ))}
      </div>
    </div>
  )
}
