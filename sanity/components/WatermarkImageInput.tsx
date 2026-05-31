import {useEffect, useRef, useState} from 'react'
import {ObjectInputProps, set, unset, useClient} from 'sanity'
import {watermarkImageBlob} from '../lib/watermark'

/**
 * Custom image input that adds a "Watermark" toggle. When ticked (and an image
 * is present) it bakes the PS6News logo + ps6news.com onto the image, uploads
 * the watermarked copy, and swaps the asset reference. Unticking restores the
 * original asset.
 *
 * Hidden helper fields used to make this safe & reversible:
 *   - watermarkApplied: guards against reprocessing / loops
 *   - originalAsset: reference to the pristine original so we can revert
 */
export function WatermarkImageInput(props: ObjectInputProps) {
  const {value, onChange} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle')
  const [error, setError] = useState('')
  const busy = useRef(false)

  const v = (value || {}) as any
  const watermark: boolean = !!v.watermark
  const watermarkApplied: boolean = !!v.watermarkApplied
  const assetRef: string | undefined = v.asset?._ref
  const originalAssetRef: string | undefined = v.originalAsset?._ref

  useEffect(() => {
    let cancelled = false

    async function reconcile() {
      if (busy.current) return

      // Apply watermark: ticked, has an asset, not already applied
      if (watermark && assetRef && !watermarkApplied) {
        busy.current = true
        setStatus('processing')
        setError('')
        try {
          const url: string = await client.fetch('*[_id == $id][0].url', {id: assetRef})
          if (!url) throw new Error('Could not resolve the original image URL')

          const blob = await watermarkImageBlob(url)
          const uploaded = await client.assets.upload('image', blob, {
            filename: `ps6news-watermarked-${Date.now()}.jpg`,
          })
          if (cancelled) return

          onChange([
            set({_type: 'reference', _ref: assetRef}, ['originalAsset']),
            set({_type: 'reference', _ref: uploaded._id}, ['asset']),
            set(true, ['watermarkApplied']),
          ])
          setStatus('idle')
        } catch (e: any) {
          if (!cancelled) {
            setStatus('error')
            setError(e?.message || 'Watermarking failed')
          }
        } finally {
          busy.current = false
        }
        return
      }

      // Remove watermark: unticked but a watermarked asset is in place -> revert
      if (!watermark && watermarkApplied && originalAssetRef) {
        busy.current = true
        try {
          onChange([
            set({_type: 'reference', _ref: originalAssetRef}, ['asset']),
            unset(['originalAsset']),
            set(false, ['watermarkApplied']),
          ])
          setStatus('idle')
        } finally {
          busy.current = false
        }
      }
    }

    reconcile()
    return () => {
      cancelled = true
    }
  }, [watermark, assetRef, watermarkApplied, originalAssetRef, client, onChange])

  return (
    <div>
      {props.renderDefault(props)}
      {status === 'processing' && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
            color: '#1f6feb',
            background: 'rgba(31,111,235,0.1)',
            border: '1px solid rgba(31,111,235,0.3)',
          }}
        >
          Applying watermark…
        </div>
      )}
      {status === 'error' && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 13,
            color: '#e5484d',
            background: 'rgba(229,72,77,0.1)',
            border: '1px solid rgba(229,72,77,0.3)',
          }}
        >
          Watermark failed: {error}
        </div>
      )}
    </div>
  )
}
