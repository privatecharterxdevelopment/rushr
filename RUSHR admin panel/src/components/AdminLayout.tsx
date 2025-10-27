import React, { ReactNode } from 'react';
import { 
  Users, 
  CreditCard, 
  MapPin, 
  Shield, 
  Crown, 
  MessageSquare,
  BarChart3,
  Grid3X3,
  Menu,
  Bell,
  Search,
  LogOut
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'categories', name: 'Job Categories', icon: Grid3X3 },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'auftrags', name: 'Jobs', icon: MapPin },
    { id: 'kyc', name: 'KYC Status', icon: Shield },
    { id: 'subscriptions', name: 'Subscriptions', icon: Crown },
    { id: 'support', name: 'Support', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <img 
              src="/rushr.png" 
              alt="RUSHR Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="ml-3 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3 opacity-60" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Admin User</p>
              <p className="text-xs text-gray-500">admin@rushr.com</p>
            </div>
            <LogOut className="w-4 h-4 ml-auto text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Menu className="w-5 h-5 text-gray-500 mr-4 lg:hidden" />
                <span className="text-sm text-gray-500 font-medium">
                  Platform Management
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50"
                  />
                </div>
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;