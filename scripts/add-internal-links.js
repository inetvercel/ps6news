const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

let _k = 1
function key() { return 'il' + (_k++).toString().padStart(4, '0') }

function block(text) {
  return { _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] }
}

function blockWithLinks(segments) {
  const markDefs = []
  const children = segments.map(seg => {
    if (seg.href) {
      const k = key()
      markDefs.push({ _type: 'link', _key: k, href: seg.href })
      return { _type: 'span', _key: key(), text: seg.text, marks: [k] }
    }
    return { _type: 'span', _key: key(), text: seg.text, marks: [] }
  })
  return { _type: 'block', _key: key(), style: 'normal', markDefs, children }
}

// Internal URLs
const URLS = {
  specs:       '/articles/ps6-specs',
  earlySpecs:  '/articles/ps6-early-specs-leak-amd-power-promises-8k-gaming-at-60-fps',
  design:      '/articles/what-will-the-ps6-look-like',
  gta6:        '/articles/gta6-release',
  cost:        '/articles/ps6-cost',
  disc:        '/articles/ps6-disc-drive',
  howto:       '/articles/how-to-prepare-for-the-ps6-launch',
}

// Each article gets a closing "Related reading" paragraph block with 4 internal links
const relatedBlocks = {

  'article-4391': blockWithLinks([
    { text: 'For broader context, see our full rundown of ' },
    { text: 'PS6 specs and rumours', href: URLS.specs },
    { text: ', dig into ' },
    { text: 'PS6 price predictions', href: URLS.cost },
    { text: ', find out ' },
    { text: 'whether the PS6 will have a disc drive', href: URLS.disc },
    { text: ', and explore ' },
    { text: 'early PS6 design concepts', href: URLS.design },
    { text: '.' },
  ]),

  'article-4416': blockWithLinks([
    { text: 'Before you prepare, brush up on ' },
    { text: 'how much the PS6 is likely to cost', href: URLS.cost },
    { text: ', check the latest ' },
    { text: 'PS6 hardware specs', href: URLS.specs },
    { text: ', learn ' },
    { text: 'whether the PS6 will include a disc drive', href: URLS.disc },
    { text: ', and see how ' },
    { text: 'GTA 6 could shape the PS6 launch', href: URLS.gta6 },
    { text: '.' },
  ]),

  'article-4445': blockWithLinks([
    { text: 'Alongside design, it\'s worth reading the ' },
    { text: 'full PS6 specs breakdown', href: URLS.specs },
    { text: ', the ' },
    { text: 'early AMD specs leak', href: URLS.earlySpecs },
    { text: ', details on ' },
    { text: 'the PS6 disc drive situation', href: URLS.disc },
    { text: ', and ' },
    { text: 'PS6 price estimates', href: URLS.cost },
    { text: '.' },
  ]),

  'article-4465': blockWithLinks([
    { text: 'Also relevant: the ' },
    { text: 'latest PS6 specs and hardware rumours', href: URLS.specs },
    { text: ', ' },
    { text: 'PS6 price predictions', href: URLS.cost },
    { text: ', ' },
    { text: 'PS6 design concepts', href: URLS.design },
    { text: ', and our ' },
    { text: 'PS6 launch preparation guide', href: URLS.howto },
    { text: '.' },
  ]),

  'article-4475': blockWithLinks([
    { text: 'Related: the ' },
    { text: 'full PS6 specs overview', href: URLS.specs },
    { text: ', ' },
    { text: 'disc drive plans for the PS6', href: URLS.disc },
    { text: ', the ' },
    { text: 'early AMD hardware leak', href: URLS.earlySpecs },
    { text: ', and our ' },
    { text: 'guide to preparing for the PS6 launch', href: URLS.howto },
    { text: '.' },
  ]),

  'article-4480': blockWithLinks([
    { text: 'See also: ' },
    { text: 'everything we know about PS6 specs', href: URLS.specs },
    { text: ', ' },
    { text: 'PS6 cost and price analysis', href: URLS.cost },
    { text: ', ' },
    { text: 'PS6 design leaks and concepts', href: URLS.design },
    { text: ', and how ' },
    { text: 'GTA 6 is expected to influence the PS6 launch', href: URLS.gta6 },
    { text: '.' },
  ]),

  'article-4487': blockWithLinks([
    { text: 'Further reading: ' },
    { text: 'PS6 price predictions and analysis', href: URLS.cost },
    { text: ', ' },
    { text: 'the PS6 disc drive debate', href: URLS.disc },
    { text: ', ' },
    { text: 'PS6 design concepts', href: URLS.design },
    { text: ', and ' },
    { text: 'GTA 6 and next-gen PS6 potential', href: URLS.gta6 },
    { text: '.' },
  ]),
}

async function run() {
  const ids = Object.keys(relatedBlocks)

  for (const id of ids) {
    const article = await client.fetch(`*[_id == "${id}"][0]{_id, title, body}`)
    if (!article) { console.log(`❌ Not found: ${id}`); continue }

    const newBody = [...(article.body || []), relatedBlocks[id]]
    await client.patch(id).set({ body: newBody }).commit()
    console.log(`✅ ${article.title}`)
  }

  console.log('\n✅ All internal links added!')
}

run().catch(err => { console.error(err); process.exit(1) })
