import React from 'react';
import { useState } from 'react';
import AdminLayout from './components/AdminLayout';
import Dashboard from './components/Dashboard';
import UsersTab from './components/UsersTab';
import JobCategoriesTab from './components/JobCategoriesTab';
import PaymentsTab from './components/PaymentsTab';
import JobsTab from './components/JobsTab';
import KycTab from './components/KycTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import SupportTab from './components/SupportTab';

function AdminApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UsersTab />;
      case 'categories':
        return <JobCategoriesTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'auftrags':
        return <JobsTab />;
      case 'kyc':
        return <KycTab />;
      case 'subscriptions':
        return <SubscriptionsTab />;
      case 'support':
        return <SupportTab />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}

export default AdminApp;