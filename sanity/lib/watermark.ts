/**
 * Browser-side watermarking utility for the Sanity Studio.
 * Loads a source image + the PS6News logo onto a canvas, composites a clean
 * branded watermark (logo with "ps6news.com" beneath it on a soft backdrop),
 * and returns a JPEG Blob ready to upload as a new asset.
 *
 * Only runs in the browser (uses canvas / Image) — never imported server-side
 * at module-eval time.
 */

const LOGO_URL =
  'https://cdn.sanity.io/images/zzzwo1aw/production/5746ab3938ea01ef12a809d319ef335048f021b7-1255x195.png'
const SITE_URL = 'ps6news.com'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export interface WatermarkOptions {
  /** Watermark corner. Default 'bottom-right'. */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  /** Logo width as a fraction of the image width. Default 0.24. */
  scale?: number
}

/**
 * Returns a watermarked JPEG Blob for the given source image URL.
 */
export async function watermarkImageBlob(
  sourceUrl: string,
  opts: WatermarkOptions = {},
): Promise<Blob> {
  const position = opts.position || 'bottom-right'
  const scale = opts.scale || 0.24

  const [base, logo] = await Promise.all([loadImage(sourceUrl), loadImage(LOGO_URL)])

  const W = base.naturalWidth
  const H = base.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  // Base image
  ctx.drawImage(base, 0, 0, W, H)

  // Watermark geometry (scaled relative to image width so it looks right at any size)
  const margin = Math.round(W * 0.025)
  const logoW = Math.min(Math.round(W * scale), 460)
  const logoAspect = logo.naturalHeight / logo.naturalWidth
  const logoH = Math.round(logoW * logoAspect)
  const urlFontSize = Math.max(Math.round(logoW * 0.135), 12)
  const gap = Math.round(logoH * 0.38)

  const boxPadX = Math.round(logoW * 0.1)
  const boxPadY = Math.round(logoH * 0.55)
  const contentW = logoW
  const contentH = logoH + gap + urlFontSize
  const boxW = contentW + boxPadX * 2
  const boxH = contentH + boxPadY * 2

  let boxX: number
  if (position === 'bottom-left') boxX = margin
  else if (position === 'bottom-center') boxX = Math.round((W - boxW) / 2)
  else boxX = W - margin - boxW
  const boxY = H - margin - boxH

  // Soft translucent backdrop for legibility on any image
  ctx.save()
  roundRect(ctx, boxX, boxY, boxW, boxH, Math.round(boxH * 0.18))
  ctx.fillStyle = 'rgba(8,12,22,0.42)'
  ctx.fill()
  ctx.restore()

  // Logo
  const logoX = boxX + boxPadX
  const logoY = boxY + boxPadY
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = Math.round(logoW * 0.04)
  ctx.drawImage(logo, logoX, logoY, logoW, logoH)
  ctx.restore()

  // URL beneath the logo
  ctx.save()
  ctx.font = `600 ${urlFontSize}px -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = Math.round(urlFontSize * 0.45)
  ctx.fillText(SITE_URL, logoX + logoW / 2, logoY + logoH + gap)
  ctx.restore()

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/jpeg',
      0.92,
    )
  })
}
