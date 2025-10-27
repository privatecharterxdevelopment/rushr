import React from 'react';
import { TrendingUp, Plane } from 'lucide-react';

const SideStats = () => {
  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-light text-gray-600">Active Flights</span>
          <TrendingUp size={14} className="text-green-500" />
        </div>
        <div className="text-2xl font-light text-gray-900">12</div>
        <div className="text-xs text-green-600 font-light">+3 this week</div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-light text-gray-600">Empty Legs</span>
          <Plane size={14} className="text-blue-500" />
        </div>
        <div className="text-2xl font-light text-gray-900">8</div>
        <div className="text-xs text-blue-600 font-light">Available now</div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-light text-gray-600">CO2 Offset</span>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="text-2xl font-light text-gray-900">247.8</div>
        <div className="text-xs text-green-600 font-light">tons this month</div>
      </div>
    </div>
  );
};

export default SideStats;