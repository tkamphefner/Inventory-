"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Package, 
  LogIn, 
  LogOut, 
  ShoppingCart, 
  BarChart2, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ activeItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Inventory', icon: Package, href: '/inventory' },
    { name: 'Check-In', icon: LogIn, href: '/check-in' },
    { name: 'Checkout', icon: LogOut, href: '/checkout' },
    { name: 'Reports', icon: BarChart2, href: '/reports' },
    { name: 'Accounts', icon: Users, href: '/accounts' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-20 m-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar for mobile */}
      <div className={`lg:hidden fixed inset-0 z-40 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleSidebar}></div>
        
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-800 text-white">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">Inventory Tracker</h1>
            <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-2 py-4 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 mt-2 text-sm font-medium rounded-md ${
                  (activeItem === item.name.toLowerCase() || pathname === item.href)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">U</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">User</p>
                <p className="text-xs text-gray-400">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-800 text-white">
        <div className="flex items-center h-16 px-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Inventory Tracker</h1>
        </div>
        
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 mt-2 text-sm font-medium rounded-md ${
                (activeItem === item.name.toLowerCase() || pathname === item.href)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">U</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">User</p>
              <p className="text-xs text-gray-400">user@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
