const fs = require('fs')
const html = fs.readFileSync('C:/Users/james/Downloads/discdriveps6Content.html', 'utf8')

// Extract external links
const linkRe = /href="(https?:\/\/[^"]+)"/g
const links = new Set()
let m
while ((m = linkRe.exec(html)) !== null) {
  const url = m[1]
  if (!url.includes('chatgpt.com') && !url.includes('openai.com') && !url.includes('cdn.') && !url.includes('favicon')) {
    links.add(url)
  }
}
console.log('=== EXTERNAL LINKS ===')
;[...links].forEach((l, i) => console.log(i + ': ' + l))

// Clean text
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<table[\s\S]*?<\/table>/gi, '[TABLE]')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s{2,}/g, '\n').trim()

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 30)
console.log('\n=== ALL TEXT LINES ===')
lines.forEach((l, i) => console.log(i + ': ' + l.substring(0, 250)))
