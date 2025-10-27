import React, { useEffect, useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { supabase, UserSubscription, SubscriptionPlan, Profile } from '../lib/supabase';

const SubscriptionsTab: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchData();
  }, [statusFilter, planFilter]);

  const fetchData = async () => {
    try {
      // Fetch subscriptions with user and plan details
      let subscriptionQuery = supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles!user_subscriptions_user_id_fkey(full_name, email, company_name, role),
          subscription_plans!user_subscriptions_plan_id_fkey(name, price_monthly, price_yearly, features, max_jobs)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        subscriptionQuery = subscriptionQuery.eq('status', statusFilter);
      }

      if (planFilter !== 'all') {
        subscriptionQuery = subscriptionQuery.eq('plan_id', planFilter);
      }

      // Fetch all active plans
      const plansQuery = supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      // Fetch all users for assignment
      const usersQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role, company_name')
        .order('full_name', { ascending: true });

      const [subscriptionsResult, plansResult, usersResult] = await Promise.all([
        subscriptionQuery,
        plansQuery,
        usersQuery
      ]);

      if (subscriptionsResult.error) throw subscriptionsResult.error;
      if (plansResult.error) throw plansResult.error;
      if (usersResult.error) throw usersResult.error;

      setSubscriptions(subscriptionsResult.data || []);
      setPlans(plansResult.data || []);
      setUsers(usersResult.data || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, status: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'cancelled') {
        updateData.expires_at = new Date().toISOString();
        updateData.auto_renew = false;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  };

  const assignSubscription = async () => {
    if (!selectedUser || !selectedPlan) return;

    try {
      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('status', 'active')
        .single();

      if (existingSubscription) {
        alert('User already has an active subscription. Please cancel the existing one first.');
        return;
      }

      // Calculate expiry date based on billing period
      const startDate = new Date();
      const expiryDate = new Date();
      if (selectedBilling === 'monthly') {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: selectedUser,
          plan_id: selectedPlan,
          status: 'active',
          billing_period: selectedBilling,
          started_at: startDate.toISOString(),
          expires_at: expiryDate.toISOString(),
          current_period_start: startDate.toISOString(),
          current_period_end: expiryDate.toISOString(),
          auto_renew: true
        });

      if (error) throw error;
      
      setShowAssignForm(false);
      setSelectedUser('');
      setSelectedPlan('');
      setSelectedBilling('monthly');
      fetchData();
    } catch (error) {
      console.error('Error assigning subscription:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.subscription_plans?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-gray-800 text-white',
      cancelled: 'bg-gray-300 text-gray-700',
      expired: 'bg-gray-200 text-gray-600',
      pending: 'bg-gray-400 text-white',
      trialing: 'bg-gray-500 text-white',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
  const selectedUserDetails = users.find(u => u.id === selectedUser);

  // Calculate stats
  const totalSubscriptions = filteredSubscriptions.length;
  const activeSubscriptions = filteredSubscriptions.filter(s => s.status === 'active').length;
  const monthlyRevenue = filteredSubscriptions
    .filter(s => s.status === 'active' && s.billing_period === 'monthly')
    .reduce((sum, s) => sum + (s.subscription_plans?.price_monthly || 0), 0);
  const yearlyRevenue = filteredSubscriptions
    .filter(s => s.status === 'active' && s.billing_period === 'yearly')
    .reduce((sum, s) => sum + (s.subscription_plans?.price_yearly || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          {showAssignForm ? 'Cancel' : 'Assign Subscription'}
        </button>
      </div>

      {/* Assignment Form */}
      {showAssignForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Subscription to User</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
                >
                  <option value="">Choose user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email} ({user.role})
                      {user.company_name && ` - ${user.company_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
                >
                  <option value="">Choose plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price_monthly}/month
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Period</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="monthly"
                      checked={selectedBilling === 'monthly'}
                      onChange={(e) => setSelectedBilling(e.target.value as 'monthly' | 'yearly')}
                      className="mr-2"
                    />
                    <span className="text-sm">Monthly</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="yearly"
                      checked={selectedBilling === 'yearly'}
                      onChange={(e) => setSelectedBilling(e.target.value as 'monthly' | 'yearly')}
                      className="mr-2"
                    />
                    <span className="text-sm">Yearly</span>
                  </label>
                </div>
              </div>

              <button
                onClick={assignSubscription}
                disabled={!selectedUser || !selectedPlan}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                Assign Subscription
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Assignment Preview</h4>
              
              {selectedUserDetails && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700">User:</div>
                  <div className="text-sm text-gray-600">
                    {selectedUserDetails.full_name || selectedUserDetails.email}
                    <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                      {selectedUserDetails.role}
                    </span>
                  </div>
                </div>
              )}

              {selectedPlanDetails && (
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-700">Plan:</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {selectedPlanDetails.name} - ${selectedBilling === 'monthly' ? selectedPlanDetails.price_monthly : selectedPlanDetails.price_yearly}/{selectedBilling === 'monthly' ? 'month' : 'year'}
                  </div>
                  <div className="text-xs text-gray-500">
                    <div className="font-medium mb-1">Features:</div>
                    <ul className="space-y-1">
                      {selectedPlanDetails.features?.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-3 h-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedUser && selectedPlan && (
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Total Cost:</div>
                  <div className="text-lg font-bold text-gray-900">
                    ${selectedBilling === 'monthly' ? selectedPlanDetails?.price_monthly : selectedPlanDetails?.price_yearly}
                    <span className="text-sm font-normal text-gray-500">/{selectedBilling === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalSubscriptions}</div>
          <div className="text-sm text-gray-500 mt-1">Total Subscriptions</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{activeSubscriptions}</div>
          <div className="text-sm text-gray-500 mt-1">Active</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">${monthlyRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Monthly Revenue</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">${yearlyRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">Yearly Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
            <option value="trialing">Trialing</option>
          </select>
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
          >
            <option value="all">All Plans</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto Renew</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSubscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.profiles?.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{subscription.profiles?.email}</div>
                      {subscription.profiles?.company_name && (
                        <div className="text-xs text-gray-400">{subscription.profiles.company_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {subscription.subscription_plans?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {subscription.subscription_plans?.max_jobs ? 
                          `${subscription.subscription_plans.max_jobs} jobs/month` : 
                          'Unlimited jobs'
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      ${subscription.billing_period === 'yearly' 
                        ? subscription.subscription_plans?.price_yearly 
                        : subscription.subscription_plans?.price_monthly}
                    </div>
                    <div className="text-xs text-gray-500">{subscription.billing_period}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={subscription.status}
                      onChange={(e) => updateSubscriptionStatus(subscription.id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getStatusBadge(subscription.status)}`}
                    >
                      <option value="active">Active</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                      <option value="trialing">Trialing</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {subscription.current_period_start && subscription.current_period_end ? (
                        <>
                          <div>{new Date(subscription.current_period_start).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            to {new Date(subscription.current_period_end).toLocaleDateString()}
                          </div>
                        </>
                      ) : (
                        'Not set'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      subscription.auto_renew ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {subscription.auto_renew ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsTab;