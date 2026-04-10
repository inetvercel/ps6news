const fs = require('fs')
const html = fs.readFileSync('C:/Users/james/Downloads/discdriveps6Content.html', 'utf8')

// Extract table HTML
const tableMatch = html.match(/<table[\s\S]*?<\/table>/i)
if (tableMatch) {
  const tableText = tableMatch[0]
    .replace(/<tr[^>]*>/gi, '\nROW: ')
    .replace(/<\/tr>/gi, '')
    .replace(/<th[^>]*>/gi, ' | ')
    .replace(/<td[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s{2,}/g, ' ').trim()
  console.log('=== TABLE ===')
  console.log(tableText)
}

// Links
const linkRe = /href="(https?:\/\/[^"#]+)"/g
const links = new Set()
let m
while ((m = linkRe.exec(html)) !== null) {
  const url = m[1]
  if (!url.includes('chatgpt.com') && !url.includes('openai.com') && !url.includes('cdn.') && !url.includes('favicon') && !url.includes('google')) {
    links.add(url)
  }
}
console.log('\n=== LINKS ===')
;[...links].slice(0,15).forEach((l,i) => console.log(i+': '+l))

// First 20 lines
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
  .replace(/<table[\s\S]*?<\/table>/gi,'[TABLE]').replace(/<[^>]+>/g,' ')
  .replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"')
  .replace(/\s{2,}/g,'\n').trim()
const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>30)
console.log('\n=== FIRST 20 LINES ===')
lines.slice(0,20).forEach((l,i)=>console.log(i+': '+l.substring(0,250)))
