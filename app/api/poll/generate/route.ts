import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@sanity/client'
import OpenAI from 'openai'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    // Generate poll using ChatGPT
    const prompt = `Generate a fun, engaging poll question for a gaming news article. The poll should be relevant to the article topic and have exactly 4 answer options.

Article Title: "${title}"
${excerpt ? `Article Summary: "${excerpt.substring(0, 300)}"` : ''}

Respond in this exact JSON format only, no other text:
{"question": "Your poll question here?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"]}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{role: 'user', content: prompt}],
      temperature: 0.8,
      max_tokens: 200,
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      return NextResponse.json({error: 'No response from OpenAI'}, {status: 500})
    }

    let pollData
    try {
      pollData = JSON.parse(content)
    } catch {
      return NextResponse.json({error: 'Failed to parse OpenAI response', raw: content}, {status: 500})
    }

    if (!pollData.question || !pollData.options || pollData.options.length < 2) {
      return NextResponse.json({error: 'Invalid poll data from OpenAI'}, {status: 500})
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
