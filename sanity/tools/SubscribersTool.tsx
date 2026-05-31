import React, {useCallback, useEffect, useState} from 'react'
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
} from '@sanity/ui'
import {DownloadIcon, SearchIcon, RefreshIcon} from '@sanity/icons'

type Subscriber = {
  _id: string
  email: string
  subscribedAt?: string
}

function csvEscape(value: string | undefined) {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function SubscribersTool() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [subs, setSubs] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await client.fetch<Subscriber[]>(
        `*[_type == "subscriber"] | order(subscribedAt desc){ _id, email, subscribedAt }`
      )
      setSubs(data)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    load()
  }, [load])

  const filtered = subs.filter((s) =>
    s.email?.toLowerCase().includes(query.toLowerCase())
  )

  const downloadCsv = () => {
    const header = 'email,subscribedAt'
    const rows = filtered.map(
      (s) => `${csvEscape(s.email)},${csvEscape(s.subscribedAt)}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ps6news-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Box padding={4} style={{maxWidth: 900, margin: '0 auto'}}>
      <Stack space={4}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={2}>
            <Heading size={3}>Newsletter Subscribers</Heading>
            <Text size={1} muted>
              {loading ? 'Loading…' : `${subs.length} total subscriber${subs.length === 1 ? '' : 's'}`}
            </Text>
          </Stack>
          <Flex gap={2}>
            <Button
              icon={RefreshIcon}
              mode="ghost"
              text="Refresh"
              onClick={load}
              disabled={loading}
            />
            <Button
              icon={DownloadIcon}
              tone="primary"
              text="Download CSV"
              onClick={downloadCsv}
              disabled={loading || filtered.length === 0}
            />
          </Flex>
        </Flex>

        <TextInput
          icon={SearchIcon}
          placeholder="Search by email…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          clearButton={query.length > 0}
          onClear={() => setQuery('')}
        />

        {loading ? (
          <Flex align="center" justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        ) : (
          <Card border radius={2} overflow="hidden">
            <Flex
              padding={3}
              style={{borderBottom: '1px solid var(--card-border-color)'}}
            >
              <Box flex={2}>
                <Text size={1} weight="semibold" muted>EMAIL</Text>
              </Box>
              <Box flex={1}>
                <Text size={1} weight="semibold" muted>SUBSCRIBED</Text>
              </Box>
            </Flex>
            {filtered.length === 0 ? (
              <Box padding={4}>
                <Text size={1} muted align="center">No subscribers found.</Text>
              </Box>
            ) : (
              filtered.map((s, i) => (
                <Flex
                  key={s._id}
                  padding={3}
                  style={{
                    borderBottom:
                      i < filtered.length - 1
                        ? '1px solid var(--card-border-color)'
                        : 'none',
                  }}
                >
                  <Box flex={2}>
                    <Text size={1}>{s.email}</Text>
                  </Box>
                  <Box flex={1}>
                    <Text size={1} muted>
                      {s.subscribedAt
                        ? new Date(s.subscribedAt).toLocaleString()
                        : '—'}
                    </Text>
                  </Box>
                </Flex>
              ))
            )}
          </Card>
        )}
      </Stack>
    </Box>
  )
}
