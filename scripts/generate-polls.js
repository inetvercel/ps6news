import {createClient} from '@sanity/client'
import OpenAI from 'openai'
import {readFileSync} from 'fs'
import {resolve} from 'path'

// Load env
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch (e) {}
try {
  const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch (e) {}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function generatePollForArticle(article) {
  const prompt = `Generate a fun, engaging poll question for a gaming news article about PlayStation 6. The poll should be relevant to the article topic and have exactly 4 answer options that readers would want to vote on.

Article Title: "${article.title}"
${article.excerpt ? `Article Summary: "${article.excerpt.substring(0, 300)}"` : ''}

Respond in this exact JSON format only, no other text:
{"question": "Your poll question here?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"]}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{role: 'user', content: prompt}],
    temperature: 0.8,
    max_tokens: 200,
  })

  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) throw new Error('No response from OpenAI')

  return JSON.parse(content)
}

async function run() {
  console.log('=== Generating Polls for All Articles ===\n')

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY not set in .env or .env.local')
    console.error('Add OPENAI_API_KEY=sk-your-key to your .env file')
    process.exit(1)
  }

  const articles = await sanityClient.fetch(
    `*[_type == "article"] { _id, title, excerpt }`
  )

  console.log(`Found ${articles.length} articles\n`)

  // Check which articles already have polls
  const existingPolls = await sanityClient.fetch(
    `*[_type == "poll"] { "articleId": article._ref }`
  )
  const articlesWithPolls = new Set(existingPolls.map(p => p.articleId))

  let created = 0
  let skipped = 0

  for (const article of articles) {
    if (articlesWithPolls.has(article._id)) {
      console.log(`⏭ Skipped (already has poll): ${article.title}`)
      skipped++
      continue
    }

    try {
      console.log(`🤖 Generating poll for: ${article.title}`)
      const pollData = await generatePollForArticle(article)

      await sanityClient.create({
        _type: 'poll',
        question: pollData.question,
        options: pollData.options.map(text => ({
          _type: 'object',
          _key: Math.random().toString(36).substr(2, 9),
          text,
          votes: 0,
        })),
        article: {
          _type: 'reference',
          _ref: article._id,
        },
        totalVotes: 0,
      })

      console.log(`  ✓ Poll: "${pollData.question}"`)
      created++

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
    }
  }

  console.log(`\n=== Done: ${created} created, ${skipped} skipped ===`)
}

run()
