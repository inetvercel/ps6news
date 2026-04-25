import {groq} from 'next-sanity'

export const articlesQuery = groq`*[_type == "article"] | order(publishedAt desc) [0...20] {
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

export const articleBySlugQuery = groq`*[_type == "article" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  body[]{
    ...,
    _type == "image" => {
      ...,
      asset->{ _id, url }
    }
  },
  publishedAt,
  updatedAt,
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

export const featuredArticlesQuery = groq`*[_type == "article" && featured == true] | order(publishedAt desc) [0...3] {
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

export const categoriesQuery = groq`*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug,
  description
}`

export const pagesQuery = groq`*[_type == "page"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt
}`

export const pageBySlugQuery = groq`*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  body,
  publishedAt
}`
