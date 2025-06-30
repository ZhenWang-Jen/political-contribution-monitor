import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

// FEC file columns (based on your data)
const FEC_COLUMNS = [
  'cmte_id', 'amndt_ind', 'rpt_tp', 'transaction_pgi', 'image_num', 'transaction_tp', 'entity_tp',
  'name', 'city', 'state', 'zip_code', 'employer', 'occupation', 'transaction_dt', 'transaction_amt',
  'other_id', 'tran_id', 'file_num', 'memo_cd', 'memo_text', 'sub_id'
];

// For __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const TXT_FILES = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.txt'));

export function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
}

// Parse a single line into a contribution object
function parseLine(line) {
  const parts = line.split('|');
  const obj = {};
  for (let i = 0; i < FEC_COLUMNS.length; i++) {
    obj[FEC_COLUMNS[i]] = parts[i] || '';
  }
  // Normalize name for search
  obj.name_normalized = normalizeName(obj.name);
  obj.amount = parseFloat(obj.transaction_amt) || 0;
  obj.date = obj.transaction_dt;
  return obj;
}

// Async initializer for in-memory data and Fuse.js index
export async function loadDataAndCreateIndex() {
  // Load all contributions from all txt files
  const contributions = [];
  TXT_FILES.forEach(file => {
    const lines = fs.readFileSync(path.join(DATA_DIR, file), 'utf8')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    lines.forEach(line => {
      const obj = parseLine(line);
      contributions.push(obj);
    });
  });

  // Build Fuse.js index for name
  const fuse = new Fuse(contributions, {
    keys: ['name_normalized'],
    threshold: 0.3, // adjust for fuzziness
    includeScore: true,
    minMatchCharLength: 2,
    useExtendedSearch: true,
  });

  return {
    contributions,
    fuse
  };
} 