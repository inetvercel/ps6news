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
const { detectCategorySlug } = require('./lib/categorize')
const { applyWatermark } = require('./lib/watermark-buffer')
const { generateSeo } = require('./lib/seo')

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
  // PS6 / PlayStation direct
  'https://news.google.com/rss/search?q=PlayStation+6+OR+PS6+release&hl=en-GB&gl=GB&ceid=GB:en',
  'https://news.google.com/rss/search?q=PS6+Sony+console&hl=en-GB&gl=GB&ceid=GB:en',
  'https://news.google.com/rss/search?q=Sony+PlayStation+next+gen+2026&hl=en-GB&gl=GB&ceid=GB:en',
  // Xbox Helix / competitor
  'https://news.google.com/rss/search?q=Xbox+Project+Helix+OR+Xbox+Helix+console&hl=en-GB&gl=GB&ceid=GB:en',
  'https://news.google.com/rss/search?q=Xbox+next+gen+console+2026&hl=en-GB&gl=GB&ceid=GB:en',
  'https://news.google.com/rss/search?q=Nintendo+Switch+2+vs+PlayStation&hl=en-GB&gl=GB&ceid=GB:en',
  // Sony financials / PS5 lifecycle
  'https://news.google.com/rss/search?q=Sony+PlayStation+financial+hardware+2026&hl=en-GB&gl=GB&ceid=GB:en',
  'https://news.google.com/rss/search?q=PS5+price+OR+PS5+Pro+OR+Sony+hardware+2026&hl=en-GB&gl=GB&ceid=GB:en',
  // Major games
  'https://news.google.com/rss/search?q=GTA+6+PlayStation+OR+GTA6+PS6&hl=en-GB&gl=GB&ceid=GB:en',
  'https://news.google.com/rss/search?q=007+First+Light+OR+Naughty+Dog+PS6&hl=en-GB&gl=GB&ceid=GB:en',
  // Gaming press
  'https://www.videogameschronicle.com/feed/',
  'https://www.eurogamer.net/feed',
  'https://kotaku.com/rss',
  'https://www.pushsquare.com/feeds/latest',
  'https://www.gamesradar.com/rss/',
  'https://www.theverge.com/rss/index.xml',
]

// Story type detection — determines AI framing
const STORY_TYPES = {
  PS6_DIRECT:   /\bps6\b|playstation\s?6|next[- ]gen playstation|sony.{0,20}next.{0,10}console/i,
  COMPETITOR:   /xbox.{0,15}helix|project helix|switch\s?2|steam deck/i,
  SONY_BIZ:     /sony.{0,30}(financial|revenue|profit|invest|hardware|ps5 pro|ps5 price|lifecycle)/i,
  MAJOR_GAME:   /\bgta\s?6\b|grand theft auto 6|007 first light|naughty dog|insomniac|fromsoftware|next[- ]gen.{0,20}game/i,
}

function detectStoryType(text) {
  if (STORY_TYPES.PS6_DIRECT.test(text)) return 'PS6_DIRECT'
  if (STORY_TYPES.COMPETITOR.test(text)) return 'COMPETITOR'
  if (STORY_TYPES.SONY_BIZ.test(text)) return 'SONY_BIZ'
  if (STORY_TYPES.MAJOR_GAME.test(text)) return 'MAJOR_GAME'
  return null
}

const PS6_KEYWORDS = /\bps6\b|playstation\s?6|next[- ]gen playstation|sony.{0,20}next.{0,10}console|xbox.{0,15}helix|project helix|switch\s?2.{0,20}(vs|playstation)|sony.{0,30}(financial|ps5 pro|hardware)|\bgta\s?6\b|007 first light/i

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomKey() {
  return Math.random().toString(36).substr(2, 12)
}

function parseParagraphWithLinks(text, existingArticles) {
  const linkPattern = /\[\[LINK:([^|]+)\|([^\]]+)\]\]/g
  const markDefs = []
  const children = []
  let lastIndex = 0
  let match
  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push({ _type: 'span', _key: randomKey(), text: text.slice(lastIndex, match.index), marks: [] })
    }
    const [, slug, anchorText] = match
    const article = existingArticles.find(a => a.slug === slug)
    if (article) {
      const linkKey = randomKey()
      markDefs.push({ _key: linkKey, _type: 'internalLink', reference: { _type: 'reference', _ref: article._id } })
      children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [linkKey] })
    } else {
      children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [] })
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

function stripHtml(html = '') {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}

const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*',
}

// ── Full Article Fetcher ──────────────────────────────────────────────────────

async function fetchArticleContent(url) {
  try {
    const res = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 8,
      headers: AXIOS_HEADERS,
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

// ── Image Scraper ────────────────────────────────────────────────────────────

function isLikelyArticleImage(imgUrl) {
  if (!imgUrl) return false
  const lower = imgUrl.toLowerCase()
  // Reject tiny icons, logos, avatars, favicons
  if (/logo|icon|favicon|avatar|badge|sprite|placeholder|default|blank|pixel|tracking/i.test(lower)) return false
  // Reject known small image patterns (300x300 or smaller squares — usually site logos)
  if (/[_-](\d{2,3})x\2[_\-./]/i.test(lower)) return false  // e.g. 300x300
  // Must be a recognisable image extension or CDN path
  if (!/\.(jpg|jpeg|png|webp|gif)($|\?)|\/images\/|\/uploads\/|\/media\/|\/content\/|\/wp-content\/|\/cdn\//i.test(lower)) return false
  return true
}

async function fetchOgImage(url) {
  try {
    const res = await axios.get(url, { timeout: 10000, maxRedirects: 5, headers: AXIOS_HEADERS })
    const html = res.data
    const patterns = [
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
      /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/i,
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      const imgUrl = match?.[1]
      if (imgUrl?.startsWith('http') && isLikelyArticleImage(imgUrl)) return imgUrl
    }
  } catch {}
  return null
}

async function uploadImageToSanity(imageUrl) {
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: AXIOS_HEADERS,
    })
    const buffer = Buffer.from(res.data)

    // Bake the PS6News watermark into the image (falls back to original on error)
    let finalBuffer = buffer
    let filename = `ps6-auto-${Date.now()}.jpg`
    let contentType = 'image/jpeg'
    try {
      finalBuffer = await applyWatermark(buffer)
      filename = `ps6-auto-watermarked-${Date.now()}.jpg`
      console.log('   🪧 Watermark applied')
    } catch (e) {
      console.warn(`   ⚠️  Watermark failed, using original image: ${e.message}`)
      const ct = res.headers['content-type'] || 'image/jpeg'
      contentType = ct
      const ext = ct.split('/')[1]?.split(';')[0]?.replace('jpeg', 'jpg') || 'jpg'
      filename = `ps6-auto-${Date.now()}.${ext}`
    }

    const asset = await sanity.assets.upload('image', finalBuffer, {
      filename,
      contentType,
    })
    console.log(`   🖼️  Image uploaded: ${asset._id}`)
    return asset._id
  } catch (err) {
    console.warn(`   ⚠️  Image upload failed: ${err.message}`)
    return null
  }
}

// ── Duplicate & Existing Articles ─────────────────────────────────────────────

async function isDuplicateContent(title, existingArticles) {
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
    const recentWords = article.title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w))
    const overlap = recentWords.filter(w => newWords.has(w)).length
    if (overlap >= 4) return article.title
  }
  return null
}

async function fetchExistingArticles() {
  return await sanity.fetch(
    `*[_type == "article"][0..30]{ _id, title, "slug": slug.current }`
  )
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
        if (items.length >= MAX_ARTICLES_PER_RUN * 5) break
      }
    } catch (err) {
      console.warn(`  ⚠️  Feed failed (${feedUrl}): ${err.message}`)
    }
  }

  return items.slice(0, MAX_ARTICLES_PER_RUN)
}

// ── Gemini Rewriter ───────────────────────────────────────────────────────────

async function rewriteWithGemini(title, description, link, existingArticles = [], storyType = 'PS6_DIRECT') {
  console.log('   🌐 Fetching full article...')
  const fullContent = link ? await fetchArticleContent(link) : null
  const sourceText = fullContent || description || 'No content available'
  const contentLabel = fullContent ? 'FULL ARTICLE TEXT' : 'SUMMARY (full article unavailable)'

  console.log(`   📄 Source: ${fullContent ? fullContent.length + ' chars fetched' : 'using RSS snippet only'} | Type: ${storyType}`)

  const articlesContext = existingArticles.length
    ? `\n\nEXISTING PS6NEWS ARTICLES — for natural internal links only:\n${existingArticles.slice(0, 15).map(a => `- "${a.title}" → slug: ${a.slug}`).join('\n')}\nIf a topic in your article genuinely relates to one of these, you may wrap the anchor text like this: [[LINK:slug|anchor text]] — once or twice max, only where it reads naturally. Never force it.`
    : ''

  // PS6 angle instruction varies by story type
  const ps6AngleInstruction = storyType === 'PS6_DIRECT'
    ? ''
    : storyType === 'COMPETITOR'
    ? `\n9. REQUIRED FINAL SECTION — "What This Means for PS6": Write a dedicated closing section (heading: "What This Means for PS6") comparing or contrasting this news with what we know about PS6. Discuss how PS6 stacks up, what Sony may need to do in response, or why PS6 fans should care. Base speculation only on publicly known PS6 information — do not invent specs or dates.`
    : storyType === 'SONY_BIZ'
    ? `\n9. REQUIRED FINAL SECTION — "PS6 Implications": Write a dedicated closing section (heading: "PS6 Implications") analysing what this Sony business news means for the PS6 — pricing, timeline, development priorities, or launch strategy. Clearly label any speculation as such.`
    : storyType === 'MAJOR_GAME'
    ? `\n9. REQUIRED FINAL SECTION — "PS6 and the Future of [Game]": Write a dedicated closing section discussing how this game fits into the PS6 era — performance expectations, next-gen potential, or what PS6 hardware could mean for the franchise. Clearly label any speculation.`
    : ''

  const prompt = `You are a senior gaming journalist writing for PS6News.com. The current year is 2026. Write a full, professional news article — minimum 600 words — in the style of IGN, Eurogamer or The Verge.

STRICT RULES:
1. Base the article ONLY on the SOURCE TEXT below. Do not invent facts, quotes, specs or dates not present in the source.
2. If the source speculates, you may reflect that speculation — but label it as such (e.g. "the outlet suggests", "according to the report").
3. Rewrite completely in your own words. Do not copy sentences verbatim.
4. Write in sharp, engaging British English — active voice, strong verbs, no waffle.
5. Structure the article properly: strong intro hook, developed body with subheadings, solid closing paragraph.
6. Each body paragraph must be 60-100 words. Do not write one-liners.
7. Do NOT repeatedly name the source publication. Mention it ONCE at most, then write as PS6News's own reporting.
8. Internal links: use [[LINK:slug|anchor text]] syntax sparingly and only where natural.${ps6AngleInstruction}${articlesContext}

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
      "heading": "What This Means for PS6",
      "paragraphs": [
        "Closing PS6-focused paragraph (60-90 words): how this story connects to the PS6 — competitor context, Sony strategy, or next-gen implications."
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

// Returns a map of category slug -> _id for all categories
async function getCategoryMap() {
  const cats = await sanity.fetch(`*[_type == "category"]{ "slug": slug.current, _id }`)
  const map = {}
  for (const c of cats) if (c.slug) map[c.slug] = c._id
  return map
}

async function publishToSanity(data, authorId, categoryId, imageAssetId, existingArticles = []) {
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
  } else {
    body.push(...textToBlocks(data.body || [], existingArticles))
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

  // Auto-generate SEO meta tags following the title/description rules.
  try {
    const bodyText = `${data.excerpt || ''} ${(data.sections || [])
      .map((s) => `${s.heading || ''} ${(s.paragraphs || []).join(' ')}`)
      .join(' ')} ${(data.body || []).join(' ')}`
    const seo = await generateSeo(openai, {
      title: data.title,
      excerpt: data.excerpt,
      body: bodyText,
    })
    doc.seo = seo
    console.log(`   🔎 SEO: ${seo.metaTitle}`)
  } catch (e) {
    console.warn(`   ⚠️  SEO generation skipped: ${e.message}`)
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
  const categoryMap = await getCategoryMap()
  console.log(`Author: ${authorId || 'none'} | Categories: ${Object.keys(categoryMap).join(', ') || 'none'}\n`)

  let published = 0
  let skipped = 0
  const results = []

  const existingArticles = await fetchExistingArticles()
  console.log(`   Found ${existingArticles.length} existing articles for internal linking\n`)

  for (const item of items) {
    console.log(`📰 Processing: "${item.title}"`)
    try {
      // Duplicate check
      const duplicate = await isDuplicateContent(item.title, existingArticles)
      if (duplicate) {
        console.log(`   ⏭️  Skipped — similar article published recently: "${duplicate}"\n`)
        skipped++
        continue
      }

      const storyType = detectStoryType(`${item.title} ${item.description}`)
      console.log(`   ✍️  Rewriting with GPT-5... [${storyType}]`)
      const data = await rewriteWithGemini(item.title, item.description, item.link, existingArticles, storyType)

      if (await slugExists(data.slug)) {
        console.log(`   ⏭️  Skipped — slug already exists: /${data.slug}\n`)
        skipped++
        continue
      }

      // Try to scrape and upload featured image
      let imageAssetId = null
      if (item.link) {
        console.log('   🔍 Looking for featured image...')
        const ogImageUrl = await fetchOgImage(item.link)
        if (ogImageUrl) {
          imageAssetId = await uploadImageToSanity(ogImageUrl)
        } else {
          console.log('   ⚠️  No OG image found')
        }
      }

      // Auto-detect category from the rewritten content (title weighted heavily)
      const catBody = `${data.excerpt || ''} ${(data.sections || []).map(s => `${s.heading || ''} ${(s.paragraphs || []).join(' ')}`).join(' ')} ${(data.body || []).join(' ')}`
      const catSlug = detectCategorySlug(data.title || '', catBody)
      const categoryId = categoryMap[catSlug] || categoryMap['news']
      console.log(`   🏷️  Category: ${catSlug}`)

      const result = await publishToSanity(data, authorId, categoryId, imageAssetId, existingArticles)
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
