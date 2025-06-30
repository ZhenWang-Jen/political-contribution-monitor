import express from 'express';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { normalizeName } from '../utils/dataProcessor.js';

export default function createBulkSearchRouter(contributions, fuse, searchResultsCache) {
  const router = express.Router();

  // POST /api/bulk-search - Bulk search with multiple names
  router.post('/', async (req, res) => {
    try {
      const { names, filters = {} } = req.body;
      if (!names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ error: 'Names array is required and must not be empty' });
      }
      if (names.length > 1000) {
        return res.status(400).json({ error: 'Maximum 1000 names allowed per bulk search' });
      }
      // Clean and validate names
      const cleanNames = names.map(name => name.trim()).filter(name => name.length > 0).slice(0, 1000);
      if (cleanNames.length === 0) {
        return res.status(400).json({ error: 'No valid names provided' });
      }
      const fuzzy = !!filters.fuzzy;
      const results = {};
      cleanNames.forEach(inputName => {
        const norm = normalizeName(inputName);
        let matchedContributions = [];
        if (fuzzy) {
          const searchTerms = norm.split(' ').map(term => `'${term}`).join(' ');
          matchedContributions = fuse.search(searchTerms, { limit: 1000 }).map(r => r.item);
        } else {
          matchedContributions = contributions.filter(c => c.name_normalized.includes(norm));
        }
        // Apply filters
        if (filters.city) {
          const cityNorm = filters.city.toLowerCase();
          matchedContributions = matchedContributions.filter(c => (c.city || '').toLowerCase().includes(cityNorm));
        }
        if (filters.state) {
          const stateNorm = filters.state.toUpperCase();
          matchedContributions = matchedContributions.filter(c => (c.state || '').toUpperCase() === stateNorm);
        }
        if (filters.minAmount) {
          matchedContributions = matchedContributions.filter(c => c.amount >= parseFloat(filters.minAmount));
        }
        if (filters.maxAmount) {
          matchedContributions = matchedContributions.filter(c => c.amount <= parseFloat(filters.maxAmount));
        }
        if (filters.startDate) {
          const m = moment(filters.startDate, 'YYYY-MM-DD');
          if (m.isValid()) {
            const minDate = m.format('MMDDYYYY');
            matchedContributions = matchedContributions.filter(c => c.date >= minDate);
          }
        }
        if (filters.endDate) {
          const m = moment(filters.endDate, 'YYYY-MM-DD');
          if (m.isValid()) {
            const maxDate = m.format('MMDDYYYY');
            matchedContributions = matchedContributions.filter(c => c.date <= maxDate);
          }
        }
        // Aggregate results
        const count = matchedContributions.length;
        const totalAmount = matchedContributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const matches = [...new Set(matchedContributions.map(c => c.name))].map(name => {
          const group = matchedContributions.filter(c => c.name === name);
          return {
            name,
            count: group.length,
            totalAmount: group.reduce((sum, c) => sum + (c.amount || 0), 0)
          };
        });
        results[inputName] = {
          matchedNames: matches.map(m => m.name),
          count,
          totalAmount,
          contributions: matchedContributions,
          matches
        };
      });
      
      const searchId = uuidv4();
      const allContributions = Object.values(results).flatMap(r => r.contributions);
      searchResultsCache.set(searchId, allContributions);
      
      // Optional: Clear cache entry after some time
      setTimeout(() => {
        searchResultsCache.delete(searchId);
      }, 10 * 60 * 1000); // 10 minutes

      // Calculate summary statistics
      const summary = {
        totalNames: cleanNames.length,
        namesWithResults: Object.values(results).filter(r => r.count > 0).length,
        totalContributions: Object.values(results).reduce((sum, r) => sum + r.count, 0),
        totalAmount: Object.values(results).reduce((sum, r) => sum + r.totalAmount, 0)
      };
      res.json({ results, summary, searchId });
    } catch (err) {
      console.error('In-memory bulk search error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
} 