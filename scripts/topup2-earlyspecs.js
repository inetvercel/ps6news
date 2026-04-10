const { createClient } = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})

let _k = 1
function key() { return 'tu' + (_k++).toString().padStart(4, '0') }

function addLink(block, anchorText, href) {
  if (!block || block._type !== 'block') return null
  if (block.markDefs?.some(m => m.href === href)) return null
  const linkKey = key()
  const newMarkDefs = [...(block.markDefs || []), { _type: 'link', _key: linkKey, href }]
  const newChildren = []
  let injected = false
  for (const child of block.children) {
    if (!injected && child._type === 'span' && child.text?.includes(anchorText)) {
      const idx = child.text.indexOf(anchorText)
      if (idx > 0) newChildren.push({ ...child, _key: key(), text: child.text.substring(0, idx) })
      newChildren.push({ _type: 'span', _key: key(), text: anchorText, marks: [...(child.marks || []), linkKey] })
      const after = child.text.substring(idx + anchorText.length)
      if (after) newChildren.push({ ...child, _key: key(), text: after })
      injected = true
    } else {
      newChildren.push(child)
    }
  }
  if (!injected) return null
  return { ...block, markDefs: newMarkDefs, children: newChildren }
}

async function run() {
  const article = await client.fetch(`*[_id=="article-4391"][0]{_id,title,body}`)
  let body = [...article.body]

  // block 0: link "PlayStation 5 marks its third year" -> howto
  const u0 = addLink(body[0], 'PlayStation 5 marks its third year', '/articles/how-to-prepare-for-the-ps6-launch')
  if (u0) { body[0] = u0; console.log('✓ block 0') } else console.log('⚠ block 0')

  // block 2: link "RedGamingTech" -> ps6-specs
  const u2 = addLink(body[2], 'RedGamingTech', '/articles/ps6-specs')
  if (u2) { body[2] = u2; console.log('✓ block 2') } else console.log('⚠ block 2')

  // block 4: link "PS6's launch window" -> ps6-cost (for price/launch context)
  const u4 = addLink(body[4], "PS6's launch window", '/articles/ps6-cost')
  if (u4) { body[4] = u4; console.log('✓ block 4') } else console.log('⚠ block 4')

  await client.patch('article-4391').set({ body }).commit()
  console.log('✅ Updated!')
}
run().catch(console.error)
