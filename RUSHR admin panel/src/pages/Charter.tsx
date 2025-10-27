import React, { useState } from 'react';
import { Plane, HeaterIcon as Helicopter, Clock } from 'lucide-react';

const Charter = () => {
  const [activeTab, setActiveTab] = useState('jets');

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

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('jets')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-light transition-all duration-200 ${
            activeTab === 'jets'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plane size={16} className="mr-2" />
          Private Jets
        </button>
        <button
          onClick={() => setActiveTab('helicopters')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-light transition-all duration-200 ${
            activeTab === 'helicopters'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Helicopter size={16} className="mr-2" />
          Helicopters
        </button>
        <button
          onClick={() => setActiveTab('empty-legs')}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-light transition-all duration-200 ${
            activeTab === 'empty-legs'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={16} className="mr-2" />
          Empty Legs
        </button>
      </div>

      {activeTab === 'jets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jets.map((jet, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <img src={jet.image} alt={jet.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{jet.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{jet.type}</p>
              <div className="space-y-2 mb-4">
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
                  <span className="text-2xl font-light text-gray-900">{jet.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/hour</span>
                </div>
                <button className="px-4 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'helicopters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {helicopters.map((heli, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <img src={heli.image} alt={heli.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{heli.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{heli.type}</p>
              <div className="space-y-2 mb-4">
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
                  <span className="text-2xl font-light text-gray-900">{heli.price}</span>
                  <span className="text-sm text-gray-500 ml-1">/hour</span>
                </div>
                <button className="px-4 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'empty-legs' && (
        <div className="space-y-4">
          {emptyLegs.map((leg, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-900 mr-4">{leg.route}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Save {leg.savings}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
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
                <div className="text-right ml-6">
                  <div className="text-2xl font-light text-gray-900 mb-1">{leg.price}</div>
                  <button className="px-4 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Charter;