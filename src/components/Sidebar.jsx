import { TrendingUp, Calendar } from 'lucide-react'

export default function Sidebar() {
  const trendingTopics = [
    "PS6 Release Date 2028",
    "8K Gaming Support",
    "Ray Tracing Technology",
    "Backward Compatibility",
    "AMD Custom Chip",
    "VR Integration"
  ]

  const upcomingEvents = [
    { title: "Sony State of Play", date: "May 15, 2026" },
    { title: "E3 2026", date: "June 10-13, 2026" },
    { title: "Tokyo Game Show", date: "September 2026" }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-ps-lightblue" />
          <h3 className="text-xl font-bold text-gray-900">Trending Topics</h3>
        </div>
        <ul className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <li key={index}>
              <a href="#" className="text-gray-700 hover:text-ps-lightblue transition-colors flex items-center space-x-2">
                <span className="text-ps-lightblue font-bold">#{index + 1}</span>
                <span>{topic}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-ps-lightblue" />
          <h3 className="text-xl font-bold text-gray-900">Upcoming Events</h3>
        </div>
        <ul className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <li key={index} className="border-l-4 border-ps-lightblue pl-4">
              <h4 className="font-semibold text-gray-900">{event.title}</h4>
              <p className="text-sm text-gray-600">{event.date}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gradient-to-br from-ps-blue to-ps-lightblue rounded-lg shadow-md p-6 text-white">
        <h3 className="text-xl font-bold mb-3">Newsletter</h3>
        <p className="text-sm mb-4">Get the latest PS6 news delivered to your inbox!</p>
        <input 
          type="email" 
          placeholder="Enter your email"
          className="w-full px-4 py-2 rounded-md text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button className="w-full bg-white text-ps-blue font-semibold py-2 rounded-md hover:bg-gray-100 transition-colors">
          Subscribe
        </button>
      </div>
    </div>
  )
}
