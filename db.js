const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;
const DB_PATH = isVercel ? path.join('/tmp', 'db.json') : path.join(__dirname, 'data', 'db.json');

// Default initial state
const defaultState = {
  sessions: [],
  claims: [],
  winners: [
    { id: 1, name: "StarChaser", avatar: "star", multiplier: 1.57, amount: 315, currency: "INR", time: "Just now" },
    { id: 2, name: "Player ••••7", avatar: "mask", multiplier: 1.72, amount: 3440, currency: "INR", time: "Just now" },
    { id: 3, name: "RaniOfRisk", avatar: "crown", multiplier: 1.25, amount: 250, currency: "INR", time: "1m ago" },
    { id: 4, name: "JetMaster99", avatar: "rocket", multiplier: 14.80, amount: 29600, currency: "INR", time: "2m ago" },
    { id: 5, name: "LuckyAces", avatar: "star", multiplier: 3.42, amount: 6840, currency: "INR", time: "3m ago" },
    { id: 6, name: "ViperKing", avatar: "crown", multiplier: 8.90, amount: 17800, currency: "INR", time: "4m ago" },
    { id: 7, name: "SkyHigh_Pro", avatar: "mask", multiplier: 2.15, amount: 4300, currency: "INR", time: "5m ago" },
    { id: 8, name: "TigerBet_88", avatar: "star", multiplier: 22.40, amount: 44800, currency: "INR", time: "6m ago" }
  ],
  stats: {
    totalFlights: 142857,
    totalBonusClaimed: 41304886,
    activePlayers: 194
  }
};

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const seedPath = path.join(__dirname, 'data', 'db.json');
      if (fs.existsSync(seedPath) && DB_PATH !== seedPath) {
        const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
        writeDb(seedData);
        return seedData;
      }
      writeDb(defaultState);
      return defaultState;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db:', err);
    return defaultState;
  }
}

function writeDb(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

// Public DB API
const db = {
  init() {
    readDb();
    console.log('[DB] Persistent database initialized at', DB_PATH);
  },

  recordSession(sessionData) {
    const data = readDb();
    const session = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...sessionData
    };
    data.sessions.push(session);
    data.stats.totalFlights += 1;
    writeDb(data);
    return session;
  },

  recordClaim(claimData) {
    const data = readDb();
    const claim = {
      id: 'clm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      promoCode: 'AVIATOR500',
      bonusPercentage: 500,
      timestamp: new Date().toISOString(),
      status: 'APPROVED',
      ...claimData
    };
    data.claims.push(claim);
    data.stats.totalBonusClaimed += Number(claimData.amount || 50000);
    writeDb(data);
    return claim;
  },

  getWinners(limit = 10) {
    const data = readDb();
    return data.winners.slice(0, limit);
  },

  addWinner(winner) {
    const data = readDb();
    data.winners.unshift({
      id: Date.now(),
      time: "Just now",
      ...winner
    });
    if (data.winners.length > 30) {
      data.winners.pop();
    }
    writeDb(data);
    return data.winners;
  },

  getStats() {
    const data = readDb();
    return {
      totalFlights: data.stats.totalFlights,
      totalBonusClaimed: data.stats.totalBonusClaimed,
      activePlayers: data.stats.activePlayers + Math.floor(Math.random() * 15) - 7,
      totalClaims: data.claims.length
    };
  }
};

module.exports = db;
