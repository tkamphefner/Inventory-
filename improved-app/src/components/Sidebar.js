import { useState } from 'react';
import { User, LogOut, Package, BarChart3, CheckSquare, ShoppingCart, Settings } from 'lucide-react';

export default function Sidebar({ activeItem = 'inventory' }) {
  const [collapsed, setCollapsed] = useState(false);
  
  const menuItems = [
    { id: 'inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
    { id: 'check-in', label: 'Check In', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'checkout', label: 'Checkout', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'accounts', label: 'Accounts', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className={`bg-gray-900 text-white h-screen ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <div className={`flex items-center ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="text-primary-500 mr-2">
            <User className="w-6 h-6" />
          </div>
          {!collapsed && <h1 className="text-xl font-bold">Inventory Manager</h1>}
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className={`text-gray-400 hover:text-white ${collapsed ? 'hidden' : ''}`}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="mb-2">
              <a 
                href={`/${item.id === 'inventory' ? '' : item.id}`} 
                className={`flex items-center px-4 py-3 ${
                  activeItem === item.id 
                    ? 'bg-primary-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } transition-colors duration-200 ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <a 
          href="/auth" 
          className={`flex items-center text-gray-300 hover:text-white transition-colors duration-200 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 mr-3" />
          {!collapsed && <span>Logout</span>}
        </a>
      </div>
    </div>
  );
}
