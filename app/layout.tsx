import type {Metadata} from 'next'
import {Inter} from 'next/font/google'
import Script from 'next/script'
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
    site: '@AllAboutPS6',
    creator: '@AllAboutPS6',
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
  icons: {
    icon: 'https://cdn.sanity.io/images/zzzwo1aw/production/72c1e3e33ce0b42ca24edb13289449384ec66e63-1024x1024.png',
    shortcut: 'https://cdn.sanity.io/images/zzzwo1aw/production/72c1e3e33ce0b42ca24edb13289449384ec66e63-1024x1024.png',
    apple: 'https://cdn.sanity.io/images/zzzwo1aw/production/72c1e3e33ce0b42ca24edb13289449384ec66e63-1024x1024.png',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  other: {
    'google-analytics': 'G-K0LH2MR3HX',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'PS6News.com',
    url: 'https://ps6news.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://cdn.sanity.io/images/zzzwo1aw/production/72c1e3e33ce0b42ca24edb13289449384ec66e63-1024x1024.png',
    },
    sameAs: [
      'https://x.com/AllAboutPS6',
    ],
    description: 'Your ultimate source for PlayStation 6 news, rumors, specs, and release date information.',
  }

  return (
    <html lang="en">
      <head>
        <link rel="canonical" href="https://ps6news.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-K0LH2MR3HX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-K0LH2MR3HX', { page_path: window.location.pathname });
          `}
        </Script>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(orgSchema)}}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col site-content`}>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
