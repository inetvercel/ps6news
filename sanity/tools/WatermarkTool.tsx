import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {
  Card,
  Stack,
  Flex,
  Box,
  Text,
  Heading,
  Button,
  Spinner,
  TextInput,
  Grid,
  Checkbox,
  Badge,
} from '@sanity/ui'
import {SearchIcon, RefreshIcon} from '@sanity/icons'

type Asset = {
  _id: string
  url: string
  originalFilename?: string
  _createdAt: string
}

const SECRET_KEY = 'ps6-admin-secret'

export default function WatermarkTool() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState<{tone: 'positive' | 'critical'; text: string} | null>(null)
  const [secret, setSecret] = useState('')

  useEffect(() => {
    setSecret(localStorage.getItem(SECRET_KEY) || '')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await client.fetch<Asset[]>(
        `*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0...200]{ _id, url, originalFilename, _createdAt }`
      )
      setAssets(data)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      assets.filter((a) =>
        (a.originalFilename || a._id).toLowerCase().includes(query.toLowerCase())
      ),
    [assets, query]
  )

  const selectedIds = Object.keys(selected).filter((k) => selected[k])

  const toggle = (id: string) =>
    setSelected((s) => ({...s, [id]: !s[id]}))

  const isWm = (a: Asset) => /watermark/i.test(a.originalFilename || '')

  const apply = async () => {
    if (selectedIds.length === 0) return
    setWorking(true)
    setMessage(null)
    try {
      localStorage.setItem(SECRET_KEY, secret)
      const res = await fetch('/api/watermark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({assetIds: selectedIds}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

      const ok = data.results.filter((r: any) => r.ok)
      const failed = data.results.filter((r: any) => !r.ok)
      const docCount = ok.reduce((n: number, r: any) => n + (r.updatedDocs || 0), 0)

      if (failed.length === 0) {
        setMessage({
          tone: 'positive',
          text: `Watermarked ${ok.length} image(s); updated ${docCount} article reference(s).`,
        })
      } else {
        setMessage({
          tone: 'critical',
          text: `Done: ${ok.length} ok, ${failed.length} failed — ${failed
            .map((f: any) => f.error)
            .join('; ')}`,
        })
      }
      setSelected({})
      await load()
    } catch (e: any) {
      setMessage({tone: 'critical', text: e?.message || 'Failed'})
    } finally {
      setWorking(false)
    }
  }

  return (
    <Box padding={4} style={{maxWidth: 1100, margin: '0 auto'}}>
      <Stack space={4}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={2}>
            <Heading size={3}>Watermark Images</Heading>
            <Text size={1} muted>
              {loading
                ? 'Loading…'
                : `${filtered.length} image(s) • ${selectedIds.length} selected`}
            </Text>
          </Stack>
          <Flex gap={2} align="center">
            <Button icon={RefreshIcon} mode="ghost" text="Refresh" onClick={load} disabled={loading} />
            <Button
              tone="primary"
              text={working ? 'Working…' : `Apply Watermark (${selectedIds.length})`}
              onClick={apply}
              disabled={working || selectedIds.length === 0}
            />
          </Flex>
        </Flex>

        <Card padding={3} radius={2} border tone="transparent">
          <Stack space={3}>
            <Text size={1} muted>
              Applies the PS6News watermark to the selected images and automatically repoints
              every article using them. The originals are kept in your library.
            </Text>
            <TextInput
              type="password"
              placeholder="Admin secret (if configured on the server)"
              value={secret}
              onChange={(e) => setSecret(e.currentTarget.value)}
            />
          </Stack>
        </Card>

        <TextInput
          icon={SearchIcon}
          placeholder="Search by filename…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          clearButton={query.length > 0}
          onClear={() => setQuery('')}
        />

        {message && (
          <Card padding={3} radius={2} tone={message.tone} border>
            <Text size={1}>{message.text}</Text>
          </Card>
        )}

        {loading ? (
          <Flex align="center" justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        ) : (
          <Grid columns={[2, 3, 4, 5]} gap={3}>
            {filtered.map((a) => {
              const isSel = !!selected[a._id]
              return (
                <Card
                  key={a._id}
                  radius={2}
                  border
                  tone={isSel ? 'primary' : 'default'}
                  onClick={() => toggle(a._id)}
                  style={{cursor: 'pointer', overflow: 'hidden'}}
                >
                  <Box style={{position: 'relative', paddingTop: '66%'}}>
                    <img
                      src={`${a.url}?w=300&h=200&fit=crop`}
                      alt={a.originalFilename || ''}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box style={{position: 'absolute', top: 8, left: 8}}>
                      <Checkbox checked={isSel} readOnly />
                    </Box>
                    {isWm(a) && (
                      <Box style={{position: 'absolute', top: 8, right: 8}}>
                        <Badge tone="positive" fontSize={0}>WM</Badge>
                      </Box>
                    )}
                  </Box>
                  <Box padding={2}>
                    <Text size={0} textOverflow="ellipsis" muted>
                      {a.originalFilename || a._id}
                    </Text>
                  </Box>
                </Card>
              )
            })}
          </Grid>
        )}
      </Stack>
    </Box>
  )
}
