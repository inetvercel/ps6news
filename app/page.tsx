import {Metadata} from 'next'
import {client} from '@/sanity/lib/client'
import {articlesQuery} from '@/sanity/lib/queries'
import Header from '@/components/Header'
import FeaturedGrid from '@/components/FeaturedGrid'
import NewsGrid from '@/components/NewsGrid'
import Sidebar from '@/components/Sidebar'
import NewsletterSignup from '@/components/NewsletterSignup'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import {Newspaper, TrendingUp, Sparkles, ChevronRight, Calendar, Cpu, DollarSign, Palette, Gamepad2, Disc, Rocket, Clock} from 'lucide-react'
import dynamic from 'next/dynamic'
const TrendingWidgets = dynamic(() => import('@/components/TrendingWidgets'), { ssr: false })
const HotTopics = dynamic(() => import('@/components/HotTopics'), { ssr: false })
const PS6Tracker = dynamic(() => import('@/components/PS6Tracker'), { ssr: false })

const guidePages = [
  {href: '/ps6-release-date', title: 'PS6 Release Date', desc: 'When will the PlayStation 6 launch?', Icon: Calendar},
  {href: '/ps6-specs', title: 'PS6 Specs & Hardware', desc: 'Inside the next-gen power.', Icon: Cpu},
  {href: '/ps6-cost', title: 'PS6 Price', desc: 'How much will it cost?', Icon: DollarSign},
  {href: '/what-will-the-ps6-look-like', title: 'PS6 Design & Concept', desc: 'What the PS6 could look like.', Icon: Palette},
  {href: '/ps6-controller', title: 'PS6 Controller', desc: 'The next DualSense evolution.', Icon: Gamepad2},
  {href: '/ps6-disc-drive', title: 'PS6 Disc Drive', desc: 'Disc or digital-only?', Icon: Disc},
  {href: '/how-to-prepare-for-the-ps6-launch', title: 'Prepare for Launch', desc: 'Get ready for day one.', Icon: Rocket},
  {href: '/is-the-ps6-coming-soon', title: 'Is PS6 Coming Soon?', desc: 'How close are we really?', Icon: Clock},
]

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

async function getGuideImages() {
  try {
    const slugs = guidePages.map((g) => g.href.replace(/^\//, ''))
    const rows = await client.fetch(
      `*[_type == "article" && slug.current in $slugs]{ "slug": slug.current, "url": mainImage.asset->url }`,
      {slugs},
      {next: {revalidate: 300, tags: ['articles']}}
    )
    const map: Record<string, string> = {}
    for (const r of rows) if (r.url) map[r.slug] = r.url
    return map
  } catch (error) {
    console.error('Error fetching guide images:', error)
    return {}
  }
}

export default async function Home() {
  const articles = await getArticles()
  const guideImages = await getGuideImages()

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
            <h1 className="mb-6 flex justify-center">
              <Image
                src="https://cdn.sanity.io/images/zzzwo1aw/production/5746ab3938ea01ef12a809d319ef335048f021b7-1255x195.png"
                alt="PS6 News"
                width={500}
                height={78}
                className="object-contain"
                priority
              />
            </h1>
            <p className="text-lg text-slate-300 mb-8 whitespace-nowrap">
              News, rumors, specs, and everything you need for PlayStation 6, all in one place.
            </p>

            {/* Hot Search Topics */}
            <HotTopics />

            {/* PS6 Tracker */}
            <PS6Tracker />

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
                Latest News
              </h2>
              <Link href="/category/news" className="text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                View All <span>→</span>
              </Link>
            </div>

            {articles.length > 0 && (
              <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-fr">
              {/* Main Featured - Large Left */}
              <Link
                href={`/${articles[0].slug.current}`}
                className="group col-span-12 md:col-span-7 row-span-2 bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden hover:border-[#3BA3FF]/30 transition-all flex flex-col"
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
                    <div className="w-full h-full flex items-center justify-center bg-[#1F2937]">
                      <Newspaper className="w-16 h-16 text-[#374151]" />
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
                  href={`/${article.slug.current}`}
                  className="group col-span-12 md:col-span-5 bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#3BA3FF]/30 transition-all flex flex-col"
                >
                  <div className="relative w-full h-44">
                    {article.mainImage?.asset?.url ? (
                      <Image
                        src={article.mainImage.asset.url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1F2937]">
                        <Newspaper className="w-10 h-10 text-[#374151]" />
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
                  href={`/${article.slug.current}`}
                  className="group col-span-12 md:col-span-4 bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#3BA3FF]/30 transition-all"
                >
                  <div className="relative w-full h-40">
                    {article.mainImage?.asset?.url ? (
                      <Image
                        src={article.mainImage.asset.url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1F2937]">
                        <Newspaper className="w-8 h-8 text-[#374151]" />
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

              {/* Additional news row */}
              {articles.slice(6, 9).map((article) => (
                <Link
                  key={article._id}
                  href={`/${article.slug.current}`}
                  className="group col-span-12 md:col-span-4 bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden hover:border-[#3BA3FF]/30 transition-all"
                >
                  <div className="relative w-full h-40">
                    {article.mainImage?.asset?.url ? (
                      <Image
                        src={article.mainImage.asset.url}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1F2937]">
                        <Newspaper className="w-8 h-8 text-[#374151]" />
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

            {/* Read more news CTA */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/category/news"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0070D1] hover:bg-[#0060BB] text-white font-bold transition-colors"
                style={{boxShadow: '0 0 18px rgba(59,163,255,0.3)'}}
              >
                Read more PS6 news <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="space-y-6">
            {/* Trending + Most Read Widgets */}
            <TrendingWidgets articles={articles} />

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
            <NewsletterSignup />
            </div>
          </aside>
        </div>
      </div>

      {/* Explore PS6 Guides — main pages as cards */}
      <section className="container mx-auto px-4 pb-14 max-w-[1350px]">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            Your Complete PS6 Guide
          </h2>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Everything you need to know about the PlayStation 6 — specs, price, release date, design and more.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {guidePages.map(({href, title, desc, Icon}) => {
            const bg = guideImages[href.replace(/^\//, '')]
            return (
              <Link
                key={href}
                href={href}
                className="group relative overflow-hidden bg-[#111827] border border-[#1F2937] rounded-2xl p-5 hover:border-[#3BA3FF]/40 transition-all flex flex-col"
                style={{boxShadow: '0 0 24px rgba(0,112,209,0.06)'}}
              >
                {bg && (
                  <Image
                    src={bg}
                    alt=""
                    fill
                    className="object-cover opacity-100 group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {/* Dark overlay for readability */}
                <div className={`absolute inset-0 ${bg ? 'bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/90 to-[#0B0F1A]/75 group-hover:to-[#0B0F1A]/60' : ''} transition-colors`} />

                <div className="relative flex flex-col h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#0070D1]/25 border border-[#3BA3FF]/30 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:bg-[#0070D1]/40 transition-colors">
                    <Icon className="w-5 h-5 text-[#3BA3FF]" />
                  </div>
                  <h3 className="font-bold text-white group-hover:text-[#3BA3FF] transition-colors drop-shadow">{title}</h3>
                  <p className="text-xs text-[#D1D5DB] mt-1 line-clamp-2 drop-shadow">{desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#3BA3FF] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <Footer />
    </>
  )
}
