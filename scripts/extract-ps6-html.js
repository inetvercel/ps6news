const fs = require('fs')

const html = fs.readFileSync('C:/Users/james/Downloads/ps6.html', 'utf8')

// Extract text from the article/conversation — strip all tags, decode entities
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s{2,}/g, '\n')
  .trim()

const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 40)

lines.slice(0, 80).forEach((l, i) => console.log(i + ': ' + l.substring(0, 200)))
