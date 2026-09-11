const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const rules = require('./js/flight-rules');

class ActivityStore {
  constructor(filename = path.join(__dirname,'data','activity.sqlite'), now = Date.now, configuration = () => ({})) {
    if(filename!==':memory:') fs.mkdirSync(path.dirname(filename),{recursive:true});
    this.db=new DatabaseSync(filename);this.now=now;this.configuration=configuration;
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS subjects(id TEXT PRIMARY KEY,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS ip_aliases(ip_hash TEXT PRIMARY KEY,subject TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS visitors(id TEXT PRIMARY KEY,subject TEXT NOT NULL,last_seen INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS rounds(token TEXT PRIMARY KEY,subject TEXT NOT NULL,attempt INTEGER NOT NULL,admin INTEGER NOT NULL,started_at INTEGER NOT NULL,ends_at REAL NOT NULL,target REAL NOT NULL,stake REAL NOT NULL,currency TEXT NOT NULL,cashout_at INTEGER,cashout_multiplier REAL,payout REAL,status TEXT NOT NULL DEFAULT 'FLYING');
      CREATE UNIQUE INDEX IF NOT EXISTS public_attempt ON rounds(subject,attempt) WHERE admin=0;
      CREATE INDEX IF NOT EXISTS round_subject ON rounds(subject,admin,started_at);
      CREATE TABLE IF NOT EXISTS activities(id INTEGER PRIMARY KEY AUTOINCREMENT,subject TEXT NOT NULL,visitor TEXT NOT NULL,ip_hash TEXT NOT NULL,type TEXT NOT NULL,details TEXT NOT NULL,admin INTEGER NOT NULL,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS admin_sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS admin_users(username TEXT PRIMARY KEY,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS login_attempts(ip_hash TEXT PRIMARY KEY,failures INTEGER NOT NULL,reset_at INTEGER NOT NULL);
    `);
    if(!this.db.prepare('PRAGMA table_info(rounds)').all().some(c=>c.name==='growth_rate'))this.db.exec('ALTER TABLE rounds ADD COLUMN growth_rate REAL NOT NULL DEFAULT 0.3');
    if(!this.db.prepare('PRAGMA table_info(admin_sessions)').all().some(c=>c.name==='username'))this.db.exec('DELETE FROM admin_sessions; ALTER TABLE admin_sessions ADD COLUMN username TEXT');
    this.db.prepare('INSERT OR IGNORE INTO metadata VALUES (?,?)').run('identity_secret',crypto.randomBytes(32).toString('hex'));
    this.secret=this.db.prepare('SELECT value FROM metadata WHERE key=?').get('identity_secret').value;
    this.settle();
  }
  hash(value){return crypto.createHmac('sha256',this.secret).update(value).digest('hex');}
  identity(ip,cookie) {
    const ipHash=this.hash(ip.replace(/^::ffff:/,''));
    const known=this.db.prepare('SELECT * FROM visitors WHERE id=?').get(cookie||'');
    const alias=this.db.prepare('SELECT subject FROM ip_aliases WHERE ip_hash=?').get(ipHash);
    let subject=alias?.subject || known?.subject || crypto.randomUUID();
    if(alias&&known&&alias.subject!==known.subject){
      const count=id=>this.db.prepare('SELECT count(*) AS n FROM rounds WHERE subject=? AND admin=0').get(id).n;
      if(count(known.subject)>count(alias.subject))subject=known.subject;
    }
    const visitor=known?.id || crypto.randomBytes(24).toString('hex');
    this.db.prepare('INSERT OR IGNORE INTO subjects VALUES (?,?)').run(subject,this.now());
    this.db.prepare('INSERT INTO ip_aliases VALUES (?,?) ON CONFLICT(ip_hash) DO UPDATE SET subject=excluded.subject').run(ipHash,subject);
    this.db.prepare('INSERT INTO visitors VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET subject=excluded.subject,last_seen=excluded.last_seen').run(visitor,subject,this.now());
    return {subject,visitor,ipHash};
  }
  log(who,type,details={},admin=false){
    this.db.prepare('INSERT INTO activities(subject,visitor,ip_hash,type,details,admin,created_at) VALUES(?,?,?,?,?,?,?)').run(who.subject,who.visitor||'',who.ipHash||'',type,JSON.stringify(details),+admin,this.now());
  }
  settle(){
    const finished=this.db.prepare("SELECT * FROM rounds WHERE status='FLYING' AND ends_at<=?").all(this.now());
    for(const round of finished){
      const status=round.cashout_at===null?'LOSS':'WIN';
      this.db.prepare('UPDATE rounds SET status=? WHERE token=?').run(status,round.token);
      this.log({subject:round.subject},'flight_finished',{token:round.token,attempt:round.attempt,multiplier:round.target,outcome:status},!!round.admin);
    }
  }
  state(who,admin=false){
    this.settle();
    const rounds=this.db.prepare('SELECT * FROM rounds WHERE subject=? AND admin=? ORDER BY started_at DESC,rowid DESC').all(who.subject,+admin);
    const active=rounds.find(r=>r.status==='FLYING');
    return {isAdmin:admin,used:admin?0:rounds.length,remaining:admin?null:Math.max(0,2-rounds.length),nextAttempt:admin?1:Math.min(2,rounds.length+1),active:active?this.flight(active):null,wonSecond:admin?(rounds[0]?.attempt===2&&rounds[0]?.status==='WIN'):rounds.some(r=>r.attempt===2&&r.status==='WIN'),serverNow:this.now()};
  }
  flight(row){return {success:true,sessionToken:row.token,attemptNumber:row.attempt,duration:(row.ends_at-row.started_at)/1000,targetMultiplier:row.target,growthRate:row.growth_rate,betAmount:row.stake,currency:row.currency,startedAt:row.started_at,endsAt:row.ends_at,serverNow:this.now()};}
  start(who,admin,requestedAttempt,stake,currency){
    if(!Number.isFinite(stake)||stake<=0||stake>50000||!['INR','USD'].includes(currency))throw Object.assign(new Error('Invalid stake or currency.'),{status:400});
    this.db.exec('BEGIN IMMEDIATE');
    try{
      const state=this.state(who,admin);
      if(state.active)throw Object.assign(new Error('A flight is already in progress.'),{status:409});
      if(!admin&&state.remaining===0)throw Object.assign(new Error('Your two flights have been used.'),{status:403});
      if(!admin&&requestedAttempt!==state.nextAttempt)throw Object.assign(new Error('Your available round has changed. Updating the game.'),{status:409});
      const attempt=admin?(requestedAttempt===2?2:1):state.nextAttempt;
      const flight=rules(attempt,Math.random,this.configuration()),startedAt=this.now(),token=crypto.randomUUID();
      this.db.prepare('INSERT INTO rounds(token,subject,attempt,admin,started_at,ends_at,target,stake,currency,growth_rate) VALUES(?,?,?,?,?,?,?,?,?,?)').run(token,who.subject,attempt,+admin,startedAt,startedAt+flight.duration*1000,flight.targetMultiplier,stake,currency,flight.growthRate);
      this.log(who,'flight_started',{token,attempt,stake,currency},admin);
      this.db.exec('COMMIT');
      return this.flight(this.db.prepare('SELECT * FROM rounds WHERE token=?').get(token));
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  cashout(who,token,admin){
    this.db.exec('BEGIN IMMEDIATE');
    try{
      const round=this.db.prepare('SELECT * FROM rounds WHERE token=? AND subject=? AND admin=?').get(token,who.subject,+admin);
      if(!round)throw Object.assign(new Error('Flight not found.'),{status:404});
      if(round.cashout_at!==null){this.db.exec('COMMIT');return {success:true,multiplier:round.cashout_multiplier,amount:round.payout};}
      const now=this.now();
      if(now>=round.ends_at||round.status!=='FLYING')throw Object.assign(new Error('The plane has already flown away.'),{status:409});
      const multiplier=rules.multiplierAt(now-round.started_at,round.target,round.growth_rate),amount=Math.round(round.stake*multiplier);
      this.db.prepare('UPDATE rounds SET cashout_at=?,cashout_multiplier=?,payout=? WHERE token=?').run(now,multiplier,amount,token);
      this.log(who,'cashout',{token,attempt:round.attempt,multiplier,amount},admin);
      this.db.exec('COMMIT');return {success:true,multiplier,amount};
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  passwordHash(password){const salt=crypto.randomBytes(16).toString('hex');return salt+':'+crypto.scryptSync(password,salt,64).toString('hex');}
  verifyAdmin(username,password){
    if(typeof username!=='string'||typeof password!=='string'||password.length>256)return false;
    const row=this.db.prepare('SELECT password_hash FROM admin_users WHERE username=?').get(username.toLowerCase());
    const [salt,hash]=(row?.password_hash||('0'.repeat(32)+':'+ '0'.repeat(128))).split(':');
    const matches=crypto.timingSafeEqual(crypto.scryptSync(password,salt,64),Buffer.from(hash,'hex'));
    return !!row&&matches;
  }
  addAdmin(username,password){
    if(typeof username!=='string'||!/^[a-zA-Z0-9_.-]{3,40}$/.test(username))throw new Error('Username must contain 3–40 letters, numbers, dots, underscores or hyphens.');
    if(typeof password!=='string'||password.length<12||password.length>256)throw new Error('Use a password between 12 and 256 characters.');
    username=username.toLowerCase();
    if(this.db.prepare('SELECT 1 FROM admin_users WHERE username=?').get(username))throw new Error('That username already exists.');
    this.db.prepare('INSERT INTO admin_users VALUES(?,?,?)').run(username,this.passwordHash(password),this.now());return username;
  }
  changePassword(username,currentPassword,newPassword){
    if(!this.verifyAdmin(username,currentPassword))throw new Error('Current password is incorrect.');
    if(typeof newPassword!=='string'||newPassword.length<12||newPassword.length>256)throw new Error('Use a password between 12 and 256 characters.');
    if(currentPassword===newPassword)throw new Error('Choose a different password.');
    const hash=this.passwordHash(newPassword);
    this.db.exec('BEGIN IMMEDIATE');
    try{this.db.prepare('UPDATE admin_users SET password_hash=? WHERE username=?').run(hash,username);this.db.prepare('DELETE FROM admin_sessions WHERE username=?').run(username);this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}
  }
  login(username){
    if(!this.db.prepare('SELECT 1 FROM admin_users WHERE username=?').get(username))throw new Error('Admin account not found.');
    const token=crypto.randomBytes(32).toString('hex');this.db.prepare('INSERT INTO admin_sessions(token_hash,expires_at,username) VALUES(?,?,?)').run(this.hash(token),this.now()+12*3600000,username);return token;
  }
  adminUsername(token){return token?this.db.prepare('SELECT username FROM admin_sessions JOIN admin_users USING(username) WHERE token_hash=? AND expires_at>?').get(this.hash(token),this.now())?.username:null;}
  isAdmin(token){return !!this.adminUsername(token);}
  loginBlocked(ipHash){return !!this.db.prepare('SELECT 1 FROM login_attempts WHERE ip_hash=? AND failures>=10 AND reset_at>?').get(ipHash,this.now());}
  loginFailed(ipHash){this.db.prepare('DELETE FROM login_attempts WHERE reset_at<=?').run(this.now());this.db.prepare('INSERT INTO login_attempts VALUES(?,1,?) ON CONFLICT(ip_hash) DO UPDATE SET failures=failures+1').run(ipHash,this.now()+15*60000);}
  loginSucceeded(ipHash){this.db.prepare('DELETE FROM login_attempts WHERE ip_hash=?').run(ipHash);}
  logout(token){if(token)this.db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(this.hash(token));}
  recent(){this.settle();return this.db.prepare('SELECT id,substr(subject,1,8) AS visitor,substr(ip_hash,1,12) AS network,type,details,admin,created_at FROM activities ORDER BY id DESC LIMIT 150').all();}
  close(){this.db.close();}
}
module.exports={ActivityStore};
