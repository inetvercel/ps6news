const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

client.delete('drafts.article-4475')
  .then(() => console.log('✅ Draft deleted — published version is now live'))
  .catch(console.error)
