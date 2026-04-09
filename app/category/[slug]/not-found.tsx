import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">Category Not Found</h2>
        <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-ps-blue text-white font-semibold rounded-lg hover:bg-ps-darkblue transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
