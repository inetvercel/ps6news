import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || 'your-project-id',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: true
})

const builder = imageUrlBuilder(client)

export function urlFor(source) {
  return builder.image(source)
}

export async function getArticles(limit = 100) {
  const query = `*[_type == "article"] | order(publishedAt desc) [0...${limit}] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    featured,
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
  
  return await client.fetch(query)
}

export async function getArticleBySlug(slug) {
  const query = `*[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    body,
    publishedAt,
    featured,
    author->{
      name,
      slug,
      image,
      bio
    },
    category->{
      title,
      slug
    },
    mainImage {
      asset->{
        _id,
        url
      },
      alt
    }
  }`
  
  return await client.fetch(query, { slug })
}

export async function getPages() {
  const query = `*[_type == "page"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt
  }`
  
  return await client.fetch(query)
}

export async function getPageBySlug(slug) {
  const query = `*[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    body,
    publishedAt
  }`
  
  return await client.fetch(query, { slug })
}

export async function getCategories() {
  const query = `*[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description
  }`
  
  return await client.fetch(query)
}

export async function getFeaturedArticles(limit = 3) {
  const query = `*[_type == "article" && featured == true] | order(publishedAt desc) [0...${limit}] {
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
  
  return await client.fetch(query)
}
