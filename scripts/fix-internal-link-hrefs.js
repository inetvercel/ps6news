const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

async function run() {
  const articles = await client.fetch(`*[_type=="article" && !(_id in path("drafts.**"))]{_id,title,body}`)
  let total = 0
  for (const article of articles) {
    let changed = false
    const body = (article.body || []).map(block => {
      if (block._type !== 'block' || !block.markDefs?.length) return block
      const newDefs = block.markDefs.map(m => {
        if (m._type === 'link' && m.href?.startsWith('/articles/')) {
          changed = true
          return {...m, href: m.href.replace('/articles/', '/')}
        }
        return m
      })
      return {...block, markDefs: newDefs}
    })
    if (changed) {
      await client.patch(article._id).set({body}).commit()
      total++
      console.log(`✅ ${article.title}`)
    }
  }
  console.log(`\nDone — updated ${total} articles`)
}
run().catch(console.error)
