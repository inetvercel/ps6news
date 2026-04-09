import { Gamepad2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Gamepad2 className="h-8 w-8" />
              <h3 className="text-2xl font-bold">PS6News.com</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Your ultimate source for PlayStation 6 news, rumors, and updates. 
              Stay informed about the next generation of gaming.
            </p>
            <p className="text-sm text-gray-500">
              © 2026 PS6News.com. All rights reserved. Not affiliated with Sony Interactive Entertainment.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">News</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Rumors</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Specs</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Games</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
