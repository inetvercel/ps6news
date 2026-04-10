const fs = require('fs')
const html = fs.readFileSync('C:/Users/james/Downloads/ps6.html', 'utf8')

// Extract all external href links
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

// First 15 lines of clean text (start of article)
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s{2,}/g, '\n').trim()

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 40)
console.log('\n=== FIRST 15 LINES ===')
lines.slice(0, 15).forEach((l, i) => console.log(i + ': ' + l.substring(0, 300)))
