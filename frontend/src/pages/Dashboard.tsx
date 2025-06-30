import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import axios from 'axios';

interface Stats {
  totalContributions: number;
  totalAmount: number;
  uniqueContributors: number;
  uniqueRecipients: number;
  dateRange: {
    start: string;
    end: string;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/search/stats');
        setStats(response.data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      title: 'Individual Search',
      description: 'Search for political contributions by name and location',
      icon: Search,
      path: '/search',
      color: 'bg-blue-500',
    },
    {
      title: 'Bulk Search',
      description: 'Upload CSV files or paste multiple names for batch processing',
      icon: Users,
      path: '/bulk-search',
      color: 'bg-green-500',
    },
    {
      title: 'Analytics',
      description: 'View charts, trends, and risk analysis for contributions',
      icon: BarChart3,
      path: '/analytics',
      color: 'bg-purple-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Political Contribution Monitor
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Monitor political contributions for compliance purposes. Search individual names, 
          process bulk lists, and analyze contribution patterns with advanced analytics.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalContributions.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Contributors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.uniqueContributors.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Date Range</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(stats.dateRange.start).getFullYear()} - {new Date(stats.dateRange.end).getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.path}
              to={feature.path}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/search"
            className="flex items-center justify-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Search className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-600">Search Individual Name</span>
          </Link>
          <Link
            to="/bulk-search"
            className="flex items-center justify-center p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <Users className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-600">Upload CSV File</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 