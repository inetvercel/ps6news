const fs = require('fs')
const html = fs.readFileSync('C:/Users/james/Downloads/How Much Will the PS6 Cost Content.html', 'utf8')

// Extract external links with surrounding text
const linkRe = /href="(https?:\/\/[^"#]+)"[^>]*>([^<]{1,80})/g
const links = []
let m
while ((m = linkRe.exec(html)) !== null) {
  const url = m[1], text = m[2].trim()
  if (!url.includes('chatgpt.com') && !url.includes('openai.com') && !url.includes('cdn.') && !url.includes('favicon') && !url.includes('google') && !url.includes('w3.org')) {
    links.push({ url, text })
  }
}
console.log('=== LINKS WITH ANCHOR TEXT ===')
links.slice(0,20).forEach((l,i) => console.log(i+': ['+l.text+'] -> '+l.url))

// Tables
const tableRe = /<table[\s\S]*?<\/table>/gi
let tm, tIdx = 0
while ((tm = tableRe.exec(html)) !== null) {
  const t = tm[0]
    .replace(/<tr[^>]*>/gi,'\nROW: ').replace(/<\/tr>/gi,'')
    .replace(/<t[hd][^>]*>/gi,' | ').replace(/<[^>]+>/g,'')
    .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s{2,}/g,' ').trim()
  console.log(`\n=== TABLE ${++tIdx} ===\n` + t)
}

// Clean text
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
  .replace(/<table[\s\S]*?<\/table>/gi,'[TABLE]').replace(/<[^>]+>/g,' ')
  .replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\u2011/g,'-').replace(/\u2019/g,"'")
  .replace(/\s{2,}/g,'\n').trim()
const lines = text.split('\n').map(l=>l.trim()).filter(l=>l.length>30)
console.log('\n=== ALL TEXT LINES ===')
lines.forEach((l,i)=>console.log(i+': '+l.substring(0,250)))
