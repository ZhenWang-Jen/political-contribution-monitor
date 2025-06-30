import express from 'express';
import moment from 'moment';

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
}

const CSV_HEADER = [
  'cmte_id', 'amndt_ind', 'rpt_tp', 'transaction_pgi', 'image_num', 
  'transaction_tp', 'entity_tp', 'name', 'city', 'state', 'zip_code', 
  'employer', 'occupation', 'transaction_dt', 'transaction_amt', 'other_id', 
  'tran_id', 'file_num', 'memo_cd', 'memo_text', 'sub_id'
];

function contributionsToCsv(contributions) {
  const csvRows = [CSV_HEADER.join(',')];
  for (const row of contributions) {
    const values = CSV_HEADER.map(header => {
      const value = row[header] || '';
      // Escape quotes by doubling them and wrap in quotes if it contains a comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export default function createExportRouter(contributions, searchResultsCache) {
  const router = express.Router();

  // Route for exporting bulk search results
  router.get('/:searchId', (req, res) => {
    const { searchId } = req.params;
    const cachedResults = searchResultsCache.get(searchId);

    if (!cachedResults) {
      return res.status(404).json({ error: 'Export data not found or expired.' });
    }

    try {
      const csvData = contributionsToCsv(cachedResults);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bulk_search_results_${searchId}.csv"`);
      res.status(200).send(csvData);
    } catch (error) {
      console.error('Bulk export error:', error);
      res.status(500).json({ error: 'Bulk export failed' });
    }
  });

  router.get('/', (req, res) => {
    try {
      const query = req.query;
      let filtered = contributions;
      if (query.name) {
        const norm = normalizeName(query.name);
        filtered = filtered.filter(c => c.name_normalized.includes(norm));
      }
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
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="contributions.csv"');
      // Write CSV header
      res.write('committee_id,name,city,state,zip,employer,occupation,date,amount,entity_type,transaction_type\n');
      for (const row of filtered) {
        res.write([
          row.committee_id,
          '"' + (row.name || '').replace(/"/g, '""') + '"',
          '"' + (row.city || '').replace(/"/g, '""') + '"',
          row.state,
          row.zip_code,
          '"' + (row.employer || '').replace(/"/g, '""') + '"',
          '"' + (row.occupation || '').replace(/"/g, '""') + '"',
          row.date,
          row.amount,
          row.entity_tp,
          row.transaction_tp
        ].join(',') + '\n');
      }
      res.end();
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Export failed' });
    }
  });

  return router;
} 