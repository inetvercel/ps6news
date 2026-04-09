import {notFound} from 'next/navigation'
import {client} from '@/sanity/lib/client'
import {groq} from 'next-sanity'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import NewsCard from '@/components/NewsCard'
import Sidebar from '@/components/Sidebar'

interface Category {
  _id: string
  title: string
  slug: {current: string}
  description?: string
}

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

async function getCategory(slug: string): Promise<Category | null> {
  const query = groq`*[_type == "category" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description
  }`
  
  return client.fetch(query, {slug})
}

async function getCategoryArticles(categoryId: string): Promise<Article[]> {
  const query = groq`*[_type == "article" && category._ref == $categoryId] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    "author": author->name,
    "category": category->title,
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    }
  }`
  
  return client.fetch(query, {categoryId})
}

export async function generateMetadata({params}: {params: {slug: string}}) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    return {
      title: 'Category Not Found'
    }
  }

  return {
    title: `${category.title} Articles`,
    description: category.description || `Latest ${category.title} articles about PlayStation 6`,
  }
}

export default async function CategoryPage({params}: {params: {slug: string}}) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }

  const articles = await getCategoryArticles(category._id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="bg-ps-blue text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 tracking-tight">
            {category.title}
          </h1>
          {category.description && (
            <p className="text-lg text-blue-100">{category.description}</p>
          )}
          <p className="text-sm text-blue-200 mt-4">
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </p>
        </div>
      </div>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {articles.map((article) => (
                  <NewsCard key={article._id} article={article} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-ps-border rounded-xl p-12 text-center">
                <p className="text-gray-600">No articles found in this category yet.</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
