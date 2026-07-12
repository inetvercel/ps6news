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

// ── Pillar-topic patterns → used to identify which pillar page to link ────────
// Each pattern matches phrases that naturally appear in articles about that topic.
// The regex must use capturing groups if you want to preserve the original casing.
const PILLAR_PATTERNS = [
  { re: /\b(release date|launch date|launch window|release window|release timing)\b/i,             topic: 'release'    },
  { re: /\b(hardware spec(?:s|ification)?|GPU|teraflop|RDNA|Zen \d|processing power|SSD speed)\b/i, topic: 'specs'    },
  { re: /\b(retail price|launch price|how much (?:the )?PS6|price point)\b/i,                      topic: 'price'      },
  { re: /\b(launch (?:games?|titles?)|launch lineup|launch library|first.party (?:games?|titles?))\b/i, topic: 'games' },
  { re: /\b(DualSense|adaptive triggers?|haptic feedback|PS6 controller)\b/i,                      topic: 'controller' },
  { re: /\b(backward compat(?:ibility)?|back.compat|play PS[45] games? on)\b/i,                    topic: 'backcompat' },
  { re: /\b(physical (?:media|games?|disc)|disc.?less|digital.?only console)\b/i,                  topic: 'disc'       },
  { re: /\b(handheld|portable PlayStation|PS6 portable|PS6 Go)\b/i,                                topic: 'handheld'   },
]

// Pillar identification — articles whose slug/title matches these are evergreen guides
const PILLAR_ID_RE = /specs|release.?date|price|cost|games|features|design|rumors?|leak|controllers?|backward.?compat|storage|cpu|gpu|ram|teraflop|launch|pre.?order|handheld|portable/i

function rnd() { return Math.random().toString(36).substr(2, 10) }

// ── Build pillar link map from Sanity ─────────────────────────────────────────
async function buildPillarMap() {
  const all = await sanity.fetch(
    `*[_type == "article" && defined(slug.current)] | order(publishedAt asc) [0..199]{ _id, title, "slug": slug.current }`
  )
  const pillars = all.filter(a => PILLAR_ID_RE.test(a.title || '') || PILLAR_ID_RE.test(a.slug || ''))

  const map = [] // { re, slug, title }
  for (const pat of PILLAR_PATTERNS) {
    const match = pillars.find(p => pat.re.test(p.title || '') || pat.re.test(p.slug || ''))
    if (match) map.push({ re: pat.re, slug: match.slug, title: match.title })
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
      const m = candidate.re.exec(text)
      if (!m) { updatedChildren.push(span); continue }

      const phraseStart = m.index
      const phraseEnd   = phraseStart + m[0].length

      // Don't link if phrase is the very first word (too prominent / looks forced)
      if (phraseStart < 15) { updatedChildren.push(span); continue }

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
  pillarMap.forEach(p => console.log(`   • /${p.slug}  (${p.title})`))
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
