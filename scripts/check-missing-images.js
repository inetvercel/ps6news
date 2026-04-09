const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

client.fetch(`*[_type=="article"] | order(publishedAt desc) [0...20] {
  _id, title,
  mainImage { asset->{ _id, url } }
}`).then(articles => {
  articles.forEach(a => {
    const url = a.mainImage?.asset?.url
    console.log(url ? '✅' : '❌', a.title?.slice(0, 60), '|', url || 'NO URL')
  })
}).catch(console.error)
