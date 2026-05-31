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

// Embed the font directly in the SVG so rendering is identical on every
// platform (Windows dev + Linux CI) and never depends on system fonts.
let fontDataUri = null
function getFontDataUri() {
  if (fontDataUri) return fontDataUri
  try {
    const ttf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'Rajdhani-SemiBold.ttf'))
    fontDataUri = `data:font/ttf;base64,${ttf.toString('base64')}`
  } catch {
    fontDataUri = null
  }
  return fontDataUri
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

  const font = getFontDataUri()
  const fontFace = font
    ? `@font-face { font-family: 'PS6'; src: url('${font}') format('truetype'); }`
    : ''
  const fontFamily = font ? 'PS6, Arial, sans-serif' : 'Arial, Helvetica, sans-serif'

  // Backdrop + URL text as an SVG overlay. Darker glassy gradient, a soft
  // inner border, and a thin PlayStation-blue accent under the logo.
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>${fontFace}</style>
      <linearGradient id="wmbg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgb(6,10,20)" stop-opacity="0.74"/>
        <stop offset="1" stop-color="rgb(2,4,10)" stop-opacity="0.86"/>
      </linearGradient>
      <linearGradient id="wmaccent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="rgb(0,112,255)" stop-opacity="0"/>
        <stop offset="0.5" stop-color="rgb(56,160,255)" stop-opacity="0.95"/>
        <stop offset="1" stop-color="rgb(0,112,255)" stop-opacity="0"/>
      </linearGradient>
      <filter id="wmglow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="${glowStd}"/>
      </filter>
    </defs>
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${radius}" ry="${radius}" fill="url(#wmbg)"/>
    <rect x="${boxX + 0.5}" y="${boxY + 0.5}" width="${boxW - 1}" height="${boxH - 1}" rx="${radius}" ry="${radius}" fill="none" stroke="rgb(255,255,255)" stroke-opacity="0.14" stroke-width="1"/>
    <rect x="${textX - logoW * 0.32}" y="${logoY + logoH + gap * 0.42}" width="${logoW * 0.64}" height="${accentH}" rx="${accentH / 2}" fill="url(#wmaccent)"/>
    <text x="${textX}" y="${textY}" font-family="${fontFamily}" font-size="${urlFontSize}" font-weight="700" letter-spacing="${letterSpacing}" fill="rgb(56,160,255)" filter="url(#wmglow)" text-anchor="middle">${escapeXml(SITE_URL)}</text>
    <text x="${textX}" y="${textY}" font-family="${fontFamily}" font-size="${urlFontSize}" font-weight="700" letter-spacing="${letterSpacing}" fill="rgb(255,255,255)" text-anchor="middle">${escapeXml(SITE_URL)}</text>
  </svg>`

  return await img
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
      { input: logoBuf, top: logoY, left: logoX },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
}

module.exports = { applyWatermark }
