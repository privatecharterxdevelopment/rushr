import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { supabase, Auftrag } from '../lib/supabase';

interface JobWithDetails extends Auftrag {
  completion_time_days?: number;
  admin_earnings?: number;
  payment_status?: string;
}

const JobsTab: React.FC = () => {
  const [jobs, setJobs] = useState<JobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          homeowner:homeowner_id(full_name, email, company_name),
          contractor:contractor_id(full_name, email, company_name),
          job_categories(name, icon),
          transactions(amount, status, type, platform_fee)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate completion time and admin earnings
      const jobsWithDetails = data?.map(job => {
        let completion_time_days = null;
        let admin_earnings = 0;
        let payment_status = 'pending';

        if (job.started_at && job.completed_at) {
          const startDate = new Date(job.started_at);
          const endDate = new Date(job.completed_at);
          completion_time_days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (job.transactions && job.transactions.length > 0) {
          const transaction = job.transactions[0];
          admin_earnings = Number(transaction.platform_fee || 0);
          payment_status = transaction.status;
        }

        return {
          ...job,
          completion_time_days,
          admin_earnings,
          payment_status
        };
      }) || [];

      setJobs(jobsWithDetails);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId);

      if (error) throw error;
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const filteredJobs = jobs.filter(job => 
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.homeowner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.contractor?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      open: 'bg-gray-100 text-gray-800',
      assigned: 'bg-gray-200 text-gray-900',
      in_progress: 'bg-gray-300 text-gray-900',
      completed: 'bg-gray-400 text-white',
      cancelled: 'bg-gray-100 text-gray-600',
      disputed: 'bg-gray-200 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Calculate stats
  const totalJobs = filteredJobs.length;
  const completedJobs = filteredJobs.filter(j => j.status === 'completed').length;
  const totalEarnings = filteredJobs.reduce((sum, job) => sum + (job.admin_earnings || 0), 0);
  const avgCompletionTime = filteredJobs
    .filter(j => j.completion_time_days)
    .reduce((sum, job, _, arr) => sum + (job.completion_time_days || 0) / arr.length, 0);

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
          <div className="text-2xl font-bold text-gray-900">{totalJobs}</div>
          <div className="text-sm text-gray-500 mt-1">Total Jobs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{completedJobs}</div>
          <div className="text-sm text-gray-500 mt-1">Completed Jobs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</div>
          <div className="text-sm text-gray-500 mt-1">Admin Earnings</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{avgCompletionTime.toFixed(1)}</div>
          <div className="text-sm text-gray-500 mt-1">Avg Days to Complete</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
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
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Homeowner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Earnings</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{job.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {job.job_categories?.name || job.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.homeowner?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{job.homeowner?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.contractor?.full_name || 'Not assigned'}
                      </div>
                      <div className="text-sm text-gray-500">{job.contractor?.email || ''}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {job.budget_min && job.budget_max ? 
                        `$${job.budget_min} - $${job.budget_max}` : 
                        job.final_price ? 
                        `$${job.final_price}` :
                        'Not specified'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={job.status}
                      onChange={(e) => updateJobStatus(job.id, e.target.value)}
                      className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getStatusBadge(job.status)}`}
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="disputed">Disputed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {job.completion_time_days ? `${job.completion_time_days} days` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      ${job.admin_earnings?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-gray-500">{job.payment_status}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </div>
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

export default JobsTab;