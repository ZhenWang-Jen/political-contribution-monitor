const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, './data/contributions.db');

console.log('Creating optimal indexes for fast searching...');

try {
  const db = new Database(DB_PATH);
  db.exec('BEGIN TRANSACTION');

  // Single-column indexes
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_name ON contributions(name)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_state ON contributions(state)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_city ON contributions(city)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(date)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_amount ON contributions(amount)');

  // Composite indexes for common queries
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_name_state ON contributions(name, state)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_name_city_state ON contributions(name, city, state)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_state_city ON contributions(state, city)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_committee_id ON contributions(committee_id)');

  // Index for date+amount ordering
  db.exec('CREATE INDEX IF NOT EXISTS idx_contributions_date_amount ON contributions(date DESC, amount DESC)');

  db.exec('COMMIT');
  console.log('Indexes created successfully!');
  db.close();
} catch (error) {
  console.error('Error creating indexes:', error);
} 