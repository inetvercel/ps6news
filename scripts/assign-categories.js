const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

// Categories: news, rumors-leaks, hardware, games, announcements, other
// Articles mapped to best-fit category
const assignments = [
  // PS6 Specs, Rumors and News — hardware specs/rumours
  { id: 'article-4487', category: 'category-27' }, // hardware

  // Will the PS6 Have a Disc Drive? — hardware rumour
  { id: 'article-4480', category: 'category-27' }, // hardware

  // How Much Will the PS6 Cost? — rumors/leaks (price speculation)
  { id: 'article-4475', category: 'category-26' }, // rumors-leaks

  // PS6 and GTA 6 — games
  { id: 'article-4465', category: 'category-28' }, // games

  // What Will the PS6 Look Like? — hardware/design
  { id: 'article-4445', category: 'category-27' }, // hardware

  // How to Prepare for the PS6 Launch — news
  { id: 'article-4416', category: 'category-news' }, // news

  // PS6 Early Specs Leak — rumors-leaks
  { id: 'article-4391', category: 'category-26' }, // rumors-leaks
]

async function run() {
  // Print category map for confirmation
  const cats = await client.fetch('*[_type=="category"]{_id,title,"slug":slug.current}')
  const catMap = {}
  cats.forEach(c => { catMap[c._id] = `${c.title} (${c.slug})` })
  console.log('Categories:', catMap, '\n')

  for (const a of assignments) {
    await client.patch(a.id).set({category: {_type:'reference', _ref: a.category}}).commit()
    console.log(`✅ ${a.id} → ${catMap[a.category]}`)
  }
  console.log('\nDone!')
}

run().catch(console.error)
