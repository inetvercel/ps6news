require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')

const token = process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN
console.log('Token found:', token ? `${token.substring(0, 10)}... (${token.length} chars)` : 'MISSING')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// Try creating a test document then deleting it
client.create({ _type: 'article', title: '__token_test__', slug: { _type: 'slug', current: '__token-test__' }, publishedAt: new Date().toISOString() })
  .then(r => {
    console.log('✅ Token has WRITE access! Cleaning up...')
    return client.delete(r._id)
  })
  .then(() => console.log('✅ Test doc deleted. Token is valid.'))
  .catch(err => console.error('❌ Token ERROR:', err.message))
