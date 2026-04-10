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

// ─── 5 external links (one use each) ─────────────────────────────────────
const GAMESRADAR    = 'https://www.gamesradar.com/gta-6-guide/'
const TWEAKTOWN_DELAY = 'https://www.tweaktown.com/news/108955/gta-6-delay-could-see-next-gen-playstation-6-and-xbox-consoles-delayed-too-says-analyst/index.html'
const TWEAKTOWN_4K  = 'https://www.tweaktown.com/news/106842/playstation-6-is-4k-120fps-console-with-5-10x-the-ray-tracing-performance-over-base-ps5/index.html'
const SCREENRANT    = 'https://screenrant.com/gta-6-graphical-breakdown-raytracing/'
const GTABOOM       = 'https://www.gtaboom.com/the-rumored-ps6-delay-could-be-the-best-thing-to-happen-to-gta-6-and-this-is-why-fa57'

const body = [

  // Intro
  blockWithLinks([
    { text: 'Rockstar Games has been gradually pushing back the release of Grand Theft Auto VI. In May 2025 the developer confirmed the game would arrive on PS5 and Xbox Series X/S in late 2025, but that window slipped again in November 2025. Rockstar ' },
    { text: 'officially confirmed', href: GAMESRADAR },
    { text: ' a November 19, 2026 release date, apologising for "adding additional time to what we realise has been a long wait." The game is now scheduled to debut exclusively on current-generation consoles, with a PC version expected to follow later. Sony has secured marketing rights and is expected to offer special PS5 and PS5 Pro bundles.' },
  ]),

  // Key Takeaways
  {
    _type: 'keyTakeaways',
    _key: key(),
    items: [
      'GTA 6 launches November 19, 2026 on PS5 and Xbox Series X/S — exclusively on current-gen hardware, with no PS6 version confirmed.',
      'Analysts say the PS6 is more likely to arrive in 2028–2029 than 2027, partly because Sony may extend the PS5\'s lifecycle to capitalise on GTA 6 hardware sales.',
      'PS6 hardware leaks suggest 34–40 teraflops of raster power and 5–10× the ray-tracing capability of the base PS5 — exactly the kind of upgrade needed to run GTA 6 at 4K/120fps.',
      'Backward compatibility is expected, meaning existing copies of GTA 6 should work on PS6, with a likely enhanced re-release down the line.',
    ]
  },

  // Will GTA 6 come to PS6?
  heading('Will GTA 6 Come to the PS6?', 2),
  block('The short answer is: not at launch, but almost certainly eventually. GTA 6 is confirmed only for PS5 and Xbox Series X/S. No next-generation version has been announced. However, history offers a strong precedent — GTA 5 launched on PS3 and Xbox 360 in 2013, then received enhanced editions for PS4, PS5 and PC. The same pattern is widely expected for GTA 6.'),
  block('Rockstar and Take-Two have given no hints of delaying GTA 6 to coincide with the PS6. Given that the game has already been delayed multiple times, another delay is considered extremely unlikely. The more probable scenario is a current-gen launch followed by a premium PS6 re-release sometime after Sony\'s next console arrives.'),

  // Analyst view on timing
  heading('How GTA 6\'s Delay Could Reshape PS6 Timing', 2),
  blockWithLinks([
    { text: 'The interplay between GTA 6 and the PS6 is more nuanced than it might appear. Piers Harding-Rolls of Ampere Analysis told GamesIndustry.biz that his firm still models next-gen PlayStation and Xbox launches for 2027, but warned that platform holders could be ' },
    { text: 'riding the GTA 6 wave', href: TWEAKTOWN_DELAY },
    { text: '. He explained that GTA 6 is such an important driver of hardware sales that Sony and Microsoft might want to maximise PS5 and Xbox Series revenue before releasing new consoles — particularly with cross-generational compatibility now standard practice.' },
  ]),
  block('GTABoom notes that if there is no PS6 until 2028 or 2029, GTA 6 effectively becomes the flagship title for the PS5\'s extended lifecycle — giving the console a run reminiscent of the PS2, which continued selling well into the PS3 era. This scenario would force Rockstar to optimise GTA 6 deeply for PS5 hardware and could push the console toward record lifetime sales.'),

  // Graphics comparison
  heading('Graphics: What GTA 6 Reveals About Next-Gen Demands', 2),
  blockWithLinks([
    { text: 'A ScreenRant analysis of the first GTA 6 trailer highlighted ' },
    { text: 'ray-traced reflections and global illumination in the trailer', href: SCREENRANT },
    { text: ' visible across car windows, sunglasses and mirrors, with complex multi-layer shadowing throughout every scene. The article emphasised that these visuals appear to be captured on PS5 Pro or high-end PC hardware, and that base PS5 units may be locked to 30fps to maintain that fidelity.' },
  ]),
  block('Digital Foundry\'s breakdown of the trailer similarly suggested the game runs at around 30fps with ray tracing enabled on current hardware, implying there is performance headroom for a 60fps mode on PS5 Pro or PC. This is precisely where the PS6 enters the picture.'),

  // PS6 hardware
  heading('What PS6 Hardware Would Mean for GTA 6', 2),
  blockWithLinks([
    { text: 'Hardware leaks consistently point to the PS6 delivering around 34–40 teraflops of raster performance — roughly triple the base PS5 — alongside 5–10× the ray-tracing capability. ' },
    { text: '4K/120fps gaming with advanced ray tracing', href: TWEAKTOWN_4K },
    { text: ', asking: "Can you imagine running Grand Theft Auto 6 at 4K 120fps on the PlayStation 6? In the years ahead, we\'ll see it happen." Neural Arrays, Radiance Cores and Universal Compression — Sony and AMD\'s Project Amethyst features — are designed to overcome the memory bandwidth limitations that have held back console graphics.' },
  ]),
  block('Combined with a 1 TB or larger NVMe SSD and support for HDMI 2.2 and USB4, this spec sheet would allow GTA 6 to run at resolutions and frame rates the PS5 simply cannot reach. The PS5 version may cap at 30–60fps depending on mode; the PS6 edition could plausibly target a stable 4K/60fps or even 4K/120fps in a performance mode.'),

  // Backward compat and bundles
  heading('Backward Compatibility, Bundles and the Digital Question', 2),
  block('Sony moved to the x86 architecture with the PS5 and is expected to retain this approach in the PS6, meaning GTA 6 will run on both systems. Polygon notes that players now expect new PlayStation consoles to offer backward compatibility, and failing to support PS5 titles would be commercially unacceptable. When the PS6 arrives, existing copies of GTA 6 should work on the new hardware out of the box.'),
  blockWithLinks([
    { text: 'GTABoom speculates that Rockstar will also want to "sell you multiple copies of the game" — encouraging players to buy the PS5 version now and upgrade to a premium PS6 edition later, much as GTA 5 was re-released for PS4 and PS5. ' },
    { text: 'PS6 launch bundles anchored around GTA 6', href: GTABOOM },
    { text: ', similar to the PS5 bundles it arranged around the game\'s marketing rights. A digital-only launch for GTA 6 on PS5 — which some retail sources have suggested — would further align with Sony\'s strategy of push subscriptions, cross-gen entitlements and day-one upgrade paths.' },
  ]),

  // Conclusion
  heading('The Bigger Picture', 2),
  block('GTA 6 and the PS6 are on separate but deeply intertwined trajectories. The game arrives on current-gen hardware in November 2026; the PS6 is unlikely before late 2028. In the intervening years, GTA 6 will drive PS5 sales, potentially extending Sony\'s current console lifecycle and giving Rockstar more time to optimise. When the PS6 does arrive, GTA 6 will almost certainly follow — remastered, upgraded and running at frame rates that make it feel like a new game all over again.'),
]

async function run() {
  const article = await client.fetch(
    `*[_type == "article" && slug.current == "gta6-release"][0]{ _id, title, slug }`
  )
  if (!article) { console.error('❌ Article not found'); process.exit(1) }
  console.log(`✅ Found: "${article.title}" (${article._id})`)

  await client.patch(article._id).set({
    title: 'PS6 and GTA 6: Release Timing, Graphics and Next-Generation Potential',
    excerpt: 'GTA 6 launches on PS5 in November 2026, but what does that mean for the PS6? We break down the release timing overlap, graphical demands and what a PS6 version of GTA 6 could look like.',
    body,
    updatedAt: new Date().toISOString(),
  }).commit()

  console.log('✅ Article updated successfully!')
}

run().catch(err => { console.error(err); process.exit(1) })
