import { Gamepad2, Menu, X, Search } from 'lucide-react'

export default function Header({ mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <header className="bg-ps-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <Gamepad2 className="h-8 w-8" />
            <h1 className="text-2xl font-bold">PS6News.com</h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#" className="hover:text-blue-200 transition">Home</a>
            <a href="#" className="hover:text-blue-200 transition">News</a>
            <a href="#" className="hover:text-blue-200 transition">Rumors</a>
            <a href="#" className="hover:text-blue-200 transition">Specs</a>
            <a href="#" className="hover:text-blue-200 transition">Games</a>
            <a href="#" className="hover:text-blue-200 transition">Release Date</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="hover:text-blue-200 transition">
              <Search className="h-5 w-5" />
            </button>
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <a href="#" className="block py-2 hover:text-blue-200 transition">Home</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition">News</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition">Rumors</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition">Specs</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition">Games</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition">Release Date</a>
          </nav>
        )}
      </div>
    </header>
  )
}
