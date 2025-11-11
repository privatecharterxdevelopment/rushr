import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contractor {
  id: string;
  email: string;
  name: string;
  business_name: string;
  phone: string;
  base_zip: string;
  categories: string[];
  status: 'pending' | 'pending_approval' | 'approved' | 'rejected' | 'online';
  kyc_status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'expired' | 'under_review';
  license_number: string;
  license_state: string;
  insurance_carrier: string;
  address: string;
  created_at: string;
  updated_at: string;
}

const ContractorsTab: React.FC = () => {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchContractors();
  }, [statusFilter]);

  const fetchContractors = async () => {
    try {
      let query = supabase
        .from('pro_contractors')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContractors(data || []);
    } catch (error) {
      console.error('Error fetching contractors:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContractorStatus = async (contractorId: string, newStatus: string, newKycStatus?: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newKycStatus) {
        updateData.kyc_status = newKycStatus;
      }

      const { error } = await supabase
        .from('pro_contractors')
        .update(updateData)
        .eq('id', contractorId);

      if (error) throw error;
      fetchContractors();
    } catch (error) {
      console.error('Error updating contractor status:', error);
    }
  };

  const approveContractor = async (contractorId: string) => {
    // Approve = set status to 'approved' AND kyc_status to 'completed'
    await updateContractorStatus(contractorId, 'approved', 'completed');
  };

  const rejectContractor = async (contractorId: string) => {
    await updateContractorStatus(contractorId, 'rejected', 'failed');
  };

  const filteredContractors = contractors.filter(contractor =>
    contractor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contractor.base_zip?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-700',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      online: 'bg-blue-100 text-blue-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getKycStatusBadge = (kycStatus: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-600',
      in_progress: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      under_review: 'bg-blue-100 text-blue-700',
    };
    return colors[kycStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{filteredContractors.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Contractors</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {filteredContractors.filter(c => c.status === 'pending_approval').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Pending Approval</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-700">
            {filteredContractors.filter(c => c.status === 'approved' && c.kyc_status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Approved & Verified</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-700">
            {filteredContractors.filter(c => c.status === 'online').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Online</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contractors..."
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
            <option value="all">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {/* Contractors Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categories</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContractors.map((contractor) => (
                <tr key={contractor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contractor.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{contractor.email}</div>
                      {contractor.phone && (
                        <div className="text-xs text-gray-400">{contractor.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{contractor.business_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{contractor.base_zip || '-'}</div>
                    {contractor.address && (
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{contractor.address}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {contractor.categories?.slice(0, 2).map((cat, idx) => (
                        <span key={idx} className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {cat}
                        </span>
                      ))}
                      {contractor.categories?.length > 2 && (
                        <span className="text-xs text-gray-500">+{contractor.categories.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(contractor.status)}`}>
                      {contractor.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getKycStatusBadge(contractor.kyc_status)}`}>
                      {contractor.kyc_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{contractor.license_number || '-'}</div>
                    {contractor.license_state && (
                      <div className="text-xs text-gray-500">{contractor.license_state}</div>
                    )}
                    {contractor.insurance_carrier && (
                      <div className="text-xs text-gray-500">{contractor.insurance_carrier}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(contractor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {contractor.status === 'pending_approval' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveContractor(contractor.id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectContractor(contractor.id)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                    {contractor.status === 'approved' && (
                      <span className="text-xs text-green-700 flex items-center justify-end gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {contractor.status === 'rejected' && (
                      <span className="text-xs text-red-700 flex items-center justify-end gap-1">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContractors.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No contractors found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorsTab;
