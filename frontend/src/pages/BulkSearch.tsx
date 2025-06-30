import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Users, FileText } from 'lucide-react';
import axios from 'axios';
import { useSearch } from '../contexts/SearchContext';
import Papa from 'papaparse';
import ContributionTable from '../components/ContributionTable';

interface PapaParseResult {
  data: any[][];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

const BulkSearch: React.FC = () => {
  const { state, dispatch } = useSearch();
  const [names, setNames] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fuzzy, setFuzzy] = useState(false);
  const [city, setCity] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    onDrop: (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (file.name.endsWith('.csv')) {
            Papa.parse(text, {
              complete: (results: PapaParseResult) => {
                const csvNames = results.data
                  .flat()
                  .filter((name: any) => name && typeof name === 'string' && name.trim())
                  .map((name: any) => name.trim());
                setNames(csvNames.join('\n'));
              },
            });
          } else {
            setNames(text);
          }
        };
        reader.readAsText(file);
      }
    },
  });

  const handleSubmit = async () => {
    if (!names.trim()) return;

    setHasSearched(true);
    setIsProcessing(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const nameList = names
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      const filters: any = {};
      if (fuzzy) filters.fuzzy = true;
      if (city) filters.city = city;
      if (stateFilter) filters.state = stateFilter;

      const response = await axios.post('/api/bulk-search', {
        names: nameList,
        filters
      });

      const bulkResults = response.data.results;
      // Map contributions to frontend model
      for (const name in bulkResults) {
        if (bulkResults.hasOwnProperty(name)) {
          bulkResults[name].contributions = bulkResults[name].contributions.map((c: any) => ({
            ...c,
            id: c.sub_id,
            date: c.transaction_dt,
            amount: parseFloat(c.transaction_amt) || 0,
          }));
        }
      }

      dispatch({
        type: 'SET_BULK_RESULTS',
        payload: {
          results: bulkResults,
          searchId: response.data.searchId,
        },
      });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Bulk search failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!state.searchId) return;

    try {
      const response = await axios.get(`/api/export/${state.searchId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk_search_results.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleClear = () => {
    setNames('');
    setUploadedFile(null);
    setFuzzy(false);
    setCity('');
    setStateFilter('');
    setHasSearched(false);
    dispatch({ type: 'CLEAR_RESULTS' });
  };

  const results = state.bulkResults ? Object.values(state.bulkResults) : [];
  const namesWithResults = results.filter(r => r.count > 0).length;
  const totalContributions = results.reduce((sum, r) => sum + r.count, 0);
  const allContributions = results.flatMap(result => result.contributions);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Search</h1>
        <p className="text-gray-600">
          Upload a CSV/TXT file or paste multiple names to search for political contributions in batch.
        </p>
      </div>

      {/* Input Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag and drop a CSV or TXT file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports CSV files with names in columns or TXT files with one name per line
                </p>
              </div>
            )}
          </div>
          {uploadedFile && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">
                <FileText className="w-4 h-4 inline mr-2" />
                {uploadedFile.name} uploaded successfully
              </p>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Paste Names</h2>
          <textarea
            value={names}
            onChange={(e) => setNames(e.target.value)}
            className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter names, one per line:&#10;John Smith&#10;Jane Doe&#10;Bob Johnson"
          />
          <p className="text-sm text-gray-500 mt-2">
            Enter one name per line. Maximum 1000 names allowed.
          </p>
        </div>
      </div>

      {/* Search Options */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fuzzy Search */}
          <div className="flex items-center">
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

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City Filter
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter city"
            />
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State Filter
            </label>
            <input
              type="text"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter state (e.g., NY)"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !names.trim()}
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Users className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Search Names'}
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear
        </button>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{state.error}</p>
        </div>
      )}

      {/* No Results Hint */}
      {hasSearched && namesWithResults === 0 && !isProcessing && (
         <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-800">
           <p>No contributions found for your search.</p>
           <ul className="list-disc ml-6 mt-2 text-sm">
             <li>Try enabling <b>Fuzzy Name Match</b> to find similar or partial names.</li>
             <li>Check for typos or try a broader name (e.g., just last name or first initial).</li>
             <li>Remove filters like city, state, or date range to widen your search.</li>
           </ul>
         </div>
      )}

      {/* Bulk Search Results */}
      {totalContributions > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Search Results</h2>
            <button
              onClick={handleExport}
              disabled={!state.searchId}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </button>
          </div>
          
          {/* Renders a detailed table for all results */}
          <ContributionTable contributions={allContributions} />

        </div>
      )}
    </div>
  );
};

export default BulkSearch; 