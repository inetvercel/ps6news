const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: 'zzzwo1aw',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

// Helper: plain paragraph block
function block(text) {
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  }
}

// Helper: heading block
function heading(text, level = 2) {
  return {
    _type: 'block',
    _key: key(),
    style: `h${level}`,
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text, marks: [] }],
  }
}

// Helper: paragraph with an inline hyperlink
// segments: array of { text, href? }
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

let _k = 1
function key() { return 'k' + (_k++).toString().padStart(4, '0') }

// ─── 5 chosen external links ───────────────────────────────────────────────
const WCCF_DELAY    = 'https://wccftech.com/playstation-6-delay-2028-2029-nintendo-switch-2-price-increase-2026/'
const WCCF_CERNY    = 'https://wccftech.com/sony-amd-mark-cerny-jack-huynh-project-amethyst-ps6-playstation-6/'
const INSIDER_DISC  = 'https://insider-gaming.com/exclusive-playstation-6-is-planned-to-have-a-detachable-disc-drive-on-launch/'
const YANKO_DESIGN  = 'https://www.yankodesign.com/2022/01/12/this-playstation-6-concept-is-a-minimalistic-gaming-console-sony-could-design-in-the-near-future/'
const TRENDHUNTER   = 'https://www.trendhunter.com/trends/playstation-6-console-concept'

// ─── Article body ──────────────────────────────────────────────────────────
const body = [

  // ── Intro ─────────────────────────────────────────────────────────────────
  heading('Rising Curiosity About Sony\'s Next Console', 2),
  block('The PS6 may still be a few years away, but curiosity around Sony\'s next-generation console is already driving huge search volumes. Phrases like "PS6 release date" (around 65,000 monthly searches) and "PlayStation 6 release date" (about 30,000) reflect how eager players are for news on the system\'s launch. With the PS5 now in the middle of its lifecycle, this article summarises the most credible information available as of April 2026 — highlighting when the new machine might arrive, what it could look like, and what hardware may lie inside.'),
  block('Note: All details below are based on leaks and analyst reports. Sony has not formally unveiled the PlayStation 6, and many aspects could change before its eventual release.'),

  // ── Key Takeaways — after intro ───────────────────────────────────────────
  {
    _type: 'keyTakeaways',
    _key: key(),
    items: [
      'The PS6 is unlikely to launch before late 2028, with some reports pointing to 2029 due to a global memory chip shortage.',
      'Sony is expected to use AMD\'s Zen 6 CPU cores and RDNA 5 GPU, built on TSMC\'s 2 nm process — delivering up to 3× the rasterization power of the PS5.',
      'The console will reportedly launch as digital-only, with a detachable disc drive available as an optional add-on.',
      'Early design leaks point to a slimmer, more conventional form factor — a sharp contrast to the PS5\'s divisive curved aesthetic.',
      'Sony is reportedly developing a companion handheld codenamed Project Canis, which would run games natively rather than via streaming.',
      'Patents for a "buttonless" touch-capacitive DualSense controller have surfaced, though patents don\'t always translate to final products.',
    ]
  },

  // ── Release window ────────────────────────────────────────────────────────
  heading('Release Window: Patience Required', 2),
  blockWithLinks([
    { text: 'Historically, Sony has followed a seven-year cadence for its home consoles: PlayStation 3 in 2006, PS4 in 2013 and PS5 in late 2020. By that measure, many expected the PS6 around holiday 2027. However, in February 2026, ' },
    { text: 'a potential delay to 2028 or even 2029', href: WCCF_DELAY },
    { text: ', blaming a global shortage of high-performance memory chips that has driven up RAM prices — a situation analysts have dubbed "RAMmageddon."' },
  ]),
  block('Sony\'s own executives have reinforced this cautious stance. During the company\'s Q2 fiscal 2026 earnings call, CFO Lin Tao told investors that the PS5 is only in the middle of its life cycle. PlayStation system architect Mark Cerny added that many next-generation technologies — neural-array upscalers, radiance cores for ray tracing and universal compression — currently exist only in simulation, and that he was excited to bring them to a future console "in a few years time."'),
  block('Most analysts now expect a PS6 launch window between late 2028 and late 2029, with the possibility of a limited announcement in 2027 if supply constraints ease.'),

  // ── Pricing ───────────────────────────────────────────────────────────────
  heading('Pricing Expectations', 2),
  block('Another major question is cost. The PS5 launched at US$499, but rising material costs have already triggered price hikes in several regions. Industry estimates suggest the PS6 will retail between US$500 and US$600, with some observers warning it could reach US$700 or more depending on memory prices. Leaker Kepler L2 suggests the bill of materials could sit around US$760, meaning Sony may need to subsidise the hardware at launch.'),

  // ── Hardware ──────────────────────────────────────────────────────────────
  heading('Hardware Rumours: Zen 6, RDNA 5 and Machine-Learning Magic', 2),
  block('Sony\'s long-standing partnership with AMD is expected to continue, with the PS6 using a custom system-on-chip built on TSMC\'s advanced 2 nm process. The chip is expected to combine eight Zen 6 CPU cores, high-bandwidth GDDR7 memory and a next-generation RDNA 5 graphics engine. Insider sources claim the PS6\'s rasterization performance could be roughly three times that of the base PS5, reaching between 34 and 40 TFlops, with ray-tracing speeds improving by six to twelve times.'),
  blockWithLinks([
    { text: 'PlayStation system architect Mark Cerny has teased these next-generation capabilities in ' },
    { text: 'a joint video with AMD covering Project Amethyst', href: WCCF_CERNY },
    { text: ' — a co-development effort covering neural arrays for AI upscaling, radiance cores for dedicated ray-tracing traversal, and universal data compression. Cerny noted that these technologies currently exist only in simulation, and he was excited to bring them to a future console "in a few years time."' },
  ]),

  // ── Disc drive ────────────────────────────────────────────────────────────
  heading('Digital-First with a Detachable Disc Drive', 2),
  blockWithLinks([
    { text: 'Leakers suggest the PS6 will ship without a built-in disc drive, relying on neural texture compression to reduce game sizes. To appease physical media fans, ' },
    { text: 'a detachable disc drive available separately', href: INSIDER_DISC },
    { text: '. The decision reportedly stems from a desire to reduce manufacturing and shipping costs while maximising space efficiency.' },
  ]),

  // ── Design leaks ──────────────────────────────────────────────────────────
  heading('Design Leaks and Early Concepts', 2),
  block('While the PS5\'s curvy tower design divided opinion, early leaks suggest the PS6 will adopt a more restrained aesthetic — a slimmer, more traditional silhouette focused on space efficiency. This aligns with reports that Sony is intentionally simplifying the design to reduce weight and maximise shipping space.'),

  blockWithLinks([
    { text: 'Design enthusiasts have already produced compelling concept renderings. Industrial designer She Yin\'s concept, ' },
    { text: 'published on Yanko Design', href: YANKO_DESIGN },
    { text: ', reimagines Sony\'s next console with clean lines and a minimalistic footprint — described as looking "more like a turntable." It combines elements of the PS2 and PS3 with a geometric form factor, larger vents for improved cooling, a top-loading disc slot, and all-white or black finishes. It serves as a retro-futuristic homage while signalling a return to understated design.' },
  ]),

  blockWithLinks([
    { text: 'A separate fan concept by Darko DARMAR Markovic, ' },
    { text: 'highlighted by Trend Hunter', href: TRENDHUNTER },
    { text: ', takes a very different approach — imagining a PS6 with an industrial and cyberpunk aesthetic that "ditches smooth lines in favor of a more utilitarian form." This rendering even integrates a redesigned DualSense controller into the side of the console for easy charging. While such concepts may not reflect Sony\'s final product, they illustrate the community\'s desire for both innovation and nostalgia.' },
  ]),

  // ── Controller ────────────────────────────────────────────────────────────
  heading('Controller Patents and Interface Changes', 2),
  block('Beyond the console itself, Sony\'s patents hint at radical changes to the DualSense controller. In early 2026, patents surfaced describing a "buttonless" controller that replaces traditional face buttons with a dynamic touch-capacitive surface. This would allow players to remap button layouts or swap D-pad and analogue stick positions to mimic an Xbox-style layout. Embedded touch sensors could detect gestures like tap, swipe, press and pinch. As Sony often files patents that never reach final products, it remains to be seen whether this concept will ship with the PS6.'),

  // ── Project Canis ─────────────────────────────────────────────────────────
  heading('Handheld Companion: Project Canis', 2),
  block('A surprising twist in PS6 rumours is the persistent mention of a companion handheld codenamed Project Canis. Rather than streaming like the PS Portal, the device would reportedly house its own AMD Zen 6c APU, 16 RDNA 5 compute units and 24–36 GB of LPDDR5X memory — delivering roughly half the rasterization power of the base PS5 but surpassing it in ray-tracing thanks to RDNA 5 efficiency gains. If true, the PS6 ecosystem could mimic Nintendo\'s strategy by offering seamless home and portable play.'),

  // ── State of speculation ──────────────────────────────────────────────────
  heading('The State of Speculation', 2),
  block('Because the PS6 has not been officially announced, speculation spans everything from credible leaks to fanciful fan art. At this stage, the only consensus is that the console is unlikely to arrive before late 2028, that it will rely on AMD\'s Zen 6 and RDNA 5 technology, and that Sony is exploring ways to make it cheaper to produce and ship. Meanwhile, concept designers continue to imagine radical takes — from minimalist turntables to cyberpunk-infused industrial sculptures.'),
  block('The true design will only be known once Sony reveals it officially, which may not occur until the PS5\'s extended life cycle winds down. Until then, the steady trickle of patents, analyst comments and speculative renderings provides a fascinating glimpse into what\'s possible.'),
]

async function run() {
  // Find the article by slug
  const article = await client.fetch(
    `*[_type == "article" && slug.current == "what-will-the-ps6-look-like"][0]{ _id, title, slug }`
  )

  if (!article) {
    console.error('❌ Article not found with slug: ps6-design-concept-predictions')
    process.exit(1)
  }

  console.log(`✅ Found article: "${article.title}" (${article._id})`)

  await client
    .patch(article._id)
    .set({
      title: 'What Will the PS6 Look Like? Early Speculations and Design Concepts',
      excerpt: 'From credible hardware leaks to striking fan concepts, here\'s everything we know about the PS6\'s likely design, specs, controller changes and companion handheld — as of April 2026.',
      body,
    })
    .commit()

  console.log('✅ Article updated successfully in Sanity!')
}

run().catch(err => { console.error(err); process.exit(1) })
