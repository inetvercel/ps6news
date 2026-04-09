import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@sanity/client'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request: NextRequest) {
  try {
    const {pollId, optionKey} = await request.json()

    if (!pollId || !optionKey) {
      return NextResponse.json({error: 'pollId and optionKey are required'}, {status: 400})
    }

    // Fetch current poll
    const poll = await sanityClient.fetch(
      `*[_type == "poll" && _id == $pollId][0]`,
      {pollId}
    )

    if (!poll) {
      return NextResponse.json({error: 'Poll not found'}, {status: 404})
    }

    // Find the option and increment votes
    const updatedOptions = poll.options.map((opt: any) => {
      if (opt._key === optionKey) {
        return {...opt, votes: (opt.votes || 0) + 1}
      }
      return opt
    })

    const newTotal = updatedOptions.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0)

    // Update in Sanity
    const updated = await sanityClient
      .patch(pollId)
      .set({options: updatedOptions, totalVotes: newTotal})
      .commit()

    return NextResponse.json({poll: updated})
  } catch (error: any) {
    console.error('Vote error:', error)
    return NextResponse.json({error: error.message || 'Failed to vote'}, {status: 500})
  }
}
