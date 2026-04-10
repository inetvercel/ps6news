const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

const ids = ['article-4391','article-4416','article-4445','article-4465','article-4475','article-4480','article-4487']

async function run() {
  for (const id of ids) {
    const a = await client.fetch(`*[_id=="${id}"][0]{_id,title,body}`)
    console.log(`\n\n===== ${a._id} | ${a.title} =====`)
    a.body.forEach((b,i) => {
      if (b._type === 'block') {
        const text = b.children?.map(c=>c.text).join('').substring(0,120)
        console.log(`[${i}] ${b.style} | ${text}`)
      } else {
        console.log(`[${i}] TYPE:${b._type}`)
      }
    })
  }
}
run().catch(console.error)
