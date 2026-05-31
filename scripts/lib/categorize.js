/**
 * Shared category detection for PS6News articles.
 * Maps an article's text (title + excerpt + body) to one of the site's
 * category slugs. Order matters — the first matching rule wins.
 *
 * Available category slugs in Sanity:
 *   rumors-leaks, announcements, hardware, games, news (fallback)
 */

// Keyword patterns per category (global flag so we can count matches).
// A title match counts far more than a body match, because almost every PS6
// article mentions "rumour/leak/speculation" somewhere in the body — only the
// title reliably signals what a piece is primarily about.
const CATEGORY_PATTERNS = {
  hardware: /\b(spec|specs|specification|specifications|chip|chipset|apu|gpu|cpu|amd|teraflop|teraflops|tflop|tflops|ssd|ram|ddr\d?|memory|disc drive|controller|dualsense|cooling|thermal|price|pricing|cost|costs|\$\d|release date|launch date|hardware|design|backwards? compatib\w*|ray tracing|resolution|8k|4k|fps|benchmark|wattage|teardown)\b/gi,
  games: /\b(gameplay|games|exclusive|exclusives|gta\s?6|grand theft auto|naughty dog|insomniac|fromsoftware|franchise|sequel|first light|launch title|launch lineup|line[- ]?up|remake|remaster|rpg|open[- ]world|playgo|smart delivery|backlog|library)\b/gi,
  announcements: /\b(announce|announced|announcement|announces|confirm|confirmed|confirms|official|officially|reveal|revealed|reveals|unveil|unveiled|unveils|state of play|press release|showcase|now available|out now)\b/gi,
  'rumors-leaks': /\b(leak|leaked|leaks|rumour|rumours|rumor|rumors|rumoured|rumored|insider|allegedly|reportedly|speculation|speculations|speculative|unconfirmed|tipster|codename|secret|patent)\b/gi,
}

// Tie-break order when scores are equal (earlier = preferred).
const PRIORITY = ['hardware', 'games', 'announcements', 'rumors-leaks']

const TITLE_WEIGHT = 3
const BODY_CAP = 3 // cap body matches per category to avoid flooding

function countMatches(re, text) {
  const m = String(text || '').match(re)
  return m ? m.length : 0
}

/**
 * Returns the best-matching category slug, weighting the title heavily.
 * Can be called as detectCategorySlug(title, bodyText) or detectCategorySlug(fullText).
 * Defaults to 'news' when no category scores above zero.
 * @param {string} title
 * @param {string} [bodyText]
 * @returns {string} category slug
 */
function detectCategorySlug(title, bodyText) {
  const t = bodyText === undefined ? '' : String(title || '')
  const b = bodyText === undefined ? String(title || '') : String(bodyText || '')

  let best = 'news'
  let bestScore = 0

  for (const slug of PRIORITY) {
    const re = CATEGORY_PATTERNS[slug]
    const titleHits = countMatches(re, t)
    const bodyHits = Math.min(countMatches(re, b), BODY_CAP)
    const score = titleHits * TITLE_WEIGHT + bodyHits
    if (score > bestScore) {
      bestScore = score
      best = slug
    }
  }

  return best
}

module.exports = { detectCategorySlug, CATEGORY_PATTERNS }
