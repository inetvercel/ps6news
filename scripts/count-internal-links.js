const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})
const ids = ['article-4391','article-4416','article-4445','article-4465','article-4475','article-4480','article-4487']
const internalPrefixes = ['/articles/']

async function run() {
  for (const id of ids) {
    const a = await client.fetch(`*[_id=="${id}"][0]{_id,title,body}`)
    let links = []
    for (const b of a.body || []) {
      if (b._type === 'block' && b.markDefs) {
        for (const m of b.markDefs) {
          if (m.href && internalPrefixes.some(p => m.href.startsWith(p))) {
            const anchor = b.children?.find(c => c.marks?.includes(m._key))?.text || '?'
            links.push(`"${anchor.substring(0,30)}" -> ${m.href}`)
          }
        }
      }
    }
    console.log(`\n${a.title} (${links.length} internal links):`)
    links.forEach(l => console.log('  ' + l))
  }
}
run().catch(console.error)
