const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'UK Water Tracker API - Live Links Version',
    endpoints: {
      incidents: '/api/incidents'
    }
  });
});

// Main incidents endpoint
app.get('/api/incidents', (req, res) => {
  const incidents = [
    {
      company: 'thames',
      location: 'Thames Valley & London',
      status: 'View Live Map',
      details: 'Click to view Thames Water live network status and current incidents.',
      delivery: false,
      link: 'https://www.thameswater.co.uk/network-latest',
      priority: false
    },
    {
      company: 'southern',
      location: 'Hampshire, Sussex & Kent',
      status: 'View Live Map',
      details: 'Click to view Southern Water live incident map and supply interruptions.',
      delivery: false,
      link: 'https://www.southernwater.co.uk/works-or-issues-in-my-area',
      priority: false
    },
    {
      company: 'southeast',
      location: 'Kent, Sussex, Surrey',
      status: 'AquAlerter Map',
      details: 'Click to view South East Water live AquAlerter map for current incidents.',
      delivery: false,
      link: 'https://inyourarea.digdat.co.uk/southeastwater',
      priority: false
    },
    {
      company: 'southwest',
      location: 'Devon, Cornwall, Somerset',
      status: 'View Live Updates',
      details: 'Click to view South West Water service updates and incidents.',
      delivery: false,
      link: 'https://www.southwestwater.co.uk/household/help-support/in-your-area/service-updates',
      priority: false
    },
    {
      company: 'affinity',
      location: 'Beds, Bucks, Herts, Essex',
      status: 'View Alerts',
      details: 'Click to view Affinity Water current alerts and planned works.',
      delivery: false,
      link: 'https://www.affinitywater.co.uk/alerts',
      priority: false
    }
  ];

  const response = {
    updated: new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/London'
    }) + ' GMT',
    totalIncidents: incidents.length,
    incidents: incidents,
    note: 'Click each link to view live incident data from water companies'
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`🚰 Water Tracker API running on port ${PORT}`);
});
