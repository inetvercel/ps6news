const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',useCdn:false})

client.fetch('*[_type == "article" && slug.current == "what-will-the-ps6-look-like"][0]{_id, title, slug, body}').then(r => {
  if (!r) { console.log('No article found with that slug'); return }
  console.log('ID:', r._id)
  console.log('Title:', r.title)
  const kt = r.body?.find(b => b._type === 'keyTakeaways')
  console.log('Has keyTakeaways:', !!kt)
  console.log('Block types:', r.body?.map(b => b._type))
}).catch(console.error)
