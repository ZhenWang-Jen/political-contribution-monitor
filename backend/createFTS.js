const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'data/contributions.db');

function createFTSTable() {
  console.log('Creating FTS5 virtual table...');
  const db = new Database(DB_PATH);
  
  try {
    // Check if FTS5 table already exists
    const existing = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contributions_fts'").get();
    
    if (existing) {
      console.log('FTS5 table already exists. Dropping and recreating...');
      db.exec('DROP TABLE contributions_fts');
    }
    
    // Create FTS5 virtual table
    db.exec(`CREATE VIRTUAL TABLE contributions_fts USING fts5(name, content='contributions', content_rowid='id')`);
    console.log('FTS5 table created successfully.');
    
    // Check how many records we have
    const count = db.prepare('SELECT COUNT(*) as total FROM contributions').get().total;
    console.log(`Found ${count} records to index...`);
    
    // Populate FTS5 table
    console.log('Populating FTS5 table...');
    const result = db.exec(`INSERT INTO contributions_fts(rowid, name) SELECT id, name FROM contributions`);
    console.log('FTS5 table populated successfully!');
    
    // Verify the population
    const ftsCount = db.prepare('SELECT COUNT(*) as total FROM contributions_fts').get().total;
    console.log(`FTS5 table now contains ${ftsCount} indexed records.`);
    
    db.close();
    console.log('FTS5 setup complete!');
    
  } catch (error) {
    console.error('Error creating FTS5 table:', error);
    db.close();
    process.exit(1);
  }
}

if (require.main === module) {
  createFTSTable();
}

module.exports = createFTSTable; 