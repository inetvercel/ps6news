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

export const revalidate = 60

interface Article {
  _id: string
  title: string
  slug: {current: string}
  excerpt: string
  body: any[]
  publishedAt: string
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

  // Fetch guide/how-to posts for sidebar
  const guidePosts = await client.fetch(
    `*[_type == "article" && (title match "how to*" || title match "How To*" || title match "guide*" || title match "Guide*")] | order(publishedAt desc)[0...20] {
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
            <div className="sticky top-24 flex flex-col items-center gap-4">
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors" title="Helpful">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                <span className="text-[10px]">Helpful</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors" title="Comments">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <span className="text-[10px]">Comments</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors" title="Save">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                <span className="text-[10px]">Save</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors" title="Tip">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z" /></svg>
                <span className="text-[10px]">Tip</span>
              </button>
            </div>
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
            <h1 className="text-[32px] md:text-[40px] lg:text-[48px] font-black text-gray-900 leading-[1.1] px-6 pt-4 pb-2 tracking-tight">
              {article.title}
            </h1>

            {/* Share Row */}
            <div className="flex flex-wrap items-center justify-between px-6 pb-5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                {article.author && (
                  <>
                    <span>by</span>
                    <span className="font-semibold text-slate-700">{article.author.name}</span>
                  </>
                )}
                {article.publishedAt && (
                  <>
                    <span className="text-slate-300">·</span>
                    <time className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </time>
                  </>
                )}
              </div>
              {/* Share Buttons */}
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <span className="mr-1">Share:</span>
                <a href={`https://twitter.com/intent/tweet?url=https://ps6news.com/articles/${article.slug.current}&text=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 hover:text-slate-600 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <button className="p-2 rounded-lg hover:bg-gray-100 hover:text-slate-600 transition-colors" title="Copy link">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 hover:text-slate-600 transition-colors" title="Share">
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
                guidePosts={guidePosts}
              />

              {/* Quick Poll - AI Generated */}
              <ArticlePoll
                articleId={article._id}
                articleTitle={article.title}
                articleExcerpt={article.excerpt}
              />

              {/* CTA */}
              <div className="bg-slate-900 rounded-lg p-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span>🎮</span>
                  <span className="text-sm font-bold text-blue-400">Need a PSN Name?</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Generate unique PlayStation usernames instantly with our free tool.</p>
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
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
