import React from 'react';
import { Search, User, Wallet } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const getPageTitle = () => {
    const pathMap = {
      '/': 'Dashboard',
      '/charter': 'Charter / Private Jets',
      '/charter/helicopters': 'Charter / Helicopters',
      '/charter/empty-legs': 'Charter / Empty Legs',
      '/cars': 'Car Rental',
      '/yachts': 'Yachts & Boats',
      '/adventures': 'Adventure Packages',
      '/certificates': 'CO2 Certificates',
      '/web3': 'Web3 / Overview',
      '/web3/dao': 'Web3 / DAO Assets',
      '/map': 'Map & Location',
      '/ai-designer': 'AI Travel Designer',
      '/settings': 'Settings'
    };
    return pathMap[location.pathname] || 'Dashboard';
  };

  return (
    <div className="flex items-center justify-between w-full mb-6">
      <div>
        <h1 className="text-lg font-light text-gray-900">{getPageTitle()}</h1>
        <p className="text-sm text-gray-500 font-light">Welcome back, Captain.</p>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search assets"
            className="w-64 pl-9 pr-4 py-2 bg-gray-50 rounded-lg border-none outline-none text-sm font-light placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all duration-200"
          />
        </div>
        
        <button className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm">
          <Wallet size={16} />
        </button>
        
        <button className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm">
          <User size={16} />
        </button>
      </div>
    </div>
  );
};

export default Header;