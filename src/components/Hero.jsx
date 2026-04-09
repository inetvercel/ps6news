import { TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-ps-blue to-ps-lightblue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">Breaking News</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          PlayStation 6: Everything We Know So Far
        </h2>
        <p className="text-xl text-blue-100 max-w-3xl">
          Stay up to date with the latest PS6 news, rumors, specs, and release date information. 
          Your ultimate source for PlayStation 6 updates.
        </p>
      </div>
    </div>
  )
}
