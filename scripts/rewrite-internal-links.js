const { createClient } = require('@sanity/client')
const client = createClient({
  projectId: 'zzzwo1aw', dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

let _k = 1
function key() { return 'il' + (_k++).toString().padStart(4, '0') }

function injectLink(block, searchText, beforeText, anchorText, afterText, href) {
  // Find the span containing searchText and split it to inject a link
  const newMarkDefs = [...(block.markDefs || [])]
  const newChildren = []
  let injected = false

  for (const child of block.children) {
    if (!injected && child._type === 'span' && child.text.includes(searchText)) {
      const idx = child.text.indexOf(searchText)
      const pre = child.text.substring(0, idx)
      const post = child.text.substring(idx + searchText.length)
      const linkKey = key()
      newMarkDefs.push({ _type: 'link', _key: linkKey, href })

      if (pre) newChildren.push({ ...child, _key: key(), text: pre })
      // beforeText replaces searchText prefix, anchorText is the link, afterText replaces suffix
      if (beforeText) newChildren.push({ _type: 'span', _key: key(), text: beforeText, marks: [] })
      newChildren.push({ _type: 'span', _key: key(), text: anchorText, marks: [linkKey] })
      if (afterText + post) newChildren.push({ _type: 'span', _key: key(), text: afterText + post, marks: [] })
      injected = true
    } else {
      newChildren.push(child)
    }
  }

  if (!injected) return null // couldn't inject
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

// Per-article injection plan:
// [blockIndex, searchText, beforeText, anchorText, afterText, href]
const injections = {

  'article-4391': [
    // block[3] - performance para -> link to specs
    [3, 'ray tracing and universal compression', 'ray tracing and universal compression — all detailed in our ', 'PS6 specs overview', '', URLS.specs],
    // block[5] - pricing para -> link to cost
    [5, 'launch price', 'launch price (see our ', 'PS6 price analysis', ')', URLS.cost],
    // block[7] - design para -> link to design
    [7, 'early design leaks', '', 'early design leaks', '', URLS.design],
    // block[9] - disc para -> link to disc
    [9, 'disc drive', '', 'disc drive', '', URLS.disc],
  ],

  'article-4416': [
    // block[3] - budget para -> link to cost
    [3, 'price estimates range from', '', 'price estimates range from', '', URLS.cost],
    // block[5] - display para -> link to specs
    [5, '4K at 120fps', '', '4K at 120fps', '', URLS.specs],
    // block[7] - disc para -> link to disc
    [7, 'Insider Gaming reports', '', 'Insider Gaming reports', '', URLS.disc],
    // block[11] - pre-order para -> link to gta6
    [11, 'GTA 6 could shape', '', 'GTA 6 could shape the PS6 launch', '', URLS.gta6],
  ],

  'article-4445': [
    // block[3] - release para -> link to specs
    [3, 'PS6 around holiday 2027', 'PS6 around holiday 2027 — the ', 'full specs picture', ' is still forming', URLS.specs],
    // block[5] - hardware para -> link to early specs
    [5, 'three times that of the base PS5', 'three times that of the base PS5 — as covered in our ', 'early AMD specs leak', '', URLS.earlySpecs],
    // block[7] - disc para -> link to disc
    [7, 'detachable disc drive', '', 'detachable disc drive', '', URLS.disc],
    // block[10] - pricing para -> link to cost
    [10, 'PS6 will retail between', 'PS6 will retail between', ' — see full price breakdown', '', URLS.cost],
  ],

  'article-4465': [
    // block[3] - release delay para -> link to specs
    [3, 'PS6 launch bundles', '', 'PS6 launch bundles', '', URLS.specs],
    // block[5] - graphics para -> link to early specs
    [5, 'ray-traced reflections', '', 'ray-traced reflections', '', URLS.earlySpecs],
    // block[9] - conclusion para -> link to cost
    [9, 'high cost of entry', '', 'high cost of entry', '', URLS.cost],
    // block[11] - design concepts para -> link to design
    [11, 'design of the console', '', 'design of the console', '', URLS.design],
  ],

  'article-4475': [
    // block[3] - economic context -> link to howto
    [3, 'start a dedicated savings fund now', '', 'start a dedicated savings fund now', '', URLS.howto],
    // block[5] - BOM para -> link to disc
    [5, '1 TB Gen5 SSD, no disc drive', '1 TB Gen5 SSD — the ', 'disc drive situation', ' is still debated', URLS.disc],
    // block[8] - $1000 para -> link to specs
    [8, 'surging DRAM and NAND costs', 'surging DRAM and NAND costs (driven by the same components as the ', 'PS6\'s rumoured specs', ')', URLS.specs],
    // block[14] - cheaper scenario -> link to earlySpecs
    [14, 'designing the PS6 "from the ground up', 'designing the PS6 "from the ground up — a claim that aligns with the ', 'early specs leak', '', URLS.earlySpecs],
  ],

  'article-4480': [
    // block[3] - rumour para -> link to specs
    [3, 'bill of materials for the PS6', 'bill of materials for the PS6 (covered in depth in our ', 'PS6 specs article', ')', URLS.specs],
    // block[6] - detachable para -> link to cost
    [6, 'replicating the PS5 Slim', 'replicating the PS5 Slim — a move that also affects ', 'PS6 pricing expectations', '', URLS.cost],
    // block[12] - backward compat -> link to gta6
    [12, 'PS5 and likely PS4 titles' , 'PS5 and likely PS4 titles — including titles like ', 'GTA 6 on PS6', '', URLS.gta6],
    // block[17] - pros para -> link to design
    [17, 'slimmer and easier to manufacture', 'slimmer and easier to manufacture — something reflected in ', 'PS6 design concepts', '', URLS.design],
  ],

  'article-4487': [
    // block[3] - release para -> link to cost
    [3, 'PS6 release date would fall in late', 'PS6 release date would fall in late 2027, though ', 'PS6 pricing uncertainty', ' adds complexity', URLS.cost],
    // block[7] - processor para -> link to earlySpecs
    [7, '34–40 teraflops', '34–40 teraflops — first reported in our ', 'early AMD specs leak', '', URLS.earlySpecs],
    // block[9] - memory para -> link to disc
    [9, 'launch without a built-in disc drive', '', 'launch without a built-in disc drive', '', URLS.disc],
    // block[13] - canis para -> link to design
    [13, 'run PS6 games at reduced settings', 'run PS6 games at reduced settings — a complement to the ', 'PS6 design concepts', ' emerging around a slimmer form factor', URLS.design],
  ],
}

async function run() {
  for (const [articleId, plan] of Object.entries(injections)) {
    const article = await client.fetch(`*[_id=="${articleId}"][0]{_id,title,body}`)
    if (!article) { console.log(`❌ Not found: ${articleId}`); continue }

    let body = [...article.body]

    // Remove the last block if it's the bunched internal-link paragraph we added before
    const last = body[body.length - 1]
    if (last?._type === 'block' && last?.children?.some(c =>
      c.text?.includes('Further reading:') ||
      c.text?.includes('Related:') ||
      c.text?.includes('See also:') ||
      c.text?.includes('Also relevant:') ||
      c.text?.includes('Alongside design') ||
      c.text?.includes('Before you prepare') ||
      c.text?.includes('broader context')
    )) {
      body = body.slice(0, -1)
    }

    // Inject internal links into body blocks
    for (const [blockIdx, searchText, beforeText, anchorText, afterText, href] of plan) {
      if (blockIdx >= body.length) { console.log(`  ⚠ Block ${blockIdx} out of range for ${articleId}`); continue }
      const block = body[blockIdx]
      if (block._type !== 'block') { console.log(`  ⚠ Block ${blockIdx} is not a text block (${block._type})`); continue }

      // Check if link already exists to avoid duplicates
      const existingHref = block.markDefs?.some(m => m.href === href)
      if (existingHref) { console.log(`  ⚠ Link already exists in block ${blockIdx}`); continue }

      const injected = injectLink(body[blockIdx], searchText, beforeText, anchorText, afterText, href)
      if (injected) {
        body[blockIdx] = injected
      } else {
        console.log(`  ⚠ Could not find "${searchText}" in block ${blockIdx} of ${articleId}`)
      }
    }

    await client.patch(articleId).set({ body }).commit()
    console.log(`✅ ${article.title}`)
  }

  console.log('\n✅ All done!')
}

run().catch(err => { console.error(err); process.exit(1) })
