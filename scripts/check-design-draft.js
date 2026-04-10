const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

async function run() {
  // Check both published and draft versions
  const results = await client.fetch(`*[slug.current == "what-will-the-ps6-look-like"]{_id, _type, title, slug, "hasDraft": _id in path("drafts.**")}`)
  console.log('All versions:', JSON.stringify(results, null, 2))
  
  // Check for validation issues on the draft
  const draft = await client.fetch(`*[_id == "drafts.article-4445"][0]{_id, title, body[]{_type, _key}}`)
  if (draft) {
    console.log('\nDraft body block types:')
    draft.body?.forEach((b, i) => console.log(`  [${i}] _type:${b._type} _key:${b._key}`))
  }
}
run().catch(console.error)
