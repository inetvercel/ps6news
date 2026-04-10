const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

client.delete('article-4461')
  .then(() => console.log('✅ Deleted article-4461 (ps6-design-concept-predictions)'))
  .catch(console.error)
