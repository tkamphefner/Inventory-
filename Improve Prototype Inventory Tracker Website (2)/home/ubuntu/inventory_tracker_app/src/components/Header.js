import { useState } from 'react';
import { Bell, Search } from 'lucide-react';

export default function Header({ title, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };
  
  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
          </form>
          
          <button className="relative p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 rounded-full transition-colors duration-200">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold">
              TK
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
