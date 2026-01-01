const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const { scrapeAllIncidents } = require('./scraper');

const app = express();
const cache = new NodeCache({ stdTTL: 900 }); // Cache for 15 minutes

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'UK Water Tracker API',
    endpoints: {
      incidents: '/api/incidents'
    }
  });
});

// Main API endpoint
app.get('/api/incidents', async (req, res) => {
  try {
    // Check cache first
    const cachedData = cache.get('incidents');
    if (cachedData) {
      console.log('Returning cached data');
      return res.json(cachedData);
    }

    console.log('Fetching fresh data...');
    const incidents = await scrapeAllIncidents();
    
    const response = {
      updated: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      }) + ' GMT',
      totalIncidents: incidents.length,
      incidents: incidents,
      nextUpdate: '15 minutes'
    };

    // Cache the response
    cache.set('incidents', response);

    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch incidents',
      message: error.message,
      updated: new Date().toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      }) + ' GMT'
    });
  }
});

// Force refresh endpoint (clears cache)
app.post('/api/refresh', (req, res) => {
  cache.del('incidents');
  res.json({ message: 'Cache cleared. Next request will fetch fresh data.' });
});

app.listen(PORT, () => {
  console.log(`🚰 Water Tracker API running on port ${PORT}`);
});
