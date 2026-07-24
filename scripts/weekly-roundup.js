/**
 * PS6News Weekly Roundup
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregates every article published on PS6News.com in the last 7 days into a
 * single, detailed "This Week in PS6 News" report — organised by theme, with
 * internal links back to every original article covered.
 *
 * Uses Terra (gpt-5.6-terra) WITHOUT live web search — this is a synthesis
 * task grounded strictly in the site's own published coverage from the week,
 * so no new facts are invented and nothing can drift from what was reported.
 *
 * Usage:
 *   node scripts/weekly-roundup.js               # publish the roundup
 *   node scripts/weekly-roundup.js --dry-run     # preview only, no publish
 *
 * Required env vars (.env.local):
 *   OPENAI_API_KEY
 *   SANITY_API_TOKEN
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 */

require('dotenv').config({ path: '.env.local' })
const { detectCategorySlug } = require('./lib/categorize')
const {
  callTerra,
  parseTerraJson,
  randomKey,
  textToBlocks,
  getImageAssetId,
  getDefaultAuthorId,
  getCategoryMap,
  slugExists,
  sanity,
} = require('./terra-publish')

const DRY_RUN = process.argv.includes('--dry-run')

// ── Linked bullet block — bullet list item with a real internal link mark ────

function linkedBulletBlock(text, slug) {
  const linkKey = randomKey()
  return {
    _type: 'block',
    _key: randomKey(),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [{ _key: linkKey, _type: 'link', href: `/${slug}` }],
    children: [{ _type: 'span', _key: randomKey(), text, marks: [linkKey] }],
  }
}

// ── Fetch this week's articles (excluding previous roundups) ─────────────────

async function fetchWeekArticles() {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  return await sanity.fetch(
    `*[_type == "article" && publishedAt > $since && !(slug.current match "weekly-ps6-news-roundup*")] | order(publishedAt asc) {
      title, "slug": slug.current, excerpt, publishedAt, "category": category->title
    }`,
    { since }
  )
}

// ── Auto-link every mentioned title back to its article ─────────────────────
// Scans generated paragraph text for exact (or near-exact) title mentions and
// converts the first occurrence into a real internal link.

function autoLinkTitles(sections, weekArticles) {
  const linkedSlugs = new Set()

  const processed = sections.map(section => {
    const paragraphs = (section.paragraphs || []).map(text => {
      let result = text
      for (const art of weekArticles) {
        if (linkedSlugs.has(art.slug)) continue
        if (!art.title) continue
        const idx = result.indexOf(art.title)
        if (idx !== -1) {
          result =
            result.slice(0, idx) +
            `[[LINK:${art.slug}|${art.title}]]` +
            result.slice(idx + art.title.length)
          linkedSlugs.add(art.slug)
        }
      }
      return result
    })
    return { ...section, paragraphs }
  })

  return { sections: processed, linkedSlugs }
}

// ── Build the roundup prompt ──────────────────────────────────────────────────

function buildPrompt(weekArticles, weekLabel) {
  const storyList = weekArticles
    .map((a, i) => `${i + 1}. "${a.title}" [${a.category || 'News'}] — ${a.excerpt || 'No excerpt available.'}`)
    .join('\n')

  return `You are the editor of PS6News.com, writing a weekly round-up feature. Below is the COMPLETE list of every story PS6News published between ${weekLabel}. Synthesise these into ONE cohesive, detailed weekly report.

STRICT RULE: Only use information contained in the story list below. Do not invent new facts, figures, or claims beyond what is summarised here — this is a synthesis of the week's own coverage, not new reporting.

STORIES THIS WEEK:
${storyList}

━━ STRUCTURE ━━
1. A strong headline for the round-up (e.g. "This Week in PS6 News: [dominant theme]")
2. A short intro paragraph summarising the overall shape of the week (was it hardware-heavy? games-heavy? major leak week?)
3. Organise the stories into 2-5 THEMATIC sections (e.g. "Hardware & Specs", "Games & Exclusives", "Industry & Business", "Rumours & Leaks", "Competitor Watch") — only include themes that actually have stories this week
4. For each story you cover, mention its title text VERBATIM at least once somewhere in the surrounding sentence, so it can be automatically linked — do not paraphrase the title away entirely, weave it naturally into a sentence
5. Close with a "What to Watch Next Week" section — 3-5 forward-looking bullet points based on open threads or developing stories from this week's coverage

━━ WRITING RULES ━━
- UK English. Enthusiastic, knowledgeable, modern tone for gamers.
- Do not overstate rumours as fact — if a story was a leak/rumour, refer to it as such.
- Every paragraph 60-110 words.
- Aim for 700-1100 words total.
- Write clean, flowing prose only. Do NOT embed [[brackets]] or markdown links yourself — just make sure each story's exact title appears naturally in the text.

Respond ONLY with valid JSON (no markdown, no code fences):
{
  "title": "This Week in PS6 News: ...",
  "slug": "weekly-ps6-news-roundup-${weekLabel.split(' to ')[1] || 'this-week'}",
  "metaTitle": "50-60 char SEO title",
  "metaDescription": "150-160 char summary",
  "excerpt": "130-155 char summary of the week",
  "imagePrompt": "Generate a detailed topic-specific image prompt for this week's roundup. Describe a concrete visual scene representing the week's dominant themes (e.g. a futuristic console surrounded by news icons, calendar pages, and gaming symbols). MUST include: NO TEXT, no words, no letters, no captions anywhere in the image. Cinematic photorealistic, dark background, blue/purple neon lighting, ultra-detailed 4K, no real people, no brand logos.",
  "sections": [
    { "heading": null, "paragraphs": ["intro paragraph(s)"] },
    { "heading": "Theme Heading", "paragraphs": ["paragraph mentioning story titles verbatim"] }
  ],
  "whatToWatch": ["Forward-looking point 1", "Forward-looking point 2", "Forward-looking point 3"]
}`
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🗞️  PS6News Weekly Roundup starting...')

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is missing — add it to .env.local')
    process.exit(1)
  }

  const weekArticles = await fetchWeekArticles()
  console.log(`📚 ${weekArticles.length} article(s) published in the last 7 days`)

  if (weekArticles.length < 3) {
    console.log('ℹ️  Fewer than 3 articles this week — not enough for a meaningful round-up. Skipping.\n')
    return
  }

  const startDate = new Date(weekArticles[0].publishedAt)
  const endDate = new Date(weekArticles[weekArticles.length - 1].publishedAt)
  const fmt = d => d.toISOString().slice(0, 10)
  const weekLabel = `${fmt(startDate)} to ${fmt(endDate)}`

  weekArticles.forEach((a, i) => console.log(`   ${i + 1}. [${a.category || 'News'}] ${a.title}`))

  console.log(`\n✍️  Synthesising round-up for ${weekLabel} with Terra...`)
  const prompt = buildPrompt(weekArticles, weekLabel)
  const rawText = await callTerra(prompt, { webSearch: false })

  let data
  try {
    data = parseTerraJson(rawText)
  } catch {
    console.error('❌ Could not parse Terra response as JSON')
    console.error('Raw (first 400 chars):', rawText.slice(0, 400))
    process.exit(1)
  }

  if (!data.slug) data.slug = `weekly-ps6-news-roundup-${fmt(endDate)}`

  console.log(`\nTitle: ${data.title}`)
  console.log(`Slug: ${data.slug}`)

  if (await slugExists(data.slug)) {
    console.log(`⏭️  A round-up with this slug already exists — skipping to avoid duplicate.\n`)
    return
  }

  // Auto-link every mentioned story title back to its article
  const { sections, linkedSlugs } = autoLinkTitles(data.sections || [], weekArticles)
  console.log(`🔗 Auto-linked ${linkedSlugs.size}/${weekArticles.length} stories by title mention`)

  if (DRY_RUN) {
    console.log('\n🔎 Dry run — stopping here. No round-up published.\n')
    console.log(JSON.stringify({ ...data, sections }, null, 2).slice(0, 2000))
    return
  }

  // Build body
  const body = []

  for (const section of sections) {
    if (section.heading) {
      body.push({
        _type: 'block', _key: randomKey(), style: 'h2', markDefs: [],
        children: [{ _type: 'span', _key: randomKey(), text: section.heading, marks: [] }],
      })
    }
    body.push(...textToBlocks(section.paragraphs || [], weekArticles.map(a => ({ slug: a.slug }))))
  }

  if (data.whatToWatch?.length) {
    body.push({
      _type: 'block', _key: randomKey(), style: 'h2', markDefs: [],
      children: [{ _type: 'span', _key: randomKey(), text: 'What to Watch Next Week', marks: [] }],
    })
    for (const point of data.whatToWatch) {
      body.push({
        _type: 'block', _key: randomKey(), style: 'normal', listItem: 'bullet', level: 1, markDefs: [],
        children: [{ _type: 'span', _key: randomKey(), text: String(point), marks: [] }],
      })
    }
  }

  // "All Stories This Week" — guaranteed link to every story, regardless of prose matching
  body.push({
    _type: 'block', _key: randomKey(), style: 'h2', markDefs: [],
    children: [{ _type: 'span', _key: randomKey(), text: 'All Stories This Week', marks: [] }],
  })
  for (const art of weekArticles) {
    body.push(linkedBulletBlock(art.title, art.slug))
  }

  const authorId = await getDefaultAuthorId()
  const categoryMap = await getCategoryMap()
  const catBody = `${data.excerpt || ''} ${sections.map(s => `${s.heading || ''} ${(s.paragraphs || []).join(' ')}`).join(' ')}`
  const catSlug = detectCategorySlug(data.title || '', catBody)
  const categoryId = categoryMap[catSlug] || categoryMap['news']
  console.log(`🏷️  Category: ${catSlug}`)

  const imageAssetId = await getImageAssetId(
    { title: data.title, imagePrompt: data.imagePrompt },
    { summary: 'PS6 weekly news roundup concept' }
  )

  const doc = {
    _type: 'article',
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    excerpt: data.excerpt ? data.excerpt.slice(0, 195) : undefined,
    body,
    publishedAt: new Date().toISOString(),
    featured: true,
  }

  if (data.metaTitle || data.metaDescription) {
    doc.seo = {
      metaTitle: (data.metaTitle || data.title || '').slice(0, 70),
      metaDescription: (data.metaDescription || data.excerpt || '').slice(0, 170),
    }
  }
  if (authorId) doc.author = { _type: 'reference', _ref: authorId }
  if (categoryId) doc.category = { _type: 'reference', _ref: categoryId }
  if (imageAssetId) {
    doc.mainImage = { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } }
  }

  const result = await sanity.create(doc)
  console.log(`\n✅ Published weekly round-up: "${data.title}"`)
  console.log(`   URL: https://ps6news.com/${data.slug}`)
  console.log(`   ID:  ${result._id}`)
}

if (require.main === module) {
  run().catch(err => {
    console.error('\n💥 Fatal error:', err.message)
    process.exit(1)
  })
}

module.exports = { run }
