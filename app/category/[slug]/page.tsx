import {notFound} from 'next/navigation'
import {client} from '@/sanity/lib/client'
import {groq} from 'next-sanity'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import {Newspaper, Calendar, Layers} from 'lucide-react'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await client.fetch<{slug: string}[]>(
    groq`*[_type == "category"]{"slug": slug.current}`
  )
  return slugs.map(({slug}) => ({slug}))
}

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
    asset?: { url?: string }
    alt?: string
  }
}

async function getCategory(slug: string): Promise<Category | null> {
  return client.fetch(groq`*[_type == "category" && slug.current == $slug][0] {
    _id, title, slug, description
  }`, {slug})
}

async function getCategoryArticles(categoryId: string): Promise<Article[]> {
  return client.fetch(groq`*[_type == "article" && category._ref == $categoryId] | order(publishedAt desc) {
    _id, title, slug, excerpt, publishedAt,
    "author": author->name,
    "category": category->title,
    mainImage { asset->{ _id, url }, alt }
  }`, {categoryId})
}

export async function generateMetadata({params}: {params: {slug: string}}) {
  const category = await getCategory(params.slug)
  if (!category) return { title: 'Category Not Found' }
  return {
    title: category.title,
    description: category.description || `Latest ${category.title} articles about PlayStation 6`,
  }
}

export default async function CategoryPage({params}: {params: {slug: string}}) {
  const category = await getCategory(params.slug)
  if (!category) notFound()

  const articles = await getCategoryArticles(category._id)
  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <div className="min-h-screen">
      <Header />

      {/* ── Hero Banner ── */}
      <div className="relative border-b border-[#1F2937] overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0F1A]" />
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,112,209,0.18) 0%, transparent 70%)'}} />
        <div className="relative container mx-auto max-w-[1350px] px-4 py-14">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-[#3BA3FF]" />
            <span className="text-xs font-bold text-[#3BA3FF] uppercase tracking-widest">Category</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            {category.title}
          </h1>
          {category.description && (
            <p className="text-[#9CA3AF] text-lg max-w-2xl">{category.description}</p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[#111827] border border-[#1F2937] rounded-full text-xs text-[#6B7280]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3BA3FF]" />
            {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto max-w-[1350px] px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">

          {/* Articles */}
          <main>
            {articles.length === 0 ? (
              <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-16 text-center">
                <Newspaper className="w-12 h-12 text-[#374151] mx-auto mb-4" />
                <p className="text-[#9CA3AF] font-medium">No articles in this category yet.</p>
                <Link href="/" className="mt-4 inline-block text-sm text-[#3BA3FF] hover:text-white transition-colors">← Back to homepage</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Featured first article */}
                {featured && (
                  <Link
                    href={`/${featured.slug.current}`}
                    className="group block bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden hover:border-[#3BA3FF]/30 transition-all duration-300"
                    style={{boxShadow:'0 4px 24px rgba(0,0,0,0.4)'}}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="md:w-56 lg:w-64 shrink-0">
                        <div className="relative w-full h-56 md:h-full min-h-[220px] bg-[#1F2937]">
                          {featured.mainImage?.asset?.url ? (
                            <Image
                              src={featured.mainImage.asset.url}
                              alt={featured.mainImage.alt || featured.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="w-12 h-12 text-[#374151]" />
                            </div>
                          )}
                          {/* Featured badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#0070D1] text-white text-[10px] font-bold uppercase tracking-wide rounded">
                            Latest
                          </div>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col">
                        {featured.category && (
                          <span className="text-[10px] font-bold text-[#3BA3FF] uppercase tracking-widest mb-2">{featured.category}</span>
                        )}
                        <h2 className="text-xl font-black text-white group-hover:text-[#3BA3FF] transition-colors leading-tight mb-3">
                          {featured.title}
                        </h2>
                        <p className="text-[#9CA3AF] text-sm leading-relaxed line-clamp-3 flex-1">
                          {featured.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1F2937]">
                          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(featured.publishedAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
                          </div>
                          <span className="text-xs font-semibold text-[#3BA3FF] group-hover:text-white transition-colors">Read More →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Rest as 2-col grid */}
                {rest.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {rest.map((article) => (
                      <Link
                        key={article._id}
                        href={`/${article.slug.current}`}
                        className="group bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#3BA3FF]/30 transition-all duration-300 flex flex-col"
                        style={{boxShadow:'0 4px 16px rgba(0,0,0,0.35)'}}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-full aspect-video bg-[#1F2937] shrink-0">
                          {article.mainImage?.asset?.url ? (
                            <Image
                              src={article.mainImage.asset.url}
                              alt={article.mainImage.alt || article.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Newspaper className="w-8 h-8 text-[#374151]" />
                            </div>
                          )}
                        </div>
                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                          {article.category && (
                            <span className="text-[10px] font-bold text-[#3BA3FF] uppercase tracking-widest mb-1.5">{article.category}</span>
                          )}
                          <h3 className="font-bold text-white text-sm leading-snug group-hover:text-[#3BA3FF] transition-colors flex-1">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#1F2937]">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.publishedAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <Sidebar />
          </aside>

        </div>
      </div>

      <Footer />
    </div>
  )
}
