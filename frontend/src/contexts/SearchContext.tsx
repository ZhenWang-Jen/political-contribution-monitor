import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface Contribution {
  cmte_id: string;
  amndt_ind: string;
  rpt_tp: string;
  transaction_pgi: string;
  image_num: string;
  transaction_tp: string;
  entity_tp: string;
  name: string;
  city: string;
  state: string;
  zip_code: string;
  employer: string;
  occupation: string;
  transaction_dt: string;
  transaction_amt: string;
  other_id: string;
  tran_id: string;
  file_num: string;
  memo_cd: string;
  memo_text: string;
  sub_id: string;
  // Frontend-specific fields
  id: string; // Often same as sub_id
  date: string; // Often same as transaction_dt
  amount: number;
}

export interface SearchResult {
  name?: string;
  count: number;
  totalAmount: number;
  contributions: Contribution[];
  matches?: { name: string; count: number; totalAmount: number }[];
  matchedNames?: string[];
}

export interface Analytics {
  summary: {
    monthlyTrend: number;
    activeContributors: number;
    highRisk: number;
    avgContribution: number;
  };
  monthlyTrends: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  geographicDistribution: Array<{
    state: string;
    count: number;
    amount: number;
  }>;
  riskAnalysis: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
  topContributions: Contribution[];
}

export interface SearchState {
  individualResults: Contribution[] | null;
  bulkResults: Record<string, SearchResult> | null;
  analytics: Analytics | null;
  loading: boolean;
  error: string | null;
  searchId: string | null;
}

// Actions
type SearchAction =
  | { type: 'SET_INDIVIDUAL_RESULTS'; payload: Contribution[] }
  | { type: 'SET_BULK_RESULTS'; payload: { results: Record<string, SearchResult>; searchId: string } }
  | { type: 'SET_ANALYTICS'; payload: Analytics }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_RESULTS' };

// Initial state
const initialState: SearchState = {
  individualResults: null,
  bulkResults: null,
  analytics: null,
  loading: false,
  error: null,
  searchId: null,
};

// Reducer
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_INDIVIDUAL_RESULTS':
      return {
        ...state,
        individualResults: action.payload,
        bulkResults: null,
        searchId: null,
        loading: false,
        error: null,
      };
    case 'SET_BULK_RESULTS':
      return {
        ...state,
        bulkResults: action.payload.results,
        searchId: action.payload.searchId,
        individualResults: null,
        loading: false,
        error: null,
      };
    case 'SET_ANALYTICS':
      return {
        ...state,
        analytics: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_RESULTS':
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

// Context
interface SearchContextType {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Provider
interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  return (
    <SearchContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchContext.Provider>
  );
}

// Hook
export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 