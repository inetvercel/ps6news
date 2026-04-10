import {Metadata} from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {client} from '@/sanity/lib/client'
import {articleBySlugQuery, articlesQuery} from '@/sanity/lib/queries'
import {urlForImage} from '@/sanity/lib/image'
import {PortableText} from '@portabletext/react'
import {portableTextComponents} from '@/components/PortableTextComponents'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {Calendar} from 'lucide-react'
import SidebarTrending from '@/components/SidebarTrending'
import ArticlePoll from '@/components/ArticlePoll'
import ArticleEngagementBar from '@/components/ArticleEngagementBar'

export const revalidate = 60

interface Article {
  _id: string
  title: string
  slug: {current: string}
  excerpt: string
  body: any[]
  publishedAt: string
  updatedAt?: string
  author?: {
    name: string
    image?: any
  }
  category?: {
    title: string
    slug: {current: string}
  }
  mainImage?: {
    asset?: {
      url?: string
    }
    alt?: string
  }
}

export async function generateStaticParams() {
  const articles = await client.fetch(articlesQuery, {}, {next: {revalidate: 3600}})
  
  return articles.map((article: Article) => ({
    slug: article.slug.current,
  }))
}

export async function generateMetadata({params}: {params: {slug: string}}): Promise<Metadata> {
  const article: Article = await client.fetch(articleBySlugQuery, {slug: params.slug})
  
  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }

  const imageUrl = article.mainImage?.asset?.url || 'https://ps6news.com/og-image.jpg'
  const url = `https://ps6news.com/articles/${params.slug}`

  return {
    title: article.title,
    description: article.excerpt
      ? article.excerpt.length > 160 ? article.excerpt.substring(0, 157) + '...' : article.excerpt
      : `Read about ${article.title} on PS6News.com - Your source for PlayStation 6 news and updates.`,
    keywords: [
      'PS6',
      'PlayStation 6',
      'Sony',
      'gaming news',
      article.category?.title || 'news',
      'PS6 release date',
      'PS6 specs',
      'next-gen gaming'
    ],
    authors: [{name: article.author?.name || 'PS6News Staff'}],
    openGraph: {
      title: article.title,
      description: article.excerpt
        ? article.excerpt.length > 160 ? article.excerpt.substring(0, 157) + '...' : article.excerpt
        : `Read about ${article.title} on PS6News.com`,
      url,
      siteName: 'PS6News.com',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.mainImage?.alt || article.title,
        },
      ],
      locale: 'en_US',
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author?.name || 'PS6News Staff'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt
        ? article.excerpt.length > 160 ? article.excerpt.substring(0, 157) + '...' : article.excerpt
        : `Read about ${article.title} on PS6News.com`,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function ArticlePage({params}: {params: {slug: string}}) {
  const article: Article = await client.fetch(
    articleBySlugQuery, 
    {slug: params.slug},
    {next: {revalidate: 60, tags: ['article', params.slug]}}
  )

  if (!article) {
    notFound()
  }

  // Fetch trending posts for sidebar
  const trendingPosts = await client.fetch(
    articlesQuery,
    {},
    {next: {revalidate: 3600}}
  )

  // Fetch rumour/leak posts for sidebar
  const rumourPosts = await client.fetch(
    `*[_type == "article" && category->slug.current == "rumors-leaks"] | order(publishedAt desc)[0...20] {
      _id,
      title,
      slug,
      mainImage { asset->{ _id, url } }
    }`,
    {},
    {next: {revalidate: 3600}}
  )

  const imageUrl = article.mainImage?.asset?.url
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: imageUrl,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'PS6News Staff',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PS6News.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://ps6news.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://ps6news.com/articles/${params.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      
      <Header />
      
      <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-[1350px]">
        <div className="grid grid-cols-1 lg:grid-cols-[60px_minmax(0,1fr)_350px] gap-6">

          {/* Left Engagement Bar - Sticky */}
          <aside className="hidden lg:block">
            <ArticleEngagementBar
              articleId={article._id}
              articleTitle={article.title}
              articleSlug={article.slug.current}
            />
          </aside>

          {/* Main Content */}
          <article className="bg-white rounded-2xl overflow-hidden">
            {/* Category Tags */}
            {article.category && (
              <div className="flex flex-wrap gap-2 px-6 pt-6">
                <Link
                  href={`/category/${article.category.slug.current}`}
                  className="px-2.5 py-1 bg-[#0066cc] text-white text-[11px] font-bold hover:bg-[#0055aa] transition-colors"
                >
                  {article.category.title}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-black text-white leading-[1.1] px-6 pt-4 pb-2 tracking-tight">
              {article.title}
            </h1>

            {/* Share Row */}
            <div className="flex flex-wrap items-center justify-between px-6 pb-5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#9CA3AF]">
                {article.author && (
                  <>
                    <span>by</span>
                    <span className="font-semibold text-[#D1D5DB]">{article.author.name}</span>
                  </>
                )}
                {(article.updatedAt || article.publishedAt) && (
                  <>
                    <span className="text-[#4B5563]">·</span>
                    {/* Hidden machine-readable published date for SEO */}
                    {article.publishedAt && (
                      <time dateTime={article.publishedAt} className="hidden" />
                    )}
                    {/* Visible: Updated date (falls back to published) */}
                    <time
                      dateTime={article.updatedAt || article.publishedAt}
                      className="flex items-center gap-1 text-[#9CA3AF]"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      {article.updatedAt ? (
                        <>
                          <span className="text-[#6B7280] text-xs">Updated</span>
                          {new Date(article.updatedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </>
                      ) : (
                        new Date(article.publishedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })
                      )}
                    </time>
                  </>
                )}
              </div>
              {/* Share Buttons */}
              <div className="flex items-center gap-1 text-sm text-[#6B7280]">
                <span className="mr-1">Share:</span>
                <a href={`https://twitter.com/intent/tweet?url=https://ps6news.com/articles/${article.slug.current}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-[#1F2937] hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <button className="p-2 rounded-lg hover:bg-[#1F2937] hover:text-white transition-colors" title="Copy link">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </button>
                <button className="p-2 rounded-lg hover:bg-[#1F2937] hover:text-white transition-colors" title="Share">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                </button>
              </div>
            </div>

            {/* Featured Image */}
            {article.mainImage?.asset?.url && (
              <div className="mb-8 px-6">
                <Image
                  src={article.mainImage.asset.url}
                  alt={article.mainImage.alt || article.title}
                  width={900}
                  height={506}
                  className="w-full rounded-[10px]"
                  priority
                />
              </div>
            )}

            {/* Article Body */}
            <div className="px-6 pt-2 pb-6">
              <div className="prose prose-lg max-w-none">
                <PortableText value={article.body} components={portableTextComponents} />
              </div>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="hidden lg:block">
            <div className="space-y-6">

              {/* Trending / How-To Guides - Tabbed */}
              <SidebarTrending
                trendingPosts={trendingPosts}
                rumourPosts={rumourPosts}
              />

              {/* Quick Poll - AI Generated */}
              <ArticlePoll
                articleId={article._id}
                articleTitle={article.title}
                articleExcerpt={article.excerpt}
              />

              {/* CTA */}
              <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5" style={{boxShadow:'0 0 20px rgba(0,112,209,0.08)'}}>
                <div className="flex items-center gap-2 mb-2">
                  <span>🎮</span>
                  <span className="text-sm font-bold text-[#3BA3FF]">Need a PSN Name?</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-3">Generate unique PlayStation usernames instantly with our free tool.</p>
                <button className="w-full bg-[#0070D1] hover:bg-[#0060BB] text-white font-bold py-2.5 rounded-lg text-sm transition-colors" style={{boxShadow:'0 0 14px rgba(59,163,255,0.3)'}}>
                  Try Generator
                </button>
              </div>

            </div>
          </aside>
        </div>
      </div>
      </div>
        
      <Footer />
    </>
  )
}
