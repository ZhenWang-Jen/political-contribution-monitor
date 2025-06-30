// =============================================================================
// Imports and Setup
// =============================================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loadDataAndCreateIndex } from './utils/dataProcessor.js';

import createSearchRouter from './routes/search.js';
import createBulkSearchRouter from './routes/bulkSearch.js';
import createExportRouter from './routes/export.js';
import createAnalyticsRouter from './routes/analytics.js';

// =============================================================================
// App Initialization
// =============================================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const searchResultsCache = new Map(); // In-memory cache for bulk search exports

// =============================================================================
// Middleware
// =============================================================================
app.use(helmet()); // Basic security headers
app.use(compression()); // Gzip compression
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// =============================================================================
// App Logic
// =============================================================================

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * Main application logic.
 * This function initializes the data and search index, then sets up the API routes
 * and starts the Express server. This ensures the server doesn't start accepting
 * requests until it's fully ready.
 */
loadDataAndCreateIndex().then(({ contributions, fuse }) => {
  console.log('Data processed and Fuse index created.');

  // ===========================================================================
  // API Routes
  // ===========================================================================
  // Pass the loaded data and search index/cache to the respective routers
  app.use('/api/search', createSearchRouter(contributions, fuse));
  app.use('/api/bulk-search', createBulkSearchRouter(contributions, fuse, searchResultsCache));
  app.use('/api/export', createExportRouter(contributions, searchResultsCache));
  app.use('/api/analytics', createAnalyticsRouter(contributions));

  console.log('Routes configured.');

  // ===========================================================================
  // Error Handling & Static Files
  // ===========================================================================
  // Generic error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });

  // Handle 404 - Not Found
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Serve the frontend's static assets in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
  }

  // ===========================================================================
  // Server Start
  // ===========================================================================
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });

}).catch(error => {
  console.error("Failed to load data and create index:", error);
  process.exit(1);
});