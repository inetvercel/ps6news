import {MetadataRoute} from 'next'
import {client} from '@/sanity/lib/client'
import {articlesQuery} from '@/sanity/lib/queries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await client.fetch(articlesQuery)

  const articleEntries: MetadataRoute.Sitemap = articles.map((article: any) => ({
    url: `https://ps6news.com/${article.slug.current}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://ps6news.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...articleEntries,
  ]
}
