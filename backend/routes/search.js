// =============================================================================
// /api/search Route
// =============================================================================
// Handles individual and filtered searches for contributions.

import express from 'express';
import moment from 'moment';
import { normalizeName } from '../utils/dataProcessor.js';

export default function createSearchRouter(contributions, fuse) {
  const router = express.Router();

  // Pre-calculate statistics once
  const totalContributions = contributions.length;
  const totalAmount = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const dates = contributions.map(c => c.date).filter(Boolean);
  const minDate = dates.length ? dates.reduce((a, b) => a < b ? a : b) : null;
  const maxDate = dates.length ? dates.reduce((a, b) => a > b ? a : b) : null;
  const uniqueContributors = new Set(contributions.map(c => c.name)).size;
  const uniqueRecipients = new Set(contributions.map(c => c.committee_id)).size;

  const stats = {
    totalContributions,
    totalAmount,
    dateRange: {
      start: minDate ? moment(minDate, 'MMDDYYYY').format('YYYY-MM-DD') : null,
      end: maxDate ? moment(maxDate, 'MMDDYYYY').format('YYYY-MM-DD') : null
    },
    uniqueContributors,
    uniqueRecipients
  };

  // GET /api/search - Search for contributions
  router.get('/', (req, res) => {
    try {
      const query = req.query;
      const limit = Math.max(1, Math.min(parseInt(query.limit) || 50, 1000));
      const offset = Math.max(0, parseInt(query.offset) || 0);
      let filtered = [];

      if (query.name) {
        const norm = normalizeName(query.name);
        if (query.fuzzy === '1' || query.fuzzy === 'true') {
          // Fuzzy search with Fuse.js, requiring all terms to be present
          const searchTerms = norm.split(' ').map(term => `'${term}`).join(' ');
          filtered = fuse.search(searchTerms, { limit: 1000 }).map(r => r.item);
        } else {
          // Exact/substring search on normalized name
          filtered = contributions.filter(c => c.name_normalized.includes(norm));
        }
      } else {
        // No name filter: include all
        filtered = [...contributions];
      }

      // Filter by city, state, amount, date
      if (query.city) {
        const cityNorm = query.city.toLowerCase();
        filtered = filtered.filter(c => (c.city || '').toLowerCase().includes(cityNorm));
      }
      if (query.state) {
        const stateNorm = query.state.toUpperCase();
        filtered = filtered.filter(c => (c.state || '').toUpperCase() === stateNorm);
      }
      if (query.minAmount) {
        filtered = filtered.filter(c => c.amount >= parseFloat(query.minAmount));
      }
      if (query.maxAmount) {
        filtered = filtered.filter(c => c.amount <= parseFloat(query.maxAmount));
      }
      if (query.startDate) {
        const m = moment(query.startDate, 'YYYY-MM-DD');
        if (m.isValid()) {
          const minDate = m.format('MMDDYYYY');
          filtered = filtered.filter(c => c.date >= minDate);
        }
      }
      if (query.endDate) {
        const m = moment(query.endDate, 'YYYY-MM-DD');
        if (m.isValid()) {
          const maxDate = m.format('MMDDYYYY');
          filtered = filtered.filter(c => c.date <= maxDate);
        }
      }

      // Sort by date desc, amount desc
      filtered.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.amount - a.amount;
      });

      const total = filtered.length;
      const paged = filtered.slice(offset, offset + limit);

      res.json({
        results: { contributions: paged, total },
        limit,
        offset
      });
    } catch (err) {
      console.error('In-memory search error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/search/stats - Get summary statistics
  router.get('/stats', (req, res) => {
    try {
      res.json(stats);
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ error: 'Stats failed' });
    }
  });

  return router;
} 