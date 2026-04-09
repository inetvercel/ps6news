import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
import {resolve} from 'path'

// Load .env.local manually
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) {
      process.env[key.trim()] = vals.join('=').trim()
    }
  })
} catch (e) {
  // Try .env
  try {
    const envPath = resolve(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=')
      if (key && vals.length) {
        process.env[key.trim()] = vals.join('=').trim()
      }
    })
  } catch (e2) {}
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
})

function generateKey() {
  return Math.random().toString(36).substr(2, 9)
}

function decodeHTMLEntities(text) {
  let decoded = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
    '&hellip;': '...', '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&bull;': '•', '&middot;': '·', '&copy;': '©', '&reg;': '®', '&trade;': '™'
  }
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char)
  }
  return decoded
}

/**
 * Parse inline content (text with <strong>, <em>, <a> tags) into Sanity spans
 */
function parseInlineContent(html) {
  const children = []
  const markDefs = []
  
  // Regex to match inline tags: <strong>, <b>, <em>, <i>, <a>
  const inlineRegex = /<(strong|b|em|i|a)(\s[^>]*)?>([^<]*(?:<(?!\/\1>)[^<]*)*)<\/\1>/gi
  
  let lastIndex = 0
  let match
  const tempHTML = html
  
  // Simple approach: split by tags iteratively
  let remaining = html
  
  // Process the HTML sequentially
  const tagRegex = /<(strong|b|em|i|a)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi
  
  let result
  let segments = []
  let pos = 0
  
  while ((result = tagRegex.exec(remaining)) !== null) {
    // Text before this tag
    if (result.index > pos) {
      const textBefore = remaining.substring(pos, result.index)
      const cleaned = decodeHTMLEntities(textBefore.replace(/<[^>]*>/g, ''))
      if (cleaned) {
        segments.push({ text: cleaned, marks: [] })
      }
    }
    
    const tag = result[1].toLowerCase()
    const attrs = result[2] || ''
    const innerText = decodeHTMLEntities(result[3].replace(/<[^>]*>/g, ''))
    
    if (tag === 'a') {
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/)
      const href = hrefMatch ? hrefMatch[1] : ''
      if (href && innerText) {
        const linkKey = generateKey()
        markDefs.push({
          _type: 'link',
          _key: linkKey,
          href: href
        })
        segments.push({ text: innerText, marks: [linkKey] })
      } else if (innerText) {
        segments.push({ text: innerText, marks: [] })
      }
    } else if (tag === 'strong' || tag === 'b') {
      if (innerText) {
        segments.push({ text: innerText, marks: ['strong'] })
      }
    } else if (tag === 'em' || tag === 'i') {
      if (innerText) {
        segments.push({ text: innerText, marks: ['em'] })
      }
    }
    
    pos = result.index + result[0].length
  }
  
  // Remaining text after last tag
  if (pos < remaining.length) {
    const textAfter = remaining.substring(pos)
    const cleaned = decodeHTMLEntities(textAfter.replace(/<[^>]*>/g, ''))
    if (cleaned) {
      segments.push({ text: cleaned, marks: [] })
    }
  }
  
  // If no segments were found, treat entire content as plain text
  if (segments.length === 0) {
    const plainText = decodeHTMLEntities(html.replace(/<[^>]*>/g, ''))
    if (plainText.trim()) {
      segments.push({ text: plainText, marks: [] })
    }
  }
  
  const spanChildren = segments.map(seg => ({
    _type: 'span',
    _key: generateKey(),
    text: seg.text,
    marks: seg.marks
  }))
  
  return { children: spanChildren.length > 0 ? spanChildren : [{ _type: 'span', _key: generateKey(), text: '', marks: [] }], markDefs }
}

/**
 * Convert HTML to proper Sanity Portable Text blocks with lists, links, bold, etc.
 */
function convertHTMLToBlocks(html) {
  const blocks = []
  
  // Clean up Elementor/WordPress cruft
  let cleanHTML = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\/\*![\s\S]*?\*\//g, '')
    .replace(/\.elementor[^{]*\{[^}]*\}/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div[^>]*>/gi, '<p>').replace(/<\/div>/gi, '</p>')
    .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
  
  // Extract tables and process separately
  const tables = []
  cleanHTML = cleanHTML.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    tables.push(match)
    return `<!--TABLE_${tables.length - 1}-->`
  })
  
  // Split into major blocks: headings, paragraphs, lists
  // Process sequentially
  const blockRegex = /<(h[1-6]|p|ul|ol|blockquote|table|figure)((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi
  
  let pos = 0
  let blockMatch
  
  while ((blockMatch = blockRegex.exec(cleanHTML)) !== null) {
    // Check for any untagged text between blocks
    if (blockMatch.index > pos) {
      const gap = cleanHTML.substring(pos, blockMatch.index).trim()
      if (gap && !gap.startsWith('<!--')) {
        const plainText = decodeHTMLEntities(gap.replace(/<[^>]*>/g, '').trim())
        if (plainText) {
          const { children, markDefs } = parseInlineContent(gap)
          blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children,
            markDefs
          })
        }
      }
    }
    
    const tag = blockMatch[1].toLowerCase()
    const content = blockMatch[3]
    
    // Handle table placeholders
    if (content.includes('<!--TABLE_')) {
      const tableIdx = content.match(/<!--TABLE_(\d+)-->/)?.[1]
      if (tableIdx !== undefined) {
        blocks.push({
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          children: [{
            _type: 'span',
            _key: generateKey(),
            text: tables[parseInt(tableIdx)],
            marks: []
          }],
          markDefs: []
        })
      }
      pos = blockMatch.index + blockMatch[0].length
      continue
    }
    
    // Headings
    if (tag.startsWith('h')) {
      const level = tag === 'h1' ? 'h2' : tag
      const text = decodeHTMLEntities(content.replace(/<[^>]*>/g, '').trim())
      if (text) {
        blocks.push({
          _type: 'block',
          _key: generateKey(),
          style: level,
          children: [{
            _type: 'span',
            _key: generateKey(),
            text,
            marks: []
          }],
          markDefs: []
        })
      }
    }
    
    // Paragraphs
    else if (tag === 'p') {
      const trimmedContent = content.trim()
      if (!trimmedContent) {
        pos = blockMatch.index + blockMatch[0].length
        continue
      }
      
      // Check for table placeholder
      if (trimmedContent.includes('<!--TABLE_')) {
        const tableIdx = trimmedContent.match(/<!--TABLE_(\d+)-->/)?.[1]
        if (tableIdx !== undefined) {
          blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children: [{
              _type: 'span',
              _key: generateKey(),
              text: tables[parseInt(tableIdx)],
              marks: []
            }],
            markDefs: []
          })
          pos = blockMatch.index + blockMatch[0].length
          continue
        }
      }
      
      // Check for YouTube
      const plainText = decodeHTMLEntities(trimmedContent.replace(/<[^>]*>/g, '').trim())
      if (plainText.includes('youtube.com') || plainText.includes('youtu.be')) {
        blocks.push({
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          children: [{
            _type: 'span',
            _key: generateKey(),
            text: plainText,
            marks: []
          }],
          markDefs: []
        })
        pos = blockMatch.index + blockMatch[0].length
        continue
      }
      
      // Parse inline content (bold, links, etc.)
      const { children, markDefs } = parseInlineContent(trimmedContent)
      const hasContent = children.some(c => c.text.trim())
      if (hasContent) {
        blocks.push({
          _type: 'block',
          _key: generateKey(),
          style: 'normal',
          children,
          markDefs
        })
      }
    }
    
    // Unordered / Ordered Lists
    else if (tag === 'ul' || tag === 'ol') {
      const listType = tag === 'ul' ? 'bullet' : 'number'
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
      let liMatch
      let listLevel = 1
      
      while ((liMatch = liRegex.exec(content)) !== null) {
        const liContent = liMatch[1].trim()
        
        // Check for nested lists inside this li
        const hasNestedList = /<(ul|ol)[^>]*>/i.test(liContent)
        
        if (hasNestedList) {
          // Get text before nested list
          const beforeNested = liContent.replace(/<(ul|ol)[^>]*>[\s\S]*<\/\1>/gi, '').trim()
          if (beforeNested) {
            const { children, markDefs } = parseInlineContent(beforeNested)
            blocks.push({
              _type: 'block',
              _key: generateKey(),
              style: 'normal',
              listItem: listType,
              level: 1,
              children,
              markDefs
            })
          }
          
          // Process nested list items
          const nestedLiRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
          const nestedContent = liContent.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] || ''
          let nestedLi
          while ((nestedLi = nestedLiRegex.exec(nestedContent)) !== null) {
            const { children, markDefs } = parseInlineContent(nestedLi[1].trim())
            blocks.push({
              _type: 'block',
              _key: generateKey(),
              style: 'normal',
              listItem: listType,
              level: 2,
              children,
              markDefs
            })
          }
        } else {
          const { children, markDefs } = parseInlineContent(liContent)
          const hasText = children.some(c => c.text.trim())
          if (hasText) {
            blocks.push({
              _type: 'block',
              _key: generateKey(),
              style: 'normal',
              listItem: listType,
              level: 1,
              children,
              markDefs
            })
          }
        }
      }
    }
    
    // Blockquotes
    else if (tag === 'blockquote') {
      const text = decodeHTMLEntities(content.replace(/<[^>]*>/g, '').trim())
      if (text) {
        blocks.push({
          _type: 'block',
          _key: generateKey(),
          style: 'blockquote',
          children: [{
            _type: 'span',
            _key: generateKey(),
            text,
            marks: []
          }],
          markDefs: []
        })
      }
    }
    
    pos = blockMatch.index + blockMatch[0].length
  }
  
  // Handle remaining content after last matched block
  if (pos < cleanHTML.length) {
    const remaining = cleanHTML.substring(pos).trim()
    if (remaining) {
      // Try to split by paragraphs or line breaks
      const parts = remaining.split(/\n\n+/).map(p => decodeHTMLEntities(p.replace(/<[^>]*>/g, '').trim())).filter(p => p)
      for (const text of parts) {
        if (text.length < 100 && /^[A-Z]/.test(text) && !text.endsWith('.') && !text.endsWith(',')) {
          blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'h2',
            children: [{ _type: 'span', _key: generateKey(), text, marks: [] }],
            markDefs: []
          })
        } else {
          const { children, markDefs } = parseInlineContent(remaining)
          blocks.push({
            _type: 'block',
            _key: generateKey(),
            style: 'normal',
            children,
            markDefs
          })
        }
      }
    }
  }
  
  // Detect paragraphs that should be bullet points:
  // Patterns like "Bold Label: Description text" that repeat
  const fixedBlocks = detectAndConvertBulletPoints(blocks)
  
  return fixedBlocks.length > 0 ? fixedBlocks : [{
    _type: 'block',
    _key: generateKey(),
    style: 'normal',
    children: [{ _type: 'span', _key: generateKey(), text: '', marks: [] }],
    markDefs: []
  }]
}

/**
 * Detect sequences of paragraphs that look like bullet points
 * Pattern: "Bold Label: description text" appearing 3+ times in sequence
 */
function detectAndConvertBulletPoints(blocks) {
  const result = []
  let i = 0
  
  while (i < blocks.length) {
    const block = blocks[i]
    
    // Check if this is a "normal" paragraph that looks like a bullet point
    if (block.style === 'normal' && !block.listItem) {
      const text = block.children?.map(c => c.text).join('') || ''
      
      // Pattern: starts with "Word(s):" followed by description
      const bulletPattern = /^([A-Z][^:]{2,40}):\s/
      
      if (bulletPattern.test(text)) {
        // Look ahead: do we have 2+ more similar patterns in a row?
        let count = 1
        let j = i + 1
        while (j < blocks.length) {
          const nextBlock = blocks[j]
          if (nextBlock.style === 'normal' && !nextBlock.listItem) {
            const nextText = nextBlock.children?.map(c => c.text).join('') || ''
            if (bulletPattern.test(nextText)) {
              count++
              j++
            } else {
              break
            }
          } else {
            break
          }
        }
        
        // If 3+ consecutive "Label: description" paragraphs, convert to bullets
        if (count >= 3) {
          for (let k = i; k < i + count; k++) {
            const b = blocks[k]
            const bText = b.children?.map(c => c.text).join('') || ''
            const match = bText.match(bulletPattern)
            
            // Make the label bold
            const label = match[1] + ':'
            const rest = bText.substring(label.length).trim()
            
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
              markDefs: b.markDefs || []
            })
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

async function fixAllArticles() {
  console.log('=== Fixing Article Formatting ===\n')
  
  // Fetch all articles
  const articles = await sanityClient.fetch(
    `*[_type == "article"] { _id, title, body }`
  )
  
  console.log(`Found ${articles.length} articles to process\n`)
  
  let fixed = 0
  let skipped = 0
  
  for (const article of articles) {
    // Reconstruct the body text to find issues
    const body = article.body || []
    
    // Check for issues:
    // 1. Blocks that contain raw HTML table strings
    // 2. Blocks with excessive empty space
    // 3. Sequential "Label: description" that should be bullet points
    
    let needsFix = false
    
    for (const block of body) {
      if (!block.children) continue
      const text = block.children.map(c => c.text).join('')
      
      // Has raw HTML table
      if (text.includes('<table')) needsFix = true
      
      // Has inline HTML tags that weren't converted
      if (text.includes('<strong>') || text.includes('<a href')) needsFix = true
      
      // Check for "Label: description" pattern that should be bullets
      if (block.style === 'normal' && !block.listItem) {
        const bulletPattern = /^([A-Z][^:]{2,40}):\s/
        if (bulletPattern.test(text)) {
          // Count consecutive similar blocks
          const idx = body.indexOf(block)
          let count = 0
          for (let j = idx; j < body.length; j++) {
            const b = body[j]
            if (b.style === 'normal' && !b.listItem) {
              const t = b.children?.map(c => c.text).join('') || ''
              if (bulletPattern.test(t)) count++
              else break
            } else break
          }
          if (count >= 3) needsFix = true
        }
      }
    }
    
    if (!needsFix) {
      skipped++
      continue
    }
    
    console.log(`Fixing: ${article.title}`)
    
    // Apply the bullet point detection and formatting fixes
    const fixedBody = detectAndConvertBulletPoints(body)
    
    // Also fix any blocks with raw HTML still in them
    const cleanedBody = fixedBody.map(block => {
      if (!block.children) return block
      
      const text = block.children.map(c => c.text).join('')
      
      // Fix raw HTML table blocks
      if (text.includes('<table')) {
        return block // Keep as-is, the renderer handles it
      }
      
      // Fix blocks that still have inline HTML
      if (text.includes('<strong>') || text.includes('<a href') || text.includes('<em>')) {
        const { children, markDefs } = parseInlineContent(text)
        return {
          ...block,
          children,
          markDefs: [...(block.markDefs || []), ...markDefs]
        }
      }
      
      return block
    })
    
    try {
      await sanityClient.patch(article._id)
        .set({ body: cleanedBody })
        .commit()
      fixed++
      console.log(`  ✓ Fixed formatting`)
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`)
    }
  }
  
  console.log(`\n=== Done ===`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Skipped (already OK): ${skipped}`)
}

fixAllArticles()
