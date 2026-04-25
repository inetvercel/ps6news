const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})
client.fetch('*[_type=="article" && slug.current=="has-trump-delayed-ps6"][0]{body}')
  .then(r => {
    const imageBlocks = r.body.filter(b => b._type === 'image')
    console.log('Image blocks:', JSON.stringify(imageBlocks, null, 2))
    console.log('\nAll block types:', r.body.map(b => b._type))
  })
  .catch(console.error)
