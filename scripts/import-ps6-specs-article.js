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

// ─── 5 external links ─────────────────────────────────────────────────────
const BLOOMBERG_DELAY   = 'https://wccftech.com/playstation-6-delay-2028-2029-nintendo-switch-2-price-increase-2026/'
const WCCF_AMETHYST     = 'https://wccftech.com/sony-amd-mark-cerny-jack-huynh-project-amethyst-ps6-playstation-6/'
const INSIDER_DISC      = 'https://insider-gaming.com/exclusive-playstation-6-is-planned-to-have-a-detachable-disc-drive-on-launch/'
const VERGE_AI          = 'https://www.theverge.com/2025/9/17/24247546/sony-playstation-ai-frame-generation-pssr'
const WCCF_CANIS        = 'https://wccftech.com/playstation-6-companion-handheld-codenamed-project-canis-leaked/'

// ─── Body ─────────────────────────────────────────────────────────────────
const body = [

  // Intro
  block('The next major PlayStation console remains unannounced, yet leaks and analyst reports are already painting a picture of a machine that will dramatically outpace today\'s PS5. This article summarises the latest information about the PS6, including its expected release window, rumoured hardware specifications, pricing speculation and the growing role of artificial intelligence — current as of April 10, 2026.'),

  // Key Takeaways
  {
    _type: 'keyTakeaways',
    _key: key(),
    items: [
      'The PS6 is unlikely to launch before late 2028 due to a global DRAM shortage driving up memory costs.',
      'Leaked specs point to a custom AMD chip with Zen 6 CPU cores and an RDNA 5 GPU delivering up to 40 teraflops — roughly triple the base PS5.',
      'Sony\'s "Project Amethyst" introduces Radiance Cores (ray tracing) and Neural Arrays (AI upscaling) as key next-gen features.',
      'Price estimates range from a subsidised $499 to as high as $999, depending on memory costs and Sony\'s market strategy.',
    ]
  },

  // Release window
  heading('Release Window and the Memory Bottleneck', 2),
  blockWithLinks([
    { text: 'Sony typically refreshes its console every seven years, so early leakers assumed the PS6 release date would fall in late 2027. Since late 2025, however, memory costs have surged, and ' },
    { text: 'a potential delay to 2028 or 2029', href: BLOOMBERG_DELAY },
    { text: '. Lenovo and Lam Research executives warned that demand from AI data centres could overwhelm all other sources of demand for memory. A Kalshi prediction market tracked by Yahoo Tech reflects this uncertainty — only roughly one quarter of bettors expected a reveal before the end of 2026.' },
  ]),
  block('PS5 architect Mark Cerny added to the caution, noting that the machine-learning technologies Sony is developing "only exist in simulation right now" and will appear in a "future console in a few years\' time." While some executives like Take-Two\'s Strauss Zelnick argue the chip crisis will not disrupt launch schedules, analysts point out that DRAM and NAND prices have risen 80–90% since early 2026, making a 2027 release increasingly uncertain.'),

  // Hardware
  heading('Rumoured Hardware: A Leap in Performance', 2),

  heading('Processor and Graphics', 3),
  blockWithLinks([
    { text: 'Leaks strongly suggest that Sony will remain partnered with AMD. Reports from Wccftech and industry insiders say the PS6 will use a custom chip combining Zen 6 CPU cores with an RDNA 5-based GPU, capable of delivering around 34–40 teraflops of raster power — roughly triple the base PS5. ' },
    { text: 'Sony and AMD\'s joint Project Amethyst', href: WCCF_AMETHYST },
    { text: ' introduces Radiance Cores, dedicated units that accelerate ray-tracing calculations and may provide up to a 6–12× boost over the PS5. Neural Arrays turn groups of compute units into AI engines for upscaling and denoising, underpinning PSSR upscaling and machine-learning frame generation.' },
  ]),

  heading('Memory and Storage', 3),
  blockWithLinks([
    { text: 'Rumours indicate the PS6 will upgrade to GDDR7 memory, with Sony using a narrower, energy-efficient bus alongside Universal Compression technology to effectively boost bandwidth. ' },
    { text: 'The console is expected to launch without a built-in disc drive', href: INSIDER_DISC },
    { text: ', relying on a detachable add-on for physical media, and will include a 1 TB NVMe SSD. Support for HDMI 2.2 and USB4 would enable high-resolution video output and faster peripheral connections.' },
  ]),

  // AI
  heading('AI and Next-Gen Features', 2),
  blockWithLinks([
    { text: 'Project Amethyst\'s technologies will be central to the PS6. Radiance Cores accelerate ray tracing, Neural Arrays enable AI-assisted upscaling, and Universal Compression reduces memory bandwidth demands. ' },
    { text: 'an AI frame-generation library is planned for PlayStation', href: VERGE_AI },
    { text: ', though it is unclear whether it will debut before the PS6 launches. Sony has also filed patents for AI companions and an in-game rewind system — signalling a broader vision for AI-powered gameplay.' },
  ]),

  // Handheld
  heading('Project Canis: A Potential Handheld Companion', 2),
  blockWithLinks([
    { text: 'Several leakers claim Sony is working on ' },
    { text: 'Project Canis, a handheld companion device built around a 3 nm APU', href: WCCF_CANIS },
    { text: ' with high-performance and efficiency cores paired with a cut-down RDNA 5 GPU. The goal is a portable console that can run PS6 games at reduced settings and share a common software base with the home system — mirroring Nintendo\'s hybrid strategy.' },
  ]),

  // Ecosystem
  heading('Ecosystem and Backward Compatibility', 2),
  block('Because the PS6 will continue using AMD hardware, most analysts expect backward compatibility with PS5 and likely PS4 titles. Players expect to carry existing libraries forward and benefit from AI-driven upscaling and faster load times. Sony\'s investment in PlayStation Plus streaming hints that older games may also be accessible via the cloud, while Project Canis would further blur the lines between home and portable play.'),

  // Pricing
  heading('Pricing Speculation', 2),
  block('Sony has not set a price, but most insiders expect the PS6 to be considerably more expensive than the PS5. Estimates suggest a bill of materials around $760, implying a retail price of $699 if Sony subsidises hardware. Analysts warn that high memory costs could push pricing toward $800 or even $999. Sony has already raised PS5 prices to $649 and $899 for the PS5 Pro, so a premium price for the PS6 would not be without precedent.'),

  // Conclusion
  heading('When Is the PS6 Coming Out?', 2),
  block('With no official announcement, the PS6 release date remains speculative. The traditional seven-year cycle points to 2027, but DRAM shortages and the ambitious scope of Project Amethyst may push it to 2028 or 2029. Hardware leaks suggest a console with a Zen 6 CPU, an RDNA 5-based GPU delivering up to 40 teraflops, GDDR7 memory and AI-accelerated features that could transform both visuals and gameplay. Price predictions range from a subsidised $499 to nearly $1,000 depending on memory costs and market positioning.'),
  block('For now, fans eager for PlayStation 6 details will have to watch for official announcements, likely at Sony\'s showcase events in 2026–27. Until then, the only certainty is that the next generation will be shaped by AI, advanced ray tracing and the realities of the global semiconductor market.'),
]

async function run() {
  const article = await client.fetch(
    `*[_type == "article" && slug.current == "ps6-specs"][0]{ _id, title, slug }`
  )
  if (!article) { console.error('❌ Article not found'); process.exit(1) }
  console.log(`✅ Found: "${article.title}" (${article._id})`)

  await client.patch(article._id).set({
    title: 'PS6 Specs, Rumors and News: What We Know as of April 2026',
    excerpt: 'From DRAM shortages delaying the launch to AMD\'s Project Amethyst and AI-powered upscaling — here\'s everything credibly known about PS6 specs and features as of April 2026.',
    body,
    updatedAt: new Date().toISOString(),
  }).commit()

  console.log('✅ Article updated successfully!')
}

run().catch(err => { console.error(err); process.exit(1) })
