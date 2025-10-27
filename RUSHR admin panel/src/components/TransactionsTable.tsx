import React from 'react';

const TransactionsTable = () => {
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

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
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
  );
};

export default TransactionsTable;