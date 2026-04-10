const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',useCdn:false})

client.fetch('*[_type == "article" && slug.current == "ps6-design-concept-predictions"][0]{body}').then(r => {
  const kt = r.body.find(b => b._type === 'keyTakeaways')
  console.log('keyTakeaways block:', JSON.stringify(kt, null, 2))
  console.log('\nAll block types:', r.body.map(b => b._type))
}).catch(console.error)
