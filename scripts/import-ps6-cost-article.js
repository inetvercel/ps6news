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
      { _type: 'tableRow', _key: key(), cells: headers },
      ...rows.map(row => ({ _type: 'tableRow', _key: key(), cells: row }))
    ]
  }
}

// ─── 5 external links (one use each, clean URLs) ──────────────────────────
const WCCF_699      = 'https://wccftech.com/playstation-6-price-699-still-possible/'
const VICE_LEAK     = 'https://www.vice.com/en/article/ps6-price-could-hit-700-as-new-leak-reveals-expensive-cost-to-make-console/'
const PUSHSQUARE    = 'https://www.pushsquare.com/news/2026/03/usd1000plus-consoles-could-become-the-norm-ps6s-price-touted-to-touch-four-figures'
const WCCF_BOM      = 'https://wccftech.com/its-not-1000-playstation-6-price-manufacturing-data-tariffs/'
const VICE_CHEAPER  = 'https://www.vice.com/en/article/ps6-will-be-cheaper-than-ps5-pro-according-to-new-leak-insider-says-skip-playstation-5/'

const body = [

  // Intro
  block('The PlayStation 5 has been on shelves since 2020, and Sony\'s mid-generation PS5 Pro refresh arrived in late 2024. With developers already planning for the next era, fans are starting to ask how much the PS6 will cost. While the console has not been officially announced, industry analysts, leakers and news outlets have begun estimating price points based on manufacturing costs, economic conditions and Sony\'s pricing history. This article collates the most recent information as of April 2026.'),

  // Key Takeaways
  {
    _type: 'keyTakeaways',
    _key: key(),
    items: [
      'Component cost estimates put the PS6\'s bill of materials at around $743–$760, suggesting a launch price of $699 is possible if Sony subsidises hardware.',
      'Several analysts warn a $999–$1,000 PS6 is "not impossible", driven by surging DRAM and NAND costs from AI data centre demand.',
      'A separate leak claims the PS6 will actually be cheaper than the PS5 Pro ($899), with Sony designing the console "from the ground up to be cheaper to produce."',
      'The final price will depend heavily on tariffs, memory costs, and whether Microsoft\'s Project Helix forces Sony to price aggressively.',
    ]
  },

  // Economic context
  heading('The Economic Context: PS5 Price Hikes', 2),
  blockWithLinks([
    { text: 'Before looking at the PS6, it helps to understand the current pricing environment. In early April 2026, ' },
    { text: 'Sony raised PS5 prices by $100–$150 above launch prices', href: WCCF_699 },
    { text: ', citing "global economic conditions" and rising component costs. The company also increased prices for its portable Portal device. These increases signal that hardware costs are rising across the board — and that the PS6 will almost certainly launch at a higher price than the PS5 did in 2020.' },
  ]),

  // BOM and $699
  heading('Bill of Materials: Is $699 Realistic?', 2),
  blockWithLinks([
    { text: 'One way to estimate the PS6\'s price is to examine component costs. Hardware leaker KeplerL2 estimates the PS6\'s bill of materials at around $760, covering a 1 TB Gen5 SSD, no disc drive, APU, motherboard, cooling and RAM. ' },
    { text: 'Vice analysed KeplerL2\'s claims', href: VICE_LEAK },
    { text: ' and notes that Sony has a history of subsidising console launches — the PS3, PS4 and PS5 were all reportedly sold at or below cost. If Sony repeats this strategy for the PS6, a $699 launch price is achievable even with a $760 bill of materials.' },
  ]),
  block('The Vice analysis also notes that if Microsoft\'s Project Helix targets a $1,000+ price point, Sony may feel less pressure to subsidise and could instead price the PS6 between $750 and $800 — recouping margins through PlayStation Plus and game sales rather than hardware alone.'),

  // $1,000 scenario
  heading('Why a $1,000 PS6 Is Not Out of the Question', 2),
  blockWithLinks([
    { text: 'Despite relatively optimistic BOM projections, some analysts believe the PS6 could push into four-figure territory. Push Square gathered expert comments noting that consultant Dr. Toto sees ' },
    { text: '"a very real possibility" of a $999+ launch price', href: PUSHSQUARE },
    { text: '. GamesRadar analyst Mat Piscatella warned we are "quickly moving toward a world in which a $1,000 console will be the norm," pointing to surging DRAM and NAND costs driven by AI data centre demand.' },
  ]),
  block('Van Dreunen echoed this, warning that memory costs have risen 80–90% since early 2026, pushing console prices toward PC-like levels. Analyst Michael Pachter added that rising hardware prices could shrink the console market to a niche audience — though he suggested game streaming might offset the need for expensive hardware long-term.'),

  // Manufacturing data
  heading('Manufacturing Analysis: Probably Not $1,000', 2),
  blockWithLinks([
    { text: 'Despite the alarm, there is compelling data suggesting the PS6 won\'t reach $1,000 — unless tariffs or extreme market shocks intervene. In April 2026 ' },
    { text: 'Wccftech published an in-depth bill-of-materials breakdown', href: WCCF_BOM },
    { text: ' using component data from YouTuber Moore\'s Law Is Dead, estimating the PS6\'s BOM at $743. The analysis argued the PS6 is "not going to be $1,000" and identified tariffs as the biggest single threat — a worst-case tariff scenario could push the price to around $950, while tariff removal and falling DRAM prices could bring it as low as $599.' },
  ]),
  block('The same report noted that delaying the console to wait for cheaper components would cost more than absorbing higher prices now — suggesting Sony may commit to a 2027–28 launch regardless of market volatility.'),

  // Cheaper rumour
  heading('The Cheaper Scenario: Below PS5 Pro Pricing', 2),
  blockWithLinks([
    { text: 'Not all reports predict sky-high prices. A separate Vice report cites an insider claiming Sony is designing the PS6 ' },
    { text: '"from the ground up to be cheaper to produce"', href: VICE_CHEAPER },
    { text: ' — with every component from screws to motherboard layout optimised for cost reduction. The same source predicted the base PS6 would be cheaper than the $899 PS5 Pro and encouraged consumers to "skip the PS5" and wait. NoobFeed similarly reports that the PS6 and its Project Canis handheld companion will use cheaper power supplies and cooling, with most estimates placing the price between $700 and $800.' },
  ]),
  block('GamesBeat analyst Piers Elliot offered a more moderate outlook, suggesting the PS6 and its Xbox rival will both launch around $600 — pointing to Xbox\'s "Galaxy Black" $600 edition as precedent and arguing that $600 has become the new floor for mainstream consoles.'),

  // Factors table
  heading('Key Factors That Will Decide the PS6 Price', 2),
  tableBlock(
    ['Factor', 'Impact on Price'],
    [
      ['Bill of materials (~$743–$760)', 'Sets baseline; Sony may subsidise to stay competitive'],
      ['DRAM/NAND costs (up 80–90%)', 'Could push price toward $800–$999 if sustained'],
      ['Tariffs on imports', 'Worst case adds ~$200; removal could save $100+'],
      ['Microsoft Project Helix pricing', 'If $1,000+, Sony has less pressure to subsidise'],
      ['Sony subsidy strategy', 'History suggests selling at loss; recouped via PS Plus'],
      ['Multiple SKUs (digital/disc/handheld)', 'Allows range from ~$399 to ~$800'],
    ]
  ),

  // Conclusion
  heading('Conclusion: Expect a High But Uncertain Price', 2),
  block('The honest answer is that we won\'t know until Sony announces the console. Based on the latest leaks and analyst opinions, the most realistic price range for the base PS6 appears to be $599–$799. A $999 variant is possible under worst-case economic conditions or if Sony opts not to subsidise, but multiple manufacturing analyses suggest the price is more likely to stay below four figures. The PS5\'s recent price hikes to $649 provide context for why the next generation may cost more than many gamers expect. Ultimately, the PS6\'s price will hinge on component costs, tariffs, competition and Sony\'s willingness to sell at a loss — so keep an eye on supply chain news as launch approaches.'),
]

async function run() {
  const article = await client.fetch(
    `*[_type == "article" && slug.current == "ps6-price"][0]{ _id, title, slug }`
  )
  if (!article) {
    // Try alternate slug
    const alt = await client.fetch(`*[_type == "article" && title match "How Much Will the PS6 Cost*"][0]{_id,title,slug}`)
    if (!alt) { console.error('❌ Article not found'); process.exit(1) }
    console.log(`✅ Found (by title): "${alt.title}" (${alt._id})`)
    await client.patch(alt._id).set({ title: 'How Much Will the PS6 Cost? Price Predictions and Analysis', excerpt: 'From a subsidised $699 to a possible $999 — here\'s what analysts, leakers and manufacturing data say about the PS6 price as of April 2026.', body, updatedAt: new Date().toISOString() }).commit()
    return console.log('✅ Updated!')
  }
  console.log(`✅ Found: "${article.title}" (${article._id})`)
  await client.patch(article._id).set({ title: 'How Much Will the PS6 Cost? Price Predictions and Analysis', excerpt: 'From a subsidised $699 to a possible $999 — here\'s what analysts, leakers and manufacturing data say about the PS6 price as of April 2026.', body, updatedAt: new Date().toISOString() }).commit()
  console.log('✅ Article updated successfully!')
}

run().catch(err => { console.error(err); process.exit(1) })
