import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  metadataBase: new URL('https://ps6news.com'),
  title: {
    default: 'PS6News.com - Latest PlayStation 6 News & Updates',
    template: '%s | PS6News.com',
  },
  description: 'Your ultimate source for PlayStation 6 news, rumors, specs, and release date information. Stay updated with the latest PS6 announcements, leaks, and gaming news.',
  keywords: [
    'PS6',
    'PlayStation 6',
    'PS6 news',
    'PS6 release date',
    'PS6 specs',
    'PS6 price',
    'Sony PlayStation',
    'next-gen gaming',
    'PS6 rumors',
    'PS6 leaks',
    'gaming news',
  ],
  authors: [{name: 'PS6News Team'}],
  creator: 'PS6News.com',
  publisher: 'PS6News.com',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ps6news.com',
    siteName: 'PS6News.com',
    title: 'PS6News.com - Latest PlayStation 6 News & Updates',
    description: 'Your ultimate source for PlayStation 6 news, rumors, specs, and release date information.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PS6News.com - PlayStation 6 News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PS6News.com - Latest PlayStation 6 News & Updates',
    description: 'Your ultimate source for PlayStation 6 news, rumors, specs, and release date information.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://ps6news.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col site-content`}>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
