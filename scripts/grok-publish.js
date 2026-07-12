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

// ── Known outlet URLs for auto-linking when mentioned by name ─────────────────
const KNOWN_OUTLET_URLS = {
  'Push Square':           'https://www.pushsquare.com',
  'IGN':                   'https://www.ign.com',
  'Eurogamer':             'https://www.eurogamer.net',
  'VGC':                   'https://www.videogameschronicle.com',
  'Video Games Chronicle': 'https://www.videogameschronicle.com',
  'Kotaku':                'https://www.kotaku.com',
  'Bloomberg':             'https://www.bloomberg.com',
  'The Verge':             'https://www.theverge.com',
  'Reuters':               'https://www.reuters.com',
  'Digital Foundry':       'https://www.eurogamer.net/digital-foundry',
  'GamesIndustry.biz':     'https://www.gamesindustry.biz',
  'GamesIndustry':         'https://www.gamesindustry.biz',
  'ComicBook.com':         'https://comicbook.com',
  'TechRadar':             'https://www.techradar.com',
  'indy100':               'https://www.indy100.com',
  'BusinessMirror':        'https://businessmirror.com.ph',
  'GamesRadar':            'https://www.gamesradar.com',
  'Axios':                 'https://www.axios.com',
}

// Pillar topic patterns → used to match slugs from existing articles for internal links
const PILLAR_TOPIC_PATTERNS = [
  { re: /\b(release date|launch date|launch window|release window|launch timing|when.*release)\b/i,       topic: 'release' },
  { re: /\b(specs|specifications|hardware spec|GPU|teraflop|RDNA|Zen \d|SSD speed|processing power)\b/i,  topic: 'specs'   },
  { re: /\b(price|cost|retail price|launch price|how much|afford)\b/i,                                    topic: 'price'   },
  { re: /\b(launch (games?|titles?)|launch lineup|launch library|first.party|exclusives?)\b/i,            topic: 'games'   },
  { re: /\b(DualSense|controller|haptic feedback|adaptive trigger)\b/i,                                   topic: 'control' },
  { re: /\b(backward compat|back.compat|PS4 games? on|legacy games?)\b/i,                                 topic: 'backcompat' },
  { re: /\b(disc|physical (media|game|edition)|disc.?less|digital.?only)\b/i,                             topic: 'disc'    },
]

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

// ── Deterministic link injection ──────────────────────────────────────────────
// Injects source, outlet, and internal pillar links into the generated article.
// Called after rewriteStory so Grok only has to focus on writing quality.

function injectArticleLinks(data, story, existingArticles) {
  if (!data.sections?.length) return data

  const MAX_EXT  = 4
  const MAX_INT  = 2
  let extCount   = 0
  let intCount   = 0

  // Already-linked outlet names/slugs — avoid double-linking
  const linkedOutlets = new Set()
  const linkedSlugs   = new Set()

  // Build internal-link candidates from pillar articles
  const pillarCandidates = [] // { re, slug }
  for (const pattern of PILLAR_TOPIC_PATTERNS) {
    // Find first pillar article whose slug/title matches this topic keyword
    const match = existingArticles.find(a =>
      a.isPillar && (pattern.re.test(a.title || '') || pattern.re.test(a.slug || ''))
    )
    if (match) pillarCandidates.push({ re: pattern.re, slug: match.slug })
  }

  const totalSections = data.sections.length

  const processedSections = data.sections.map((section, sectionIdx) => {
    const isFirst = sectionIdx === 0
    const isLast  = sectionIdx === totalSections - 1

    const paragraphs = (section.paragraphs || []).map((para, paraIdx) => {
      let text = para

      // ── 1. Source external link — always in opening paragraph ──────────────
      if (isFirst && paraIdx === 0 && extCount < MAX_EXT && story.sourceUrl) {
        const srcName = story.sourceName || 'the report'
        const token   = `[[EXTLINK:${story.sourceUrl}|${srcName}]]`
        // Skip if Grok already embedded it
        if (!text.includes('[[EXTLINK:')) {
          const nameRe = new RegExp(`\\b(${srcName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i')
          if (nameRe.test(text)) {
            text = text.replace(nameRe, token)
          } else {
            text = `According to ${token}, ` + text.charAt(0).toLowerCase() + text.slice(1)
          }
          linkedOutlets.add(srcName.toLowerCase())
          extCount++
        } else {
          extCount++ // already embedded by Grok
          linkedOutlets.add(srcName.toLowerCase())
        }
      }

      // ── 2. Outlet auto-links — scan for known outlet names mid-article ─────
      if (!isFirst && !isLast && extCount < MAX_EXT) {
        for (const [outletName, outletUrl] of Object.entries(KNOWN_OUTLET_URLS)) {
          if (linkedOutlets.has(outletName.toLowerCase())) continue
          if (text.includes('[[EXTLINK:')) continue // already has a link in this para
          // Escape for regex, match whole word/phrase
          const outletRe = new RegExp(`\\b(${outletName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`)
          if (outletRe.test(text)) {
            text = text.replace(outletRe, `[[EXTLINK:${outletUrl}|$1]]`)
            linkedOutlets.add(outletName.toLowerCase())
            extCount++
            if (extCount >= MAX_EXT) break
          }
        }
      }

      // ── 3. Internal pillar links — only mid-article, one per pillar slug ───
      if (!isFirst && !isLast && intCount < MAX_INT) {
        for (const candidate of pillarCandidates) {
          if (linkedSlugs.has(candidate.slug)) continue
          if (text.includes('[[LINK:')) continue // already has a link in this para
          if (candidate.re.test(text)) {
            // Use regex replacement (not string replace) so word boundaries are honoured
            const singleRe = new RegExp(candidate.re.source, 'i')
            text = text.replace(singleRe, (match) => `[[LINK:${candidate.slug}|${match}]]`)
            linkedSlugs.add(candidate.slug)
            intCount++
            if (intCount >= MAX_INT) break
          }
        }
      }

      return text
    })

    return { ...section, paragraphs }
  })

  console.log(`   🔗 Links injected: ${extCount} external, ${intCount} internal`)
  return { ...data, sections: processedSections }
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

async function rewriteStory(story) {
  const prompt = `You are a senior gaming journalist at PS6News.com (2026). Write a high-quality, in-depth news article based on the source below.

━━ LENGTH ━━
• Aim for 900–1400 words. If the story has rich detail, expand fully — don't cut it short.
• More sections = more depth. Add extra sections if the topic warrants it (context, history, implications, industry reaction, comparisons).
• Every paragraph must be 70-110 words. No one-liners.

━━ WRITING RULES ━━
1. Base the article ONLY on the source summary. Do not invent facts, specs, quotes, or dates.
2. Rewrite completely in your own words. No verbatim copying.
3. Sharp, engaging British English — active voice, strong verbs, no waffle.
4. Name the original source ONCE in the opening paragraph, then write as PS6News original reporting.
5. If story is NOT directly about PS6, add a "What This Means for PS6" closing section.

━━ COMPARISON TABLES ━━
Tables make articles far more useful — include one whenever the topic involves historical data, prices, specs, or timelines.

STRONG TRIGGERS — add a table if the article covers any of these:
• PS6 price or cost → "PlayStation Console Launch Prices" (PS1→PS5 real prices + PS6 projected)
• PS6 release date or delay → "PlayStation Console Launch Dates" (PS1–PS6 timeline)
• RAM, memory, or chip costs → "DRAM / Memory Cost Per GB" (2000–2025 + 2027 projected)
• Specs or hardware → "Next-Gen Console Specs Compared" (PS6 vs Xbox Helix vs known figures)
• Disc drive or physical vs digital → "PlayStation Physical vs Digital Sales Share" (2018–2025)
• Regional pricing → table of UK/US/EU/AUS prices

RULES:
• Only use real, verifiable, or widely-reported figures. Label projections "Projected" or "Estimated".
• If you don't have enough real data for a table, skip it — never invent numbers.
• Aim to include a table in at least one section per article when the topic allows.

━━ WRITING FOCUS ━━
Write clean, flowing prose only. Do NOT embed any link tokens, [[brackets]], or special syntax of any kind.
Links will be added automatically — just write natural sentences.

━━ IMAGE PROMPT ━━
50-80 words. Safe for work, no real people, no brand logos. Cinematic photorealistic. Gaming/technology subject matching the article topic. Dark background, dramatic blue/purple neon lighting, ultra detail.

━━ SOURCE ━━
Headline: ${story.headline}
Source URL: ${story.sourceUrl}
Source name: ${story.sourceName || 'the source'}
Published: ${story.publishedAt || 'recently'}
Summary:
${story.summary}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "Compelling keyword-first headline under 70 chars",
  "slug": "seo-slug-lowercase-hyphens-max-55-chars",
  "excerpt": "130-155 char punchy meta description with emotional hook or CTA",
  "imagePrompt": "Cinematic photorealistic ...",
  "sections": [
    {
      "heading": null,
      "paragraphs": [
        "YOUR OPENING PARAGRAPH (70-110 words). Attribute the source by name. Write clean prose — no brackets, no special syntax.",
        "YOUR SECOND PARAGRAPH (70-110 words). Expand the core claim with detail from the summary."
      ]
    },
    {
      "heading": "Your Section Heading Here",
      "paragraphs": [
        "YOUR PARAGRAPH (70-110 words). Add context, history, or background.",
        "YOUR PARAGRAPH (70-110 words). Continue developing the point."
      ],
      "table": {
        "caption": "PlayStation Console Launch Prices (USD)",
        "headers": ["Console", "Launch Year", "Launch Price (USD)"],
        "rows": [
          ["PS1", "1994", "$299"],
          ["PS2", "2000", "$299"],
          ["PS3", "2006", "$499 / $599"],
          ["PS4", "2013", "$399"],
          ["PS5", "2020", "$499"],
          ["PS6", "2028 (Projected)", "$599+ (Estimated)"]
        ]
      }
    },
    {
      "heading": "Your Section Heading Here",
      "paragraphs": [
        "YOUR PARAGRAPH (70-110 words). Industry reaction, analyst opinion, or comparisons.",
        "YOUR PARAGRAPH (70-110 words). Further implications or context."
      ],
      "table": null
    },
    {
      "heading": "What This Means for PS6",
      "paragraphs": [
        "YOUR CLOSING PARAGRAPH (70-110 words). PS6 angle and reader takeaway."
      ],
      "table": null
    }
  ],
  "keyTakeaways": [
    "Specific verifiable fact from the source",
    "Another specific fact",
    "Third specific fact"
  ]
}`

  const response = await grok.chat.completions.create({
    model: GROK_TEXT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content)
}

// ── Phase 3: Smart image strategy ────────────────────────────────────────────
//
// GAME articles  → find a real official/press image via Grok web search
// PS6 / hardware → generate a cinematic AI concept image
// Fallback        → AI generation if real image search fails

// Named games that have real promotional imagery we should use
const NAMED_GAME_RE = /\b(god of war|laufey|spider[\s-]?man|miles morales|gta\s*6|grand theft auto|horizon|aloy|forbidden west|final fantasy|call of duty|assassin'?s creed|elden ring|sekiro|dark souls|fromsoftware|zelda|mario|halo|forza|elder scrolls|starfield|cyberpunk|wolverine|007|first light|ghost of tsushima|death stranding|last of us|naughty dog|insomniac|santa monica|guerrilla games|bend studio|sucker punch|square enix|capcom|ubisoft|activision|battlefield|resident evil|devil may cry|street fighter|mortal kombat|tekken|persona|yakuza|like a dragon)\b/i

// PS6 hardware / Sony concepts where AI image makes sense
const PS6_CONCEPT_RE = /\bps6\b|playstation\s?6|next[- ]gen console|sony hardware|console design|release date|launch price|dualsense|controller|backward compat|console spec|teraflop|gpu|cpu|ram\b/i

const AXIOS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*',
}

function isLikelyArticleImage(url) {
  if (!url) return false
  const l = url.toLowerCase()
  if (/logo|icon|favicon|avatar|badge|sprite|placeholder|blank|pixel|tracking/i.test(l)) return false
  if (!/\.(jpg|jpeg|png|webp)($|\?)|\/images\/|\/uploads\/|\/media\/|\/wp-content\/|\/cdn\//i.test(l)) return false
  return true
}

async function fetchOgImage(pageUrl) {
  try {
    const res = await axios.get(pageUrl, { timeout: 10000, maxRedirects: 5, headers: AXIOS_HEADERS })
    const html = res.data
    const patterns = [
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
      /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/i,
    ]
    for (const pat of patterns) {
      const m = html.match(pat)
      if (m?.[1]?.startsWith('http') && isLikelyArticleImage(m[1])) return m[1]
    }
  } catch {}
  return null
}

// Ask Grok (with live search) to find the best official image page for a game
async function findGamePressImageUrl(gameName, sourceUrl) {
  // Step 1: try source article OG image first (fast + often great quality)
  if (sourceUrl) {
    const og = await fetchOgImage(sourceUrl)
    if (og) {
      console.log(`   �️  Using OG image from source article`)
      return og
    }
  }

  // Step 2: ask Grok to find the official PS Store / official site page for the game
  console.log(`   🔍 Searching for official press image for "${gameName}"...`)
  try {
    const res = await axios.post(
      'https://api.x.ai/v1/responses',
      {
        model: GROK_SEARCH_MODEL,
        input: [{
          role: 'user',
          content: `Find the best official page URL for the game "${gameName}" — preferably the PlayStation Store listing (store.playstation.com) or the game's official website. Return ONLY the single URL, no explanation, no markdown.`,
        }],
        tools: [{ type: 'web_search' }],
      },
      {
        headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    )

    const output = res.data?.output || []
    const message = output.find(o => o.type === 'message')
    const text = (message?.content?.find(c => c.type === 'output_text')?.text || '').trim()

    // Extract first URL from response
    const urlMatch = text.match(/https?:\/\/[^\s\n"'<>]+/)
    if (urlMatch) {
      const officialOg = await fetchOgImage(urlMatch[0])
      if (officialOg) {
        console.log(`   🖼️  Found official press image via ${urlMatch[0]}`)
        return officialOg
      }
    }
  } catch (err) {
    console.warn(`   ⚠️  Game image search failed: ${err.message}`)
  }

  return null
}

// Shared: watermark + upload any image buffer to Sanity
async function processAndUploadBuffer(imageBuffer, label) {
  try {
    imageBuffer = await sharp(imageBuffer).rotate().jpeg({ quality: 90 }).toBuffer()
  } catch (err) {
    console.warn(`   ⚠️  JPEG conversion failed: ${err.message}`)
    return null
  }
  try {
    imageBuffer = await applyWatermark(imageBuffer)
    console.log('   🪧 Watermark applied')
  } catch (err) {
    console.warn(`   ⚠️  Watermark skipped: ${err.message}`)
  }
  try {
    const asset = await sanity.assets.upload('image', imageBuffer, {
      filename: `ps6-${label}-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    })
    console.log(`   ✅ Image uploaded: ${asset._id}`)
    return asset._id
  } catch (err) {
    console.warn(`   ⚠️  Sanity upload failed: ${err.message}`)
    return null
  }
}

// Generate AI concept image (for PS6 hardware / generic topics)
async function generateAiImage(imagePrompt) {
  console.log('   🎨 Generating AI concept image...')
  try {
    const response = await grok.images.generate({ model: GROK_IMAGE_MODEL, prompt: imagePrompt, n: 1 })
    const imgData = response.data?.[0]
    if (!imgData) throw new Error('Empty image response')

    let buf
    if (imgData.url) {
      const res = await axios.get(imgData.url, { responseType: 'arraybuffer', timeout: 60000 })
      buf = Buffer.from(res.data)
    } else if (imgData.b64_json) {
      buf = Buffer.from(imgData.b64_json, 'base64')
    } else {
      throw new Error('No image data')
    }
    return buf
  } catch (err) {
    console.warn(`   ⚠️  AI image generation failed: ${err.message}`)
    return null
  }
}

// Main image orchestrator — picks the right strategy per article
async function getImageAssetId(data, story) {
  const combinedText = `${data.title} ${story.summary || ''}`
  const isNamedGame = NAMED_GAME_RE.test(combinedText)
  const isPs6Concept = PS6_CONCEPT_RE.test(combinedText)

  if (isNamedGame) {
    console.log(`   🎮 Game article detected — searching for real press image...`)
    const realImageUrl = await findGamePressImageUrl(data.title, story.sourceUrl)
    if (realImageUrl) {
      try {
        const res = await axios.get(realImageUrl, { responseType: 'arraybuffer', timeout: 20000, headers: AXIOS_HEADERS })
        return await processAndUploadBuffer(Buffer.from(res.data), 'game-press')
      } catch (err) {
        console.warn(`   ⚠️  Could not download real image (${err.message}), falling back to AI...`)
      }
    } else {
      console.log(`   ⚠️  No real image found — falling back to AI...`)
    }
  }

  if (isPs6Concept || !isNamedGame) {
    // For PS6 hardware/concept articles always use a specific PS6-focused prompt
    // so the AI doesn't generate a generic or Xbox-looking console
    const prompt = isPs6Concept
      ? `Cinematic next-generation Sony PlayStation 6 console concept, sleek angular matte-black body, glowing blue PS button logo, ultra-polished reflective surface, dark studio environment, dramatic blue and purple neon rim lighting, 4K ultra detail, no people, no text, no Xbox, no Nintendo, no brand logos`
      : (data.imagePrompt || `Cinematic next-gen gaming technology, dark studio, dramatic blue neon lighting, 4K ultra detail, no people, no text, no logos`)
    const buf = await generateAiImage(prompt)
    if (buf) return await processAndUploadBuffer(buf, isPs6Concept ? 'ps6-concept' : 'ai')
  }

  return null
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

      // Comparison table — only if Grok provided real data (headers + at least 1 row)
      const t = section.table
      if (t && Array.isArray(t.headers) && t.headers.length && Array.isArray(t.rows) && t.rows.length) {
        // Optional caption as an H3
        if (t.caption) {
          body.push({
            _type: 'block',
            _key: randomKey(),
            style: 'h3',
            markDefs: [],
            children: [{ _type: 'span', _key: randomKey(), text: t.caption, marks: [] }],
          })
        }
        // @sanity/table format
        body.push({
          _type: 'table',
          _key: randomKey(),
          rows: [
            // Header row first
            {
              _type: 'tableRow',
              _key: randomKey(),
              cells: t.headers.map(String),
            },
            // Data rows
            ...t.rows.map(row => ({
              _type: 'tableRow',
              _key: randomKey(),
              cells: (Array.isArray(row) ? row : [row]).map(String),
            })),
          ],
        })
      }
    }
  }

  const doc = {
    _type: 'article',
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    excerpt: data.excerpt ? data.excerpt.slice(0, 195) : undefined,
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

      // Phase 2: Rewrite then inject links deterministically
      console.log('   ✍️  Rewriting with Grok...')
      const rawData = await rewriteStory(story)
      const data = injectArticleLinks(rawData, story, existingArticles)

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

      // Phase 3: Smart image (real press image for games, AI for PS6/hardware)
      const imageAssetId = await getImageAssetId(data, story)

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
