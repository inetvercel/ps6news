const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

async function run() {
  // Create the news category
  const cat = await client.createOrReplace({
    _id: 'category-news',
    _type: 'category',
    title: 'News',
    slug: {_type: 'slug', current: 'news'},
    description: 'The latest PlayStation 6 news, announcements and updates.',
  })
  console.log('✅ Created category:', cat._id, '|', cat.title)

  // Assign all articles to news category (they are all news articles)
  const articles = await client.fetch(
    '*[_type == "article" && !(_id in path("drafts.**"))]{_id, title, "cat": category->slug.current}'
  )

  console.log(`\nFound ${articles.length} articles — assigning to News category:`)
  for (const a of articles) {
    await client.patch(a._id).set({
      category: {_type: 'reference', _ref: 'category-news'}
    }).commit()
    console.log(`  ✅ ${a.title}`)
  }
  console.log('\nDone!')
}

run().catch(console.error)
