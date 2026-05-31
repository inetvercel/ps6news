/**
 * Server-side image watermarking using sharp.
 * Bakes the PS6News logo + "ps6news.com" onto an image buffer (bottom-right,
 * on a soft translucent backdrop) and returns a JPEG buffer.
 *
 * Used by the auto-publisher so every published image is watermarked, and by
 * the backfill script for existing images.
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')
const sharp = require('sharp')

const LOGO_URL =
  'https://cdn.sanity.io/images/zzzwo1aw/production/5746ab3938ea01ef12a809d319ef335048f021b7-1255x195.png'
const SITE_URL = 'PS6NEWS.COM'
const LOGO_ASPECT = 195 / 1255 // height / width

let logoCache = null
async function getLogoBuffer() {
  if (logoCache) return logoCache
  const res = await axios.get(LOGO_URL, { responseType: 'arraybuffer', timeout: 15000 })
  logoCache = Buffer.from(res.data)
  return logoCache
}

// Locate the bundled font on disk. We render the URL text with sharp's native
// text engine using this file directly (via the `fontfile` option) — this is
// reliable across platforms (Windows dev + Linux serverless), unlike SVG
// @font-face which librsvg does not honour in many builds (-> tofu boxes).
let fontPath = null
let fontPathResolved = false
function getFontPath() {
  if (fontPathResolved) return fontPath
  fontPathResolved = true
  const candidates = [
    path.join(__dirname, '..', 'assets', 'Rajdhani-SemiBold.ttf'),
    path.join(process.cwd(), 'scripts', 'assets', 'Rajdhani-SemiBold.ttf'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      fontPath = p
      return fontPath
    }
  }
  fontPath = null
  return fontPath
}

// Render a single line of text to an RGBA PNG buffer using libvips/pango with
// the bundled TTF. Returns {buffer, width, height}.
async function renderText(text, {pt, color, letterSpacing}) {
  const fp = getFontPath()
  const spacing = Math.round((letterSpacing || 0) * 1024)
  const textOpts = {
    text: `<span letter_spacing="${spacing}" foreground="${color}">${escapeXml(text)}</span>`,
    font: `Rajdhani SemiBold ${pt}`,
    rgba: true,
    dpi: 72,
  }
  if (fp) textOpts.fontfile = fp
  const out = await sharp({ text: textOpts }).png().toBuffer({ resolveWithObject: true })
  return { buffer: out.data, width: out.info.width, height: out.info.height }
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c])
  )
}

/**
 * @param {Buffer} inputBuffer Source image bytes
 * @returns {Promise<Buffer>} Watermarked JPEG bytes
 */
async function applyWatermark(inputBuffer) {
  // Normalise orientation first so width/height are accurate.
  const normalized = await sharp(inputBuffer).rotate().toBuffer()
  const img = sharp(normalized)
  const meta = await img.metadata()
  const W = meta.width
  const H = meta.height
  if (!W || !H) throw new Error('Could not read image dimensions')

  // Geometry (scaled to image width so it looks right at any size)
  const margin = Math.round(W * 0.025)
  const logoW = Math.min(Math.round(W * 0.2), 380)
  const logoH = Math.round(logoW * LOGO_ASPECT)
  // Larger URL (~38% of logo height) for stronger branding / readability.
  const urlFontSize = Math.max(Math.round(logoH * 0.38), 14)
  const letterSpacing = Math.max(urlFontSize * 0.1, 1)
  const gap = Math.round(logoH * 0.34)
  // Tighter padding so the badge is more compact around the content.
  const boxPadX = Math.round(logoW * 0.08)
  const boxPadY = Math.round(logoH * 0.42)
  const boxW = logoW + boxPadX * 2
  const boxH = logoH + gap + urlFontSize + boxPadY * 2
  const boxX = Math.max(0, W - margin - boxW)
  const boxY = Math.max(0, H - margin - boxH)
  const logoX = boxX + boxPadX
  const logoY = boxY + boxPadY
  const radius = Math.round(boxH * 0.16)
  const textX = logoX + logoW / 2
  const textY = logoY + logoH + gap + urlFontSize // SVG text y is the baseline
  const accentH = Math.max(Math.round(boxH * 0.045), 2)
  const glowStd = Math.max(urlFontSize * 0.14, 1.5)

  // Resize the logo to fit
  const logoBuf = await sharp(await getLogoBuffer())
    .resize(logoW, logoH, { fit: 'fill' })
    .png()
    .toBuffer()

  // Backdrop only (SVG): darker glassy gradient, soft inner border, and a thin
  // PlayStation-blue accent under the logo. Text is rendered separately below.
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wmbg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgb(6,10,20)" stop-opacity="0.74"/>
        <stop offset="1" stop-color="rgb(2,4,10)" stop-opacity="0.86"/>
      </linearGradient>
      <linearGradient id="wmaccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="rgb(0,112,255)" stop-opacity="0"/>
        <stop offset="0.5" stop-color="rgb(56,160,255)" stop-opacity="0.95"/>
        <stop offset="1" stop-color="rgb(0,112,255)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${radius}" ry="${radius}" fill="url(#wmbg)"/>
    <rect x="${boxX + 0.5}" y="${boxY + 0.5}" width="${boxW - 1}" height="${boxH - 1}" rx="${radius}" ry="${radius}" fill="none" stroke="rgb(255,255,255)" stroke-opacity="0.14" stroke-width="1"/>
    <rect x="${textX - logoW * 0.32}" y="${logoY + logoH + gap * 0.42}" width="${logoW * 0.64}" height="${accentH}" rx="${accentH / 2}" fill="url(#wmaccent)"/>
  </svg>`

  // Render the URL text with the bundled font (reliable everywhere).
  const urlWhite = await renderText(SITE_URL, {
    pt: urlFontSize,
    color: '#ffffff',
    letterSpacing,
  })
  // Soft blue glow = a blurred blue copy composited underneath.
  const glowBlue = await renderText(SITE_URL, {
    pt: urlFontSize,
    color: '#38a0ff',
    letterSpacing,
  })
  const glowBuf = await sharp(glowBlue.buffer).blur(glowStd).png().toBuffer()

  const textTop = Math.round(logoY + logoH + gap)
  const textLeft = Math.round(textX - urlWhite.width / 2)
  const glowLeft = Math.round(textX - glowBlue.width / 2)
  const glowTop = textTop + Math.round((urlWhite.height - glowBlue.height) / 2)

  return await img
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: logoBuf, top: logoY, left: logoX },
      { input: glowBuf, top: Math.max(0, glowTop), left: Math.max(0, glowLeft) },
      { input: urlWhite.buffer, top: textTop, left: Math.max(0, textLeft) },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
}

module.exports = { applyWatermark }
