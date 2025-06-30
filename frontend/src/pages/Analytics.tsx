// =============================================================================
// Analytics Page
// =============================================================================
// This component fetches and displays aggregated analytics data for the entire
// dataset, providing visualizations for trends, geographic distribution, and more.

import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import axios from 'axios';
import AnalyticsChart from '../components/AnalyticsChart';
import GeoChart from '../components/GeoChart';
import moment from 'moment';
import { Contribution, Analytics as AnalyticsType } from '../contexts/SearchContext';

const Analytics: React.FC = () => {
  // ===========================================================================
  // State Management & Data Fetching
  // ===========================================================================
  const [data, setData] = useState<AnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches the main analytics data from the backend.
     * The backend performs all the necessary aggregations.
     */
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/analytics');
        const analyticsData = response.data;
        // The backend sends raw contribution objects for the 'topContributions' list.
        // We need to map them to the frontend 'Contribution' model to ensure
        // properties like 'id' and 'amount' (as a number) are correctly set.
        analyticsData.topContributions = analyticsData.topContributions.map((c: Contribution) => ({
            ...c,
            id: c.sub_id,
            date: c.transaction_dt,
            amount: parseFloat(c.transaction_amt) || 0,
        }));
        setData(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Show a loading spinner while data is being fetched
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Trends</h1>
        <p className="text-gray-600">
          Analyze political contribution patterns, trends, and risk factors.
        </p>
      </div>

      {/* Overview Cards: High-level summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Trend</p>
              <p className={`text-2xl font-bold ${data.summary.monthlyTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.monthlyTrend.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Contributors</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.activeContributors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.highRisk.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Contribution</p>
              <p className="text-2xl font-bold text-gray-900">${data.summary.avgContribution.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section: Visualizations of key metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Contribution Trends</h3>
          <div className="h-64">
             <AnalyticsChart analytics={data} />
          </div>
        </div>

        {/* Geographic Distribution Map */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="h-64">
            <GeoChart data={data.geographicDistribution} />
          </div>
        </div>
      </div>

      {/* Risk Analysis: Breakdown of contributors by risk category */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">High Risk</div>
            <div className="text-4xl font-bold text-red-700">{data.riskAnalysis.highRisk.toLocaleString()}</div>
            <div className="text-sm text-red-600">Contributors</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 mb-2">Medium Risk</div>
            <div className="text-4xl font-bold text-yellow-700">{data.riskAnalysis.mediumRisk.toLocaleString()}</div>
            <div className="text-sm text-yellow-600">Contributors</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">Low Risk</div>
            <div className="text-4xl font-bold text-green-700">{data.riskAnalysis.lowRisk.toLocaleString()}</div>
            <div className="text-sm text-green-600">Contributors</div>
          </div>
        </div>
      </div>

      {/* Top Contributions Table: A list of the largest individual donations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Largest Contributions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contributor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient (CMTE_ID)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topContributions.map((contribution: Contribution) => (
                <tr key={contribution.sub_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contribution.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contribution.cmte_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {moment(contribution.date, 'MMDDYYYY').format('MM/DD/YYYY')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${contribution.amount.toLocaleString()}
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

export default Analytics; 