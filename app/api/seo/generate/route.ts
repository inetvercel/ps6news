import {NextRequest, NextResponse} from 'next/server'
import OpenAI from 'openai'
// Shared with the auto-publisher so meta rules stay identical.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {generateSeo} = require('../../../../scripts/lib/seo')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const {title, excerpt, body} = await request.json()
    if (!title) {
      return NextResponse.json({error: 'title is required'}, {status: 400})
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({error: 'OPENAI_API_KEY not configured'}, {status: 500})
    }

    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})
    const seo = await generateSeo(openai, {title, excerpt, body})

    return NextResponse.json(seo)
  } catch (error: any) {
    console.error('SEO generation error:', error)
    return NextResponse.json({error: error?.message || 'Failed'}, {status: 500})
  }
}
