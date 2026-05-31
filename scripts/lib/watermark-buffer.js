/**
 * Server-side image watermarking using sharp.
 * Bakes the PS6News logo + "ps6news.com" onto an image buffer (bottom-right,
 * on a soft translucent backdrop) and returns a JPEG buffer.
 *
 * Used by the auto-publisher so every published image is watermarked, and by
 * the backfill script for existing images.
 */

const axios = require('axios')
const sharp = require('sharp')

const LOGO_URL =
  'https://cdn.sanity.io/images/zzzwo1aw/production/5746ab3938ea01ef12a809d319ef335048f021b7-1255x195.png'
const SITE_URL = 'ps6news.com'
const LOGO_ASPECT = 195 / 1255 // height / width

let logoCache = null
async function getLogoBuffer() {
  if (logoCache) return logoCache
  const res = await axios.get(LOGO_URL, { responseType: 'arraybuffer', timeout: 15000 })
  logoCache = Buffer.from(res.data)
  return logoCache
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
  const logoW = Math.min(Math.round(W * 0.24), 460)
  const logoH = Math.round(logoW * LOGO_ASPECT)
  const urlFontSize = Math.max(Math.round(logoW * 0.135), 12)
  const gap = Math.round(logoH * 0.38)
  const boxPadX = Math.round(logoW * 0.1)
  const boxPadY = Math.round(logoH * 0.55)
  const boxW = logoW + boxPadX * 2
  const boxH = logoH + gap + urlFontSize + boxPadY * 2
  const boxX = Math.max(0, W - margin - boxW)
  const boxY = Math.max(0, H - margin - boxH)
  const logoX = boxX + boxPadX
  const logoY = boxY + boxPadY
  const radius = Math.round(boxH * 0.18)
  const textX = logoX + logoW / 2
  const textY = logoY + logoH + gap + urlFontSize // SVG text y is the baseline

  // Resize the logo to fit
  const logoBuf = await sharp(await getLogoBuffer())
    .resize(logoW, logoH, { fit: 'fill' })
    .png()
    .toBuffer()

  // Backdrop + URL text as an SVG overlay
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${radius}" ry="${radius}" fill="rgb(8,12,22)" fill-opacity="0.42"/>
    <text x="${textX}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="${urlFontSize}" font-weight="600" fill="rgb(255,255,255)" fill-opacity="0.95" text-anchor="middle">${escapeXml(SITE_URL)}</text>
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
