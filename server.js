const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { ActivityStore } = require('./activity-store');
const { createVisitorAPI } = require('./visitor-api');
const fs = require('fs');
const { createCMS } = require('./cms');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.VERCEL || process.env.NOW_REGION || process.env.TRUST_PROXY) {
  app.set('trust proxy', 1);
}
let sqliteDbPath = path.join(__dirname, 'data', 'activity.sqlite');
if (process.env.VERCEL) {
  const tmpDb = path.join('/tmp', 'activity.sqlite');
  if (!fs.existsSync(tmpDb) && fs.existsSync(sqliteDbPath)) {
    try {
      fs.copyFileSync(sqliteDbPath, tmpDb);
    } catch (e) {
      console.warn('Failed copying seed sqlite DB to /tmp:', e);
    }
  }
  sqliteDbPath = fs.existsSync(tmpDb) ? tmpDb : ':memory:';
}
const activityStore = new ActivityStore(sqliteDbPath, Date.now, () => {
  const file = path.join(__dirname, 'data', 'site-content.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).values : {};
});
const visitorAPI = createVisitorAPI(activityStore);
const cmsAPI = createCMS({ isAuthenticated: visitorAPI.isAdmin });
app.use(['/api/cms', '/cms'], cmsAPI);
app.use(['/api', '/'], visitorAPI.router);
const settleTimer=setInterval(()=>activityStore.settle(),250);settleTimer.unref();
app.get('/admin', (req, res) => {
  const p = path.join(__dirname, 'public', 'admin.html');
  res.sendFile(fs.existsSync(p) ? p : path.join(__dirname, 'admin.html'));
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
for (const folder of ['assets','css','js']) {
  const p = path.join(__dirname, 'public', folder);
  const target = fs.existsSync(p) ? p : path.join(__dirname, folder);
  app.use('/'+folder, express.static(target, {setHeaders:res=>res.set('X-Content-Type-Options','nosniff')}));
}
app.use(['/data','/node_modules','/.git'],(req,res)=>res.sendStatus(404));

// Initialize database
db.init();

// --- API Endpoints ---

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// App Config & Meta
app.get(['/api/config', '/config'], (req, res) => {
  res.json({
    appName: 'Aviator Pro Landing Page',
    promoCode: 'AVIATOR500',
    bonusMultiplier: 500,
    currencies: ['INR', 'USD'],
    defaultCurrency: 'INR',
    defaultBet: 100
  });
});

// Claim 500% Welcome Bonus
app.post(['/api/bonus/claim', '/bonus/claim'], async (req, res) => {
  const {
    name = 'Aviator Winner',
    phone = '',
    email = '',
    promoCode = 'AVIATOR500',
    amount = 50000,
    currency = 'INR',
    sessionToken = ''
  } = req.body;

  try {
    const claim = await db.recordClaim({
      name,
      phone,
      email,
      promoCode,
      amount,
      currency,
      sessionToken
    });

    res.json({
      success: true,
      message: '500% Welcome Bonus Claimed Successfully!',
      claim,
      promoCode: 'AVIATOR500',
      bonusValue: Number(amount) * 5,
      redirectUrl: 'https://aviator-games.vip/claim?code=AVIATOR500'
    });
  } catch (err) {
    console.error('Error claiming bonus:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Live Winners Feed
app.get(['/api/winners', '/winners'], async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const winners = await db.getWinners(limit);
    res.json({ success: true, winners });
  } catch (err) {
    res.json({ success: true, winners: [] });
  }
});

// Platform Stats
app.get(['/api/stats', '/stats'], async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.json({
      success: true,
      stats: {
        totalFlights: 142857,
        totalBonusClaimed: 41304886,
        activePlayers: 194,
        totalClaims: 0
      }
    });
  }
});

// Fallback to index.html for root routing
app.get('*', (req, res) => {
  const p = path.join(__dirname, 'public', 'index.html');
  res.sendFile(fs.existsSync(p) ? p : path.join(__dirname, 'index.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Aviator Landing Page Server Running!`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}

module.exports = app;
