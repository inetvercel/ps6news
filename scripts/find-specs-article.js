const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

client.fetch(`*[_type == "article" && slug.current match "ps6-spec*"]{_id,title,slug,publishedAt}`)
  .then(r => console.log(JSON.stringify(r,null,2)))
  .catch(console.error)
