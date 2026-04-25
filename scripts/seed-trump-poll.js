const {createClient} = require('@sanity/client')
const client = createClient({projectId:'zzzwo1aw',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN,useCdn:false})
function key() { return Math.random().toString(36).substr(2, 9) }
client.create({
  _type: 'poll',
  question: 'Do you think Trump\'s tariffs could delay the PS6 release?',
  options: [
    {_type:'object', _key:key(), text:'Yes — Sony will push back the launch', votes:0},
    {_type:'object', _key:key(), text:'No — Sony will absorb the costs', votes:0},
    {_type:'object', _key:key(), text:'It\'ll raise the price, not delay it', votes:0},
    {_type:'object', _key:key(), text:'Too early to say', votes:0},
  ],
  article: {_type:'reference', _ref:'d509ab84-41e5-45a3-9848-c0a939e97866'},
  totalVotes: 0,
}).then(r => console.log('✅ Poll created:', r._id)).catch(console.error)
