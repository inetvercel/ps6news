const {createClient} = require('@sanity/client')
const {GoogleGenerativeAI} = require('@google/generative-ai')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API)

async function generatePoll(article) {
  const prompt = `Generate a fun, engaging poll question for a gaming news article. The poll should be relevant to the article topic and have exactly 4 answer options.

Article Title: "${article.title}"
${article.excerpt ? `Article Summary: "${article.excerpt.substring(0, 300)}"` : ''}

Respond in this exact JSON format only, no markdown, no other text:
{"question": "Your poll question here?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"]}`

  const model = genAI.getGenerativeModel({model: 'gemini-2.0-flash'})
  const result = await model.generateContent(prompt)
  const content = result.response.text().trim()
  const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(cleaned)
}

async function run() {
  const articles = await client.fetch(
    `*[_type == "article" && !(_id in path("drafts.**"))] | order(publishedAt desc) { _id, title, excerpt }`
  )
  console.log(`Found ${articles.length} articles\n`)

  for (const article of articles) {
    // Check if poll already exists
    const existing = await client.fetch(
      `*[_type == "poll" && article._ref == $id][0]._id`,
      {id: article._id}
    )
    if (existing) {
      console.log(`⏭  Skip: "${article.title}" — poll exists`)
      continue
    }

    try {
      const pollData = await generatePoll(article)
      await client.create({
        _type: 'poll',
        question: pollData.question,
        options: pollData.options.map((text) => ({
          _type: 'object',
          _key: Math.random().toString(36).substr(2, 9),
          text,
          votes: 0,
        })),
        article: {_type: 'reference', _ref: article._id},
        totalVotes: 0,
      })
      console.log(`✅ Created poll for: "${article.title}"`)
      console.log(`   Q: ${pollData.question}\n`)
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`❌ Failed for "${article.title}":`, err.message)
    }
  }
  console.log('\nDone!')
}

run().catch(console.error)
