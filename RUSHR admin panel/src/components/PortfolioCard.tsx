import React, { useState } from 'react';

const PortfolioCard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const periods = ['1D', '1W', '1Y', 'ALL'];

  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-gray-600 text-sm font-light mb-1">Charter Portfolio</h2>
          <div className="flex items-baseline">
            <span className="text-3xl font-light text-gray-900">2,847,392</span>
            <span className="text-lg font-light text-gray-400 ml-2">.45 USD</span>
          </div>
          <div className="flex items-center mt-1">
            <span className="text-sm text-green-600 font-light">+ 4,284.73 USD</span>
            <span className="text-sm text-green-600 font-light ml-2">+ 1.87% ↗</span>
          </div>
        </div>
        
        <button className="px-5 py-2 bg-gray-900 text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
          Book Flight
        </button>
      </div>

      <div className="flex justify-end mb-3">
        <div className="flex bg-gray-50 rounded-md p-1">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-xs font-light rounded transition-all duration-200 ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="h-32 mb-4 relative">
        <svg className="w-full h-full" viewBox="0 0 400 128" preserveAspectRatio="none">
          <path
            d="M0,96 Q50,80 100,88 T200,72 T300,56 T400,48"
            stroke="#000"
            strokeWidth="2"
            fill="none"
            className="opacity-80"
          />
          <circle cx="350" cy="52" r="3" fill="#000" />
        </svg>
        
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">2:30pm</div>
          <div className="text-sm font-medium text-gray-900">1,847,284.47 USD</div>
          <div className="text-xs text-green-600">+ 0.32%</div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-black rounded-full mr-2"></div>
              <span className="text-gray-600">Jets</span>
              <span className="ml-auto text-gray-900">1,634,238.19 USD</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Tokens</span>
              <span className="ml-auto text-gray-900">213,046.28 USD</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center mr-2">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Charter Tokens</div>
              <div className="text-xs text-gray-500">847,293.31 CTK</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-2">
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
  );
};

export default PortfolioCard;