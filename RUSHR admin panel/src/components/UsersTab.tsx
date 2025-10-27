import React, { useEffect, useState } from 'react';
import { Search, Filter, UserCheck, UserX } from 'lucide-react';
import { supabase, Profile, KycDocument } from '../lib/supabase';

interface UserWithKyc extends Profile {
  kyc_documents?: KycDocument[];
  subscription_status?: string;
}

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<UserWithKyc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          kyc_documents!kyc_documents_user_id_fkey(*),
          user_subscriptions(status, subscription_plans(name))
        `)
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserVerification = async (userId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating user verification:', error);
    }
  };

  const updateKycStatus = async (documentId: string, status: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'verified') {
        updateData.verified_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('kyc_documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error('Error updating KYC status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors = {
      homeowner: 'bg-gray-100 text-gray-800',
      contractor: 'bg-gray-200 text-gray-900',
      admin: 'bg-gray-300 text-gray-900',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
          <div className="text-2xl font-bold text-gray-900">{filteredUsers.length}</div>
          <div className="text-sm text-gray-500 mt-1">Total Users</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {filteredUsers.filter(u => u.is_verified).length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Verified Users</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {filteredUsers.filter(u => u.role === 'contractor').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Contractors</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {filteredUsers.filter(u => u.role === 'homeowner').length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Homeowners</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
          />
        </div>
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="homeowner">Homeowners</option>
            <option value="contractor">Contractors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const kycDoc = user.kyc_documents?.[0];
                const subscription = user.user_subscriptions?.[0];
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.company_name && (
                          <div className="text-xs text-gray-400">{user.company_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {kycDoc ? (
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            kycDoc.status === 'verified' ? 'bg-gray-100 text-gray-800' :
                            kycDoc.status === 'pending' ? 'bg-gray-50 text-gray-600' :
                            'bg-gray-200 text-gray-900'
                          }`}>
                            {kycDoc.status}
                          </span>
                          <div className="text-xs text-gray-500 capitalize">
                            {kycDoc.document_type.replace('_', ' ')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No documents</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateUserVerification(user.id, !user.is_verified)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_verified 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {user.is_verified ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Unverified
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {subscription ? (
                        <div>
                          <div className="text-sm text-gray-900">{subscription.subscription_plans?.name}</div>
                          <div className="text-xs text-gray-500">{subscription.status}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No subscription</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {kycDoc && kycDoc.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => updateKycStatus(kycDoc.id, 'verified')}
                            className="text-xs text-gray-600 hover:text-gray-900"
                          >
                            Approve KYC
                          </button>
                          <button
                            onClick={() => updateKycStatus(kycDoc.id, 'rejected')}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersTab;