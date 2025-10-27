import React from 'react';

const StakeCard = () => {
  return (
    <div className="bg-gray-900 rounded-xl p-5 text-white">
      <div className="mb-3">
        <h3 className="text-lg font-light mb-1">Stake DAO</h3>
        <p className="text-sm text-gray-400 font-light">Up to 12.34% APY</p>
      </div>
      
      <button className="w-full bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors duration-200">
        Get started
      </button>
    </div>
  );
};

export default StakeCard;