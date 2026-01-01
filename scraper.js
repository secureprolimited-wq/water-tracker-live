const puppeteer = require('puppeteer');

// Scrape Thames Water incidents
async function scrapeThamesWater(page) {
  try {
    console.log('Scraping Thames Water...');
    await page.goto('https://www.thameswater.co.uk/network-latest', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await page.waitForTimeout(3000);

    const incidents = await page.evaluate(() => {
      const results = [];
      const incidentCards = document.querySelectorAll('[class*="incident"], [class*="alert"], article, .card');
      
      incidentCards.forEach(card => {
        const text = card.innerText || card.textContent;
        
        // Look for postcodes (UK format)
        const postcodeMatch = text.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?)\b/g);
        
        if (postcodeMatch && (text.toLowerCase().includes('no water') || 
            text.toLowerCase().includes('low pressure') || 
            text.toLowerCase().includes('supply') ||
            text.toLowerCase().includes('burst'))) {
          
          const hasDelivery = text.toLowerCase().includes('tanker') || 
                            text.toLowerCase().includes('bottled water') ||
                            text.toLowerCase().includes('priority');
          
          results.push({
            company: 'thames',
            location: postcodeMatch[0],
            status: text.toLowerCase().includes('no water') ? 'No Water' : 'Active',
            details: text.substring(0, 150).replace(/\n/g, ' ').trim(),
            delivery: hasDelivery,
            link: 'https://www.thameswater.co.uk/network-latest'
          });
        }
      });
      
      return results.slice(0, 5); // Limit to top 5
    });

    console.log(`Thames Water: Found ${incidents.length} incidents`);
    return incidents;
  } catch (error) {
    console.error('Thames Water scrape error:', error.message);
    return [{
      company: 'thames',
      location: 'View Live Map',
      status: 'Check Status',
      details: 'Click to view Thames Water live incident map.',
      delivery: false,
      link: 'https://www.thameswater.co.uk/network-latest'
    }];
  }
}

// Scrape Southern Water incidents
async function scrapeSouthernWater(page) {
  try {
    console.log('Scraping Southern Water...');
    await page.goto('https://www.southernwater.co.uk/works-or-issues-in-my-area', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await page.waitForTimeout(4000);

    const incidents = await page.evaluate(() => {
      const results = [];
      const elements = document.querySelectorAll('[class*="incident"], [class*="supply"], [class*="alert"], div');
      
      elements.forEach(el => {
        const text = el.innerText || el.textContent;
        const postcodeMatch = text.match(/\b([A-Z]{2}\d{1,2}[A-Z]?)\b/g);
        
        if (postcodeMatch && text.length < 500 && (
            text.toLowerCase().includes('supply') || 
            text.toLowerCase().includes('water') ||
            text.toLowerCase().includes('interruption'))) {
          
          const hasDelivery = text.toLowerCase().includes('station') || 
                            text.toLowerCase().includes('delivery') ||
                            text.toLowerCase().includes('bottled');
          
          results.push({
            company: 'southern',
            location: postcodeMatch[0],
            status: text.toLowerCase().includes('investigating') ? 'Investigating' : 'Active',
            details: text.substring(0, 120).replace(/\n/g, ' ').trim(),
            delivery: hasDelivery,
            link: 'https://www.southernwater.co.uk/works-or-issues-in-my-area'
          });
        }
      });
      
      return [...new Map(results.map(item => [item.location, item])).values()].slice(0, 4);
    });

    console.log(`Southern Water: Found ${incidents.length} incidents`);
    return incidents;
  } catch (error) {
    console.error('Southern Water scrape error:', error.message);
    return [{
      company: 'southern',
      location: 'View Live Map',
      status: 'Check Status',
      details: 'Click to view Southern Water incident map.',
      delivery: false,
      link: 'https://www.southernwater.co.uk/works-or-issues-in-my-area'
    }];
  }
}

// Scrape South West Water incidents
async function scrapeSouthWestWater(page) {
  try {
    console.log('Scraping South West Water...');
    await page.goto('https://www.southwestwater.co.uk/household/help-support/in-your-area/service-updates', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await page.waitForTimeout(3000);

    const incidents = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('article, [class*="update"], [class*="incident"], .content-item');
      
      items.forEach(item => {
        const text = item.innerText || item.textContent;
        const postcodeMatch = text.match(/\b([A-Z]{2}\d{1,2})\b/g);
        
        if (postcodeMatch && text.length < 400) {
          results.push({
            company: 'southwest',
            location: postcodeMatch[0],
            status: text.toLowerCase().includes('no water') ? 'No Water' : 'Active',
            details: text.substring(0, 100).replace(/\n/g, ' ').trim(),
            delivery: false,
            link: 'https://www.southwestwater.co.uk/household/help-support/in-your-area/service-updates'
          });
        }
      });
      
      return results.slice(0, 6);
    });

    console.log(`South West Water: Found ${incidents.length} incidents`);
    return incidents;
  } catch (error) {
    console.error('South West Water scrape error:', error.message);
    return [];
  }
}

// Scrape Affinity Water
async function scrapeAffinityWater(page) {
  try {
    console.log('Scraping Affinity Water...');
    await page.goto('https://www.affinitywater.co.uk/alerts', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    await page.waitForTimeout(2000);

    const incidents = await page.evaluate(() => {
      const results = [];
      const alerts = document.body.innerText;
      
      if (!alerts.toLowerCase().includes('no alerts') && 
          !alerts.toLowerCase().includes('currently no alerts')) {
        
        const postcodeMatches = alerts.match(/\b([A-Z]{2,3}\d{1,2})\b/g);
        
        if (postcodeMatches) {
          postcodeMatches.forEach(postcode => {
            results.push({
              company: 'affinity',
              location: postcode,
              status: 'Interruption',
              details: 'Supply interruption reported. Click for details.',
              delivery: false,
              link: 'https://www.affinitywater.co.uk/alerts'
            });
          });
        }
      }
      
      return [...new Set(results.map(JSON.stringify))].map(JSON.parse).slice(0, 3);
    });

    console.log(`Affinity Water: Found ${incidents.length} incidents`);
    return incidents;
  } catch (error) {
    console.error('Affinity Water scrape error:', error.message);
    return [];
  }
}

// South East Water - Link to their map system
function getSouthEastWaterIncidents() {
  return [{
    company: 'southeast',
    location: 'Kent & Sussex',
    status: 'Check AquAlerter',
    details: 'Click to view live AquAlerter map for current incidents.',
    delivery: false,
    link: 'https://inyourarea.digdat.co.uk/southeastwater'
  }];
}

// Main scraping function
async function scrapeAllIncidents() {
  console.log('🚀 Starting scrape of all water companies...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    const allIncidents = [];

    // Scrape each company
    const thamesIncidents = await scrapeThamesWater(page);
    allIncidents.push(...thamesIncidents);

    const southernIncidents = await scrapeSouthernWater(page);
    allIncidents.push(...southernIncidents);

    const southWestIncidents = await scrapeSouthWestWater(page);
    allIncidents.push(...southWestIncidents);

    const affinityIncidents = await scrapeAffinityWater(page);
    allIncidents.push(...affinityIncidents);

    const southEastIncidents = getSouthEastWaterIncidents();
    allIncidents.push(...southEastIncidents);

    await browser.close();

    console.log(`✅ Scraping complete. Total incidents: ${allIncidents.length}`);
    return allIncidents;

  } catch (error) {
    await browser.close();
    throw error;
  }
}

module.exports = { scrapeAllIncidents };
