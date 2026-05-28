/**
 * PS6News Auto-Publisher
 * Fetches latest PS6 news from RSS feeds, rewrites uniquely with Gemini,
 * then publishes to Sanity CMS.
 *
 * Usage: node scripts/auto-publish.js
 * Env vars needed: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_API_TOKEN, GEMINI_API
 */

require('dotenv').config({ path: '.env.local' })
const Parser = require('rss-parser')
const { createClient } = require('@sanity/client')
const OpenAI = require('openai').default || require('openai')
const axios = require('axios')

// ── Clients ──────────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const rssParser = new Parser({ timeout: 10000 })

// ── Config ────────────────────────────────────────────────────────────────────

const MAX_ARTICLES_PER_RUN = 1

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=PlayStation+6+OR+PS6+release&hl=en-GB&gl=GB&ceid=GB:en',
  'https://www.videogameschronicle.com/feed/',
  'https://www.eurogamer.net/feed',
]

const PS6_KEYWORDS = /ps6|playstation\s?6|next.gen playstation/i

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomKey() {
  return Math.random().toString(36).substr(2, 12)
}

function textToBlocks(paragraphs) {
  return paragraphs.map(text => ({
    _type: 'block',
    _key: randomKey(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: randomKey(), text: text.trim(), marks: [] }],
  }))
}

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

// ── Full Article Fetcher ──────────────────────────────────────────────────────

async function fetchArticleContent(url) {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 8,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    const html = res.data
    // Extract all <p> tag content — best signal for article body text
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => stripHtml(m[1]).trim())
      .filter(p => p.length > 60 && !/cookie|subscribe|newsletter|sign up|advertisement/i.test(p))
    return paragraphs.slice(0, 25).join('\n\n')
  } catch {
    return null
  }
}

// ── RSS Fetching ──────────────────────────────────────────────────────────────

async function fetchPS6NewsItems() {
  const seen = new Set()
  const items = []

  for (const feedUrl of RSS_FEEDS) {
    try {
      console.log(`  Checking feed: ${feedUrl}`)
      const feed = await rssParser.parseURL(feedUrl)
      for (const item of feed.items) {
        const combined = `${item.title || ''} ${item.contentSnippet || ''}`
        if (!PS6_KEYWORDS.test(combined)) continue
        if (seen.has(item.title)) continue
        seen.add(item.title)
        items.push({
          title: item.title,
          description: stripHtml(item.contentSnippet || item.content || '').substring(0, 600),
          link: item.link,
          pubDate: item.pubDate,
        })
        if (items.length >= MAX_ARTICLES_PER_RUN * 2) break
      }
    } catch (err) {
      console.warn(`  ⚠️  Feed failed (${feedUrl}): ${err.message}`)
    }
  }

  return items.slice(0, MAX_ARTICLES_PER_RUN)
}

// ── Gemini Rewriter ───────────────────────────────────────────────────────────

async function rewriteWithGemini(title, description, link) {
  console.log('   🌐 Fetching full article...')
  const fullContent = link ? await fetchArticleContent(link) : null
  const sourceText = fullContent || description || 'No content available'
  const contentLabel = fullContent ? 'FULL ARTICLE TEXT' : 'SUMMARY (full article unavailable)'

  console.log(`   📄 Source: ${fullContent ? fullContent.length + ' chars fetched' : 'using RSS snippet only'}`)

  const prompt = `You are a senior gaming journalist writing for PS6News.com. The current year is 2026. Write a full, professional news article — minimum 600 words — in the style of IGN, Eurogamer or The Verge.

STRICT RULES:
1. Base the article ONLY on the SOURCE TEXT below. Do not invent facts, quotes, specs or dates not present in the source.
2. If the source speculates, you may reflect that speculation — but label it as such (e.g. "the outlet suggests", "according to the report").
3. Rewrite completely in your own words. Do not copy sentences verbatim.
4. Write in sharp, engaging British English — active voice, strong verbs, no waffle.
5. Structure the article properly: strong intro hook, developed body with subheadings, solid closing paragraph.
6. Each body paragraph must be 60-100 words. Do not write one-liners.
7. IMPORTANT: Do NOT repeatedly name the source publication. You may mention it ONCE at most (e.g. "according to a recent report"). After that, write as if PS6News is reporting the story directly — use phrases like "the report states", "sources indicate", or just state the facts plainly. Never repeat the outlet name more than once.

${contentLabel}:
"""
${sourceText.substring(0, 6000)}
"""

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "Sharp, accurate headline under 70 chars — make it compelling",
  "slug": "seo-slug-lowercase-hyphens-max-55-chars",
  "excerpt": "Punchy meta description 130-155 characters that makes readers want to click",
  "sections": [
    {
      "heading": null,
      "paragraphs": [
        "Strong opening paragraph (60-90 words): lead with the most important fact. Who reported it, what they said, why it matters.",
        "Second paragraph (60-90 words): expand on the core claim with supporting detail from the source."
      ]
    },
    {
      "heading": "Section heading relevant to next topic",
      "paragraphs": [
        "Third paragraph (60-90 words): dive into a specific detail or angle from the source.",
        "Fourth paragraph (60-90 words): quotes, reactions, or additional specifics from the source."
      ]
    },
    {
      "heading": "Another section heading",
      "paragraphs": [
        "Fifth paragraph (60-90 words): implications or context mentioned in the source.",
        "Sixth paragraph (60-90 words): what this means for PS6 fans based on what the source states."
      ]
    },
    {
      "heading": "What to Watch For",
      "paragraphs": [
        "Closing paragraph (60-90 words): what happens next, what to look out for — based only on the source."
      ]
    }
  ],
  "keyTakeaways": [
    "Specific factual point from the source in one sentence",
    "Another specific factual point from the source in one sentence",
    "Third specific factual point from the source in one sentence"
  ]
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content)
}

// ── Sanity Helpers ────────────────────────────────────────────────────────────

async function slugExists(slug) {
  const id = await sanity.fetch(
    `*[_type == "article" && slug.current == $slug][0]._id`,
    { slug }
  )
  return !!id
}

async function getDefaultAuthorId() {
  return await sanity.fetch(`*[_type == "author"][0]._id`)
}

async function getCategoryId(slugName) {
  return await sanity.fetch(
    `*[_type == "category" && slug.current == $slugName][0]._id`,
    { slugName }
  )
}

async function publishToSanity(data, authorId, categoryId) {
  const body = []

  if (data.keyTakeaways?.length) {
    body.push({
      _type: 'keyTakeaways',
      _key: randomKey(),
      items: data.keyTakeaways,
    })
  }

  // Support both old flat body[] and new sections[] format
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
      body.push(...textToBlocks(section.paragraphs || []))
    }
  } else {
    body.push(...textToBlocks(data.body || []))
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

  if (authorId) doc.author = { _type: 'reference', _ref: authorId }
  if (categoryId) doc.category = { _type: 'reference', _ref: categoryId }

  return await sanity.create(doc)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🚀 PS6News Auto-Publisher starting...\n')

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY env var is missing. Add it to .env.local')
    process.exit(1)
  }
  if (!process.env.SANITY_API_TOKEN && !process.env.SANITY_TOKEN) {
    console.error('❌ SANITY_API_TOKEN env var is missing. Add it to .env.local')
    process.exit(1)
  }

  console.log('📡 Fetching PS6 news from RSS feeds...')
  const items = await fetchPS6NewsItems()

  if (!items.length) {
    console.log('ℹ️  No new PS6 news found today.')
    return
  }

  console.log(`\nFound ${items.length} items to process\n`)

  const authorId = await getDefaultAuthorId()
  const categoryId = await getCategoryId('news')
  console.log(`Author: ${authorId || 'none'} | Category: ${categoryId || 'none'}\n`)

  let published = 0
  let skipped = 0
  const results = []

  for (const item of items) {
    console.log(`📰 Processing: "${item.title}"`)
    try {
      console.log('   ✍️  Rewriting with Gemini...')
      const data = await rewriteWithGemini(item.title, item.description, item.link)

      if (await slugExists(data.slug)) {
        console.log(`   ⏭️  Skipped — slug already exists: /${data.slug}\n`)
        skipped++
        continue
      }

      const result = await publishToSanity(data, authorId, categoryId)
      console.log(`   ✅ Published: "${data.title}"`)
      console.log(`      URL: https://ps6news.com/${data.slug}`)
      console.log(`      ID:  ${result._id}\n`)
      results.push({ title: data.title, slug: data.slug, id: result._id })
      published++

      // Respect Gemini free tier rate limits (15 req/min)
      if (items.indexOf(item) < items.length - 1) {
        console.log('   ⏳ Waiting 8s before next request...')
        await new Promise(r => setTimeout(r, 8000))
      }
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}\n`)
    }
  }

  console.log(`\n✅ Done! Published: ${published} | Skipped: ${skipped}`)
  if (results.length) {
    console.log('\nPublished articles:')
    results.forEach(r => console.log(`  • ${r.title} → /${r.slug}`))
  }

  return results
}

// Run if called directly
if (require.main === module) {
  run().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}

module.exports = { run }
