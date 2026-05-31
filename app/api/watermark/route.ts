import {NextRequest, NextResponse} from 'next/server'
import {createClient} from '@sanity/client'
import axios from 'axios'
// CommonJS util shared with the CLI watermark scripts.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {applyWatermark} = require('../../../scripts/lib/watermark-buffer')

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Recursively swap every reference to `oldId` with `newId` inside a document.
function deepReplaceRef(node: any, oldId: string, newId: string): boolean {
  let changed = false
  if (Array.isArray(node)) {
    for (const item of node) {
      if (deepReplaceRef(item, oldId, newId)) changed = true
    }
  } else if (node && typeof node === 'object') {
    if (node._type === 'reference' && node._ref === oldId) {
      node._ref = newId
      changed = true
    }
    for (const key of Object.keys(node)) {
      if (key === '_ref') continue
      if (deepReplaceRef(node[key], oldId, newId)) changed = true
    }
  }
  return changed
}

export async function POST(request: NextRequest) {
  try {
    // Auth: require a shared admin secret (configured in env, entered in the tool).
    const secret = process.env.ADMIN_SECRET
    if (secret) {
      const provided = request.headers.get('x-admin-secret')
      if (provided !== secret) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401})
      }
    }

    if (!process.env.SANITY_API_TOKEN && !process.env.SANITY_TOKEN) {
      return NextResponse.json(
        {error: 'Server missing SANITY_API_TOKEN'},
        {status: 500}
      )
    }

    const {assetIds} = await request.json()
    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({error: 'assetIds[] required'}, {status: 400})
    }

    const results: any[] = []

    for (const assetId of assetIds) {
      try {
        const asset = await sanity.fetch<{url: string; originalFilename?: string}>(
          `*[_id == $id][0]{ url, originalFilename }`,
          {id: assetId}
        )
        if (!asset?.url) {
          results.push({assetId, ok: false, error: 'Asset not found'})
          continue
        }

        // Download + watermark
        const res = await axios.get(asset.url, {
          responseType: 'arraybuffer',
          timeout: 30000,
        })
        const watermarked = await applyWatermark(Buffer.from(res.data))

        // Upload the watermarked copy
        const uploaded = await sanity.assets.upload('image', watermarked, {
          filename: `ps6-watermarked-${Date.now()}.jpg`,
          contentType: 'image/jpeg',
        })

        // Repoint every document that referenced the original asset.
        const docs = await sanity.fetch<any[]>(
          `*[references($id) && !(_id in path("drafts.**"))]`,
          {id: assetId}
        )
        let updatedDocs = 0
        const tx = sanity.transaction()
        for (const doc of docs) {
          const copy = JSON.parse(JSON.stringify(doc))
          if (deepReplaceRef(copy, assetId, uploaded._id)) {
            tx.createOrReplace(copy)
            updatedDocs++
          }
        }
        if (updatedDocs > 0) await tx.commit()

        results.push({
          assetId,
          ok: true,
          newAssetId: uploaded._id,
          newUrl: uploaded.url,
          updatedDocs,
        })
      } catch (e: any) {
        results.push({assetId, ok: false, error: e?.message || 'Failed'})
      }
    }

    return NextResponse.json({results})
  } catch (error: any) {
    console.error('Watermark API error:', error)
    return NextResponse.json(
      {error: error?.message || 'Failed'},
      {status: 500}
    )
  }
}
