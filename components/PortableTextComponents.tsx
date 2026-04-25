import {PortableTextComponents} from '@portabletext/react'
import Image from 'next/image'

function YouTubeEmbed({url}: {url: string}) {
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = getYouTubeId(url)
  
  if (!videoId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-ps-blue hover:underline">
        {url}
      </a>
    )
  }

  return (
    <div className="relative w-full my-8" style={{paddingBottom: '56.25%'}}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-xl"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function TableRenderer({html}: {html: string}) {
  return (
    <div 
      className="my-8 overflow-x-auto"
      dangerouslySetInnerHTML={{__html: html}}
    />
  )
}

function KeyTakeaways({ items }: { items: string[] }) {
  return (
    <div className="my-5 rounded-xl border border-[#1F2937] bg-[#111827]/60 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-xs">📌</span>
        <span className="text-[10px] font-black text-[#3BA3FF] uppercase tracking-widest">Key Takeaways</span>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded-full bg-[#1F2937] border border-[#3BA3FF]/40 flex items-center justify-center text-[8px] font-black text-[#3BA3FF]">
              {i + 1}
            </span>
            <span className="text-xs text-[#9CA3AF] leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({value}: any) => {
      const url = value?.asset?.url
      if (!url) return null
      return (
        <figure className="my-8">
          <Image
            src={url}
            alt={value.alt || ''}
            width={900}
            height={506}
            className="w-full rounded-xl"
          />
          {value.caption && (
            <figcaption className="text-center text-xs text-[#6B7280] mt-2">{value.caption}</figcaption>
          )}
        </figure>
      )
    },
    youtube: ({value}: any) => {
      return <YouTubeEmbed url={value.url} />
    },
    keyTakeaways: ({value}: any) => {
      return <KeyTakeaways items={value?.items || []} />
    },
    table: ({value}: any) => {
      const rows: {cells: string[]}[] = value?.rows || []
      if (!rows.length) return null
      const [headerRow, ...bodyRows] = rows
      return (
        <div className="not-prose my-8 rounded-xl overflow-hidden" style={{border:'1px solid rgba(59,163,255,0.18)', boxShadow:'0 0 30px rgba(0,112,209,0.12), 0 2px 8px rgba(0,0,0,0.5)'}}>
          <table className="w-full text-sm text-left" style={{borderCollapse:'collapse', margin:0}}>
            {headerRow && (
              <thead>
                <tr style={{background:'linear-gradient(90deg,#0058a8 0%,#0070D1 50%,#0ea5e9 100%)'}}>
                  {headerRow.cells.map((cell: string, i: number) => (
                    <th key={i} style={{padding:'12px 20px', fontWeight:700, color:'#fff', fontSize:'11px', letterSpacing:'0.08em', textTransform:'uppercase', whiteSpace:'nowrap', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>{cell}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {bodyRows.map((row, i) => (
                <tr
                  key={i}
                  className={`transition-colors duration-150 hover:bg-[#162032] ${i % 2 === 0 ? 'bg-[#0B0F1A]' : 'bg-[#0f1623]'}`}
                >
                  {row.cells.map((cell: string, j: number) => (
                    <td key={j} style={{padding:'11px 20px', color: j === 0 ? '#E2E8F0' : '#94A3B8', borderTop:'1px solid rgba(31,41,55,0.8)'}}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
  },
  marks: {
    link: ({children, value}: any) => {
      const href = value?.href || ''
      
      // Check if it's a YouTube link
      if (href.includes('youtube.com') || href.includes('youtu.be')) {
        return <YouTubeEmbed url={href} />
      }
      
      // Internal links (relative paths)
      const isInternal = href.startsWith('/') || href.startsWith('#')
      
      return (
        <a
          href={href}
          {...(!isInternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 font-medium transition-colors"
        >
          {children}
        </a>
      )
    },
    strong: ({children}: any) => <strong className="font-bold text-gray-900">{children}</strong>,
    em: ({children}: any) => <em className="italic">{children}</em>,
  },
  block: {
    normal: ({children, value}: any) => {
      // Get the text content
      const text = value?.children?.[0]?.text || children?.[0] || ''
      
      // Check if it's a table (starts with <table)
      if (typeof text === 'string' && text.trim().startsWith('<table')) {
        return <TableRenderer html={text} />
      }
      
      // Check if it contains a YouTube URL
      if (typeof text === 'string' && (text.includes('youtube.com') || text.includes('youtu.be'))) {
        return <YouTubeEmbed url={text.trim()} />
      }
      
      return <p>{children}</p>
    },
    h1: ({children}: any) => <h1>{children}</h1>,
    h2: ({children}: any) => <h2>{children}</h2>,
    h3: ({children}: any) => <h3>{children}</h3>,
    h4: ({children}: any) => <h4>{children}</h4>,
  },
  list: {
    bullet: ({children}: any) => <ul>{children}</ul>,
    number: ({children}: any) => <ol>{children}</ol>,
  },
  listItem: {
    bullet: ({children}: any) => <li>{children}</li>,
    number: ({children}: any) => <li>{children}</li>,
  },
}
