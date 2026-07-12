/**
 * PS6News Smart Internal Link Injector
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamically scans published articles and injects natural internal pillar-page
 * links directly into body text — no wording changes, links sit mid-sentence.
 *
 * Usage:
 *   node scripts/add-internal-links.js              # articles from last 48 h
 *   node scripts/add-internal-links.js --hours=168  # last 7 days
 *   node scripts/add-internal-links.js --all        # every article in CMS
 *   node scripts/add-internal-links.js --dry-run    # preview, no writes
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

// ── CLI ───────────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2)
const DRY    = args.includes('--dry-run')
const ALL    = args.includes('--all')
const HOURS  = parseInt((args.find(a => a.startsWith('--hours=')) || '').split('=')[1] || '48', 10)
const MAX_LINKS_PER_ARTICLE = 3

// ── Pillar-topic patterns ─────────────────────────────────────────────────────
// pillarRe  — matches the pillar article's OWN title/slug (loose, topic-level)
// contentRe — matches phrases inside OTHER articles' body text (what to link)
const PILLAR_PATTERNS = [
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

function rnd() { return Math.random().toString(36).substr(2, 10) }

// ── Build pillar link map from Sanity ─────────────────────────────────────────
async function buildPillarMap() {
  const all = await sanity.fetch(
    `*[_type == "article" && defined(slug.current)] | order(publishedAt asc) [0..199]{ _id, title, "slug": slug.current }`
  )

  const map = [] // { contentRe, slug, title }
  for (const pat of PILLAR_PATTERNS) {
    // Use pillarRe to find the matching pillar article by its title/slug
    const match = all.find(a => pat.pillarRe.test(a.title || '') || pat.pillarRe.test(a.slug || ''))
    if (match) map.push({ contentRe: pat.contentRe, slug: match.slug, title: match.title, topic: pat.topic })
  }
  return map
}

// ── Inject links into a single Portable Text block ───────────────────────────
// Only modifies normal-text blocks; skips headings and already-linked blocks.
// Returns modified block or null if nothing changed.
function processBlock(block, pillarMap, usedSlugs) {
  if (block._type !== 'block') return null
  if (block.style && block.style !== 'normal') return null // skip headings

  // Skip blocks that already contain a link annotation
  const existingLinkDefs = (block.markDefs || []).filter(d => d._type === 'link' || d._type === 'internalLink')
  if (existingLinkDefs.length > 0) return null

  const newMarkDefs = [...(block.markDefs || [])]
  let newChildren = [...(block.children || [])]
  let modified = false

  for (const candidate of pillarMap) {
    if (usedSlugs.has(candidate.slug)) continue

    // Find the first span that fully contains the phrase (single-span match)
    let matched = false
    const updatedChildren = []

    for (const span of newChildren) {
      if (matched || span._type !== 'span' || (span.marks || []).length > 0) {
        updatedChildren.push(span)
        continue
      }

      const text = span.text || ''
      const m = candidate.contentRe.exec(text)
      if (!m) { updatedChildren.push(span); continue }

      const phraseStart = m.index
      const phraseEnd   = phraseStart + m[0].length

      // Don't link if phrase starts within first 8 chars (too close to paragraph start)
      if (phraseStart < 8) { updatedChildren.push(span); continue }

      // Split span: before | linked phrase | after
      const before = text.slice(0, phraseStart)
      const phrase = m[0]
      const after  = text.slice(phraseEnd)

      const linkKey = rnd()
      newMarkDefs.push({ _key: linkKey, _type: 'link', href: `/${candidate.slug}` })

      if (before) updatedChildren.push({ ...span, _key: rnd(), text: before })
      updatedChildren.push({ ...span, _key: rnd(), text: phrase, marks: [...(span.marks || []), linkKey] })
      if (after)  updatedChildren.push({ ...span, _key: rnd(), text: after })

      matched = true
      modified = true
      usedSlugs.add(candidate.slug)
    }

    if (modified) newChildren = updatedChildren
  }

  if (!modified) return null
  return { ...block, markDefs: newMarkDefs, children: newChildren }
}

// ── Process a single article ───────────────────────────────────────────────────
async function processArticle(article, pillarMap) {
  const body = article.body || []
  if (!body.length) return 0

  // Identify first and last normal-text blocks — never link there
  const normalBlocks  = body.filter(b => b._type === 'block' && (!b.style || b.style === 'normal'))
  const firstBlockKey = normalBlocks[0]?._key
  const lastBlockKey  = normalBlocks[normalBlocks.length - 1]?._key

  const usedSlugs = new Set()
  let linkCount   = 0
  const newBody   = []

  for (const block of body) {
    const isEdge = block._key === firstBlockKey || block._key === lastBlockKey
    if (isEdge || usedSlugs.size >= MAX_LINKS_PER_ARTICLE) {
      newBody.push(block)
      continue
    }

    const updated = processBlock(block, pillarMap, usedSlugs)
    if (updated) {
      newBody.push(updated)
      linkCount++
    } else {
      newBody.push(block)
    }
  }

  if (!linkCount) return 0

  if (DRY) {
    const preview = [...usedSlugs].join(', ')
    console.log(`   [dry-run] Would add ${linkCount} link(s) → ${preview}`)
    return linkCount
  }

  await sanity.patch(article._id).set({ body: newBody }).commit()
  return linkCount
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🔗 PS6News Smart Internal Link Injector')
  console.log(`   Mode : ${DRY ? 'DRY RUN (no writes)' : 'LIVE'}`)
  console.log(`   Scope: ${ALL ? 'ALL articles' : `published in last ${HOURS} hours`}\n`)

  const pillarMap = await buildPillarMap()
  if (!pillarMap.length) { console.log('⚠️  No pillar articles found — nothing to link to.'); return }
  console.log(`📌 ${pillarMap.length} pillar link pattern(s) available:`)
  pillarMap.forEach(p => console.log(`   • [${p.topic}] /${p.slug}  (${p.title})`))
  console.log()

  let query, params = {}
  if (ALL) {
    query = `*[_type == "article"] | order(publishedAt desc) { _id, title, "slug": slug.current, body, publishedAt }`
  } else {
    const since = new Date(Date.now() - HOURS * 3600 * 1000).toISOString()
    query  = `*[_type == "article" && publishedAt > $since] | order(publishedAt desc) { _id, title, "slug": slug.current, body, publishedAt }`
    params = { since }
  }

  const articles = await sanity.fetch(query, params)
  if (!articles.length) { console.log('ℹ️  No articles found in that time window.\n'); return }
  console.log(`📚 ${articles.length} article(s) to process\n`)

  let totalLinks = 0

  for (const article of articles) {
    console.log(`📰 "${article.title}"`)
    const count = await processArticle(article, pillarMap)
    if (count) {
      console.log(`   ✅ Injected ${count} internal link(s)`)
      totalLinks += count
    } else {
      console.log(`   ─  No suitable positions found`)
    }
  }

  console.log(`\n✅ Done — ${totalLinks} total link(s) ${DRY ? 'would be ' : ''}injected across ${articles.length} article(s)\n`)
}

run().catch(err => { console.error(err); process.exit(1) })
