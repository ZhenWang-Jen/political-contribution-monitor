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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const searchResultsCache = new Map();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Load data and then set up routes
loadDataAndCreateIndex().then(({ contributions, fuse }) => {
  console.log('Data processed and Fuse index created.');

  // Pass the data to the routers
  app.use('/api/search', createSearchRouter(contributions, fuse));
  app.use('/api/bulk-search', createBulkSearchRouter(contributions, fuse, searchResultsCache));
  app.use('/api/export', createExportRouter(contributions, searchResultsCache));
  app.use('/api/analytics', createAnalyticsRouter(contributions));

  console.log('Routes configured.');

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });

}).catch(error => {
  console.error("Failed to load data and create index:", error);
  process.exit(1);
});