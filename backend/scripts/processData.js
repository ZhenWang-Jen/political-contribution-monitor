const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(__dirname, '../data/contributions.db');

// FEC field positions (pipe-delimited)
const FIELDS = [
  'committee_id',    // 0
  'amendment_ind',   // 1
  'report_type',     // 2
  'transaction_pgi', // 3
  'image_num',       // 4
  'transaction_type',// 5
  'entity_type',     // 6
  'name',            // 7
  'city',            // 8
  'state',           // 9
  'zip',             // 10
  'employer',        // 11
  'occupation',      // 12
  'date',            // 13
  'amount',          // 14
  'other_id',        // 15
  'transaction_id',  // 16
  'file_num',        // 17
  'memo_cd',         // 18
  'memo_text',       // 19
  'sub_id'           // 20
];

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim();
}

function createTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    committee_id TEXT,
    amendment_ind TEXT,
    report_type TEXT,
    transaction_pgi TEXT,
    image_num TEXT,
    transaction_type TEXT,
    entity_type TEXT,
    name TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    employer TEXT,
    occupation TEXT,
    date TEXT,
    amount REAL,
    other_id TEXT,
    transaction_id TEXT UNIQUE,
    file_num TEXT,
    memo_cd TEXT,
    memo_text TEXT,
    sub_id TEXT
  )`);
  // Always drop and recreate FTS5 table to ensure correct schema
  db.exec('DROP TABLE IF EXISTS contributions_fts');
  db.exec(`CREATE VIRTUAL TABLE contributions_fts USING fts5(name, name_normalized, content='contributions', content_rowid='id')`);
}

async function importFECFiles() {
  const db = new Database(DB_PATH);
  createTable(db);
  const insert = db.prepare(`INSERT OR IGNORE INTO contributions (
    committee_id, amendment_ind, report_type, transaction_pgi, image_num, transaction_type, entity_type, name, city, state, zip, employer, occupation, date, amount, other_id, transaction_id, file_num, memo_cd, memo_text, sub_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.dat'));
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log('Importing', filePath);
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });
    let count = 0;
    for await (const line of rl) {
      if (!line.trim()) continue;
      const row = line.split('|');
      if (row.length < 21) continue; // skip malformed
      insert.run(
        row[0],  // committee_id
        row[1],  // amendment_ind
        row[2],  // report_type
        row[3],  // transaction_pgi
        row[4],  // image_num
        row[5],  // transaction_type
        row[6],  // entity_type
        row[7],  // name
        row[8],  // city
        row[9],  // state
        row[10], // zip
        row[11], // employer
        row[12], // occupation
        row[13], // date
        parseFloat(row[14]) || 0, // amount
        row[15], // other_id
        row[16], // transaction_id
        row[17], // file_num
        row[18], // memo_cd
        row[19], // memo_text
        row[20]  // sub_id
      );
      count++;
      if (count % 100000 === 0) console.log(`  Inserted ${count} rows...`);
    }
    console.log(`  Finished ${file}: ${count} rows inserted.`);
  }
  // Populate FTS5 table with normalized name
  const insertFts = db.prepare('INSERT INTO contributions_fts(rowid, name, name_normalized) VALUES (?, ?, ?)');
  const allRows = db.prepare('SELECT id, name FROM contributions').all();
  for (const row of allRows) {
    insertFts.run(row.id, row.name, normalizeName(row.name));
  }
  db.close();
  console.log('All files imported to SQLite!');
}

if (require.main === module) {
  importFECFiles();
}

module.exports = importFECFiles; 