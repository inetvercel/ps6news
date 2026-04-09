import axios from 'axios'
import {createClient} from '@sanity/client'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2023-05-03',
  useCdn: false
})

const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://your-wordpress-site.com'

async function uploadImageToSanity(imageUrl, altText = '') {
  try {
    console.log(`  Downloading image: ${imageUrl}`)
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
    const buffer = Buffer.from(response.data)
    
    // Extract filename from URL
    const filename = imageUrl.split('/').pop().split('?')[0]
    
    // Upload to Sanity
    const asset = await sanityClient.assets.upload('image', buffer, {
      filename: filename,
    })
    
    console.log(`  ✓ Uploaded image: ${filename}`)
    
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id
      },
      alt: altText
    }
  } catch (error) {
    console.error(`  ✗ Error uploading image ${imageUrl}:`, error.message)
    return null
  }
}

async function fetchWordPressPosts() {
  try {
    console.log('Fetching posts from WordPress...')
    const response = await axios.get(`${WORDPRESS_URL}/wp-json/wp/v2/posts?per_page=100&_embed`)
    return response.data
  } catch (error) {
    console.error('Error fetching WordPress posts:', error.message)
    return []
  }
}

async function fetchWordPressMedia(mediaId) {
  try {
    const response = await axios.get(`${WORDPRESS_URL}/wp-json/wp/v2/media/${mediaId}`)
    return response.data
  } catch (error) {
    console.error(`Error fetching media ${mediaId}:`, error.message)
    return null
  }
}

async function fetchWordPressPages() {
  try {
    console.log('Fetching pages from WordPress...')
    const response = await axios.get(`${WORDPRESS_URL}/wp-json/wp/v2/pages?per_page=100`)
    return response.data
  } catch (error) {
    console.error('Error fetching WordPress pages:', error.message)
    return []
  }
}

async function fetchWordPressCategories() {
  try {
    console.log('Fetching categories from WordPress...')
    const response = await axios.get(`${WORDPRESS_URL}/wp-json/wp/v2/categories?per_page=100`)
    return response.data
  } catch (error) {
    console.error('Error fetching WordPress categories:', error.message)
    return []
  }
}

async function fetchWordPressAuthors() {
  try {
    console.log('Fetching authors from WordPress...')
    const response = await axios.get(`${WORDPRESS_URL}/wp-json/wp/v2/users?per_page=100`)
    return response.data
  } catch (error) {
    console.error('Error fetching WordPress authors:', error.message)
    return []
  }
}

function decodeHTMLEntities(text) {
  // First, handle numeric entities
  let decoded = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
  
  // Then handle named entities
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&hellip;': '...',
    '&nbsp;': ' ',
    '&ndash;': '-',
    '&mdash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"'
  }
  
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char)
  }
  
  return decoded
}

function convertHTMLToBlocks(html) {
  const blocks = []
  
  // Remove Elementor CSS and scripts
  let cleanHTML = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
    .replace(/\/\*![\s\S]*?\*\//g, '') // Remove CSS comments
    .replace(/\.elementor[^{]*\{[^}]*\}/g, '') // Remove elementor CSS rules
  
  // Extract and preserve tables
  const tables = []
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  let tableMatch
  while ((tableMatch = tableRegex.exec(cleanHTML)) !== null) {
    tables.push({
      fullMatch: tableMatch[0],
      placeholder: `__TABLE_${tables.length}__`
    })
  }
  
  // Replace tables with placeholders
  tables.forEach(table => {
    cleanHTML = cleanHTML.replace(table.fullMatch, `<p>${table.placeholder}</p>`)
  })
  
  // First, extract headings (h1-h6)
  const headingRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi
  const parts = cleanHTML.split(headingRegex)
  
  let currentHTML = cleanHTML
  const headings = []
  let match
  
  // Extract all headings with their positions
  const tempRegex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi
  while ((match = tempRegex.exec(cleanHTML)) !== null) {
    headings.push({
      level: match[1],
      text: decodeHTMLEntities(match[2].replace(/<[^>]*>/g, '').trim()),
      fullMatch: match[0]
    })
  }
  
  // Split content by headings
  let remainingHTML = cleanHTML
  headings.forEach(heading => {
    const parts = remainingHTML.split(heading.fullMatch)
    
    // Process content before heading
    if (parts[0]) {
      const paragraphs = parts[0]
        .split(/<\/?p[^>]*>/)
        .map(p => p.replace(/<[^>]*>/g, '').trim())
        .map(p => decodeHTMLEntities(p))
        .filter(p => p.length > 0)
      
      paragraphs.forEach(text => {
        // Check if it's a table placeholder
        const tableMatch = text.match(/__TABLE_(\d+)__/)
        if (tableMatch) {
          const tableIndex = parseInt(tableMatch[1])
          const tableHTML = tables[tableIndex]?.fullMatch
          if (tableHTML) {
            blocks.push({
              _type: 'block',
              _key: Math.random().toString(36).substr(2, 9),
              style: 'normal',
              children: [
                {
                  _type: 'span',
                  _key: Math.random().toString(36).substr(2, 9),
                  text: tableHTML,
                  marks: []
                }
              ],
              markDefs: []
            })
          }
          return
        }
        
        // Check if it's a YouTube URL
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
          blocks.push({
            _type: 'block',
            _key: Math.random().toString(36).substr(2, 9),
            style: 'normal',
            children: [
              {
                _type: 'span',
                _key: Math.random().toString(36).substr(2, 9),
                text: text,
                marks: []
              }
            ]
          })
          return
        }
        
        // Check if it looks like a heading (short, title case, ends without period)
        const isLikelyHeading = text.length < 100 && 
                                text === text.trim() && 
                                !text.endsWith('.') && 
                                !text.endsWith(',') &&
                                /^[A-Z]/.test(text)
        
        blocks.push({
          _type: 'block',
          _key: Math.random().toString(36).substr(2, 9),
          style: isLikelyHeading ? 'h2' : 'normal',
          children: [
            {
              _type: 'span',
              _key: Math.random().toString(36).substr(2, 9),
              text: text,
              marks: []
            }
          ]
        })
      })
    }
    
    // Add the heading
    const headingStyle = heading.level === 'h1' ? 'h2' : heading.level
    blocks.push({
      _type: 'block',
      _key: Math.random().toString(36).substr(2, 9),
      style: headingStyle,
      children: [
        {
          _type: 'span',
          _key: Math.random().toString(36).substr(2, 9),
          text: heading.text,
          marks: []
        }
      ]
    })
    
    remainingHTML = parts[1] || ''
  })
  
  // Process remaining content
  if (remainingHTML) {
    const paragraphs = remainingHTML
      .split(/<\/?p[^>]*>/)
      .map(p => p.replace(/<[^>]*>/g, '').trim())
      .map(p => decodeHTMLEntities(p))
      .filter(p => p.length > 0)
    
    paragraphs.forEach(text => {
      // Check if it's a table placeholder
      const tableMatch = text.match(/__TABLE_(\d+)__/)
      if (tableMatch) {
        const tableIndex = parseInt(tableMatch[1])
        const tableHTML = tables[tableIndex]?.fullMatch
        if (tableHTML) {
          blocks.push({
            _type: 'block',
            _key: Math.random().toString(36).substr(2, 9),
            style: 'normal',
            children: [
              {
                _type: 'span',
                _key: Math.random().toString(36).substr(2, 9),
                text: tableHTML,
                marks: []
              }
            ]
          })
        }
        return
      }
      
      // Check if it's a YouTube URL
      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        blocks.push({
          _type: 'block',
          _key: Math.random().toString(36).substr(2, 9),
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: Math.random().toString(36).substr(2, 9),
              text: text,
              marks: []
            }
          ]
        })
        return
      }
      
      // Check if it looks like a heading
      const isLikelyHeading = text.length < 100 && 
                              text === text.trim() && 
                              !text.endsWith('.') && 
                              !text.endsWith(',') &&
                              /^[A-Z]/.test(text) &&
                              !/^As |^The |^In |^With |^For /.test(text)
      
      blocks.push({
        _type: 'block',
        _key: Math.random().toString(36).substr(2, 9),
        style: isLikelyHeading ? 'h2' : 'normal',
        children: [
          {
            _type: 'span',
            _key: Math.random().toString(36).substr(2, 9),
            text: text,
            marks: []
          }
        ]
      })
    })
  }
  
  return blocks.length > 0 ? blocks : [{
    _type: 'block',
    _key: Math.random().toString(36).substr(2, 9),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).substr(2, 9),
        text: '',
        marks: []
      }
    ]
  }]
}

async function importAuthors(wpAuthors) {
  console.log(`\nImporting ${wpAuthors.length} authors...`)
  const authorMap = {}

  for (const wpAuthor of wpAuthors) {
    const author = {
      _type: 'author',
      _id: `author-${wpAuthor.id}`,
      name: wpAuthor.name,
      slug: {
        _type: 'slug',
        current: wpAuthor.slug
      },
      bio: wpAuthor.description ? convertHTMLToBlocks(wpAuthor.description) : []
    }

    try {
      await sanityClient.createOrReplace(author)
      authorMap[wpAuthor.id] = author._id
      console.log(`✓ Imported author: ${wpAuthor.name}`)
    } catch (error) {
      console.error(`✗ Error importing author ${wpAuthor.name}:`, error.message)
    }
  }

  return authorMap
}

async function importCategories(wpCategories) {
  console.log(`\nImporting ${wpCategories.length} categories...`)
  const categoryMap = {}

  for (const wpCategory of wpCategories) {
    const category = {
      _type: 'category',
      _id: `category-${wpCategory.id}`,
      title: decodeHTMLEntities(wpCategory.name),
      slug: {
        _type: 'slug',
        current: wpCategory.slug
      },
      description: wpCategory.description ? decodeHTMLEntities(wpCategory.description) : ''
    }

    try {
      await sanityClient.createOrReplace(category)
      categoryMap[wpCategory.id] = category._id
      console.log(`✓ Imported category: ${category.title}`)
    } catch (error) {
      console.error(`✗ Error importing category ${wpCategory.name}:`, error.message)
    }
  }

  return categoryMap
}

async function importPosts(wpPosts, authorMap, categoryMap) {
  console.log(`\nImporting ${wpPosts.length} posts...`)

  for (const wpPost of wpPosts) {
    const article = {
      _type: 'article',
      _id: `article-${wpPost.id}`,
      title: decodeHTMLEntities(wpPost.title.rendered),
      slug: {
        _type: 'slug',
        current: wpPost.slug
      },
      publishedAt: wpPost.date,
      excerpt: wpPost.excerpt?.rendered ? decodeHTMLEntities(wpPost.excerpt.rendered.replace(/<[^>]*>/g, '').trim()) : '',
      body: convertHTMLToBlocks(wpPost.content.rendered),
      featured: wpPost.sticky || false,
      wordpressId: wpPost.id
    }

    // Import featured image
    if (wpPost.featured_media && wpPost.featured_media > 0) {
      try {
        const featuredImage = wpPost._embedded?.['wp:featuredmedia']?.[0]
        if (featuredImage && featuredImage.source_url) {
          const altText = featuredImage.alt_text || wpPost.title.rendered
          const uploadedImage = await uploadImageToSanity(featuredImage.source_url, altText)
          if (uploadedImage) {
            article.mainImage = uploadedImage
          }
        }
      } catch (error) {
        console.error(`  ✗ Error importing featured image for ${wpPost.title.rendered}:`, error.message)
      }
    }

    if (wpPost.author && authorMap[wpPost.author]) {
      article.author = {
        _type: 'reference',
        _ref: authorMap[wpPost.author]
      }
    }

    if (wpPost.categories && wpPost.categories.length > 0 && categoryMap[wpPost.categories[0]]) {
      article.category = {
        _type: 'reference',
        _ref: categoryMap[wpPost.categories[0]]
      }
    }

    try {
      await sanityClient.createOrReplace(article)
      console.log(`✓ Imported post: ${wpPost.title.rendered}`)
    } catch (error) {
      console.error(`✗ Error importing post ${wpPost.title.rendered}:`, error.message)
    }
  }
}

async function importPages(wpPages) {
  console.log(`\nImporting ${wpPages.length} pages...`)

  for (const wpPage of wpPages) {
    const page = {
      _type: 'page',
      _id: `page-${wpPage.id}`,
      title: wpPage.title.rendered,
      slug: {
        _type: 'slug',
        current: wpPage.slug
      },
      publishedAt: wpPage.date,
      body: convertHTMLToBlocks(wpPage.content.rendered),
      wordpressId: wpPage.id
    }

    try {
      await sanityClient.createOrReplace(page)
      console.log(`✓ Imported page: ${wpPage.title.rendered}`)
    } catch (error) {
      console.error(`✗ Error importing page ${wpPage.title.rendered}:`, error.message)
    }
  }
}

async function main() {
  console.log('=== WordPress to Sanity Import Tool ===\n')
  
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
  const token = process.env.SANITY_TOKEN
  
  if (!projectId || !token) {
    console.error('Error: NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_TOKEN must be set in .env.local file')
    console.error(`Project ID: ${projectId ? 'Found' : 'Missing'}`)
    console.error(`Token: ${token ? 'Found' : 'Missing'}`)
    process.exit(1)
  }

  if (!process.env.WORDPRESS_URL) {
    console.error('Error: WORDPRESS_URL must be set in .env.local file')
    process.exit(1)
  }

  try {
    const wpAuthors = await fetchWordPressAuthors()
    const wpCategories = await fetchWordPressCategories()
    const wpPosts = await fetchWordPressPosts()
    const wpPages = await fetchWordPressPages()

    const authorMap = await importAuthors(wpAuthors)
    const categoryMap = await importCategories(wpCategories)
    await importPosts(wpPosts, authorMap, categoryMap)
    await importPages(wpPages)

    console.log('\n=== Import Complete! ===')
    console.log(`Total imported:`)
    console.log(`- Authors: ${wpAuthors.length}`)
    console.log(`- Categories: ${wpCategories.length}`)
    console.log(`- Posts: ${wpPosts.length}`)
    console.log(`- Pages: ${wpPages.length}`)
  } catch (error) {
    console.error('Import failed:', error)
    process.exit(1)
  }
}

main()
