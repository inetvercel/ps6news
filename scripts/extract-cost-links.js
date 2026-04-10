const fs = require('fs')
const html = fs.readFileSync('C:/Users/james/Downloads/How Much Will the PS6 Cost Content.html', 'utf8')
const re = /href="(https?:\/\/[^"]+)"/g
const s = new Set()
let m
while ((m = re.exec(html)) !== null) {
  const u = m[1]
  if (!u.includes('chatgpt') && !u.includes('openai') && !u.includes('cdn.') && !u.includes('favicon') && !u.includes('google') && !u.includes('w3.org')) s.add(u)
}
;[...s].forEach((u,i) => console.log(i + ': ' + u))
