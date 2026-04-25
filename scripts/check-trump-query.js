const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})
client.fetch(`*[_type=="article" && slug.current=="has-trump-delayed-ps6"][0]{
  body[]{
    ...,
    _type == "image" => {
      ...,
      asset->{ _id, url }
    }
  }
}`)
  .then(r => {
    const imageBlocks = r.body.filter(b => b._type === 'image')
    console.log('Resolved image blocks:', JSON.stringify(imageBlocks, null, 2))
  })
  .catch(console.error)
