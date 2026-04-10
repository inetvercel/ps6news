import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@sanity/client'
import {GoogleGenerativeAI} from '@google/generative-ai'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API!)

export async function POST(request: NextRequest) {
  try {
    const {articleId, title, excerpt} = await request.json()

    if (!articleId || !title) {
      return NextResponse.json({error: 'articleId and title are required'}, {status: 400})
    }

    // Check if poll already exists for this article
    const existing = await sanityClient.fetch(
      `*[_type == "poll" && article._ref == $articleId][0]`,
      {articleId}
    )

    if (existing) {
      return NextResponse.json({poll: existing, message: 'Poll already exists'})
    }

    // Generate poll using Gemini
    const prompt = `Generate a fun, engaging poll question for a gaming news article. The poll should be relevant to the article topic and have exactly 4 answer options.

Article Title: "${title}"
${excerpt ? `Article Summary: "${excerpt.substring(0, 300)}"` : ''}

Respond in this exact JSON format only, no markdown, no other text:
{"question": "Your poll question here?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"]}`

    const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'})
    const result = await model.generateContent(prompt)
    const content = result.response.text().trim()

    if (!content) {
      return NextResponse.json({error: 'No response from Gemini'}, {status: 500})
    }

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    let pollData
    try {
      pollData = JSON.parse(cleaned)
    } catch {
      return NextResponse.json({error: 'Failed to parse Gemini response', raw: content}, {status: 500})
    }

    if (!pollData.question || !pollData.options || pollData.options.length < 2) {
      return NextResponse.json({error: 'Invalid poll data from Gemini'}, {status: 500})
    }

    // Create poll in Sanity
    const poll = await sanityClient.create({
      _type: 'poll',
      question: pollData.question,
      options: pollData.options.map((text: string) => ({
        _type: 'object',
        _key: Math.random().toString(36).substr(2, 9),
        text,
        votes: 0,
      })),
      article: {
        _type: 'reference',
        _ref: articleId,
      },
      totalVotes: 0,
    })

    return NextResponse.json({poll, message: 'Poll created'})
  } catch (error: any) {
    console.error('Poll generation error:', error)
    return NextResponse.json({error: error.message || 'Failed to generate poll'}, {status: 500})
  }
}
