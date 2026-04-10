const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})
client.fetch('*[_type == "category"] | order(title asc) {_id, title, "slug": slug.current}')
  .then(cats => {
    console.log(`Found ${cats.length} categories:`)
    cats.forEach(c => console.log(c._id, '|', c.slug, '|', c.title))
  })
  .catch(console.error)
