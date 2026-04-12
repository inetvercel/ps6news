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
    const {email} = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({error: 'Valid email required'}, {status: 400})
    }

    const normalised = email.toLowerCase().trim()

    // Check for duplicate
    const existing = await sanityClient.fetch(
      `*[_type == "subscriber" && email == $email][0]._id`,
      {email: normalised}
    )
    if (existing) {
      return NextResponse.json({success: true, message: 'Already subscribed'})
    }

    await sanityClient.create({
      _type: 'subscriber',
      email: normalised,
      subscribedAt: new Date().toISOString(),
    })

    return NextResponse.json({success: true})
  } catch (error: any) {
    console.error('Newsletter error:', error)
    return NextResponse.json({error: error.message || 'Failed to subscribe'}, {status: 500})
  }
}
