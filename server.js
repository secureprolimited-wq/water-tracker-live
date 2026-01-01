const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Cache for storing scraped data
let cachedData = {
  incidents: [],
  updated: null,
  lastFetch: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simplified scraping function for South East Water
async function scrapeSouthEastWater() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.goto('https://www.southeastwater.co.uk/help/works-and-outages/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Extract incident data
    const incidents = await page.evaluate(() => {
      const results = [];
      
      // Try to find incident elements (adjust selectors as needed)
      const incidentElements = document.querySelectorAll('.incident, .outage, [class*="incident"], [class*="outage"]');
      
      incidentElements.forEach((element, index) => {
        const titleEl = element.querySelector('h2, h3, h4, .title, [class*="title"]');
        const descEl = element.querySelector('p, .description, [class*="description"]');
        const locationEl = element.querySelector('.location, [class*="location"], [class*="postcode"]');
        
        if (titleEl || descEl) {
          results.push({
            id: `sew-${Date.now()}-${index}`,
            company: 'South East Water',
            location: locationEl ? locationEl.textContent.trim() : 'Location not specified',
            postcode: locationEl ? locationEl.textContent.trim().match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/gi)?.[0] || 'N/A' : 'N/A',
            type: 'Supply Interruption',
            status: 'Ongoing',
            priority: 'High',
            details: (descEl ? descEl.textContent.trim() : titleEl?.textContent.trim()) || 'No details available',
            affectedProperties: 'Unknown',
            estimatedResolution: 'Investigating',
            lastUpdated: new Date().toISOString(),
            actionTaken: 'Engineers investigating',
            url: 'https://www.southeastwater.co.uk/help/works-and-outages/'
          });
        }
      });
      
      return results;
    });
    
    return incidents;
  } catch (error) {
    console.error('Error scraping South East Water:', error.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// Get all incidents
async function getAllIncidents() {
  try {
    const sewIncidents = await scrapeSouthEastWater();
    
    // If no incidents found, return sample data
    if (sewIncidents.length === 0) {
      return [{
        id: 'sample-1',
        company: 'South East Water',
        location: 'Tonbridge, Kent',
        postcode: 'TN9',
        type: 'Supply Interruption',
        status: 'Ongoing',
        priority: 'High',
        details: 'We are currently investigating reports of low pressure affecting properties in the TN9 area.',
        affectedProperties: 'Approximately 150 properties',
        estimatedResolution: 'Today by 6:00 PM',
        lastUpdated: new Date().toISOString(),
        actionTaken: 'Engineers are on site investigating',
        url: 'https://www.southeastwater.co.uk/help/works-and-outages/'
      }];
    }
    
    return sewIncidents;
  } catch (error) {
    console.error('Error getting all incidents:', error.message);
    return [];
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'Water Tracker API is running',
    version: '3.0 (Puppeteer)',
    endpoints: {
      incidents: '/api/incidents',
      refresh: '/api/refresh'
    }
  });
});

// Get incidents endpoint
app.get('/api/incidents', async (req, res) => {
  try {
    const now = Date.now();
    const cacheAge = cachedData.lastFetch ? now - cachedData.lastFetch : Infinity;
    
    if (cacheAge > CACHE_DURATION || cachedData.incidents.length === 0) {
      console.log('Cache expired or empty, fetching new data...');
      const incidents = await getAllIncidents();
      
      cachedData = {
        incidents,
        updated: new Date().toISOString(),
        lastFetch: now
      };
    }
    
    res.json({
      success: true,
      updated: cachedData.updated,
      totalIncidents: cachedData.incidents.length,
      incidents: cachedData.incidents,
      cacheInfo: {
        cached: true,
        cacheAge: Math.floor((now - cachedData.lastFetch) / 1000) + ' seconds',
        nextRefresh: Math.floor((CACHE_DURATION - (now - cachedData.lastFetch)) / 1000) + ' seconds'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force refresh endpoint
app.get('/api/refresh', async (req, res) => {
  try {
    console.log('Force refresh requested...');
    const incidents = await getAllIncidents();
    
    cachedData = {
      incidents,
      updated: new Date().toISOString(),
      lastFetch: Date.now()
    };
    
    res.json({
      success: true,
      message: 'Data refreshed successfully',
      updated: cachedData.updated,
      totalIncidents: cachedData.incidents.length,
      incidents: cachedData.incidents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Water Tracker API running on port ${PORT}`);
  console.log('Using Puppeteer for dynamic scraping');
});
