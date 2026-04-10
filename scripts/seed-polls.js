const {createClient} = require('@sanity/client')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

function key() { return Math.random().toString(36).substr(2, 9) }

const polls = [
  {
    articleId: 'article-4487',
    question: 'Which PS6 spec are you most excited about?',
    options: ['8K gaming at high frame rates', 'Ultra-fast SSD loading', 'Advanced ray tracing', 'Full backwards compatibility'],
  },
  {
    articleId: 'article-4480',
    question: 'Should the PS6 include a disc drive as standard?',
    options: ['Yes — always include it', 'Optional add-on is fine', 'No — go fully digital', 'Don\'t mind either way'],
  },
  {
    articleId: 'article-4475',
    question: 'How much would you pay for the PS6 at launch?',
    options: ['Up to £400', '£400–£500', '£500–£600', 'Price doesn\'t matter to me'],
  },
  {
    articleId: 'article-4465',
    question: 'Will GTA 6 be a PS6 launch title?',
    options: ['Yes, Sony will secure it', 'No — PS5 only at first', 'Available on both', 'GTA 6 won\'t make launch'],
  },
  {
    articleId: 'article-4445',
    question: 'What PS6 design style would you prefer?',
    options: ['Sleek & minimalist', 'Bold & futuristic', 'Similar to PS5', 'Compact & portable'],
  },
  {
    articleId: 'article-4416',
    question: 'Are you ready for the PS6 launch?',
    options: ['Already saving up!', 'Need to know the price first', 'Waiting to see the games lineup', 'Still happy with PS5'],
  },
  {
    articleId: 'article-4391',
    question: 'What PS6 early spec rumour excites you most?',
    options: ['AMD-powered 8K graphics', 'Massive performance leap over PS5', 'AI-driven gameplay features', 'Next-gen DualSense controller'],
  },
]

async function run() {
  const articles = await client.fetch(`*[_type=="article" && !(_id in path("drafts.**"))]{_id,title}`)
  const idMap = {}
  articles.forEach(a => { idMap[a._id] = a.title })

  for (const p of polls) {
    const existing = await client.fetch(
      `*[_type=="poll" && article._ref == $id][0]._id`,
      {id: p.articleId}
    )
    if (existing) {
      console.log(`⏭  Skip "${idMap[p.articleId] || p.articleId}" — poll exists`)
      continue
    }
    try {
      await client.create({
        _type: 'poll',
        question: p.question,
        options: p.options.map(text => ({_type:'object', _key:key(), text, votes:0})),
        article: {_type:'reference', _ref: p.articleId},
        totalVotes: 0,
      })
      console.log(`✅ Created: "${p.question}"`)
    } catch(err) {
      console.error(`❌ Failed for ${p.articleId}:`, err.message)
    }
  }
  console.log('\nDone!')
}

run().catch(console.error)
