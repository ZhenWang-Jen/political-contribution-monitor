// =============================================================================
// Individual Search Page
// =============================================================================
// This component provides the UI and logic for performing a detailed search
// for individual contributions, including filtering and pagination.

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Filter, Download } from 'lucide-react';
import axios from 'axios';
import { useSearch } from '../contexts/SearchContext';
import { Contribution } from '../contexts/SearchContext';
import ContributionTable from '../components/ContributionTable';
import AnalyticsChart from '../components/AnalyticsChart';

interface SearchFormData {
  name: string;
  city: string;
  state: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
}

const IndividualSearch: React.FC = () => {
  // ===========================================================================
  // State Management
  // ===========================================================================
  const { state, dispatch } = useSearch(); // Global context for search state
  const [isSearching, setIsSearching] = useState(false); // Local loading state for search actions
  const [results, setResults] = useState<Contribution[]>([]); // Current page of results
  const [total, setTotal] = useState(0); // Total number of results for the current query
  const [limit] = useState(50); // Number of results per page
  const [page, setPage] = useState(1); // Current page number
  const [lastQuery, setLastQuery] = useState<string>(''); // Stores the last executed query string for pagination/export
  const [fuzzy, setFuzzy] = useState(false); // Toggles Fuse.js fuzzy search
  const [hasSearched, setHasSearched] = useState(false); // Tracks if a search has been performed to control UI messages

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SearchFormData>();

  /**
   * Fetches a specific page of results for the last executed query.
   * @param {number} pageNum The page number to fetch.
   * @param {string} queryString The query string from the last search.
   */
  const fetchPage = async (pageNum: number, queryString: string) => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams(queryString);
      params.set('offset', ((pageNum - 1) * limit).toString());
      params.set('limit', limit.toString());
      const response = await axios.get(`/api/search?${params.toString()}`);
      
      const mappedContributions = response.data.results.contributions.map((c: any) => ({
        ...c,
        id: c.sub_id,
        date: c.transaction_dt,
        amount: parseFloat(c.transaction_amt) || 0,
      }));

      setResults(mappedContributions);
      setTotal(response.data.results.total);
      setPage(pageNum);
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Pagination failed' });
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Handles the main form submission.
   * Constructs the query, sends it to the backend, and updates the state with the results.
   * @param {SearchFormData} data The data from the search form.
   */
  const onSubmit = async (data: SearchFormData) => {
    setHasSearched(true);
    setIsSearching(true);
    dispatch({ type: 'SET_LOADING', payload: true });
    setResults([]);
    setTotal(0);
    setPage(1);
    setLastQuery('');
    try {
      const params = new URLSearchParams();
      if (data.name) params.append('name', data.name);
      if (data.city) params.append('city', data.city);
      if (data.state) params.append('state', data.state);
      if (data.minAmount) params.append('minAmount', data.minAmount);
      if (data.maxAmount) params.append('maxAmount', data.maxAmount);
      if (data.startDate) params.append('startDate', data.startDate);
      if (data.endDate) params.append('endDate', data.endDate);
      if (fuzzy) params.append('fuzzy', '1');
      params.append('limit', limit.toString());
      params.append('offset', '0');
      const queryString = params.toString();
      setLastQuery(queryString);
      
      const response = await axios.get(`/api/search?${params.toString()}`);
      const mappedContributions = response.data.results.contributions.map((c: any) => ({
        ...c,
        id: c.sub_id,
        date: c.transaction_dt,
        amount: parseFloat(c.transaction_amt) || 0,
      }));
      setResults(mappedContributions);
      setTotal(response.data.results.total);

      dispatch({ type: 'SET_INDIVIDUAL_RESULTS', payload: mappedContributions });

      if (state.analytics) {
        dispatch({ type: 'SET_ANALYTICS', payload: state.analytics });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Search failed' });
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Triggered when the user clicks a pagination control.
   * @param {number} newPage The new page number to navigate to.
   */
  const handlePageChange = (newPage: number) => {
    if (!lastQuery) return;
    fetchPage(newPage, lastQuery);
  };

  // Effect to keep the global search context in sync with the local results state.
  useEffect(() => {
    if (results.length > 0) {
      dispatch({ type: 'SET_INDIVIDUAL_RESULTS', payload: results });
    }
  }, [results, dispatch]);

  /**
   * Clears the form, results, and all related state.
   */
  const handleClear = () => {
    reset();
    setResults([]);
    setTotal(0);
    setPage(1);
    setLastQuery('');
    setHasSearched(false);
    dispatch({ type: 'CLEAR_RESULTS' });
  };

  /**
   * Handles the CSV export functionality.
   * It re-uses the `lastQuery` state to request a CSV from the export endpoint.
   */
  const handleExport = async () => {
    if (!lastQuery || total === 0) return;
    try {
      // The `lastQuery` state already holds all the filter parameters
      const response = await axios.get(`/api/export?${lastQuery}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'];
      let filename = 'contributions.csv';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Pagination controls (improved)
  const totalPages = Math.ceil(total / limit);
  let pageNumbers: (number | string)[] = [];
  if (totalPages <= 9) {
    pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (page <= 4) {
      pageNumbers = [1, 2, 3, 4, 5, '...', totalPages];
    } else if (page >= totalPages - 3) {
      pageNumbers = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pageNumbers = [1, '...', page - 2, page - 1, page, page + 1, page + 2, '...', totalPages];
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Individual Search</h1>
        <p className="text-gray-600">
          Search for political contributions by name and location with advanced filtering options.
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
              {/* Fuzzy Name Match Checkbox */}
              <div className="mt-2 flex items-center">
                <input
                  id="fuzzy"
                  type="checkbox"
                  checked={fuzzy}
                  onChange={e => setFuzzy(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="fuzzy" className="ml-2 block text-sm text-gray-700">
                  Fuzzy Name Match (finds similar/partial names)
                </label>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                {...register('state')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter state (e.g., NY)"
              />
            </div>

            {/* Min Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Amount
              </label>
              <input
                type="number"
                {...register('minAmount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter minimum amount"
              />
            </div>

            {/* Max Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Amount
              </label>
              <input
                type="number"
                {...register('maxAmount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter maximum amount"
              />
            </div>

            {/* Date Range */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results
              </h2>
              <p className="text-gray-600">
                Showing page {page} of {totalPages} ({total} contributions)
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Analytics Chart */}
          {state.analytics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
              <AnalyticsChart analytics={state.analytics} />
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-md">
            <ContributionTable contributions={results} />
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center py-4 space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                &laquo;
              </button>
              {pageNumbers.map((num, idx) =>
                typeof num === 'number' ? (
                  <button
                    key={num}
                    onClick={() => handlePageChange(num)}
                    className={`px-3 py-1 rounded ${num === page ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {num}
                  </button>
                ) : (
                  <span key={"ellipsis-" + idx} className="px-2 py-1 text-gray-400 select-none">...</span>
                )
              )}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                &raquo;
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {hasSearched && results.length === 0 && !isSearching && !state.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
          <p>No contributions found for your search.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>Try enabling <b>Fuzzy Name Match</b> to find similar or partial names.</li>
            <li>Check for typos or try a broader name (e.g., just last name or first initial).</li>
            <li>Remove filters like city, state, or date range to widen your search.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default IndividualSearch; 