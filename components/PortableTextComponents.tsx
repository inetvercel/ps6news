import {PortableTextComponents} from '@portabletext/react'

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

export const portableTextComponents: PortableTextComponents = {
  types: {
    youtube: ({value}: any) => {
      return <YouTubeEmbed url={value.url} />
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
