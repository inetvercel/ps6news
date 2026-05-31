/**
 * Shared SEO meta generation. Produces an SEO-optimised meta title + description
 * for an article using OpenAI, following strict length/structure rules.
 *
 * Used by the /api/seo/generate route (manual re-gen button in Studio) and by
 * the auto-publisher (so every new article ships with great meta tags).
 */

const BRAND = 'PS6News'

function clamp(s, max) {
  if (!s) return s
  s = String(s).trim()
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s
}

function buildPrompt({ title, excerpt, body }) {
  return `You are an expert SEO copywriter for "${BRAND}" (ps6news.com), a PlayStation 6 news site.
Write SEO meta tags for the article below. Follow these rules EXACTLY:

META TITLE:
- 50-60 characters total (hard limit 60).
- Put the PRIMARY KEYWORD first, then a value proposition, then the brand last as " | ${BRAND}".
- Compelling and specific. No clickbait, no quotes.

META DESCRIPTION:
- 150-160 characters (hard limit 160).
- Keyword-rich summary that precisely describes the content.
- Include an emotional hook or clear call-to-action to maximise click-through.
- One to two sentences, natural language, no quotes.

Both must be UNIQUE and accurately describe the content.

ARTICLE TITLE: "${title}"
${excerpt ? `EXCERPT: "${excerpt}"` : ''}
${body ? `CONTENT: "${String(body).slice(0, 1500)}"` : ''}

Respond as JSON only, no markdown:
{"metaTitle": "...", "metaDescription": "..."}`
}

/**
 * @param {import('openai').OpenAI} openai initialised OpenAI client
 * @param {{title:string, excerpt?:string, body?:string}} input
 * @returns {Promise<{metaTitle:string, metaDescription:string}>}
 */
async function generateSeo(openai, input) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(input) }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })
  const content = completion.choices?.[0]?.message?.content?.trim() || ''
  const parsed = JSON.parse(content)
  if (!parsed.metaTitle || !parsed.metaDescription) {
    throw new Error('AI response missing metaTitle/metaDescription')
  }
  return {
    metaTitle: clamp(parsed.metaTitle, 65),
    metaDescription: clamp(parsed.metaDescription, 165),
  }
}

module.exports = { generateSeo, buildPrompt }
