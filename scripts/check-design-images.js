const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

async function run() {
  const draft = await client.fetch(`*[_id == "drafts.article-4445"][0]`)
  
  // Check excerpt length
  console.log('Excerpt length:', draft.excerpt?.length, '| value:', draft.excerpt)
  
  // Check image blocks
  const images = draft.body?.filter(b => b._type === 'image')
  console.log('\nImage blocks:')
  images?.forEach((img, i) => {
    console.log(`  [${i}] _key:${img._key}`)
    console.log(`       asset:`, JSON.stringify(img.asset))
    console.log(`       alt:`, img.alt)
  })
  
  // Check for any blocks with missing _key
  const missingKeys = draft.body?.filter(b => !b._key)
  console.log('\nBlocks missing _key:', missingKeys?.length || 0)
}
run().catch(console.error)
