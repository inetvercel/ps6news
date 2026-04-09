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

// Internal link map
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
  'PS6 design concept': '/articles/ps6-design-concept-predictions',
}

// External link map
const externalLinks = {
  'Sony': 'https://www.playstation.com/',
  'AMD': 'https://www.amd.com/',
  'RDNA': 'https://www.amd.com/en/technologies/rdna',
  'Rockstar Games': 'https://www.rockstargames.com/',
  'Unreal Engine 5': 'https://www.unrealengine.com/',
  'Unreal Engine': 'https://www.unrealengine.com/',
  'ray tracing': 'https://en.wikipedia.org/wiki/Ray_tracing_(graphics)',
  'PSVR2': 'https://www.playstation.com/en-us/ps-vr2/',
  'PSVR 2': 'https://www.playstation.com/en-us/ps-vr2/',
  'DualSense': 'https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/',
  'PlayStation 5': 'https://www.playstation.com/en-us/ps5/',
  'PS5': 'https://www.playstation.com/en-us/ps5/',
  'PlayStation Network': 'https://www.playstation.com/en-us/playstation-network/',
  'Digital Foundry': 'https://www.eurogamer.net/digitalfoundry',
  'TechRadar': 'https://www.techradar.com/',
  'Zen 5': 'https://www.amd.com/en/processors/zen',
  'GDDR7': 'https://en.wikipedia.org/wiki/GDDR7_SDRAM',
}

function fixArticle(body, articleSlug) {
  let blocks = [...body]
  
  // STEP 1: Fix wrong h2 style on description paragraphs 
  // (h2 blocks that are actually intro sentences, not titles)
  blocks = blocks.map(block => {
    if (block.style === 'h2') {
      const text = (block.children?.map(c => c.text).join('') || '').trim()
      // If it's long (>80 chars), contains periods, or starts with common sentence starters => not a heading
      if (
        text.length > 80 ||
        text.includes('.') ||
        /^(Industry|Many|Opinions|Several|Expect|The|A |Some|While|Although|With|In |It |As |For )/i.test(text)
      ) {
        return { ...block, style: 'normal' }
      }
    }
    return block
  })
  
  // STEP 2: Convert consecutive "Label: description" paragraphs to bullet lists
  let result = []
  let i = 0
  
  while (i < blocks.length) {
    const block = blocks[i]
    
    if (block.style === 'normal' && !block.listItem) {
      const text = (block.children?.map(c => c.text).join('') || '').trim()
      
      // Pattern: "Capitalized Label: description..."
      const bulletPattern = /^([A-Z][A-Za-z0-9 &\-\/,'()]{1,60}):\s+\S/
      
      if (bulletPattern.test(text)) {
        let count = 1
        let j = i + 1
        while (j < blocks.length) {
          const next = blocks[j]
          if (next.style === 'normal' && !next.listItem) {
            const nextText = (next.children?.map(c => c.text).join('') || '').trim()
            if (bulletPattern.test(nextText)) { count++; j++ }
            else break
          } else break
        }
        
        if (count >= 2) {
          for (let k = i; k < i + count; k++) {
            const b = blocks[k]
            const bText = (b.children?.map(c => c.text).join('') || '').trim()
            const match = bText.match(/^([A-Z][A-Za-z0-9 &\-\/,'()]{1,60}):\s+/)
            
            if (match) {
              const label = match[1] + ':'
              const rest = bText.substring(match[0].length)
              
              result.push({
                _type: 'block',
                _key: gk(),
                style: 'normal',
                listItem: 'bullet',
                level: 1,
                children: [
                  { _type: 'span', _key: gk(), text: label + ' ', marks: ['strong'] },
                  { _type: 'span', _key: gk(), text: rest, marks: [] }
                ],
                markDefs: []
              })
            } else {
              result.push(b)
            }
          }
          i += count
          continue
        }
      }
      
      // Also: "Console Name (Year): description" pattern for pricing history
      const consolePattern = /^(PlayStation \d+|PS\d+)(\s*\([^)]+\))?:\s+/
      if (consolePattern.test(text)) {
        let count = 1
        let j = i + 1
        while (j < blocks.length) {
          const next = blocks[j]
          if (next.style === 'normal' && !next.listItem) {
            const nextText = (next.children?.map(c => c.text).join('') || '').trim()
            if (consolePattern.test(nextText)) { count++; j++ }
            else break
          } else break
        }
        
        if (count >= 2) {
          for (let k = i; k < i + count; k++) {
            const b = blocks[k]
            const bText = (b.children?.map(c => c.text).join('') || '').trim()
            const match = bText.match(/^((?:PlayStation \d+|PS\d+)(?:\s*\([^)]+\))?:\s+)/)
            
            if (match) {
              const label = match[1].trim()
              const rest = bText.substring(match[0].length)
              
              result.push({
                _type: 'block',
                _key: gk(),
                style: 'normal',
                listItem: 'bullet',
                level: 1,
                children: [
                  { _type: 'span', _key: gk(), text: label + ' ', marks: ['strong'] },
                  { _type: 'span', _key: gk(), text: rest, marks: [] }
                ],
                markDefs: []
              })
            } else {
              result.push(b)
            }
          }
          i += count
          continue
        }
      }
    }
    
    result.push(block)
    i++
  }
  
  // STEP 3: Fix Sources section - convert to bullet list with links
  const sourcesIdx = result.findIndex(b => {
    const text = (b.children?.map(c => c.text).join('') || '').trim()
    return (b.style === 'h2' || b.style === 'h3') && /^sources?$/i.test(text)
  })
  
  if (sourcesIdx >= 0 && sourcesIdx < result.length - 1) {
    const sourcesBlock = result[sourcesIdx + 1]
    const text = (sourcesBlock.children?.map(c => c.text).join('') || '').trim()
    
    // Split by double newlines, triple newlines, or long spaces
    const sources = text.split(/\n{2,}|\s{4,}/).map(s => s.trim()).filter(s => s.length > 2)
    
    if (sources.length > 1) {
      // Remove the original paragraph
      const newBlocks = result.slice(0, sourcesIdx + 1)
      
      for (const source of sources) {
        // Clean: remove leading dashes, bullets
        const clean = source.replace(/^[-–•]\s*/, '').trim()
        if (!clean) continue
        
        newBlocks.push({
          _type: 'block',
          _key: gk(),
          style: 'normal',
          listItem: 'bullet',
          level: 1,
          children: [{ _type: 'span', _key: gk(), text: clean, marks: [] }],
          markDefs: []
        })
      }
      
      // Add remaining blocks after sources
      result = [...newBlocks, ...result.slice(sourcesIdx + 2)]
    }
  }
  
  // STEP 4: Add internal and external links (first occurrence only per keyword)
  const linkedKeywords = new Set()
  
  result = result.map(block => {
    if (!block.children || block.style?.startsWith('h')) return block
    if (block.markDefs && block.markDefs.length > 0) return block // Already has links
    
    const fullText = block.children.map(c => c.text).join('')
    
    // Find all matchable keywords
    const allLinks = { ...internalLinks, ...externalLinks }
    let matches = []
    
    for (const [keyword, href] of Object.entries(allLinks)) {
      if (linkedKeywords.has(keyword)) continue
      if (href.includes(articleSlug) && !href.startsWith('http')) continue
      
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      const m = regex.exec(fullText)
      if (m) {
        matches.push({ keyword, href, index: m.index, length: m[0].length, matchedText: m[0] })
      }
    }
    
    if (matches.length === 0) return block
    
    // Pick up to 2 links per block
    matches.sort((a, b) => a.index - b.index)
    const selected = matches.slice(0, 2)
    
    // Build new children with links inserted
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
    const text = b.children.map(c => c.text || '').join('').trim()
    return text.length > 0
  })
  
  return result
}

async function run() {
  console.log('=== Final Article Fix: Bullets, Links, Headings, Sources ===\n')
  
  const articles = await sanityClient.fetch(
    `*[_type == "article"] { _id, title, "slug": slug.current, body }`
  )
  
  console.log(`Processing ${articles.length} articles...\n`)
  
  for (const article of articles) {
    console.log(`Processing: ${article.title}`)
    
    const fixed = fixArticle(article.body || [], article.slug)
    
    const hasList = fixed.some(b => b.listItem)
    const hasLink = fixed.some(b => b.markDefs?.length > 0)
    const wrongH2 = (article.body || []).filter(b => b.style === 'h2').length
    const fixedH2 = fixed.filter(b => b.style === 'h2').length
    
    console.log(`  Blocks: ${(article.body||[]).length} → ${fixed.length} | Lists: ${hasList} | Links: ${hasLink} | H2: ${wrongH2}→${fixedH2}`)
    
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
