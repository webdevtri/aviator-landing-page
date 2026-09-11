const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;
const DB_PATH = isVercel ? path.join('/tmp', 'db.json') : path.join(__dirname, 'data', 'db.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    console.log('[DB] Supabase client initialized for', SUPABASE_URL);
  } catch (e) {
    console.error('[DB] Failed to initialize Supabase client:', e.message);
  }
}

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
    console.error('Error reading local db:', err);
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
    console.error('Error writing local db:', err);
  }
}

// Public DB API
const db = {
  init() {
    readDb();
    if (supabase) {
      console.log('[DB] Cloud database ready (Supabase active).');
    } else {
      console.log('[DB] Local JSON database initialized at', DB_PATH);
    }
  },

  readDb,
  writeDb,

  async recordSession(sessionData) {
    const data = readDb();
    const session = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...sessionData
    };
    data.sessions.push(session);
    data.stats.totalFlights += 1;
    writeDb(data);

    if (supabase) {
      try {
        const { error } = await supabase.from('sessions').insert([{
          id: session.id,
          session_token: session.sessionToken || session.id,
          attempt_number: session.attemptNumber || 1,
          duration: session.duration || 0,
          multiplier: session.multiplier || 1,
          outcome: session.outcome || 'UNKNOWN',
          bet_amount: session.betAmount || 100,
          currency: session.currency || 'INR',
          timestamp: session.timestamp
        }]);
        if (error) console.warn('[DB] Supabase insert session warning:', error.message);
      } catch (err) {
        console.warn('[DB] Supabase insert session error:', err.message);
      }
    }

    return session;
  },

  async recordClaim(claimData) {
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

    if (supabase) {
      try {
        const { error } = await supabase.from('claims').insert([{
          id: claim.id,
          name: claim.name || 'Aviator Player',
          phone: claim.phone || '',
          email: claim.email || '',
          promo_code: claim.promoCode || 'AVIATOR500',
          bonus_percentage: claim.bonusPercentage || 500,
          amount: Number(claim.amount || 50000),
          currency: claim.currency || 'INR',
          session_token: claim.sessionToken || '',
          status: claim.status || 'APPROVED',
          timestamp: claim.timestamp
        }]);
        if (error) console.warn('[DB] Supabase insert claim warning:', error.message);
      } catch (err) {
        console.warn('[DB] Supabase insert claim error:', err.message);
      }
    }

    return claim;
  },

  async getWinners(limit = 10) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('winners')
          .select('*')
          .order('id', { ascending: false })
          .limit(limit);

        if (!error && data && data.length > 0) {
          return data.map(w => ({
            id: w.id,
            name: w.name,
            avatar: w.avatar || 'star',
            multiplier: Number(w.multiplier),
            amount: Number(w.amount),
            currency: w.currency || 'INR',
            time: w.time || 'Just now'
          }));
        }
      } catch (err) {
        console.warn('[DB] Supabase getWinners fallback to local:', err.message);
      }
    }

    const localData = readDb();
    return localData.winners.slice(0, limit);
  },

  async addWinner(winner) {
    const data = readDb();
    const newWinner = {
      id: Date.now(),
      time: "Just now",
      ...winner
    };
    data.winners.unshift(newWinner);
    if (data.winners.length > 30) {
      data.winners.pop();
    }
    writeDb(data);

    if (supabase) {
      try {
        const { error } = await supabase.from('winners').insert([{
          name: newWinner.name,
          avatar: newWinner.avatar || 'star',
          multiplier: Number(newWinner.multiplier),
          amount: Number(newWinner.amount),
          currency: newWinner.currency || 'INR',
          time: newWinner.time || 'Just now'
        }]);
        if (error) console.warn('[DB] Supabase addWinner warning:', error.message);
      } catch (err) {
        console.warn('[DB] Supabase addWinner error:', err.message);
      }
    }

    return data.winners;
  },

  async getStats() {
    const localData = readDb();
    if (supabase) {
      try {
        const { count: claimsCount } = await supabase
          .from('claims')
          .select('*', { count: 'exact', head: true });

        const { data: statsRow } = await supabase
          .from('stats')
          .select('*')
          .limit(1)
          .single();

        if (statsRow) {
          return {
            totalFlights: Number(statsRow.total_flights || localData.stats.totalFlights),
            totalBonusClaimed: Number(statsRow.total_bonus_claimed || localData.stats.totalBonusClaimed),
            activePlayers: Number(statsRow.active_players || localData.stats.activePlayers) + Math.floor(Math.random() * 15) - 7,
            totalClaims: claimsCount ?? localData.claims.length
          };
        }
      } catch (err) {
        console.warn('[DB] Supabase getStats fallback to local:', err.message);
      }
    }

    return {
      totalFlights: localData.stats.totalFlights,
      totalBonusClaimed: localData.stats.totalBonusClaimed,
      activePlayers: localData.stats.activePlayers + Math.floor(Math.random() * 15) - 7,
      totalClaims: localData.claims.length
    };
  }
};

module.exports = db;
