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

/**
 * Normalizes a name for searching by converting to lowercase, removing special characters,
 * and collapsing whitespace.
 * @param {string} name The name to normalize.
 * @returns {string} The normalized name.
 */
export function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
}

/**
 * Parses a single line from the FEC data file into a structured contribution object.
 * @param {string} line A single pipe-delimited line of text.
 * @returns {object} A contribution object.
 */
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

/**
 * Initializes the application's data by reading all .txt files from the data directory,
 * parsing them into contribution objects, and building a Fuse.js search index.
 * This function is called once on server startup.
 * @returns {Promise<{contributions: object[], fuse: Fuse}>} An object containing the array of contributions and the Fuse.js index.
 */
export async function loadDataAndCreateIndex() {
  console.log(`Loading data from: ${TXT_FILES.join(', ')}`);
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
  console.log(`Loaded ${contributions.length} total contributions.`);

  // Build Fuse.js index for name
  console.log('Building Fuse.js index...');
  const fuse = new Fuse(contributions, {
    keys: ['name_normalized'], // The field to search in
    threshold: 0.3, // A value of 0.0 requires a perfect match, 1.0 would match anything.
    includeScore: true, // Include the search score in the results
    minMatchCharLength: 2, // Minimum number of characters that must be matched
    useExtendedSearch: true, // Enable powerful AND-style search logic
  });
  console.log('Fuse.js index built successfully.');

  return {
    contributions,
    fuse
  };
} 