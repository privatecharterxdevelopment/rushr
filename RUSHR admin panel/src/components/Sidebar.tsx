import React from 'react';
import { Home, BarChart3, Users, FileText, Settings, Plane, Car, Ship, Mountain, Leaf, Globe, MapPin, MessageSquare } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Plane, path: '/charter', label: 'Charter' },
    { icon: Car, path: '/cars', label: 'Cars' },
    { icon: Ship, path: '/yachts', label: 'Yachts' },
    { icon: Mountain, path: '/adventures', label: 'Adventures' },
    { icon: Leaf, path: '/certificates', label: 'Certificates' },
    { icon: Globe, path: '/web3', label: 'Web3' },
    { icon: MapPin, path: '/map', label: 'Map' },
    { icon: MessageSquare, path: '/ai-designer', label: 'AI Designer' },
    { icon: Settings, path: '/settings', label: 'Settings' },
  ];

  return (
    <div className="w-16 h-full bg-white/90 backdrop-blur-md rounded-xl flex flex-col items-center py-4 space-y-2">
      <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center mb-6">
        <div className="w-3 h-3 bg-white transform rotate-45"></div>
      </div>
      
      {navItems.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
            location.pathname === item.path
              ? 'bg-black text-white shadow-md' 
              : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          }`}
        >
          <item.icon size={16} />
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;