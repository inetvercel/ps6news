const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

client.fetch(`*[_type == "article" && slug.current == "ps6-price"][0]{_id,title,slug,updatedAt,body}`).then(r => {
  if (!r) { console.log('Not found by ps6-price slug'); return }
  console.log('ID:', r._id)
  console.log('Title:', r.title)
  console.log('UpdatedAt:', r.updatedAt)
  console.log('Block types:', r.body?.map(b => b._type))
}).catch(console.error)
