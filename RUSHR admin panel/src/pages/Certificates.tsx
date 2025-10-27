import React, { useState } from 'react';
import { Leaf, Fuel, ToggleLeft, ToggleRight } from 'lucide-react';

const Certificates = () => {
  const [showSAF, setShowSAF] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSAF(false)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
              !showSAF
                ? 'bg-green-100 text-green-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Leaf size={16} className="mr-2" />
            CO2 Certificates
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">CO2</span>
            <button
              onClick={() => setShowSAF(!showSAF)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showSAF ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
            <span className="text-sm text-gray-600">SAF</span>
          </div>

          <button
            onClick={() => setShowSAF(true)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
              showSAF
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Fuel size={16} className="mr-2" />
            SAF Certificates
          </button>
        </div>

        <button className="px-4 py-2 bg-black text-white text-sm font-light rounded-lg hover:bg-gray-800 transition-colors duration-200">
          Purchase New
        </button>
      </div>

      {!showSAF ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {co2Certificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Leaf size={16} className="text-green-600" />
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
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{cert.project}</h3>
              
              <div className="space-y-2 mb-4">
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
                <span className="text-xl font-light text-gray-900">{cert.price}</span>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-light rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safCertificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Fuel size={16} className="text-blue-600" />
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
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">{cert.supplier}</h3>
              
              <div className="space-y-2 mb-4">
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
                <span className="text-xl font-light text-gray-900">{cert.price}</span>
                <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-light rounded-lg hover:bg-gray-200 transition-colors duration-200">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;