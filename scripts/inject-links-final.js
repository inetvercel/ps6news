const { createClient } = require('@sanity/client')
const client = createClient({
  projectId: 'zzzwo1aw', dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

let _k = 1
function key() { return 'fn' + (_k++).toString().padStart(4, '0') }

// Inject a link by searching for anchorText across concatenated child text,
// then splitting the correct child span
function addLink(block, anchorText, href) {
  if (!block || block._type !== 'block') return null
  const fullText = block.children?.map(c => c.text || '').join('')
  if (!fullText.includes(anchorText)) return null
  if (block.markDefs?.some(m => m.href === href)) return null // already done

  const linkKey = key()
  const newMarkDefs = [...(block.markDefs || []), { _type: 'link', _key: linkKey, href }]
  const newChildren = []

  let pos = 0
  let injected = false

  for (const child of block.children) {
    const cText = child.text || ''
    if (!injected) {
      const start = fullText.indexOf(anchorText)
      const childStart = pos
      const childEnd = pos + cText.length

      if (childStart <= start && start < childEnd) {
        // anchor starts in this child
        const localStart = start - childStart
        const localEnd = localStart + anchorText.length

        if (localStart > 0) newChildren.push({ ...child, _key: key(), text: cText.substring(0, localStart) })
        
        if (localEnd <= cText.length) {
          // anchor fully in this child
          newChildren.push({ _type: 'span', _key: key(), text: anchorText, marks: [...(child.marks || []), linkKey] })
          if (localEnd < cText.length) newChildren.push({ ...child, _key: key(), text: cText.substring(localEnd) })
        } else {
          // anchor spans multiple children - just link what fits in this child
          newChildren.push({ _type: 'span', _key: key(), text: cText.substring(localStart), marks: [...(child.marks || []), linkKey] })
        }
        injected = true
      } else {
        newChildren.push(child)
      }
    } else {
      newChildren.push(child)
    }
    pos += cText.length
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

// [blockIndex, anchorText (exact substring), href]
const plan = {
  'article-4391': [
    [7, "continuing Sony's successful partner", URLS.specs],   // conclusion para
    [5, "Moore's Law Is Dead", URLS.cost],                      // timeline para
    [5, "rumors suggest that the PS5 Pro", URLS.disc],          // same para different anchor
    [7, "advancements in gaming technology", URLS.design],      // conclusion
  ],
  'article-4416': [
    [3, "reports of memory shortages pushing the launch to 2028 or 2029", URLS.cost],
    [7, "HDR support (Dolby Vision or HDR10+)", URLS.specs],
    [9, "Insider Gaming reports a detachable disc drive", URLS.disc],
    [9, "PS5 Slim's modular approach", URLS.gta6],
  ],
  'article-4445': [
    [2, "Sony has not formally unveiled the PlayStation 6", URLS.specs],
    [6, "PS5 is only in the middle of its life cycle", URLS.earlySpecs],
    [6, "neural-array upscalers, radiance cores", URLS.disc],
    [6, "future console", URLS.cost],
  ],
  'article-4465': [
    [0, "Grand Theft Auto VI", URLS.specs],
    [4, "extremely unlikely", URLS.cost],
    [6, "next-gen PlayStation and Xbox lau", URLS.design],
    [4, "already been delayed multiple times", URLS.howto],
  ],
  'article-4475': [
    [6, "Project Helix", URLS.disc],
    [8, "Push Square gathered expert comments", URLS.specs],
    [14, "Vice report cites an insider", URLS.earlySpecs],
    [14, "every component from screws to", URLS.howto],
  ],
  'article-4480': [
    [6, "replicating the PS5 Slim — a move", URLS.cost],
    [12, 'ComicBook argues the PS6 will "almost certainly"', URLS.gta6],
    [17, "reduce shipping weight and pass some savings", URLS.design],
    [17, "collectors can still buy physical discs", URLS.howto],
  ],
  'article-4487': [
    [7, "Zen 6 CPU cores with an RDNA 5-based GPU", URLS.earlySpecs],
    [9, "The console is expect", URLS.disc],
    [13, "run PS6 games at reduced settings", URLS.design],
    [17, "considerably more expensive than the PS5", URLS.cost],
  ],
}

async function run() {
  for (const [articleId, injections] of Object.entries(plan)) {
    const article = await client.fetch(`*[_id=="${articleId}"][0]{_id,title,body}`)
    if (!article) { console.log(`❌ Not found: ${articleId}`); continue }

    let body = [...article.body]
    let count = 0

    for (const [blockIdx, anchorText, href] of injections) {
      const updated = addLink(body[blockIdx], anchorText, href)
      if (updated) {
        body[blockIdx] = updated
        count++
      } else {
        console.log(`  ⚠ [${articleId}] block ${blockIdx}: "${anchorText.substring(0,40)}"`)
      }
    }

    await client.patch(articleId).set({ body }).commit()
    console.log(`✅ ${article.title} (${count}/4)`)
  }
  console.log('\n✅ All done!')
}

run().catch(err => { console.error(err); process.exit(1) })
