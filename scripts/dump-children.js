const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

const targets = {
  'article-4391': [5,7],
  'article-4416': [3],
  'article-4475': [8,14],
  'article-4480': [6,17],
  'article-4487': [7,9,13,17],
}

async function run() {
  for (const [id, blocks] of Object.entries(targets)) {
    const a = await client.fetch(`*[_id=="${id}"][0]{_id,title,body}`)
    console.log(`\n===== ${a.title} =====`)
    for (const i of blocks) {
      const b = a.body[i]
      if (!b || b._type !== 'block') { console.log(`[${i}] skip`); continue }
      console.log(`[${i}] children:`)
      b.children.forEach((c,ci) => console.log(`  [${ci}] marks:${JSON.stringify(c.marks)} text:"${(c.text||'').substring(0,80)}"`))
    }
  }
}
run().catch(console.error)
