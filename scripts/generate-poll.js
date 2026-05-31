/**
 * Generate an AI poll for an article and store it in Sanity.
 * Usage: node scripts/generate-poll.js <slug>
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')
const OpenAI = require('openai').default || require('openai')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'zzzwo1aw',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function randomKey() {
  return Math.random().toString(36).substr(2, 9)
}

async function generatePollFor(article) {
  const existing = await sanity.fetch(`*[_type == "poll" && article._ref == $id][0]._id`, { id: article._id })
  if (existing) {
    console.log(`  ⏭️  ${article.slug} — poll already exists`)
    return false
  }
  const prompt = `Generate a fun, engaging poll question for a gaming news article. The poll should be relevant to the article topic and have exactly 4 answer options.

Article Title: "${article.title}"
${article.excerpt ? `Article Summary: "${String(article.excerpt).substring(0, 300)}"` : ''}

Respond in this exact JSON format only, no markdown, no other text:
{"question": "Your poll question here?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"]}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })
  const data = JSON.parse(completion.choices[0].message.content.trim())
  await sanity.create({
    _type: 'poll',
    question: data.question,
    options: data.options.map((text) => ({ _type: 'object', _key: randomKey(), text, votes: 0 })),
    article: { _type: 'reference', _ref: article._id },
    totalVotes: 0,
  })
  console.log(`  ✅ ${article.slug} — poll created: "${data.question}"`)
  return true
}

async function run() {
  const slug = process.argv[2]
  const filter = slug ? `_type == "article" && slug.current == $slug` : `_type == "article"`
  const articles = await sanity.fetch(
    `*[${filter}]{_id, title, excerpt, "slug": slug.current}`,
    slug ? { slug } : {}
  )
  if (!articles.length) {
    console.log('No matching articles found.')
    return
  }
  for (const a of articles) {
    try {
      await generatePollFor(a)
    } catch (e) {
      console.warn(`  ⚠️  ${a.slug} — failed: ${e.message}`)
    }
  }
}

run().catch((e) => { console.error(e.message); process.exit(1) })
