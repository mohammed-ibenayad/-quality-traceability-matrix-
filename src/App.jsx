import { useState } from 'react'
import './App.css'

function App() {
  const [selectedVersion, setSelectedVersion] = useState('v2.2');
  
  const versions = [
    { id: 'v2.0', name: 'Version 2.0' },
    { id: 'v2.1', name: 'Version 2.1' },
    { id: 'v2.2', name: 'Version 2.2' }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navigation */}
      <div className="flex min-h-screen">
        <div className="w-64 bg-gray-800 text-white">
          <div className="p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Quality Tracker</h1>
          </div>
          <nav className="mt-4">
            <a href="#" className="block px-4 py-3 bg-gray-700 text-white">Dashboard</a>
            <a href="#" className="block px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Traceability Matrix</a>
            <a href="#" className="block px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Requirements</a>
            <a href="#" className="block px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Test Cases</a>
            <a href="#" className="block px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">Reports</a>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <header className="bg-white shadow h-16 flex items-center justify-between px-6">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold">Release Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className="mr-2 text-sm text-gray-500">Version:</span>
                <select 
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="border rounded p-1.5 text-sm"
                >
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <span className="text-sm font-medium">JS</span>
              </div>
            </div>
          </header>
          
          <main className="p-6">
            <h2 className="text-2xl font-bold mb-6">Welcome to Quality Traceability Matrix</h2>
            <p className="mb-4">This application helps you track quality metrics for software releases.</p>
            <p>Start by exploring the navigation menu on the left.</p>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App