const { createClient } = require('@sanity/client')
const client = createClient({
  projectId: 'zzzwo1aw', dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

let _k = 1
function key() { return 'rm' + (_k++).toString().padStart(4, '0') }

function addLink(block, anchorText, href) {
  if (!block || block._type !== 'block') return null
  if (block.markDefs?.some(m => m.href === href)) return null

  const linkKey = key()
  const newMarkDefs = [...(block.markDefs || []), { _type: 'link', _key: linkKey, href }]
  const newChildren = []
  let injected = false

  for (const child of block.children) {
    if (!injected && child._type === 'span' && (child.marks?.length === 0 || !child.marks) && child.text.includes(anchorText)) {
      const idx = child.text.indexOf(anchorText)
      if (idx > 0) newChildren.push({ ...child, _key: key(), text: child.text.substring(0, idx) })
      newChildren.push({ _type: 'span', _key: key(), text: anchorText, marks: [linkKey] })
      const after = child.text.substring(idx + anchorText.length)
      if (after) newChildren.push({ ...child, _key: key(), text: after })
      injected = true
    } else {
      newChildren.push(child)
    }
  }

  if (!injected) return null
  return { ...block, markDefs: newMarkDefs, children: newChildren }
}

const URLS = {
  specs:      '/articles/ps6-specs',
  earlySpecs: '/articles/ps6-early-specs-leak-amd-power-promises-8k-gaming-at-60-fps',
  design:     '/articles/what-will-the-ps6-look-like',
  gta6:       '/articles/gta6-release',
  cost:       '/articles/ps6-cost',
  disc:       '/articles/ps6-disc-drive',
  howto:      '/articles/how-to-prepare-for-the-ps6-launch',
}

// Only truly missing injections based on children dump
const remaining = {
  'article-4391': [
    // block 5 child[0] has "Moreover, Moore's Law Is Dead indicated" - unlinked
    [5, "Moore's Law Is Dead indicated", URLS.cost],
    // block 7 child[2] has "continuing Sony's successful partnership with " - unlinked
    [7, "continuing Sony's successful partnership", URLS.specs],
  ],
  'article-4475': [
    // block 8 child[3] has "surging DRAM and NAND costs (driven by the same components as the " - unlinked
    [8, "surging DRAM and NAND costs", URLS.specs],
    // block 14 child[0] has "Not all reports predict sky-high prices. A separate Vice report cites an insider" - unlinked
    [14, "Vice report cites an insider", URLS.earlySpecs],
  ],
  'article-4480': [
    // block 6 child[3] has "replicating the PS5 Slim — a move that also affects " - unlinked
    [6, "replicating the PS5 Slim", URLS.cost],
  ],
}

async function run() {
  for (const [articleId, injections] of Object.entries(remaining)) {
    const article = await client.fetch(`*[_id=="${articleId}"][0]{_id,title,body}`)
    if (!article) { console.log(`❌ Not found: ${articleId}`); continue }

    let body = [...article.body]
    let count = 0

    for (const [blockIdx, anchorText, href] of injections) {
      const updated = addLink(body[blockIdx], anchorText, href)
      if (updated) {
        body[blockIdx] = updated
        count++
        console.log(`  ✓ "${anchorText}"`)
      } else {
        console.log(`  ⚠ could not inject "${anchorText}" in block ${blockIdx}`)
      }
    }

    await client.patch(articleId).set({ body }).commit()
    console.log(`✅ ${article.title} (+${count})`)
  }
  console.log('\n✅ Done!')
}

run().catch(err => { console.error(err); process.exit(1) })
