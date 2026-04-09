import {NextRequest, NextResponse} from 'next/server'
import {client} from '@/sanity/lib/client'

export async function GET(
  request: NextRequest,
  {params}: {params: {articleId: string}}
) {
  try {
    const poll = await client.fetch(
      `*[_type == "poll" && article._ref == $articleId][0] {
        _id,
        question,
        options[] {
          _key,
          text,
          votes
        },
        totalVotes
      }`,
      {articleId: params.articleId}
    )

    if (!poll) {
      return NextResponse.json({poll: null})
    }

    return NextResponse.json({poll})
  } catch (error: any) {
    console.error('Fetch poll error:', error)
    return NextResponse.json({error: error.message}, {status: 500})
  }
}
