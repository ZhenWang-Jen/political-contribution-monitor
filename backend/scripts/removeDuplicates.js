const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/contributions.db');

function removeDuplicates() {
  const db = new Database(DB_PATH);
  try {
    // Find duplicate transaction_ids
    const duplicates = db.prepare(`
      SELECT transaction_id
      FROM contributions
      WHERE transaction_id IS NOT NULL AND transaction_id != ''
      GROUP BY transaction_id
      HAVING COUNT(*) > 1
    `).all();

    let totalRemoved = 0;
    for (const dup of duplicates) {
      // For each duplicate transaction_id, keep the row with the lowest id
      const rows = db.prepare(`
        SELECT id FROM contributions WHERE transaction_id = ? ORDER BY id ASC
      `).all(dup.transaction_id);
      const idsToDelete = rows.slice(1).map(r => r.id); // keep the first, delete the rest
      if (idsToDelete.length > 0) {
        const placeholders = idsToDelete.map(() => '?').join(',');
        db.prepare(`DELETE FROM contributions WHERE id IN (${placeholders})`).run(...idsToDelete);
        totalRemoved += idsToDelete.length;
      }
    }
    db.close();
    console.log(`Removed ${totalRemoved} duplicate rows from contributions.`);
  } catch (err) {
    db.close();
    console.error('Error removing duplicates:', err);
  }
}

if (require.main === module) {
  removeDuplicates();
}

module.exports = removeDuplicates; 