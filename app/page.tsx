import {Metadata} from 'next'
import {client} from '@/sanity/lib/client'
import {articlesQuery} from '@/sanity/lib/queries'
import Header from '@/components/Header'
import FeaturedGrid from '@/components/FeaturedGrid'
import NewsGrid from '@/components/NewsGrid'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import {Newspaper, TrendingUp, Sparkles, ChevronRight} from 'lucide-react'

export const revalidate = 60

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://ps6news.com',
  },
}

async function getArticles() {
  try {
    return await client.fetch(articlesQuery, {}, {
      next: {
        revalidate: 60,
        tags: ['articles']
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return []
  }
}

export default async function Home() {
  const articles = await getArticles()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PS6News.com',
    description: 'Your ultimate source for PlayStation 6 news, rumors, specs, and release date information.',
    url: 'https://ps6news.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://ps6news.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PS6News.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ps6news.com/logo.png',
      },
    },
  }

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/ps-pattern.png')] opacity-5"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 py-16 md:py-24 max-w-[1350px] relative">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              Your Ultimate PS6 Resource
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
              PS6 News
            </h1>
            <p className="text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto">
              News, rumors, specs, and everything you need for PlayStation 6, all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-[1350px]">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] gap-6">
          {/* Featured Articles */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                Latest Articles
              </h2>
              <Link href="/blog" className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View All <span>→</span>
              </Link>
            </div>

            {articles.length > 0 && (
              <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-fr">
              {/* Main Featured - Large Left */}
              <Link
                href={`/articles/${articles[0].slug.current}`}
                className="group col-span-12 md:col-span-7 row-span-2 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
              >
                <div className="flex-1 relative min-h-[280px]">
                  {articles[0].mainImage?.asset?.url ? (
                    <Image
                      src={articles[0].mainImage.asset.url}
                      alt={articles[0].title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Newspaper className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  {articles[0].category && (
                    <span className="text-xs font-bold text-[#3BA3FF] uppercase tracking-wide">
                      {articles[0].category}
                    </span>
                  )}
                  <h3 className="text-xl font-black text-white group-hover:text-[#3BA3FF] transition-colors mt-1 line-clamp-2">
                    {articles[0].title}
                  </h3>
                </div>
              </Link>

              {/* Right Side - Stacked Cards */}
              {articles.slice(1, 3).map((article) => (
                <Link
                  key={article._id}
                  href={`/articles/${article.slug.current}`}
                  className="group col-span-12 md:col-span-5 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="aspect-video relative">
                    {article.mainImage?.asset?.url ? (
                      <Image
                        src={article.mainImage.asset.url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Newspaper className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1">
                    {article.category && (
                      <span className="text-[10px] font-bold text-[#3BA3FF] uppercase tracking-wide">
                        {article.category}
                      </span>
                    )}
                    <h3 className="font-bold text-white text-sm group-hover:text-[#3BA3FF] transition-colors mt-1 line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}

              {/* More articles in grid */}
              {articles.slice(3, 6).map((article) => (
                <Link
                  key={article._id}
                  href={`/articles/${article.slug.current}`}
                  className="group col-span-12 md:col-span-4 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="aspect-4/3 relative">
                    {article.mainImage?.asset?.url ? (
                      <Image
                        src={article.mainImage.asset.url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <Newspaper className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {article.category && (
                      <span className="text-[10px] font-bold text-[#3BA3FF] uppercase tracking-wide">
                        {article.category}
                      </span>
                    )}
                    <h3 className="font-bold text-white text-sm group-hover:text-[#3BA3FF] transition-colors mt-1 line-clamp-2">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="space-y-6">
            {/* Categories Widget */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest mb-4">Categories</h3>
              <div className="space-y-1">
                {[
                  {label:'Announcements', slug:'announcements'},
                  {label:'Games', slug:'games'},
                  {label:'Hardware', slug:'hardware'},
                  {label:'Rumors & Leaks', slug:'rumors-leaks'},
                  {label:'Other', slug:'other'},
                ].map(cat => (
                  <Link key={cat.slug} href={`/category/${cat.slug}`} className="flex items-center justify-between py-2 px-3 rounded-lg text-sm text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-all group">
                    <span>{cat.label}</span>
                    <span className="text-[#4B5563] group-hover:text-[#3BA3FF] transition-colors">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Widget */}
            <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6" style={{boxShadow:'0 0 30px rgba(0,112,209,0.12)'}}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-[#3BA3FF]" style={{boxShadow:'0 0 8px rgba(59,163,255,0.8)'}} />
                <h3 className="text-sm font-bold text-[#3BA3FF] uppercase tracking-widest">Stay Updated</h3>
              </div>
              <p className="text-[#9CA3AF] text-sm mb-4 mt-2">Get the latest PS6 news delivered to your inbox</p>
              <input 
                type="email" 
                placeholder="Your email"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0B0F1A] border border-[#1F2937] text-white placeholder-[#4B5563] mb-3 focus:outline-none focus:border-[#3BA3FF] focus:ring-1 focus:ring-[#3BA3FF]/30 transition-all"
              />
              <button className="w-full bg-[#0070D1] hover:bg-[#0060BB] text-white font-bold py-2.5 rounded-lg transition-colors" style={{boxShadow:'0 0 16px rgba(59,163,255,0.3)'}}>
                Subscribe
              </button>
            </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </>
  )
}
