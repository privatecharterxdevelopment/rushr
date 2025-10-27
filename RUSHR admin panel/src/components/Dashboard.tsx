import React, { useState } from 'react';
import { 
  Home, Plane, Car, Ship, Mountain, Leaf, Globe, MapPin, MessageSquare, Settings,
  Search, User, Wallet, TrendingUp, Clock, Send, Sparkles, Fuel, ToggleLeft, ToggleRight,
  HeaterIcon as Helicopter
} from 'lucide-react';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('jets');
  const [showSAF, setShowSAF] = useState(false);
  const [kycStatus, setKycStatus] = useState('under-review'); // 'pending', 'under-review', 'approved', 'rejected'
  const [walletConnected, setWalletConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'ai',
      message: 'Hello! I\'m your AI Travel Designer. I can help you plan the perfect charter experience. What kind of trip are you looking for?',
      time: '2:30 PM'
    }
  ]);

  const navItems = [
    { icon: Home, id: 'dashboard', label: 'Home' },
    { icon: User, id: 'user-dashboard', label: 'User Dashboard' },
    { icon: Plane, id: 'charter', label: 'Charter' },
    { icon: Car, id: 'cars', label: 'Cars' },
    { icon: Ship, id: 'yachts', label: 'Yachts' },
    { icon: Mountain, id: 'adventures', label: 'Adventures' },
    { icon: Leaf, id: 'certificates', label: 'Certificates' },
    { icon: Globe, id: 'web3', label: 'Web3' },
    { icon: MapPin, id: 'map', label: 'Map' },
    { icon: MessageSquare, id: 'ai-designer', label: 'AI Designer' },
    { icon: Settings, id: 'settings', label: 'Settings' },
  ];

  const getPageTitle = () => {
    const titleMap = {
      'dashboard': 'Dashboard',
      'user-dashboard': 'User Dashboard',
      'charter': 'Charter / Private Jets',
      'cars': 'Car Rental',
      'yachts': 'Yachts & Boats',
      'adventures': 'Adventure Packages',
      'certificates': 'CO2 Certificates',
      'web3': 'Web3 / Tokenization',
      'map': 'Map & Location',
      'ai-designer': 'AI Travel Designer',
      'settings': 'Settings'
    };
    return titleMap[activeSection] || 'Dashboard';
  };

  const jets = [
    {
      name: 'Gulfstream G650',
      type: 'Heavy Jet',
      passengers: '14-19',
      range: '7,000 nm',
      price: '$8,500',
      image: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Citation X+',
      type: 'Super Mid',
      passengers: '8-12',
      range: '3,460 nm',
      price: '$4,200',
      image: 'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Phenom 300E',
      type: 'Light Jet',
      passengers: '6-9',
      range: '2,010 nm',
      price: '$2,800',
      image: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const helicopters = [
    {
      name: 'AW139',
      type: 'Twin Engine',
      passengers: '8-15',
      range: '573 nm',
      price: '$3,200',
      image: 'https://images.pexels.com/photos/87009/pexels-photo-87009.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Bell 407',
      type: 'Single Engine',
      passengers: '6',
      range: '374 nm',
      price: '$1,800',
      image: 'https://images.pexels.com/photos/2026324/pexels-photo-2026324.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const emptyLegs = [
    {
      route: 'NYC → MIA',
      aircraft: 'Citation X+',
      date: 'Dec 15, 2024',
      time: '2:30 PM',
      passengers: '8',
      price: '$2,100',
      savings: '50%'
    },
    {
      route: 'LAX → LAS',
      aircraft: 'Phenom 300E',
      date: 'Dec 16, 2024',
      time: '10:15 AM',
      passengers: '6',
      price: '$1,400',
      savings: '45%'
    }
  ];

  const co2Certificates = [
    {
      id: 'CO2-001',
      project: 'Amazon Rainforest Conservation',
      tons: '25.5',
      price: '$1,275',
      status: 'Active',
      expiry: 'Dec 2025'
    },
    {
      id: 'CO2-002',
      project: 'Wind Farm Development',
      tons: '18.2',
      price: '$910',
      status: 'Active',
      expiry: 'Jan 2026'
    },
    {
      id: 'CO2-003',
      project: 'Reforestation Initiative',
      tons: '32.1',
      price: '$1,605',
      status: 'Pending',
      expiry: 'Mar 2026'
    }
  ];

  const safCertificates = [
    {
      id: 'SAF-001',
      supplier: 'Neste Renewable Diesel',
      gallons: '1,250',
      price: '$6,875',
      status: 'Active',
      expiry: 'Nov 2025'
    },
    {
      id: 'SAF-002',
      supplier: 'BP Sustainable Aviation',
      gallons: '890',
      price: '$4,895',
      status: 'Active',
      expiry: 'Dec 2025'
    }
  ];

  const adventures = [
    {
      name: 'Alpine Ski Experience',
      location: 'Swiss Alps',
      duration: '5 days',
      price: '$12,500',
      image: 'https://images.pexels.com/photos/551524/pexels-photo-551524.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Safari Adventure',
      location: 'Kenya',
      duration: '7 days',
      price: '$18,900',
      image: 'https://images.pexels.com/photos/631317/pexels-photo-631317.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Island Hopping',
      location: 'Maldives',
      duration: '4 days',
      price: '$9,800',
      image: 'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const yachts = [
    {
      name: 'Ocean Majesty',
      type: 'Super Yacht',
      length: '180 ft',
      guests: '12',
      price: '$25,000',
      image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Sea Breeze',
      type: 'Motor Yacht',
      length: '120 ft',
      guests: '8',
      price: '$15,000',
      image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const cars = [
    {
      name: 'Rolls Royce Phantom',
      type: 'Luxury Sedan',
      seats: '4',
      price: '$800',
      image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Lamborghini Huracán',
      type: 'Sports Car',
      seats: '2',
      price: '$1,200',
      image: 'https://images.pexels.com/photos/544542/pexels-photo-544542.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const transactions = [
    {
      time: '3m ago',
      type: 'Charter',
      send: '2,500 USDT',
      receive: '0.00847 CTK',
      hash: '0xa1b2c3d4...890'
    },
    {
      time: '1h ago',
      type: 'Stake',
      send: '1,000 CTK',
      receive: '12.34% APY',
      hash: '0xe5f6g7h8...123'
    },
    {
      time: '2h ago',
      type: 'CO2 Cert',
      send: '750 USDT',
      receive: '5.2 tons CO2',
      hash: '0xi9j0k1l2...456'
    }
  ];

  const userRequests = [
    {
      id: 'REQ-001',
      type: 'Empty Leg',
      route: 'AMS → ZRH',
      status: 'pending',
      date: 'Sep 06, 2025',
      time: '21:20',
      icon: '🎯'
    },
    {
      id: 'REQ-002',
      type: 'Empty Leg',
      route: 'BRU → CHA',
      status: 'pending',
      date: 'Sep 06, 2025',
      time: '19:28',
      icon: '🎯'
    },
    {
      id: 'REQ-003',
      type: 'Private Jet',
      route: 'NYC → MIA',
      status: 'confirmed',
      date: 'Sep 05, 2025',
      time: '14:30',
      icon: '✈️'
    },
    {
      id: 'REQ-004',
      type: 'CO2 Certificate',
      amount: '25.5 tons',
      status: 'completed',
      date: 'Sep 04, 2025',
      time: '10:15',
      icon: '🌱'
    }
  ];

  const nftBenefits = [
    {
      id: 'NFT-001',
      name: 'Platinum Member',
      image: 'https://images.pexels.com/photos/844297/pexels-photo-844297.jpeg?auto=compress&cs=tinysrgb&w=400',
      benefits: ['Priority Booking', '15% Discount', 'Concierge Service'],
      rarity: 'Legendary'
    },
    {
      id: 'NFT-002',
      name: 'Carbon Neutral Badge',
      image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400',
      benefits: ['CO2 Offset Credits', 'Green Flight Priority'],
      rarity: 'Rare'
    }
  ];

  const web3Transactions = [
    {
      hash: '0xa1b2c3d4...890',
      type: 'Token Purchase',
      amount: '1,000 CTK',
      value: '$2,500',
      status: 'Confirmed',
      time: '2 hours ago'
    },
    {
      hash: '0xe5f6g7h8...123',
      type: 'NFT Mint',
      amount: '1 NFT',
      value: '$500',
      status: 'Confirmed',
      time: '1 day ago'
    },
    {
      hash: '0xi9j0k1l2...456',
      type: 'Staking Reward',
      amount: '50 CTK',
      value: '$125',
      status: 'Confirmed',
      time: '3 days ago'
    }
  ];

  const quickSuggestions = [
    'Looking for the most luxurious experience?',
    'Plan a trip to Aspen?',
    'Need the latest SAF?',
    'Want everything planned seamlessly?'
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      setChatHistory([...chatHistory, {
        type: 'user',
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setMessage('');
      
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          type: 'ai',
          message: 'I\'d be happy to help you with that! Let me suggest some options based on your preferences.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }, 1000);
    }
  };

  const renderDashboard = () => (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-8">
        {/* Portfolio Card */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-600 text-sm font-light mb-1">Charter Portfolio</h2>
              <div className="flex items-baseline">
                <span className="text-2xl font-light text-gray-900">2,847,392</span>
                <span className="text-lg font-light text-gray-400 ml-2">.45 USD</span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-sm text-green-600 font-light">+ 4,284.73 USD</span>
                <span className="text-sm text-green-600 font-light ml-2">+ 1.87% ↗</span>
              </div>
            </div>
            
            <button className="px-4 py-2 bg-gray-900 text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
              Book Flight
            </button>
          </div>

          <div className="h-24 mb-4 relative">
            <svg className="w-full h-full" viewBox="0 0 400 96" preserveAspectRatio="none">
              <path
                d="M0,72 Q50,60 100,66 T200,54 T300,42 T400,36"
                stroke="#000"
                strokeWidth="2"
                fill="none"
                className="opacity-80"
              />
              <circle cx="350" cy="39" r="2" fill="#000" />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center mr-2">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Charter Tokens</div>
                  <div className="text-xs text-gray-500">847,293.31 CTK</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs font-bold">$</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">USD Balance</div>
                  <div className="text-xs text-gray-500">1,999,846.28 USD</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-lg font-light text-gray-900 mb-4">Transactions</h3>
          
          <div className="overflow-hidden">
            <div className="grid grid-cols-5 gap-4 pb-3 text-xs font-medium text-gray-500 border-b border-gray-100">
              <div>Time</div>
              <div>Type</div>
              <div>Send</div>
              <div>Receive</div>
              <div>Tx Hash</div>
            </div>
            
            <div className="space-y-3 mt-3">
              {transactions.map((tx, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 items-center py-2">
                  <div className="text-sm text-gray-600">{tx.time}</div>
                  <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {tx.send}
                  </div>
                  <div className="flex items-center text-sm">
                    <span>→</span>
                    <div className="w-2 h-2 bg-orange-500 rounded-full mx-2"></div>
                    {tx.receive}
                  </div>
                  <div className="text-sm text-gray-400 font-mono">
                    {tx.hash}
                    <button className="ml-2 text-gray-600 hover:text-gray-900">↗</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-span-4 space-y-3">
        {/* Side Stats */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-light text-gray-600">Active Flights</span>
              <TrendingUp size={14} className="text-green-500" />
            </div>
            <div className="text-xl font-light text-gray-900">12</div>
            <div className="text-xs text-green-600 font-light">+3 this week</div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-light text-gray-600">Empty Legs</span>
              <Plane size={14} className="text-blue-500" />
            </div>
            <div className="text-xl font-light text-gray-900">8</div>
            <div className="text-xs text-blue-600 font-light">Available now</div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-light text-gray-600">CO2 Offset</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-xl font-light text-gray-900">247.8</div>
            <div className="text-xs text-green-600 font-light">tons this month</div>
          </div>
        </div>

        {/* Stake Card */}
        <div className="bg-gray-900 rounded-xl p-4 text-white mt-auto">
          <div className="mb-3">
            <h3 className="text-lg font-light mb-1">Stake DAO</h3>
            <p className="text-sm text-gray-400 font-light">Up to 12.34% APY</p>
          </div>
          
          <button className="w-full bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200">
            Get started
          </button>
        </div>
      </div>
    </div>
  );

  const renderUserDashboard = () => (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-3">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <User size={20} className="text-gray-600" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">User Dashboard</h3>
              <p className="text-sm text-gray-600">eltesto@gmail.com</p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p>📍 Sofia, Bulgaria</p>
            <p>🌐 185.94.188.123</p>
          </div>

          {kycStatus === 'under-review' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                KYC under review - we'll notify you within 24 hours
              </p>
            </div>
          )}

          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Overview
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              My Requests <span className="float-right text-gray-400">31</span>
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              CO2 Certificates
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Wallet & NFTs
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              KYC Verification
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              Profile Settings
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-9">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Member since</div>
            <div className="text-lg font-medium text-gray-900">Jul 2025</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Requests</div>
            <div className="text-lg font-medium text-gray-900">31</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">CO2 Requests</div>
            <div className="text-lg font-medium text-gray-900">0</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Certificates</div>
            <div className="text-lg font-medium text-gray-900">0</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <button className="text-sm text-gray-600 hover:text-gray-900">View all</button>
          </div>
          
          <div className="space-y-3">
            {userRequests.slice(0, 6).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{request.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{request.type}</div>
                    <div className="text-sm text-gray-600">
                      {request.route || request.amount}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    request.status === 'confirmed' ? 'text-green-600' :
                    request.status === 'pending' ? 'text-yellow-600' :
                    request.status === 'completed' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {request.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {request.date} {request.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCharter = () => (
    <div className="space-y-4">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('jets')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-light transition-all duration-200 ${
            activeTab === 'jets'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plane size={14} className="mr-2" />
          Private Jets
        </button>
        <button
          onClick={() => setActiveTab('helicopters')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-light transition-all duration-200 ${
            activeTab === 'helicopters'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Helicopter size={14} className="mr-2" />
          Helicopters
        </button>
        <button
          onClick={() => setActiveTab('empty-legs')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-light transition-all duration-200 ${
            activeTab === 'empty-legs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={14} className="mr-2" />
          Empty Legs
        </button>
      </div>

      {activeTab === 'jets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jets.map((jet, index) => (
            <div key={index} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <img src={jet.image} alt={jet.name} className="w-full h-24 object-cover rounded-lg mb-2" />
              <h3 className="text-base font-medium text-gray-900 mb-1">{jet.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{jet.type}</p>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Passengers</span>
                  <span className="text-gray-900">{jet.passengers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Range</span>
                  <span className="text-gray-900">{jet.range}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-light text-gray-900">{jet.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/hour</span>
                </div>
                <button className="px-3 py-1 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'helicopters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {helicopters.map((heli, index) => (
            <div key={index} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <img src={heli.image} alt={heli.name} className="w-full h-24 object-cover rounded-lg mb-2" />
              <h3 className="text-base font-medium text-gray-900 mb-1">{heli.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{heli.type}</p>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Passengers</span>
                  <span className="text-gray-900">{heli.passengers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Range</span>
                  <span className="text-gray-900">{heli.range}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-light text-gray-900">{heli.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/hour</span>
                </div>
                <button className="px-3 py-1 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'empty-legs' && (
        <div className="space-y-3">
          {emptyLegs.map((leg, index) => (
            <div key={index} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-base font-medium text-gray-900 mr-3">{leg.route}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Save {leg.savings}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Aircraft</span>
                      <p className="text-gray-900 font-medium">{leg.aircraft}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date</span>
                      <p className="text-gray-900 font-medium">{leg.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Time</span>
                      <p className="text-gray-900 font-medium">{leg.time}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Passengers</span>
                      <p className="text-gray-900 font-medium">{leg.passengers}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-xl font-light text-gray-900 mb-1">{leg.price}</div>
                  <button className="px-3 py-1 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCertificates = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSAF(false)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
              !showSAF
                ? 'bg-green-100 text-green-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Leaf size={14} className="mr-2" />
            CO2 Certificates
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">CO2</span>
            <button
              onClick={() => setShowSAF(!showSAF)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showSAF ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <span className="text-sm text-gray-600">SAF</span>
          </div>

          <button
            onClick={() => setShowSAF(true)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
              showSAF
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Fuel size={14} className="mr-2" />
            SAF Certificates
          </button>
        </div>

        <button className="px-3 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
          Purchase New
        </button>
      </div>

      {!showSAF ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {co2Certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <Leaf size={12} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{cert.id}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  cert.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {cert.status}
                </span>
              </div>
              
              <h3 className="text-base font-medium text-gray-900 mb-2">{cert.project}</h3>
              
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CO2 Offset</span>
                  <span className="text-gray-900 font-medium">{cert.tons} tons</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-gray-900">{cert.expiry}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-light text-gray-900">{cert.price}</span>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-light rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {safCertificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <Fuel size={12} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{cert.id}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  cert.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {cert.status}
                </span>
              </div>
              
              <h3 className="text-base font-medium text-gray-900 mb-2">{cert.supplier}</h3>
              
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SAF Volume</span>
                  <span className="text-gray-900 font-medium">{cert.gallons} gal</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expires</span>
                  <span className="text-gray-900">{cert.expiry}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-light text-gray-900">{cert.price}</span>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-light rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAIDesigner = () => (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-3">
        <div className="bg-white rounded-xl p-3 shadow-sm h-full">
          <h3 className="text-base font-medium text-gray-900 mb-3">Chat History</h3>
          <div className="space-y-2">
            <div className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <Plane size={12} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Aspen Trip Planning</span>
              </div>
              <p className="text-xs text-gray-600">2 hours ago</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <MapPin size={12} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Miami Weekend</span>
              </div>
              <p className="text-xs text-gray-600">1 day ago</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center mb-1">
                <Clock size={12} className="mr-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Empty Leg Search</span>
              </div>
              <p className="text-xs text-gray-600">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-9">
        <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                <Sparkles size={12} className="text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900">AI Travel Designer</h3>
                <p className="text-sm text-gray-600">Find What Matters, Faster.</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-3 mb-4">
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    chat.type === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{chat.message}</p>
                    <p className={`text-xs mt-1 ${chat.type === 'user' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {chat.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {quickSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="p-2 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <p className="text-sm text-gray-900">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border-none outline-none text-sm font-light placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all duration-200"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors duration-200"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWeb3 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-1">Wallet Connection</h2>
                <p className="text-sm text-gray-600">Connect your Web3 wallet to access tokenization features</p>
              </div>
              <button
                onClick={() => setWalletConnected(!walletConnected)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  walletConnected
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {walletConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>
            
            {walletConnected && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Wallet size={16} className="text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">0x1234...5678</div>
                    <div className="text-xs text-gray-600">MetaMask Wallet</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
            <div className="space-y-3">
              {web3Transactions.map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tx.type}</div>
                    <div className="text-xs text-gray-600 font-mono">{tx.hash}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{tx.amount}</div>
                    <div className="text-xs text-gray-600">{tx.value}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">{tx.status}</div>
                    <div className="text-xs text-gray-600">{tx.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-4">
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Token Balance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-black rounded-full mr-2"></div>
                  <span className="text-sm font-medium">CTK</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">1,250</div>
                  <div className="text-xs text-gray-600">$3,125</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">USDT</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">5,000</div>
                  <div className="text-xs text-gray-600">$5,000</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-3">NFT Membership</h3>
            <div className="space-y-3">
              {nftBenefits.map((nft) => (
                <div key={nft.id} className="border border-gray-200 rounded-lg p-3">
                  <img src={nft.image} alt={nft.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                  <div className="text-sm font-medium text-gray-900 mb-1">{nft.name}</div>
                  <div className="text-xs text-gray-600 mb-2">{nft.rarity}</div>
                  <div className="space-y-1">
                    {nft.benefits.map((benefit, idx) => (
                      <div key={idx} className="text-xs text-gray-600">• {benefit}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCards = (items, type) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item, index) => (
        <div key={index} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
          <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-lg mb-2" />
          <h3 className="text-base font-medium text-gray-900 mb-1">{item.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{item.type || item.location}</p>
          <div className="space-y-1 mb-3">
            {type === 'adventures' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <span className="text-gray-900">{item.duration}</span>
              </div>
            )}
            {type === 'yachts' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Length</span>
                  <span className="text-gray-900">{item.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests</span>
                  <span className="text-gray-900">{item.guests}</span>
                </div>
              </>
            )}
            {type === 'cars' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seats</span>
                <span className="text-gray-900">{item.seats}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-light text-gray-900">{item.price}</span>
              <span className="text-sm text-gray-500 ml-1">
                {type === 'adventures' ? '/person' : type === 'cars' ? '/day' : '/day'}
              </span>
            </div>
            <button className="px-3 py-1 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
              Book
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'user-dashboard':
        return renderUserDashboard();
      case 'charter':
        return renderCharter();
      case 'certificates':
        return renderCertificates();
      case 'ai-designer':
        return renderAIDesigner();
      case 'web3':
        return renderWeb3();
      case 'adventures':
        return renderCards(adventures, 'adventures');
      case 'yachts':
        return renderCards(yachts, 'yachts');
      case 'cars':
        return renderCards(cars, 'cars');
      default:
        return (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="text-xl font-light text-gray-900">{getPageTitle()} - Coming Soon</h2>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 h-screen">
        <div className="h-full max-w-7xl mx-auto">
          <div className="h-full bg-gray-50 rounded-2xl flex gap-3 p-3 shadow-lg">
            {/* Sidebar */}
            <div className="w-14 h-full bg-white/90 backdrop-blur-md rounded-xl flex flex-col items-center py-3 space-y-2">
              <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center mb-4">
                <div className="w-2 h-2 bg-white transform rotate-45"></div>
              </div>
              
              {navItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-black text-white shadow-md' 
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  }`}
                >
                  <item.icon size={14} />
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="h-full bg-transparent rounded-xl overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between w-full mb-4">
                  <div>
                    <h1 className="text-lg font-light text-gray-900">{getPageTitle()}</h1>
                    <p className="text-sm text-gray-500 font-light">Welcome back, Captain.</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search assets"
                        className="w-56 pl-8 pr-3 py-2 bg-gray-50 rounded-lg border-none outline-none text-sm font-light placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-200 transition-all duration-200"
                      />
                    </div>
                    
                    <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm">
                      <Wallet size={14} />
                    </button>
                    
                    <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all duration-200 shadow-sm">
                      <User size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="h-full">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;