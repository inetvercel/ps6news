const { createClient } = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

let _k = 1
function key() { return 'tp' + (_k++).toString().padStart(4, '0') }

async function run() {
  const article = await client.fetch(`*[_id=="article-4391"][0]{_id,title,body}`)
  console.log('Blocks:')
  article.body.forEach((b,i) => {
    if (b._type === 'block') {
      const text = b.children?.map(c=>c.text).join('')
      console.log(`[${i}] ${b.style} | children:${b.children?.length} | "${text.substring(0,120)}"`)
    } else {
      console.log(`[${i}] TYPE:${b._type}`)
    }
  })
}
run().catch(console.error)
