const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

client.fetch(`*[_type == "article" && (title match "PS6 Cost*" || slug.current match "*cost*" || slug.current match "*price*")]{_id,title,slug,updatedAt}`)
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
