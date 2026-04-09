import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {resolve} from 'path'

try {
  const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
} catch (e) {
  try {
    const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=')
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
    })
  } catch (e2) {}
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
})

function gk() { return Math.random().toString(36).substr(2, 9) }

const internalLinks = {
  'PS6 specifications': '/articles/ps6-specs',
  'PS6 specs': '/articles/ps6-specs',
  'GTA 6': '/articles/gta6-release',
  'GTA VI': '/articles/gta6-release',
  'PS6 cost': '/articles/ps6-cost',
  'PS6 price': '/articles/ps6-cost',
  'disc drive': '/articles/ps6-disc-drive',
  'PS6 design': '/articles/what-will-the-ps6-look-like',
  'what the PS6 will look like': '/articles/what-will-the-ps6-look-like',
  'PS6 launch': '/articles/how-to-prepare-for-the-ps6-launch',
  'prepare for the PS6': '/articles/how-to-prepare-for-the-ps6-launch',
  'PS6 early specs': '/articles/ps6-early-specs-leak-amd-power-promises-8k-gaming-at-60-fps',
}

const externalLinks = {
  'Sony': 'https://www.playstation.com/',
  'AMD': 'https://www.amd.com/',
  'RDNA': 'https://www.amd.com/en/technologies/rdna',
  'Rockstar Games': 'https://www.rockstargames.com/',
  'Unreal Engine 5': 'https://www.unrealengine.com/',
  'ray tracing': 'https://en.wikipedia.org/wiki/Ray_tracing_(graphics)',
  'PSVR2': 'https://www.playstation.com/en-us/ps-vr2/',
  'PSVR 2': 'https://www.playstation.com/en-us/ps-vr2/',
  'DualSense': 'https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/',
  'PlayStation 5': 'https://www.playstation.com/en-us/ps5/',
  'PS5': 'https://www.playstation.com/en-us/ps5/',
  'Digital Foundry': 'https://www.eurogamer.net/digitalfoundry',
  'TechRadar': 'https://www.techradar.com/',
  'Zen 5': 'https://www.amd.com/en/processors/zen',
  'GDDR7': 'https://en.wikipedia.org/wiki/GDDR7_SDRAM',
  'SSD': 'https://en.wikipedia.org/wiki/Solid-state_drive',
}

function getText(block) {
  return (block.children?.map(c => c.text).join('') || '').trim()
}

const bulletPattern = /^([A-Z][A-Za-z0-9 &\-\/,'()]{1,60}):\s+\S/

function makeBullet(text, existingMarkDefs) {
  const match = text.match(/^([A-Z][A-Za-z0-9 &\-\/,'()]{1,60}):\s+/)
  if (!match) return null
  const label = match[1] + ':'
  const rest = text.substring(match[0].length)
  return {
    _type: 'block',
    _key: gk(),
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    children: [
      { _type: 'span', _key: gk(), text: label + ' ', marks: ['strong'] },
      { _type: 'span', _key: gk(), text: rest, marks: [] }
    ],
    markDefs: existingMarkDefs || []
  }
}

function fixArticle(body, articleSlug) {
  let blocks = [...body]
  
  // STEP 1: Fix wrong h2 headings that are actually paragraphs
  blocks = blocks.map(block => {
    if (block.style === 'h2') {
      const text = getText(block)
      if (
        text.length > 80 ||
        text.includes('.') ||
        /^(Industry|Many|Opinions|Several|Expect|The|A |Some|While|Although|With|In |It |As |For |This )/i.test(text)
      ) {
        return { ...block, style: 'normal' }
      }
    }
    return block
  })
  
  // STEP 2: Convert label-colon paragraphs to bullets
  // Strategy: If a paragraph ends with ":" and next paragraph matches "Label: desc", that's a bullet list
  let result = []
  let i = 0
  
  while (i < blocks.length) {
    const block = blocks[i]
    const text = getText(block)
    
    // Check if this is a normal paragraph (or one after intro ending with ":")
    if (block.style === 'normal' && !block.listItem) {
      
      // Consecutive "Label: desc" check (2+ in a row)
      if (bulletPattern.test(text)) {
        let count = 1
        let j = i + 1
        while (j < blocks.length) {
          const next = blocks[j]
          const nextText = getText(next)
          if (next.style === 'normal' && !next.listItem && bulletPattern.test(nextText)) {
            count++; j++
          } else break
        }
        
        if (count >= 2) {
          for (let k = i; k < i + count; k++) {
            const b = blocks[k]
            const bText = getText(b)
            const bullet = makeBullet(bText, b.markDefs)
            result.push(bullet || b)
          }
          i += count
          continue
        }
      }
      
      // Single "Label: desc" after intro paragraph ending with ":"
      if (bulletPattern.test(text) && i > 0) {
        const prev = result[result.length - 1]
        const prevText = getText(prev)
        if (prevText.endsWith(':')) {
          const bullet = makeBullet(text, block.markDefs)
          if (bullet) {
            result.push(bullet)
            // Also check next blocks
            let j = i + 1
            while (j < blocks.length) {
              const next = blocks[j]
              const nextText = getText(next)
              if (next.style === 'normal' && !next.listItem && bulletPattern.test(nextText)) {
                const nextBullet = makeBullet(nextText, next.markDefs)
                result.push(nextBullet || next)
                j++
              } else break
            }
            i = j
            continue
          }
        }
      }
    }
    
    result.push(block)
    i++
  }
  
  // STEP 3: Fix Sources section
  const sourcesIdx = result.findIndex(b => {
    const text = getText(b)
    return (b.style === 'h2' || b.style === 'h3') && /^sources?$/i.test(text)
  })
  
  if (sourcesIdx >= 0 && sourcesIdx < result.length - 1) {
    const sourcesBlock = result[sourcesIdx + 1]
    if (!sourcesBlock.listItem) {
      const text = getText(sourcesBlock)
      const sources = text.split(/\n{2,}|\s{4,}/).map(s => s.trim()).filter(s => s.length > 2)
      
      if (sources.length > 1) {
        const newBlocks = result.slice(0, sourcesIdx + 1)
        for (const source of sources) {
          const clean = source.replace(/^[-–•]\s*/, '').trim()
          if (!clean) continue
          newBlocks.push({
            _type: 'block', _key: gk(), style: 'normal', listItem: 'bullet', level: 1,
            children: [{ _type: 'span', _key: gk(), text: clean, marks: [] }],
            markDefs: []
          })
        }
        result = [...newBlocks, ...result.slice(sourcesIdx + 2)]
      }
    }
  }
  
  // STEP 4: Add links
  const linkedKeywords = new Set()
  const allLinks = { ...internalLinks, ...externalLinks }
  
  result = result.map(block => {
    if (!block.children || block.style?.startsWith('h')) return block
    if (block.markDefs && block.markDefs.length > 0) return block
    
    const fullText = block.children.map(c => c.text).join('')
    let matches = []
    
    for (const [keyword, href] of Object.entries(allLinks)) {
      if (linkedKeywords.has(keyword)) continue
      if (href.includes(articleSlug) && !href.startsWith('http')) continue
      
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      const m = regex.exec(fullText)
      if (m) matches.push({ keyword, href, index: m.index, length: m[0].length, matchedText: m[0] })
    }
    
    if (!matches.length) return block
    matches.sort((a, b) => a.index - b.index)
    const selected = matches.slice(0, 2)
    
    let newChildren = []
    let newMarkDefs = [...(block.markDefs || [])]
    let cursor = 0
    
    for (const sel of selected) {
      linkedKeywords.add(sel.keyword)
      if (sel.index > cursor) {
        newChildren.push({ _type: 'span', _key: gk(), text: fullText.substring(cursor, sel.index), marks: [] })
      }
      const linkKey = gk()
      newMarkDefs.push({ _type: 'link', _key: linkKey, href: sel.href })
      newChildren.push({ _type: 'span', _key: gk(), text: sel.matchedText, marks: [linkKey] })
      cursor = sel.index + sel.length
    }
    
    if (cursor < fullText.length) {
      newChildren.push({ _type: 'span', _key: gk(), text: fullText.substring(cursor), marks: [] })
    }
    
    return { ...block, children: newChildren, markDefs: newMarkDefs }
  })
  
  // STEP 5: Remove empty blocks
  result = result.filter(b => {
    if (!b.children) return true
    return getText(b).length > 0
  })
  
  return result
}

async function run() {
  console.log('=== Final Fix V2: Full Article Processing ===\n')
  
  const articles = await sanityClient.fetch(
    `*[_type == "article"] { _id, title, "slug": slug.current, body }`
  )
  
  console.log(`Processing ${articles.length} articles...\n`)
  
  for (const article of articles) {
    console.log(`Processing: ${article.title}`)
    const fixed = fixArticle(article.body || [], article.slug)
    
    const hasList = fixed.some(b => b.listItem)
    const hasLink = fixed.some(b => b.markDefs?.length > 0)
    
    console.log(`  Blocks: ${(article.body||[]).length} → ${fixed.length} | Lists: ${hasList} | Links: ${hasLink}`)
    
    try {
      await sanityClient.patch(article._id).set({ body: fixed }).commit()
      console.log(`  ✓ Updated`)
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
    }
  }
  
  console.log(`\n=== Done ===`)
}

run()
