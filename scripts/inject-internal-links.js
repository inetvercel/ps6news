const { createClient } = require('@sanity/client')
const client = createClient({
  projectId: 'zzzwo1aw', dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

let _k = 1
function key() { return 'nl' + (_k++).toString().padStart(4, '0') }

// Inject a link into a block by finding a unique substring and wrapping it
function addLinkToBlock(block, anchorText, href) {
  const fullText = block.children?.map(c => c.text).join('')
  if (!fullText.includes(anchorText)) return null
  if (block.markDefs?.some(m => m.href === href)) return null // already linked

  const newMarkDefs = [...(block.markDefs || [])]
  const linkKey = key()
  newMarkDefs.push({ _type: 'link', _key: linkKey, href })

  const newChildren = []
  let remaining = anchorText

  for (const child of block.children) {
    if (remaining && child._type === 'span' && !child.marks?.some(m => newMarkDefs.find(d => d._key === m && d._type === 'link'))) {
      const idx = child.text.indexOf(remaining)
      if (idx !== -1) {
        if (idx > 0) newChildren.push({ ...child, _key: key(), text: child.text.substring(0, idx) })
        newChildren.push({ _type: 'span', _key: key(), text: remaining, marks: [...(child.marks || []), linkKey] })
        const after = child.text.substring(idx + remaining.length)
        if (after) newChildren.push({ ...child, _key: key(), text: after })
        remaining = null
        continue
      }
    }
    newChildren.push(child)
  }

  if (remaining) return null // didn't find it split across children
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

// [blockIndex, anchorText, href]
// Using exact substrings visible in dump
const injections = {

  'article-4391': [
    // intro -> specs
    [0, 'eight Zen 6 CPU cores', URLS.specs],
    // block 2 (h2 skipped) -> block 3 normal -> cost
    [4, 'price the PS6 around $699', URLS.cost],
    // block 5 (h2) -> block 6 normal -> disc
    [6, 'digital-only console', URLS.disc],
    // block 8 normal -> design
    [8, 'design of the PS6', URLS.design],
  ],

  'article-4416': [
    // block 3 budget -> cost
    [3, '$600 and $999', URLS.cost],
    // block 5 display -> specs
    [5, '4K at 120fps with advanced ray tracing', URLS.specs],
    // block 7 disc -> disc article
    [7, 'detachable disc drive at or near launch', URLS.disc],
    // block 9 library -> gta6
    [9, 'PS4 and PS5 titles', URLS.gta6],
  ],

  'article-4445': [
    // block 2 intro -> specs
    [2, 'PS6 around holiday 2027', URLS.specs],
    // block 6 hardware -> earlySpecs
    [6, 'roughly three times that of the base PS5', URLS.earlySpecs],
    // block 8 disc -> disc
    [8, 'detachable drive available separately', URLS.disc],
    // block 10 pricing -> cost
    [10, 'US$500 and US$600', URLS.cost],
  ],

  'article-4465': [
    // block 0 intro -> specs
    [0, 'next-generation console', URLS.specs],
    // block 4 graphics -> earlySpecs
    [4, 'ray-traced reflections and global illumination', URLS.earlySpecs],
    // block 6 bundles -> cost
    [6, 'PS6 launch bundles anchored around GTA 6', URLS.cost],
    // block 8 conclusion -> design
    [8, 'design of the console', URLS.design],
  ],

  'article-4475': [
    // block 0 intro -> howto
    [0, 'how much the PS6 will cost', URLS.howto],
    // block 6 vice -> disc
    [6, '1 TB Gen5 SSD', URLS.disc],
    // block 8 $1000 -> specs
    [8, 'surging DRAM and NAND costs', URLS.specs],
    // block 14 cheaper -> earlySpecs
    [14, 'designing the PS6', URLS.earlySpecs],
  ],

  'article-4480': [
    // block 6 detachable -> cost
    [6, 'replicating the PS5 Slim', URLS.cost],
    // block 12 compat -> gta6
    [12, 'PS4 and PS5 games', URLS.gta6],
    // block 17 pros -> design
    [17, 'slim and modular', URLS.design],
    // block 23 verdict -> howto
    [23, 'hybrid strategy', URLS.howto],
  ],

  'article-4487': [
    // block 7 processor -> earlySpecs
    [7, 'RDNA 5-based GPU', URLS.earlySpecs],
    // block 9 memory -> disc
    [9, 'launch without a built-in disc drive', URLS.disc],
    // block 17 pricing -> cost
    [17, 'retail price of $699', URLS.cost],
    // block 13 canis -> design
    [13, 'run PS6 games at reduced settings', URLS.design],
  ],
}

async function run() {
  for (const [articleId, plan] of Object.entries(injections)) {
    const article = await client.fetch(`*[_id=="${articleId}"][0]{_id,title,body}`)
    if (!article) { console.log(`❌ Not found: ${articleId}`); continue }

    let body = [...article.body]
    let successCount = 0

    for (const [blockIdx, anchorText, href] of plan) {
      if (blockIdx >= body.length) {
        console.log(`  ⚠ [${articleId}] Block ${blockIdx} out of range`)
        continue
      }
      const block = body[blockIdx]
      if (block._type !== 'block') {
        console.log(`  ⚠ [${articleId}] Block ${blockIdx} is ${block._type}, skipping`)
        continue
      }
      const updated = addLinkToBlock(block, anchorText, href)
      if (updated) {
        body[blockIdx] = updated
        successCount++
      } else {
        console.log(`  ⚠ [${articleId}] Could not inject "${anchorText}" in block ${blockIdx}`)
      }
    }

    await client.patch(articleId).set({ body }).commit()
    console.log(`✅ ${article.title} (${successCount}/4 links injected)`)
  }
  console.log('\n✅ All done!')
}

run().catch(err => { console.error(err); process.exit(1) })
