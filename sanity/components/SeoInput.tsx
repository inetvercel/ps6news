import {useState} from 'react'
import {ObjectInputProps, set, useFormValue} from 'sanity'
import {Stack, Button, Card, Text, Flex, Badge} from '@sanity/ui'
import {SparklesIcon} from '@sanity/icons'

/**
 * SEO meta input: renders the default Meta Title / Meta Description fields plus
 * a "Generate with AI" button that produces an SEO-optimised title + description
 * from the article content and writes them into the fields.
 */
export function SeoInput(props: ObjectInputProps) {
  const {onChange} = props
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  const title = useFormValue(['title']) as string | undefined
  const excerpt = useFormValue(['excerpt']) as string | undefined
  const category = useFormValue(['category']) as any
  const body = useFormValue(['body']) as any[] | undefined

  const value = (props.value || {}) as {metaTitle?: string; metaDescription?: string}

  function bodyToText(blocks?: any[]): string {
    if (!Array.isArray(blocks)) return ''
    return blocks
      .filter((b) => b && b._type === 'block' && Array.isArray(b.children))
      .map((b) => b.children.map((c: any) => c.text || '').join(''))
      .join(' ')
      .slice(0, 1500)
  }

  const generate = async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/seo/generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: title || '',
          excerpt: excerpt || '',
          body: bodyToText(body),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
      if (!data.metaTitle || !data.metaDescription) {
        throw new Error('AI did not return both fields')
      }
      onChange([
        set(data.metaTitle, ['metaTitle']),
        set(data.metaDescription, ['metaDescription']),
      ])
      setStatus('idle')
    } catch (e: any) {
      setStatus('error')
      setError(e?.message || 'Generation failed')
    }
  }

  const titleLen = value.metaTitle?.length || 0
  const descLen = value.metaDescription?.length || 0

  return (
    <Stack space={3}>
      <Flex gap={2} align="center" wrap="wrap">
        <Button
          icon={SparklesIcon}
          tone="primary"
          text={status === 'loading' ? 'Generating…' : 'Generate with AI'}
          onClick={generate}
          disabled={status === 'loading' || !title}
        />
        {value.metaTitle && (
          <Badge tone={titleLen >= 50 && titleLen <= 60 ? 'positive' : 'caution'} fontSize={0}>
            Title {titleLen}
          </Badge>
        )}
        {value.metaDescription && (
          <Badge tone={descLen >= 150 && descLen <= 160 ? 'positive' : 'caution'} fontSize={0}>
            Desc {descLen}
          </Badge>
        )}
      </Flex>

      {status === 'error' && (
        <Card padding={3} radius={2} tone="critical" border>
          <Text size={1}>SEO generation failed: {error}</Text>
        </Card>
      )}

      {props.renderDefault(props)}
    </Stack>
  )
}
