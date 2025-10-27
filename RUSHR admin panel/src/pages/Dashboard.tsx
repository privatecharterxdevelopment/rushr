import React from 'react';
import PortfolioCard from '../components/PortfolioCard';
import TransactionsTable from '../components/TransactionsTable';
import StakeCard from '../components/StakeCard';
import SideStats from '../components/SideStats';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-8">
        <PortfolioCard />
        <TransactionsTable />
      </div>
      
      <div className="col-span-4 space-y-4">
        <SideStats />
        <div className="mt-auto">
          <StakeCard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;