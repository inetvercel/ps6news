const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

const targets = {
  'article-4391': [3,5,6,7,8],
  'article-4416': [3,5,7,9],
  'article-4445': [2,6,8,10],
  'article-4465': [0,4,6,8],
  'article-4475': [6,8,14],
  'article-4480': [6,12,17],
  'article-4487': [7,9,13],
}

async function run() {
  for (const [id, blocks] of Object.entries(targets)) {
    const a = await client.fetch(`*[_id=="${id}"][0]{_id,title,body}`)
    console.log(`\n===== ${a._id} | ${a.title} =====`)
    for (const i of blocks) {
      const b = a.body[i]
      if (!b) { console.log(`[${i}] OUT OF RANGE`); continue }
      if (b._type !== 'block') { console.log(`[${i}] TYPE:${b._type}`); continue }
      const text = b.children?.map(c=>c.text).join('')
      console.log(`[${i}] "${text.substring(0,200)}"`)
    }
  }
}
run().catch(console.error)
