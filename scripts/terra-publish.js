/**
 * PS6News Terra (OpenAI) Auto-Publisher
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses OpenAI's Responses API (model: gpt-5.6-terra, reasoning: medium, web_search)
 * to:
 *  1. Discover genuinely new, credible PS6 / next-gen gaming news via live web search
 *  2. Cross-check and rewrite each story as a fully original PS6News.com article,
 *     with explicit Confirmed / Reported / Rumour / Analysis labelling
 *  3. Generate a featured image (AI concept or real press image)
 *  4. Publish to Sanity with internal + external links, tables, and
 *     "What We Know" / "What Remains Unclear" sections
 *
 * Usage:
 *   node scripts/terra-publish.js               # publish 1 article (default)
 *   node scripts/terra-publish.js --count=3     # publish up to 3 articles
 *   node scripts/terra-publish.js --dry-run     # discover only, no publish
 *
 * Required env vars (.env.local):
 *   OPENAI_API_KEY             — OpenAI API key (must have access to gpt-5.6-terra)
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

// ── Terra (OpenAI) model constants ─────────────────────────────────────────────
const TERRA_MODEL            = 'gpt-5.6-terra'
const TERRA_REASONING_EFFORT = 'medium'
const TERRA_IMAGE_MODEL      = 'gpt-image-1'

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
  {
    topic:     'release',
    pillarRe:  /release.?date|when.*(ps6|playstation.?6)|launch.*(date|window|year|timing)/i,
    contentRe: /\b(release date|launch date|launch window|release window|release timing|expected launch|planned launch|launch year)\b/i,
  },
  {
    topic:     'specs',
    pillarRe:  /specs?|specification|hardware|gpu|teraflop|what.*(inside|under)/i,
    contentRe: /\b(hardware specs?|technical specs?|GPU|teraflops?|RDNA|Zen \d|SSD speed|processing power|raw performance)\b/i,
  },
  {
    topic:     'price',
    pillarRe:  /price|cost|how.much|afford/i,
    contentRe: /\b(retail price|launch price|price point|how much.*PS6|PS6.*price|cost of.*PS6|pricing|afford\w*)\b/i,
  },
  {
    topic:     'games',
    pillarRe:  /launch.?game|launch.?title|first.?party|exclusiv/i,
    contentRe: /\b(launch games?|launch titles?|launch lineup|launch library|first.party (?:games?|titles?)|PS6 exclusives?)\b/i,
  },
  {
    topic:     'controller',
    pillarRe:  /controller|dualsense|dual.?sense|haptic/i,
    contentRe: /\b(DualSense|PS6 controller|adaptive triggers?|haptic feedback|next.gen controller)\b/i,
  },
  {
    topic:     'backcompat',
    pillarRe:  /backward.?compat|back.?compat|legacy.?game/i,
    contentRe: /\b(backward compat\w*|back.compat\w*|play PS[45] games? on|legacy games?)\b/i,
  },
  {
    topic:     'disc',
    pillarRe:  /disc|physical|disk.?drive|optical/i,
    contentRe: /\b(disc drive|physical (?:media|games?|disc|edition)|disc.?less|digital.?only)\b/i,
  },
  {
    topic:     'handheld',
    pillarRe:  /handheld|portable|ps6.?go|ps.?portable/i,
    contentRe: /\b(handheld|portable PlayStation|PS6 portable|PS6 Go|PlayStation handheld)\b/i,
  },
  {
    topic:     'design',
    pillarRe:  /design|look.?like|appearance|concept|aesthetic/i,
    contentRe: /\b(PS6 design|what.*PS6 looks? like|console design|form factor|aesthetic)\b/i,
  },
]

// ── Clients ──────────────────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── CLI args ──────────────────────────────────────────────────────────────────

const cliArgs = process.argv.slice(2)
const DRY_RUN = cliArgs.includes('--dry-run')
const countArg = cliArgs.find(a => a.startsWith('--count='))
const MAX_ARTICLES = countArg ? Math.max(1, parseInt(countArg.split('=')[1], 10)) : 1

// ── Terra call helper (Responses API) ─────────────────────────────────────────

async function callTerra(promptText) {
  const response = await openai.responses.create({
    model: TERRA_MODEL,
    reasoning: { effort: TERRA_REASONING_EFFORT },
    tools: [{ type: 'web_search' }],
    input: [{ role: 'user', content: promptText }],
  })

  // Convenience property on newer SDKs
  let text = response.output_text
  if (!text) {
    const output = response.output || []
    const message = output.find(o => o.type === 'message')
    text = message?.content?.find(c => c.type === 'output_text')?.text || message?.content?.[0]?.text || ''
  }
  return (text || '').trim()
}

function parseTerraJson(rawText) {
  const jsonStr = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(jsonStr)
}

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
      markDefs.push({ _key: linkKey, _type: 'link', href: target.trim(), blank: true })
      children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [linkKey] })
    } else {
      const article = existingArticles.find(a => a.slug === target.trim())
      if (article) {
        markDefs.push({ _key: linkKey, _type: 'link', href: `/${article.slug}` })
        children.push({ _type: 'span', _key: randomKey(), text: anchorText, marks: [linkKey] })
      } else {
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

// ── Citation sanitizer ────────────────────────────────────────────────────────
// Terra's web_search tool sometimes auto-appends markdown citations like
// "([blog.playstation.com](https://...))" directly into paragraph text.
// Strip these out — they render as literal text in Sanity, not real links.

function stripCitationArtifacts(text) {
  if (!text) return text
  return text
    // ([label](url)) — parenthesised markdown link citation
    .replace(/\(\s*\[[^\]]*\]\(https?:\/\/[^)]+\)\s*\)/g, '')
    // [label](url) — bare markdown link
    .replace(/\[[^\]]*\]\(https?:\/\/[^)]+\)/g, '')
    // (https://...) — bare parenthesised URL citation
    .replace(/\(\s*https?:\/\/[^\s)]+\s*\)/g, '')
    // Collapse resulting double spaces / stray punctuation spacing
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:])/g, '$1')
    .trim()
}

function sanitizeSections(sections) {
  return (sections || []).map(section => ({
    ...section,
    paragraphs: (section.paragraphs || []).map(stripCitationArtifacts),
  }))
}

// ── Deterministic link injection ──────────────────────────────────────────────
// Injects source, outlet, and internal pillar links into the generated article.
// Target: 1-3 external links (incl. mandatory source link), 2-4 internal links.

function injectArticleLinks(data, story, existingArticles) {
  if (!data.sections?.length) return data

  data = { ...data, sections: sanitizeSections(data.sections) }

  const MAX_EXT  = 3
  const MAX_INT  = 4
  let extCount   = 0
  let intCount   = 0

  const linkedOutlets = new Set()
  const linkedSlugs   = new Set()

  const pillarCandidates = [] // { re, slug }
  for (const pattern of PILLAR_TOPIC_PATTERNS) {
    const match = existingArticles.find(a =>
      a.isPillar && (pattern.pillarRe.test(a.title || '') || pattern.pillarRe.test(a.slug || ''))
    )
    if (match) pillarCandidates.push({ re: pattern.contentRe, slug: match.slug })
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
          extCount++
          linkedOutlets.add(srcName.toLowerCase())
        }
      }

      // ── 2. Outlet auto-links — scan for known outlet names mid-article ─────
      if (!isFirst && !isLast && extCount < MAX_EXT) {
        for (const [outletName, outletUrl] of Object.entries(KNOWN_OUTLET_URLS)) {
          if (linkedOutlets.has(outletName.toLowerCase())) continue
          if (text.includes('[[EXTLINK:')) continue
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
          if (text.includes('[[LINK:')) continue
          if (candidate.re.test(text)) {
            const singleRe = new RegExp(candidate.re.source, 'i')
            text = text.replace(singleRe, (m) => `[[LINK:${candidate.slug}|${m}]]`)
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

function bulletBlocks(items = []) {
  return items.map(text => ({
    _type: 'block',
    _key: randomKey(),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', _key: randomKey(), text: String(text), marks: [] }],
  }))
}

// ── Duplicate check ───────────────────────────────────────────────────────────

function isDuplicate(headline, existingArticles, sourceUrl) {
  const stopWords = new Set([
    'about', 'their', 'which', 'there', 'could', 'would', 'should',
    'playstation', 'release', 'looks', 'knows', 'says', 'report',
    'claims', 'latest', 'after', 'before', 'still', 'delay', 'delayed',
    'this', 'with', 'that', 'from', 'have', 'what', 'will', 'more',
  ])

  function properNouns(str) {
    return new Set(
      str.split(/\s+/).filter(w => /^[A-Z][a-z]/.test(w) && w.length >= 4).map(w => w.toLowerCase())
    )
  }

  function tokens(str) {
    return new Set(
      str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
        .filter(w => w.length >= 3 && !stopWords.has(w))
    )
  }

  const newNouns  = properNouns(headline)
  const newTokens = tokens(headline)

  for (const article of existingArticles) {
    if (!article.title) continue

    if (sourceUrl && article.sourceUrl && article.sourceUrl === sourceUrl) return article.title

    const existNouns = properNouns(article.title)
    const nounOverlap = [...newNouns].filter(n => existNouns.has(n)).length
    if (nounOverlap >= 2) return article.title

    const existTokens = tokens(article.slug || article.title)
    const inter = [...newTokens].filter(t => existTokens.has(t)).length
    const union = new Set([...newTokens, ...existTokens]).size
    if (union > 0 && inter / union > 0.45) return article.title

    const existWords = article.title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !stopWords.has(w))
    const newWords   = [...newTokens].filter(w => w.length > 4)
    const wordOverlap = existWords.filter(w => newWords.includes(w)).length
    if (wordOverlap >= 4) return article.title
  }
  return null
}

// ── Sanity helpers ────────────────────────────────────────────────────────────

const PILLAR_KEYWORDS = /specs|release.?date|price|cost|games|features|design|rumors?|leak|controllers?|backward.?compat|storage|cpu|gpu|ram|teraflop|launch|pre.?order|handheld|portable/i

async function fetchExistingArticles() {
  const articles = await sanity.fetch(
    `*[_type == "article"] | order(publishedAt desc) [0..49]{ _id, title, "slug": slug.current }`
  )
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

// ── Phase 1: Terra discovery via web search ──────────────────────────────────

async function discoverStories(existingArticles, count) {
  const coveredList = existingArticles
    .slice(0, 35)
    .map(a => `- ${a.title}`)
    .join('\n')

  const prompt = `You are the lead news editor for PS6News.com, a dedicated PlayStation 6 and next-generation gaming news site. Search the web now and identify genuinely new, credible, and relevant news stories from the last 72 hours.

YOUR BEAT (cast the net wide, but every story must ultimately connect to next-gen PlayStation/PS6 relevance):
- PlayStation 6 / PS6 — specs, price, release date, leaks, official announcements
- Sony Interactive Entertainment and PlayStation hardware strategy, first-party studios
- Nintendo Switch 2 — sales, software lineup, hardware revisions, competitive positioning (frame as: what does this mean for Sony's next-gen strategy / the console market PS6 is entering?)
- Xbox Helix (or whatever Microsoft's next-gen hardware project is called) — specs, strategy, cloud/Windows integration, handheld plans (frame as: how does this affect the competitive landscape PS6 will launch into?)
- Major upcoming games, announcements, studio acquisitions/closures, leaks, and industry shifts relevant to next-gen gaming
- Gaming hardware, cloud gaming, AI in games, engines, graphics tech (DLSS/FSR/ray tracing/upscaling), chip/GPU industry news, and major publisher news — where relevant to what next-gen consoles (PS6 included) will look like or compete with
- Broader console market trends (pricing, supply chain, chip shortages, tariffs, semiconductor news) that could shape PS6's cost, timing, or strategy

RULE: A story about Switch 2, Xbox Helix, or general industry/tech news is fair game AS LONG AS the article explicitly ties it back to PS6 or next-gen PlayStation relevance (e.g. competitive pressure, technology PS6 might adopt, market conditions affecting Sony's plans). Do not cover competitor/industry news in isolation with no PlayStation angle.

SOURCING RULES:
- Investigate each candidate story using MULTIPLE credible sources where possible.
- Prefer PRIMARY sources first: official PlayStation/Sony/Nintendo/Microsoft statements, developer/publisher statements, investor materials, official trailers, verified social accounts.
- Use reputable games journalism (IGN, Eurogamer, VGC, The Verge, Bloomberg, Reuters, GamesIndustry.biz, Digital Foundry, TechRadar, etc.) for reporting and context.
- Do NOT include a story just because one outlet posted it — verify it is genuinely new, useful, and relevant, not filler or a repost of old information.
- Skip anything that closely overlaps with the ALREADY COVERED list below.

CERTAINTY LEVELS — tag every story with exactly one:
- "confirmed" — officially announced/confirmed by Sony, a publisher, or a verified primary source
- "reported"  — credibly reported by reputable journalists citing sources, not yet officially confirmed
- "rumour"    — leak, insider claim, or unverified rumour
- "analysis"  — editorial/analytical angle built on already-known information

ALREADY COVERED (skip anything overlapping):
${coveredList}

Return ONLY raw JSON — no markdown, no code fences, nothing before or after:
{
  "noStrongStory": false,
  "monitoring": [],
  "stories": [
    {
      "headline": "The actual headline",
      "sourceUrl": "https://exact-url-to-the-primary-article.com",
      "sourceName": "IGN",
      "publishedAt": "2026-07-19",
      "certainty": "confirmed" | "reported" | "rumour" | "analysis",
      "summary": "4-6 sentence factual summary of what the sources actually say, noting any conflicting details between sources."
    }
  ]
}

If there is truly no meaningful new story worth publishing today, set "noStrongStory": true, leave "stories" empty, and list 2-5 developing stories worth monitoring in "monitoring".`

  console.log(`\n🔍 Searching for latest PS6 / next-gen news via Terra (gpt-5.6-terra, web search)...`)

  const rawText = await callTerra(prompt)

  if (!rawText) {
    console.warn('   ⚠️  Empty response from Terra')
    return { noStrongStory: true, monitoring: [], stories: [] }
  }

  try {
    const parsed = parseTerraJson(rawText)
    return {
      noStrongStory: !!parsed.noStrongStory,
      monitoring: Array.isArray(parsed.monitoring) ? parsed.monitoring : [],
      stories: Array.isArray(parsed.stories) ? parsed.stories : [],
    }
  } catch {
    console.warn('   ⚠️  Could not parse Terra response as JSON')
    console.warn('   Raw (first 300 chars):', rawText.slice(0, 300))
    return { noStrongStory: true, monitoring: [], stories: [] }
  }
}

// ── Phase 2: Terra rewrite (with verification via web search) ────────────────

const CERTAINTY_GUIDANCE = {
  confirmed: 'This is OFFICIALLY CONFIRMED. Write with confidence, but still attribute claims to their official source.',
  reported:  'This is CREDIBLY REPORTED but not yet officially confirmed. Use language like "according to", "reports suggest" — never state it as settled fact.',
  rumour:    'This is a RUMOUR / LEAK. Make this explicit early in the article. Use hedged language throughout ("claims", "alleged", "if accurate") and never imply certainty.',
  analysis:  'This is EDITORIAL ANALYSIS built on known information. Be clear this is informed speculation/analysis, not a new confirmed development.',
}

async function rewriteStory(story) {
  const certainty = story.certainty || 'reported'
  const guidance = CERTAINTY_GUIDANCE[certainty] || CERTAINTY_GUIDANCE.reported

  const prompt = `You are a senior gaming journalist at PS6News.com, writing in 2026. Produce a FULLY ORIGINAL article based on the source material below. Do not closely paraphrase or copy wording, structure, or distinctive phrasing from any source — write entirely in your own voice with genuine original analysis.

Use web search to cross-check this story against multiple credible sources before writing. Note every source you actually relied on in "sourcesList".

━━ STORY CERTAINTY: ${certainty.toUpperCase()} ━━
${guidance}
Never present a leak, estimate, industry rumour, or fan theory as confirmed fact. Make the certainty level clear to the reader, prominently and early in the article.

━━ LENGTH ━━
Aim for 800-1200 words for substantial news. Shorter only if the story is genuinely thin — never pad with filler.
Every paragraph 60-110 words. No one-liners.

━━ REQUIRED STRUCTURE ━━
1. Strong, click-worthy but accurate headline
2. Short intro explaining what happened and why it matters
3. Clear subheadings across the body
4. Original analysis — implications for the PS6, PlayStation strategy, next-gen gaming, developers, or players.
   If this story is primarily about a competitor (Switch 2, Xbox Helix) or general industry/tech news rather than PlayStation directly, this MUST include a clearly headed section such as "What This Means for PS6" that draws an explicit, substantive connection — not a token one-liner.
5. "What We Know" — confirmed, sourced facts only (whatWeKnow field)
6. "What Remains Unclear" — open questions, caveats, unverified claims (whatRemainsUnclear field; leave empty array only if genuinely nothing is unclear)

━━ WRITING RULES ━━
- UK English throughout.
- Enthusiastic, knowledgeable, clear, modern tone — written for gamers, not corporate investors.
- Confident but never overstate uncertain information.
- No filler, no generic AI phrases, no repetition, no overblown claims.
- Base all claims on the source summary and your own verification. Do not invent facts, quotes, or figures.

━━ COMPARISON TABLES ━━
Include a table whenever the topic involves historical data, prices, specs, or timelines.
STRONG TRIGGERS:
• PS6 price/cost → "PlayStation Console Launch Prices" (PS1→PS5 real prices + PS6 projected)
• PS6 release date/delay → "PlayStation Console Launch Dates" (PS1–PS6 timeline)
• RAM/memory/chip costs → "DRAM / Memory Cost Per GB" (2000–2025 + 2027 projected)
• Specs/hardware → "Next-Gen Console Specs Compared"
• Disc drive/physical vs digital → "PlayStation Physical vs Digital Sales Share"
Only use real, verifiable, or widely-reported figures. Label projections "Projected" or "Estimated". Skip the table entirely if you don't have enough real data — never invent numbers.

━━ LINKS ━━
Write clean, flowing prose only. Do NOT embed any link tokens, [[brackets]], markdown links like [text](url), citation markers, or any special syntax anywhere in the paragraph text — not even at the end of a paragraph.
This applies even though you are using web search to verify facts: strip out ALL citation formatting, footnotes, and source markers from the final paragraph text. Paragraphs must read as pure, clean prose with absolutely no brackets or parentheses containing URLs.
Links (2-4 internal, 1-3 external) are added automatically after you write — just write natural sentences that would plausibly carry a link.

━━ IMAGE PROMPT ━━
50-80 words. Safe for work, no real people, no brand logos. Cinematic photorealistic. Gaming/technology subject matching the article topic. Dark background, dramatic blue/purple neon lighting, ultra detail.

━━ SOURCE MATERIAL ━━
Headline: ${story.headline}
Source URL: ${story.sourceUrl}
Source name: ${story.sourceName || 'the source'}
Certainty: ${certainty}
Published: ${story.publishedAt || 'recently'}
Summary:
${story.summary}

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "Compelling, accurate headline under 70 chars",
  "slug": "seo-slug-lowercase-hyphens-max-55-chars",
  "metaTitle": "50-60 char SEO title, primary keyword first",
  "metaDescription": "150-160 char keyword-rich summary with hook",
  "excerpt": "130-155 char punchy meta description",
  "imagePrompt": "Cinematic photorealistic ...",
  "certainty": "${certainty}",
  "sections": [
    {
      "heading": null,
      "paragraphs": [
        "OPENING PARAGRAPH (60-110 words). What happened and why it matters. Attribute the source by name.",
        "SECOND PARAGRAPH (60-110 words). Expand the core claim with detail."
      ]
    },
    {
      "heading": "Your Section Heading Here",
      "paragraphs": [
        "PARAGRAPH (60-110 words). Context, history, or background.",
        "PARAGRAPH (60-110 words). Continue developing the point."
      ],
      "table": null
    },
    {
      "heading": "What This Means for PS6",
      "paragraphs": [
        "PARAGRAPH (60-110 words). Original analysis and reader takeaway."
      ],
      "table": null
    }
  ],
  "whatWeKnow": [
    "Specific confirmed/sourced fact",
    "Another confirmed fact"
  ],
  "whatRemainsUnclear": [
    "Open question or unverified claim"
  ],
  "keyTakeaways": [
    "Specific verifiable fact from the source",
    "Another specific fact",
    "Third specific fact"
  ],
  "sourcesList": [
    { "name": "Source outlet name", "url": "https://..." }
  ]
}`

  const rawText = await callTerra(prompt)
  return parseTerraJson(rawText)
}

// ── Phase 3: Smart image strategy ────────────────────────────────────────────

const NAMED_GAME_RE = /\b(god of war|laufey|spider[\s-]?man|miles morales|gta\s*6|grand theft auto|horizon|aloy|forbidden west|final fantasy|call of duty|assassin'?s creed|elden ring|sekiro|dark souls|fromsoftware|zelda|mario|halo|forza|elder scrolls|starfield|cyberpunk|wolverine|007|first light|ghost of tsushima|death stranding|last of us|naughty dog|insomniac|santa monica|guerrilla games|bend studio|sucker punch|square enix|capcom|ubisoft|activision|battlefield|resident evil|devil may cry|street fighter|mortal kombat|tekken|persona|yakuza|like a dragon)\b/i

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

async function findGamePressImageUrl(gameName, sourceUrl) {
  if (sourceUrl) {
    const og = await fetchOgImage(sourceUrl)
    if (og) {
      console.log(`   🖼️  Using OG image from source article`)
      return og
    }
  }

  console.log(`   🔍 Searching for official press image for "${gameName}"...`)
  try {
    const text = await callTerra(
      `Find the best official page URL for the game "${gameName}" — preferably the PlayStation Store listing (store.playstation.com) or the game's official website. Return ONLY the single URL, no explanation, no markdown.`
    )
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

async function generateAiImage(imagePrompt) {
  console.log('   🎨 Generating AI concept image...')
  try {
    const response = await openai.images.generate({
      model: TERRA_IMAGE_MODEL,
      prompt: imagePrompt,
      size: '1024x1024',
    })
    const imgData = response.data?.[0]
    if (!imgData) throw new Error('Empty image response')

    let buf
    if (imgData.b64_json) {
      buf = Buffer.from(imgData.b64_json, 'base64')
    } else if (imgData.url) {
      const res = await axios.get(imgData.url, { responseType: 'arraybuffer', timeout: 60000 })
      buf = Buffer.from(res.data)
    } else {
      throw new Error('No image data')
    }
    return buf
  } catch (err) {
    console.warn(`   ⚠️  AI image generation failed: ${err.message}`)
    return null
  }
}

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
    const prompt = isPs6Concept
      ? `Cinematic next-generation Sony PlayStation 6 console concept, sleek angular matte-black body, glowing blue PS button logo, ultra-polished reflective surface, dark studio environment, dramatic blue and purple neon rim lighting, 4K ultra detail, no people, no text, no Xbox, no Nintendo, no brand logos`
      : (data.imagePrompt || `Cinematic next-gen gaming technology, dark studio, dramatic blue neon lighting, 4K ultra detail, no people, no text, no logos`)
    const buf = await generateAiImage(prompt)
    if (buf) return await processAndUploadBuffer(buf, isPs6Concept ? 'ps6-concept' : 'ai')
  }

  return null
}

// ── Phase 4: Publish to Sanity ────────────────────────────────────────────────

const CERTAINTY_LABELS = {
  confirmed: '✅ CONFIRMED',
  reported:  '📰 REPORTED',
  rumour:    '⚠️ RUMOUR / LEAK',
  analysis:  '🔍 ANALYSIS',
}

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

      const t = section.table
      if (t && Array.isArray(t.headers) && t.headers.length && Array.isArray(t.rows) && t.rows.length) {
        if (t.caption) {
          body.push({
            _type: 'block',
            _key: randomKey(),
            style: 'h3',
            markDefs: [],
            children: [{ _type: 'span', _key: randomKey(), text: t.caption, marks: [] }],
          })
        }
        body.push({
          _type: 'table',
          _key: randomKey(),
          rows: [
            { _type: 'tableRow', _key: randomKey(), cells: t.headers.map(String) },
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

  // "What We Know" section
  if (data.whatWeKnow?.length) {
    body.push({
      _type: 'block', _key: randomKey(), style: 'h2', markDefs: [],
      children: [{ _type: 'span', _key: randomKey(), text: 'What We Know', marks: [] }],
    })
    body.push(...bulletBlocks(data.whatWeKnow))
  }

  // "What Remains Unclear" section
  if (data.whatRemainsUnclear?.length) {
    body.push({
      _type: 'block', _key: randomKey(), style: 'h2', markDefs: [],
      children: [{ _type: 'span', _key: randomKey(), text: 'What Remains Unclear', marks: [] }],
    })
    body.push(...bulletBlocks(data.whatRemainsUnclear))
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

  // SEO meta — use Terra's own output directly, no separate API call needed
  if (data.metaTitle || data.metaDescription) {
    doc.seo = {
      metaTitle: (data.metaTitle || data.title || '').slice(0, 70),
      metaDescription: (data.metaDescription || data.excerpt || '').slice(0, 170),
    }
    console.log(`   🔎 SEO: ${doc.seo.metaTitle}`)
  }

  if (authorId) doc.author = { _type: 'reference', _ref: authorId }
  if (categoryId) doc.category = { _type: 'reference', _ref: categoryId }
  if (imageAssetId) {
    doc.mainImage = {
      _type: 'image',
      asset: { _type: 'reference', _ref: imageAssetId },
    }
  }

  const result = await sanity.create(doc)

  // Log source list for editorial reference (not published to the page)
  if (data.sourcesList?.length) {
    console.log('   📚 Sources used (editorial reference):')
    data.sourcesList.forEach(s => console.log(`      - ${s.name}: ${s.url}`))
  }

  return result
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🚀 PS6News Terra Publisher starting...')
  console.log(`   Model: ${TERRA_MODEL} | Reasoning: ${TERRA_REASONING_EFFORT} | Tool: web_search`)
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (discover only)' : `publish up to ${MAX_ARTICLES} article(s)`}\n`)

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is missing — add it to .env.local')
    process.exit(1)
  }
  if (!process.env.SANITY_API_TOKEN && !process.env.SANITY_TOKEN) {
    console.error('❌ SANITY_API_TOKEN is missing — add it to .env.local')
    process.exit(1)
  }

  const existingArticles = await fetchExistingArticles()
  console.log(`📚 ${existingArticles.length} existing articles loaded\n`)

  // Phase 1: Discover
  const discovery = await discoverStories(existingArticles, MAX_ARTICLES)

  if (discovery.noStrongStory || !discovery.stories.length) {
    console.log('\nℹ️  No strong publishable story found today.\n')
    if (discovery.monitoring?.length) {
      console.log('👀 Worth monitoring:')
      discovery.monitoring.forEach(m => console.log(`   - ${m}`))
    }
    console.log()
    return { published: 0, skipped: 0, results: [] }
  }

  const stories = discovery.stories
  console.log(`\n✅ Terra found ${stories.length} candidate stories:\n`)
  stories.forEach((s, i) => {
    console.log(`  ${i + 1}. [${(s.certainty || 'reported').toUpperCase()}] ${s.headline}`)
    console.log(`     📰 ${s.sourceName || s.sourceUrl}  |  ${s.publishedAt || 'date unknown'}`)
  })

  if (DRY_RUN) {
    console.log('\n🔎 Dry run — stopping here. No articles published.\n')
    return { published: 0, skipped: 0, results: [] }
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

    console.log(`\n📰 Processing [${CERTAINTY_LABELS[story.certainty] || story.certainty}]: "${story.headline}"`)

    try {
      const duplicate = isDuplicate(story.headline, existingArticles, story.sourceUrl)
      if (duplicate) {
        console.log(`   ⏭️  Skipped — too similar to: "${duplicate}"`)
        skipped++
        continue
      }

      console.log('   ✍️  Rewriting with Terra (verifying via web search)...')
      const rawData = await rewriteStory(story)
      const data = injectArticleLinks(rawData, story, existingArticles)

      if (!data?.title || !data?.slug) {
        console.log('   ⚠️  Invalid article data returned — skipping')
        skipped++
        continue
      }

      if (await slugExists(data.slug)) {
        console.log(`   ⏭️  Skipped — slug already exists: /${data.slug}`)
        skipped++
        continue
      }

      const imageAssetId = await getImageAssetId(data, story)

      const catBody = `${data.excerpt || ''} ${(data.sections || []).map(s => `${s.heading || ''} ${(s.paragraphs || []).join(' ')}`).join(' ')}`
      const catSlug = detectCategorySlug(data.title || '', catBody)
      const categoryId = categoryMap[catSlug] || categoryMap['news']
      console.log(`   🏷️  Category: ${catSlug}`)

      const result = await publishToSanity(data, authorId, categoryId, imageAssetId, existingArticles)
      console.log(`   ✅ Published: "${data.title}"`)
      console.log(`      URL: https://ps6news.com/${data.slug}`)
      console.log(`      ID:  ${result._id}`)
      results.push({ title: data.title, slug: data.slug, id: result._id, certainty: story.certainty })
      published++

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
    results.forEach(r => console.log(`  • [${r.certainty}] "${r.title}" → https://ps6news.com/${r.slug}`))
  }

  return { published, skipped, results }
}

if (require.main === module) {
  run().catch(err => {
    console.error('\n💥 Fatal error:', err.message)
    process.exit(1)
  })
}

module.exports = { run }
