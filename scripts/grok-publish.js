/**
 * PS6News Grok Auto-Publisher
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Grok (xAI) with live web search to:
 *  1. Discover fresh, uncovered PS6 / next-gen console news (last 72 h)
 *  2. Rewrite each story as a full PS6News.com article
 *  3. Generate an AI featured image via Grok image generation
 *  4. Watermark + upload image to Sanity, then publish the article
 *
 * Usage:
 *   node scripts/grok-publish.js               # publish 1 article (default)
 *   node scripts/grok-publish.js --count=3     # publish up to 3 articles
 *   node scripts/grok-publish.js --dry-run     # discover stories only, no publish
 *
 * Required env vars (.env.local):
 *   XAI_API_KEY                — xAI / Grok API key
 *   SANITY_API_TOKEN           — Sanity write token
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')
const OpenAI = require('openai').default || require('openai')
const axios = require('axios')
const sharp = require('sharp')
const { detectCategorySlug } = require('./lib/categorize')
const { applyWatermark } = require('./lib/watermark-buffer')
const { generateSeo } = require('./lib/seo')

// ── xAI model constants — update here when xAI releases newer versions ─────────
const GROK_SEARCH_MODEL = 'grok-4.5'        // Responses API (web search)
const GROK_TEXT_MODEL   = 'grok-3'          // Chat completions (rewrite)
const GROK_MINI_MODEL   = 'grok-3-mini'     // Chat completions (SEO)
const GROK_IMAGE_MODEL  = 'grok-imagine-image-quality' // Image generation

// ── Clients ──────────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
})

// ── CLI args ──────────────────────────────────────────────────────────────────

const cliArgs = process.argv.slice(2)
const DRY_RUN = cliArgs.includes('--dry-run')
const countArg = cliArgs.find(a => a.startsWith('--count='))
const MAX_ARTICLES = countArg ? Math.max(1, parseInt(countArg.split('=')[1], 10)) : 1

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomKey() {
  return Math.random().toString(36).substr(2, 12)
}

function parseParagraphWithLinks(text, existingArticles) {
  // Matches [[LINK:slug|anchor]] and [[EXTLINK:https://...|anchor]]
  const linkPattern = /\[\[(LINK|EXTLINK):([^|]+)\|([^\]]+)\]\]/g
  const markDefs = []
  const children = []
  let lastIndex = 0
  let match

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push({ _type: 'span', _key: randomKey(), text: text.slice(lastIndex, match.index), marks: [] })
    }

    const [, type, target, anchorText] = match
    const linkKey = randomKey()

    if (type === 'EXTLINK') {
      // External link — uses the schema's built-in `link` annotation
      markDefs.push({ _key: linkKey, _type: 'link', href: target.trim(), blank: true })
      children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [linkKey] })
    } else {
      // Internal link — resolve slug to Sanity document reference
      const article = existingArticles.find(a => a.slug === target.trim())
      if (article) {
        markDefs.push({ _key: linkKey, _type: 'link', href: `/${article.slug}` })
        children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [linkKey] })
      } else {
        // Slug not found — render plain text to avoid broken links
        children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [] })
      }
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    children.push({ _type: 'span', _key: randomKey(), text: text.slice(lastIndex), marks: [] })
  }

  return {
    children: children.length > 0 ? children : [{ _type: 'span', _key: randomKey(), text: text.trim(), marks: [] }],
    markDefs,
  }
}

function textToBlocks(paragraphs, existingArticles = []) {
  return paragraphs.map(text => {
    const { children, markDefs } = parseParagraphWithLinks(text.trim(), existingArticles)
    return { _type: 'block', _key: randomKey(), style: 'normal', markDefs, children }
  })
}

// ── Duplicate check ───────────────────────────────────────────────────────────

function isDuplicate(title, existingArticles) {
  const stopWords = new Set([
    'about', 'their', 'which', 'there', 'could', 'would', 'should',
    'playstation', 'release', 'looks', 'knows', 'says', 'report',
    'claims', 'latest', 'after', 'before', 'still', 'delay', 'delayed',
  ])
  const newWords = new Set(
    title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w))
  )
  for (const article of existingArticles) {
    if (!article.title) continue
    const existWords = article.title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w))
    const overlap = existWords.filter(w => newWords.has(w)).length
    if (overlap >= 4) return article.title
  }
  return null
}

// ── Sanity helpers ────────────────────────────────────────────────────────────

// Pillar page keywords — articles whose slugs/titles match these are evergreen guides
const PILLAR_KEYWORDS = /specs|release.?date|price|cost|games|features|design|rumors?|leak|controllers?|backward.?compat|storage|cpu|gpu|ram|teraflop|launch|pre.?order/i

async function fetchExistingArticles() {
  const articles = await sanity.fetch(
    `*[_type == "article"] | order(publishedAt desc) [0..49]{ _id, title, "slug": slug.current }`
  )
  // Tag pillar pages so the AI prompt can reference them correctly
  return articles.map(a => ({
    ...a,
    isPillar: PILLAR_KEYWORDS.test(a.title || '') || PILLAR_KEYWORDS.test(a.slug || ''),
  }))
}

async function slugExists(slug) {
  const id = await sanity.fetch(`*[_type == "article" && slug.current == $slug][0]._id`, { slug })
  return !!id
}

async function getDefaultAuthorId() {
  return await sanity.fetch(`*[_type == "author"][0]._id`)
}

async function getCategoryMap() {
  const cats = await sanity.fetch(`*[_type == "category"]{ "slug": slug.current, _id }`)
  const map = {}
  for (const c of cats) if (c.slug) map[c.slug] = c._id
  return map
}

// ── Phase 1: Grok Responses API — live web search discovery ─────────────────

async function discoverStories(existingArticles, count) {
  const coveredList = existingArticles
    .slice(0, 35)
    .map(a => `- ${a.title}`)
    .join('\n')

  const prompt = `You are a gaming news editor for PS6News.com. Search the web RIGHT NOW and find the ${count * 3} most recent, genuinely new news stories (published within the last 72 hours) about:

PRIORITY TOPICS (in order):
1. PS6 / PlayStation 6 — specs, release date, price, launch games, leaks, rumors
2. Sony PlayStation strategy — next-gen hardware plans, business decisions, studio news
3. Xbox next-gen competitor (Project Helix or its successor) — for competitive context
4. Major next-gen launch games — GTA 6, Sony first-party exclusives, cross-gen titles

REQUIREMENTS:
- Must be REAL stories from credible gaming/tech sources (IGN, Eurogamer, VGC, The Verge, Bloomberg, Reuters, etc.)
- Must be genuinely NEW news — not already in the list below
- Prioritise exclusives, leaks, and official announcements over opinion pieces
- Include the exact source URL so it can be verified

ALREADY COVERED (skip any story that closely overlaps with these):
${coveredList}

Return ONLY a raw JSON object — no markdown, no code fences, nothing before or after the JSON:
{
  "stories": [
    {
      "headline": "The actual headline from the source",
      "sourceUrl": "https://exact-url-to-the-article.com",
      "sourceName": "IGN",
      "publishedAt": "2026-07-12",
      "summary": "3-5 sentence factual summary of what the article actually says. Include key details, figures, and claims from the source accurately."
    }
  ]
}`

  console.log(`\n🔍 Searching for latest PS6 / next-gen news via Grok (live web search)...`)

  // Use the Responses API — the new xAI web search interface
  const res = await axios.post(
    'https://api.x.ai/v1/responses',
    {
      model: GROK_SEARCH_MODEL,
      input: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search' }],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 90000,
    }
  )

  // Extract text content from the Responses API output
  const output = res.data?.output || []
  const message = output.find(o => o.type === 'message')
  const rawText = (
    message?.content?.find(c => c.type === 'output_text')?.text ||
    message?.content?.[0]?.text ||
    ''
  ).trim()

  if (!rawText) {
    console.warn('   ⚠️  Empty response from Grok search')
    return []
  }

  // Strip any accidental markdown fences before parsing
  const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed.stories) ? parsed.stories : []
  } catch {
    console.warn('   ⚠️  Could not parse Grok response as JSON')
    console.warn('   Raw (first 300 chars):', rawText.slice(0, 300))
    return []
  }
}

// ── Phase 2: Grok rewrite ─────────────────────────────────────────────────────

async function rewriteStory(story, existingArticles) {
  // Split articles into pillar guides and regular news for clearer prompting
  const pillars = existingArticles.filter(a => a.isPillar).slice(0, 10)
  const recentNews = existingArticles.filter(a => !a.isPillar).slice(0, 10)

  const pillarContext = pillars.length
    ? `\nOUR PILLAR / GUIDE PAGES (evergreen, high-value — link here if the article topic directly relates):\n${pillars.map(a => `  - slug: ${a.slug} | "${a.title}"`).join('\n')}`
    : ''

  const newsContext = recentNews.length
    ? `\nOUR RECENT NEWS ARTICLES (only link if this new article genuinely continues or references that story):\n${recentNews.map(a => `  - slug: ${a.slug} | "${a.title}"`).join('\n')}`
    : ''

  const prompt = `You are a senior gaming journalist at PS6News.com (2026). Write a full professional news article — minimum 600 words — based on the story below.

WRITING RULES:
1. Base the article ONLY on the source summary. Do not invent facts, specs, quotes, or dates.
2. Rewrite completely in your own words. No verbatim copying.
3. Sharp, engaging British English — active voice, strong verbs, no waffle.
4. Structure: compelling hook intro → developed body with subheadings → PS6-angle closing section.
5. Every paragraph must be 60-100 words. No one-liner paragraphs.
6. Name the original source ONCE in the opening paragraph, then write as PS6News original reporting.
7. If the story is NOT directly about PS6, add a "What This Means for PS6" closing section.

LINKING RULES — read carefully, this is important:

EXTERNAL LINKS — use [[EXTLINK:URL|anchor text]] syntax:
• ALWAYS link the source on its FIRST mention in the opening paragraph using the source URL below.
  Example: "According to [[EXTLINK:${story.sourceUrl}|${story.sourceName || 'the report'}]], Sony has..."
• You MAY add 1-2 more external links if you genuinely reference another credible outlet (IGN, Eurogamer, VGC, Bloomberg, Kotaku, The Verge, Reuters) by name in the text. Only if it reads naturally — never force it.
• NEVER link to competitor news sites just to link — only when you directly reference their reporting.
• Link the anchor text to a meaningful phrase (the outlet name, or the specific claim), never bare URLs.

INTERNAL LINKS — use [[LINK:slug|anchor text]] syntax:
• Only link to one of the pages listed below if the topic you are writing DIRECTLY relates.
• Maximum 2 internal links per article. Zero is fine — only add them if they genuinely help the reader.
• Place internal links mid-article where context arises naturally — NEVER in the opening or closing paragraph.
• The anchor text must be a natural phrase in the sentence, not a forced insertion.
• NEVER link just to hit a quota. A reader should not notice the link was added by an AI.
${pillarContext}
${newsContext}

IMAGE PROMPT RULES:
Generate a 50-80 word AI image prompt for the featured image. It must be safe for work, no real people, no brand logos. Cinematic photorealistic style. Gaming/technology subject matching the article topic. Dark background, dramatic blue/purple neon lighting, ultra detail.

SOURCE:
Headline: ${story.headline}
Source URL: ${story.sourceUrl}
Source name: ${story.sourceName || 'the source'}
Published: ${story.publishedAt || 'recently'}
Summary:
${story.summary}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "Compelling headline under 70 chars, keyword-first",
  "slug": "seo-slug-lowercase-hyphens-max-55-chars",
  "excerpt": "Punchy meta description 130-155 chars with emotional hook or CTA",
  "imagePrompt": "Cinematic photorealistic ...",
  "sections": [
    {
      "heading": null,
      "paragraphs": [
        "Opening paragraph 60-90 words with source attribution and [[EXTLINK:${story.sourceUrl}|${story.sourceName || 'the report'}]] linked naturally.",
        "Second paragraph 60-90 words expanding on the core claim."
      ]
    },
    {
      "heading": "Relevant Section Heading",
      "paragraphs": [
        "Third paragraph 60-90 words. Add an internal [[LINK:slug|anchor]] here only if genuinely relevant.",
        "Fourth paragraph 60-90 words."
      ]
    },
    {
      "heading": "Another Section Heading",
      "paragraphs": [
        "Fifth paragraph 60-90 words.",
        "Sixth paragraph 60-90 words. May add a second external link here if you reference another outlet by name."
      ]
    },
    {
      "heading": "What This Means for PS6",
      "paragraphs": [
        "Closing PS6-angle paragraph 60-90 words. No links in this paragraph."
      ]
    }
  ],
  "keyTakeaways": [
    "Specific factual point from the source",
    "Another specific factual point",
    "Third specific factual point"
  ]
}`

  const response = await grok.chat.completions.create({
    model: GROK_TEXT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content)
}

// ── Phase 3: Grok image generation + upload ────────────────────────────────

async function generateAndUploadImage(imagePrompt) {
  console.log('   🎨 Generating AI featured image...')

  let imageBuffer

  try {
    const response = await grok.images.generate({
      model: GROK_IMAGE_MODEL,
      prompt: imagePrompt,
      n: 1,
    })

    const imgData = response.data?.[0]
    if (!imgData) throw new Error('Empty image response')

    if (imgData.url) {
      console.log(`   📥 Downloading generated image...`)
      const res = await axios.get(imgData.url, { responseType: 'arraybuffer', timeout: 60000 })
      imageBuffer = Buffer.from(res.data)
    } else if (imgData.b64_json) {
      imageBuffer = Buffer.from(imgData.b64_json, 'base64')
    } else {
      throw new Error('No image URL or base64 in response')
    }
  } catch (err) {
    console.warn(`   ⚠️  Image generation failed: ${err.message}`)
    return null
  }

  // Normalise to JPEG
  try {
    imageBuffer = await sharp(imageBuffer).rotate().jpeg({ quality: 90 }).toBuffer()
  } catch (err) {
    console.warn(`   ⚠️  JPEG conversion failed: ${err.message}`)
    return null
  }

  // Apply PS6News watermark
  try {
    imageBuffer = await applyWatermark(imageBuffer)
    console.log('   🪧 Watermark applied')
  } catch (err) {
    console.warn(`   ⚠️  Watermark skipped: ${err.message}`)
  }

  // Upload to Sanity
  try {
    const asset = await sanity.assets.upload('image', imageBuffer, {
      filename: `ps6-ai-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    })
    console.log(`   🖼️  AI image uploaded: ${asset._id}`)
    return asset._id
  } catch (err) {
    console.warn(`   ⚠️  Sanity upload failed: ${err.message}`)
    return null
  }
}

// ── Phase 4: Publish to Sanity ────────────────────────────────────────────────

async function publishToSanity(data, authorId, categoryId, imageAssetId, existingArticles) {
  const body = []

  if (data.keyTakeaways?.length) {
    body.push({
      _type: 'keyTakeaways',
      _key: randomKey(),
      items: data.keyTakeaways,
    })
  }

  if (data.sections?.length) {
    for (const section of data.sections) {
      if (section.heading) {
        body.push({
          _type: 'block',
          _key: randomKey(),
          style: 'h2',
          markDefs: [],
          children: [{ _type: 'span', _key: randomKey(), text: section.heading, marks: [] }],
        })
      }
      body.push(...textToBlocks(section.paragraphs || [], existingArticles))
    }
  }

  const doc = {
    _type: 'article',
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    excerpt: data.excerpt,
    body,
    publishedAt: new Date().toISOString(),
    featured: false,
  }

  // Auto-generate SEO meta
  try {
    const bodyText = `${data.excerpt || ''} ${(data.sections || [])
      .map(s => `${s.heading || ''} ${(s.paragraphs || []).join(' ')}`)
      .join(' ')}`
    const seo = await generateSeo(grok, { title: data.title, excerpt: data.excerpt, body: bodyText }, { model: GROK_MINI_MODEL })
    doc.seo = seo
    console.log(`   🔎 SEO: ${seo.metaTitle}`)
  } catch (e) {
    console.warn(`   ⚠️  SEO skipped: ${e.message}`)
  }

  if (authorId) doc.author = { _type: 'reference', _ref: authorId }
  if (categoryId) doc.category = { _type: 'reference', _ref: categoryId }
  if (imageAssetId) {
    doc.mainImage = {
      _type: 'image',
      asset: { _type: 'reference', _ref: imageAssetId },
    }
  }

  return await sanity.create(doc)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🚀 PS6News Grok Publisher starting...')
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (discover only)' : `publish up to ${MAX_ARTICLES} article(s)`}\n`)

  if (!process.env.XAI_API_KEY) {
    console.error('❌ XAI_API_KEY is missing — add it to .env.local')
    process.exit(1)
  }
  if (!process.env.SANITY_API_TOKEN && !process.env.SANITY_TOKEN) {
    console.error('❌ SANITY_API_TOKEN is missing — add it to .env.local')
    process.exit(1)
  }

  // Load existing articles for dedup + internal linking
  const existingArticles = await fetchExistingArticles()
  console.log(`📚 ${existingArticles.length} existing articles loaded\n`)

  // Phase 1: Discover
  const stories = await discoverStories(existingArticles, MAX_ARTICLES)

  if (!stories.length) {
    console.log('\nℹ️  No new stories found — try again later or check XAI_API_KEY.\n')
    return
  }

  console.log(`\n✅ Grok found ${stories.length} candidate stories:\n`)
  stories.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.headline}`)
    console.log(`     📰 ${s.sourceName || s.sourceUrl}  |  ${s.publishedAt || 'date unknown'}`)
  })

  if (DRY_RUN) {
    console.log('\n🔎 Dry run — stopping here. No articles published.\n')
    return
  }

  console.log()

  const authorId = await getDefaultAuthorId()
  const categoryMap = await getCategoryMap()
  console.log(`Author: ${authorId || 'none'} | Categories: ${Object.keys(categoryMap).join(', ')}\n`)

  let published = 0
  let skipped = 0
  const results = []

  for (const story of stories) {
    if (published >= MAX_ARTICLES) break

    console.log(`\n📰 Processing: "${story.headline}"`)

    try {
      // Local duplicate check
      const duplicate = isDuplicate(story.headline, existingArticles)
      if (duplicate) {
        console.log(`   ⏭️  Skipped — too similar to: "${duplicate}"`)
        skipped++
        continue
      }

      // Phase 2: Rewrite
      console.log('   ✍️  Rewriting with Grok...')
      const data = await rewriteStory(story, existingArticles)

      if (!data?.title || !data?.slug) {
        console.log('   ⚠️  Invalid article data returned — skipping')
        skipped++
        continue
      }

      // Slug conflict
      if (await slugExists(data.slug)) {
        console.log(`   ⏭️  Skipped — slug already exists: /${data.slug}`)
        skipped++
        continue
      }

      // Phase 3: Generate AI image
      const fallbackImagePrompt = `Cinematic next-gen PlayStation 6 console concept in dark studio, dramatic blue neon lighting, ultra-polished surface reflections, 4K ultra detail, no text no logos`
      const imageAssetId = await generateAndUploadImage(data.imagePrompt || fallbackImagePrompt)

      // Detect category
      const catBody = `${data.excerpt || ''} ${(data.sections || []).map(s => `${s.heading || ''} ${(s.paragraphs || []).join(' ')}`).join(' ')}`
      const catSlug = detectCategorySlug(data.title || '', catBody)
      const categoryId = categoryMap[catSlug] || categoryMap['news']
      console.log(`   🏷️  Category: ${catSlug}`)

      // Phase 4: Publish
      const result = await publishToSanity(data, authorId, categoryId, imageAssetId, existingArticles)
      console.log(`   ✅ Published: "${data.title}"`)
      console.log(`      URL: https://ps6news.com/${data.slug}`)
      console.log(`      ID:  ${result._id}`)
      results.push({ title: data.title, slug: data.slug, id: result._id })
      published++

      // Rate limit buffer
      if (published < MAX_ARTICLES) {
        console.log('\n   ⏳ Waiting 6s before next article...')
        await new Promise(r => setTimeout(r, 6000))
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`)
      skipped++
    }
  }

  console.log(`\n✅ Done! Published: ${published} | Skipped: ${skipped}`)
  if (results.length) {
    console.log('\nPublished articles:')
    results.forEach(r => console.log(`  • "${r.title}" → https://ps6news.com/${r.slug}`))
  }

  return results
}

if (require.main === module) {
  run().catch(err => {
    console.error('\n💥 Fatal error:', err.message)
    process.exit(1)
  })
}

module.exports = { run }
