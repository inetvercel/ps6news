const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

let _k = 1
function key() { return 'k' + (_k++).toString().padStart(4, '0') }

function block(text) {
  return {
    _type: 'block', _key: key(), style: 'normal', markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  }
}

function heading(text, level = 2) {
  return {
    _type: 'block', _key: key(), style: `h${level}`, markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  }
}

function blockWithLinks(segments) {
  const markDefs = []
  const children = segments.map(seg => {
    if (seg.href) {
      const k = key()
      markDefs.push({ _type: 'link', _key: k, href: seg.href })
      return { _type: 'span', _key: key(), text: seg.text, marks: [k] }
    }
    return { _type: 'span', _key: key(), text: seg.text, marks: [] }
  })
  return { _type: 'block', _key: key(), style: 'normal', markDefs, children }
}

function tableBlock(headers, rows) {
  return {
    _type: 'table',
    _key: key(),
    rows: [
      {
        _type: 'tableRow',
        _key: key(),
        cells: headers,
      },
      ...rows.map(row => ({
        _type: 'tableRow',
        _key: key(),
        cells: row,
      }))
    ]
  }
}

// ─── 5 external links ─────────────────────────────────────────────────────
const INSIDER_DISC    = 'https://insider-gaming.com/exclusive-playstation-6-is-planned-to-have-a-detachable-disc-drive-on-launch/'
const WCCF_SPECS      = 'https://wccftech.com/roundup/playstation-6-everything-we-know-release-date-specs-price-games/'
const PLAYSTATION_LS  = 'https://www.playstationlifestyle.net/2024/03/14/ps6-disc-drive-detachable-rumor/'
const COMICBOOK       = 'https://comicbook.com/gaming/news/ps6-backwards-compatible-ps4-ps5-games/'
const GAMESPOT_DISC   = 'https://www.gamespot.com/articles/ps6-disc-drive-detachable-modular-report/1100-6530000/'

const body = [

  // Intro
  block('Sony is still years away from announcing its next-generation console, but the question of whether the PS6 will support physical media has already stirred lively debate. With the gaming industry increasingly favouring digital distribution, fans wonder if Sony will abandon the Blu-ray drive entirely — or retain some form of optical support. Below is a detailed look at the latest rumours, insider reports and expert commentary as of April 2026.'),

  // Key Takeaways
  {
    _type: 'keyTakeaways',
    _key: key(),
    items: [
      'Multiple credible sources report the PS6 will launch without a built-in disc drive, with a detachable drive available separately — mirroring the PS5 Slim model.',
      'Hardware leaker Kepler_L2 claims Sony\'s bill of materials targets $760, with removing the optical drive cited as the primary cost-cutting measure.',
      'Despite growing digital sales (70% of Sony\'s 2024 game revenue), disc-based consoles still outsell digital-only models — making full abandonment commercially risky.',
      'Former PlayStation CEO Shawn Layden has publicly doubted Sony will drop discs, citing global internet inequality and niche audiences that depend on physical media.',
    ]
  },

  // Rumour: no built-in drive
  heading('The Rumour: A Digital-Only Base Console', 2),
  blockWithLinks([
    { text: 'The most discussed rumour comes from AMD hardware leaker Kepler_L2, who told NeoGAF that Sony\'s bill of materials for the PS6 is built around a 1 TB Gen5 SSD and ' },
    { text: 'no built-in disc drive', href: WCCF_SPECS },
    { text: '. Wccftech summarises his posts, noting that Kepler believes dropping the optical drive is "the most obvious area to cut costs." The site adds that neural texture compression (NTC) — an emerging algorithm that can shrink high-resolution textures by up to seven times — could make a 1 TB drive sufficient even without physical media.' },
  ]),
  block('These rumours suggest Sony might ship the base PS6 as digital-only, relying on NTC to control file sizes and reduce the bill of materials. The logic is partly economic: eliminating the optical drive cuts manufacturing and shipping costs, and smaller storage further lowers component costs.'),

  // Detachable drive reports
  heading('The Counter-Evidence: A Detachable Drive', 2),
  blockWithLinks([
    { text: 'Multiple independent outlets push back on the discless theory. ' },
    { text: 'Tom Henderson at Insider Gaming reports', href: INSIDER_DISC },
    { text: ' that Sony plans to offer a detachable disc drive at launch — replicating the PS5 Slim\'s modular approach. The combination of these reports suggests Sony\'s next console will not abandon discs entirely, but will treat them as an optional accessory rather than a standard feature.' },
  ]),
  blockWithLinks([
    { text: 'PlayStation LifeStyle and GameSpot both report that ' },
    { text: 'Sony intends to offer consumers a choice', href: GAMESPOT_DISC },
    { text: ' between a traditional disc-equipped model and a cheaper digital-only option. PlayStation LifeStyle adds that Sony wants a simpler chassis to streamline manufacturing and maximise shipping efficiency — a goal a detachable drive directly supports.' },
  ]),

  // Digital vs physical context
  heading('Digital vs. Physical: The Market Reality', 2),
  block('Understanding why Sony might maintain optical support requires looking at broader sales trends. Digital games accounted for roughly 70% of Sony\'s game revenue in 2024, and market research firm Circana found that 49% of PS5 consoles sold in the US in 2025 were digital-only. Yet despite these figures, digital-only consoles accounted for only 18% of total hardware sales — suggesting that a majority of consumers still prefer a console with a disc drive.'),
  block('Furthermore, after the PS5 Pro launched without a drive, the optional disc drive accessory sold out across US retailers, indicating strong latent demand. This pattern strongly supports a detachable-drive strategy over a fully discless one.'),

  // Backward compatibility
  heading('Backward Compatibility: A Key Factor', 2),
  blockWithLinks([
    { text: 'Backward compatibility also plays a major role in this debate. ' },
    { text: 'ComicBook argues the PS6 will "almost certainly" support PS4 and PS5 games', href: COMICBOOK },
    { text: ', meaning players will want to continue using their physical libraries. Removing the disc drive entirely would force users to repurchase digital copies or abandon their existing discs — damaging goodwill and potentially violating consumer expectations built over multiple console generations.' },
  ]),

  // Expert commentary
  heading('Expert Commentary: Why Dropping Discs Is Risky', 2),
  blockWithLinks([
    { text: 'Former PlayStation CEO Shawn Layden has publicly stated he doubts Sony will drop disc support. In a February 2025 interview, Layden explained that PlayStation operates in around 170 countries, many of which have poor internet infrastructure. He noted that certain groups — including athletes and military personnel — often rely on physical discs due to unreliable connectivity. ' },
    { text: 'Layden warned that going fully discless would exclude large global audience segments', href: PLAYSTATION_LS },
    { text: ', and that AAA game budgets are heading towards $400 million — making disc distribution costs relatively small by comparison.' },
  ]),
  block('Industry analysts echo this caution. GameSpot quotes Sony president Hideaki Nishino emphasising that, despite cloud gaming progress, consumers still prefer local execution of games. This suggests Sony remains committed to hardware-based experiences, including physical media — at least as an option.'),

  // Pros and cons
  heading('Pros and Cons of a Detachable Drive', 2),
  block('The modular disc drive strategy offers clear advantages. Without an internal drive, Sony can lower the bill of materials, reduce shipping weight and pass some savings to consumers. Players who embrace digital storefronts get a cheaper model; collectors can still buy physical discs. The modular approach also makes the core console slimmer and easier to manufacture.'),
  block('The risks are real too. PlayStation LifeStyle warns that when the PS5 Pro launched without a drive, the separate disc drive sold out quickly, leading to scalping and supply frustration. There is also a two-tier pricing concern: digital players benefit while physical media fans pay extra. Some analysts worry this could fragment the market, though the success of the PS5 Slim\'s optional drive suggests most consumers now understand the modular model.'),

  // Search trends table
  heading('PS6 Search Interest: Key Queries', 2),
  block('These figures reflect the growing public interest in Sony\'s next console and help explain why speculation about features like the disc drive continues to gain traction.'),
  tableBlock(
    ['Search Query', 'Approx. Monthly Searches'],
    [
      ['ps6', '65,000'],
      ['ps6 release date', '30,000'],
      ['playstation 6', '13,000'],
      ['playstation 6 release date', '7,500'],
      ['when is ps6 coming out', '5,900'],
    ]
  ),

  // Conclusion
  heading('The Verdict', 2),
  block('As of April 2026, no official announcement has been made about the PS6\'s disc drive. The available evidence points toward a hybrid strategy: a digital-only PS6 as the default base model, paired with a detachable disc drive for those who want physical games or need backward compatibility with PS4 and PS5 discs. This approach balances cost reductions with consumer choice — acknowledging that digital distribution is growing, yet physical media still matters to a significant portion of the global PlayStation audience.'),
]

async function run() {
  const article = await client.fetch(
    `*[_type == "article" && slug.current == "ps6-disc-drive"][0]{ _id, title, slug }`
  )
  if (!article) { console.error('❌ Article not found'); process.exit(1) }
  console.log(`✅ Found: "${article.title}" (${article._id})`)

  await client.patch(article._id).set({
    title: 'Will the PS6 Have a Disc Drive? Latest Rumours and Evidence',
    excerpt: 'From hardware leaks pointing to a discless base model to insider reports of a detachable drive — here\'s everything credibly known about PS6 disc drive plans as of April 2026.',
    body,
    updatedAt: new Date().toISOString(),
  }).commit()

  console.log('✅ Article updated successfully!')
}

run().catch(err => { console.error(err); process.exit(1) })
