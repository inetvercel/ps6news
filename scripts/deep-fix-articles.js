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

function generateKey() {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Detect consecutive "Label: description" paragraphs and convert to bullet lists
 */
function convertLabelParagraphsToBullets(blocks) {
  const result = []
  let i = 0
  
  while (i < blocks.length) {
    const block = blocks[i]
    
    if (block.style === 'normal' && !block.listItem) {
      const text = block.children?.map(c => c.text).join('') || ''
      const bulletPattern = /^([A-Z][A-Za-z0-9 &\-\/,'()]{1,50}):\s+\S/
      
      if (bulletPattern.test(text)) {
        // Count consecutive matching blocks
        let count = 1
        let j = i + 1
        while (j < blocks.length) {
          const next = blocks[j]
          if (next.style === 'normal' && !next.listItem) {
            const nextText = next.children?.map(c => c.text).join('') || ''
            if (bulletPattern.test(nextText)) {
              count++
              j++
            } else break
          } else break
        }
        
        if (count >= 2) {
          for (let k = i; k < i + count; k++) {
            const b = blocks[k]
            const bText = b.children?.map(c => c.text).join('') || ''
            const match = bText.match(/^([A-Z][A-Za-z0-9 &\-\/,'()]{1,50}):\s+/)
            
            if (match) {
              const label = match[1] + ':'
              const rest = bText.substring(match[0].length)
              
              result.push({
                _type: 'block',
                _key: generateKey(),
                style: 'normal',
                listItem: 'bullet',
                level: 1,
                children: [
                  { _type: 'span', _key: generateKey(), text: label + ' ', marks: ['strong'] },
                  { _type: 'span', _key: generateKey(), text: rest, marks: [] }
                ],
                markDefs: []
              })
            } else {
              result.push(b)
            }
          }
          i = i + count
          continue
        }
      }
    }
    
    result.push(block)
    i++
  }
  
  return result
}

/**
 * Remove empty/whitespace-only blocks and fix spacing
 */
function removeEmptyBlocks(blocks) {
  return blocks.filter(block => {
    if (!block.children) return true
    const text = block.children.map(c => c.text || '').join('').trim()
    return text.length > 0
  })
}

/**
 * Add internal links to relevant keywords
 */
function addInternalLinks(blocks, articleSlug) {
  const linkMap = {
    'PS6': { href: '/', pattern: /\bPS6\b/g },
    'PlayStation 6': { href: '/', pattern: /\bPlayStation 6\b/gi },
    'PS6 specs': { href: '/articles/ps6-specs', pattern: /\bPS6 specs\b/gi },
    'PS6 specifications': { href: '/articles/ps6-specs', pattern: /\bPS6 specifications\b/gi },
    'GTA 6': { href: '/articles/gta6-release', pattern: /\bGTA 6\b/gi },
    'GTA VI': { href: '/articles/gta6-release', pattern: /\bGTA VI\b/gi },
    'PS6 cost': { href: '/articles/ps6-cost', pattern: /\bPS6 cost\b/gi },
    'PS6 price': { href: '/articles/ps6-cost', pattern: /\bPS6 price\b/gi },
    'disc drive': { href: '/articles/ps6-disc-drive', pattern: /\bdisc drive\b/gi },
    'PS6 design': { href: '/articles/what-will-the-ps6-look-like', pattern: /\bPS6 design\b/gi },
    'PS6 launch': { href: '/articles/how-to-prepare-for-the-ps6-launch', pattern: /\bPS6 launch\b/gi },
  }
  
  // External links
  const externalLinks = {
    'Sony': { href: 'https://www.playstation.com/', pattern: /\bSony\b/g },
    'PlayStation': { href: 'https://www.playstation.com/', pattern: /\bPlayStation\b(?! [0-9])/gi },
    'AMD': { href: 'https://www.amd.com/', pattern: /\bAMD\b/g },
    'RDNA': { href: 'https://www.amd.com/en/technologies/rdna', pattern: /\bRDNA\b/g },
    'Rockstar Games': { href: 'https://www.rockstargames.com/', pattern: /\bRockstar Games\b/gi },
    'Unreal Engine 5': { href: 'https://www.unrealengine.com/', pattern: /\bUnreal Engine 5\b/gi },
    'ray tracing': { href: 'https://en.wikipedia.org/wiki/Ray_tracing_(graphics)', pattern: /\bray tracing\b/gi },
    'SSD': { href: 'https://en.wikipedia.org/wiki/Solid-state_drive', pattern: /\bSSD\b/g },
    'PSVR2': { href: 'https://www.playstation.com/en-us/ps-vr2/', pattern: /\bPSVR2?\b/gi },
    'DualSense': { href: 'https://www.playstation.com/en-us/accessories/dualsense-wireless-controller/', pattern: /\bDualSense\b/gi },
  }
  
  // Only add 1 link per keyword per article (first occurrence)
  const linkedKeywords = new Set()
  
  return blocks.map(block => {
    if (!block.children || block.style?.startsWith('h')) return block
    
    const text = block.children.map(c => c.text).join('')
    
    // Skip blocks that already have links
    if (block.markDefs && block.markDefs.length > 0) return block
    
    // Try to find a keyword to link
    let bestMatch = null
    let bestIndex = Infinity
    
    const allLinks = { ...linkMap, ...externalLinks }
    
    for (const [keyword, config] of Object.entries(allLinks)) {
      if (linkedKeywords.has(keyword)) continue
      
      // Don't link to current article
      if (config.href.includes(articleSlug)) continue
      
      const match = config.pattern.exec(text)
      config.pattern.lastIndex = 0 // Reset regex
      
      if (match && match.index < bestIndex) {
        bestMatch = { keyword, match, config }
        bestIndex = match.index
      }
    }
    
    if (!bestMatch) return block
    
    linkedKeywords.add(bestMatch.keyword)
    
    const matchText = bestMatch.match[0]
    const matchStart = bestMatch.match.index
    const before = text.substring(0, matchStart)
    const after = text.substring(matchStart + matchText.length)
    const linkKey = generateKey()
    const isExternal = bestMatch.config.href.startsWith('http')
    
    const newChildren = []
    if (before) {
      newChildren.push({ _type: 'span', _key: generateKey(), text: before, marks: [] })
    }
    newChildren.push({ _type: 'span', _key: generateKey(), text: matchText, marks: [linkKey] })
    if (after) {
      newChildren.push({ _type: 'span', _key: generateKey(), text: after, marks: [] })
    }
    
    return {
      ...block,
      children: newChildren,
      markDefs: [
        ...(block.markDefs || []),
        { _type: 'link', _key: linkKey, href: bestMatch.config.href }
      ]
    }
  })
}

async function deepFixArticles() {
  console.log('=== Deep Fix: Article Formatting, Bullets & Links ===\n')
  
  const articles = await sanityClient.fetch(
    `*[_type == "article"] { _id, title, "slug": slug.current, body }`
  )
  
  console.log(`Processing ${articles.length} articles...\n`)
  
  let fixed = 0
  
  for (const article of articles) {
    console.log(`Processing: ${article.title}`)
    
    let body = article.body || []
    const origLength = body.length
    
    // Step 1: Remove empty blocks
    body = removeEmptyBlocks(body)
    
    // Step 2: Convert "Label: description" patterns to bullet points
    body = convertLabelParagraphsToBullets(body)
    
    // Step 3: Add internal and external links
    body = addInternalLinks(body, article.slug)
    
    const hasLists = body.some(b => b.listItem)
    const hasLinks = body.some(b => b.markDefs && b.markDefs.length > 0)
    
    console.log(`  Blocks: ${origLength} → ${body.length} | Lists: ${hasLists} | Links: ${hasLinks}`)
    
    try {
      await sanityClient.patch(article._id)
        .set({ body })
        .commit()
      fixed++
      console.log(`  ✓ Updated`)
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
    }
  }
  
  console.log(`\n=== Done: ${fixed}/${articles.length} articles updated ===`)
}

deepFixArticles()
