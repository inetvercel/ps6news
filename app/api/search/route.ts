import {NextRequest, NextResponse} from 'next/server'
import {client} from '@/sanity/lib/client'
import {groq} from 'next-sanity'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  try {
    const results = await client.fetch(
      groq`*[_type == "article" && (title match $searchQuery || excerpt match $searchQuery)] | order(publishedAt desc) [0...10] {
        _id,
        _type,
        title,
        slug,
        "category": category->title
      }`,
      {searchQuery: `${query}*`}
    )

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json([])
  }
}
