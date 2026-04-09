import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-700 mb-4">Article Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the article you're looking for.
        </p>
        <Link 
          href="/"
          className="inline-block bg-ps-lightblue text-white px-6 py-3 rounded-lg font-semibold hover:bg-ps-blue transition"
        >
          Back to Home
        </Link>
      </div>
      <Footer />
    </div>
  )
}
