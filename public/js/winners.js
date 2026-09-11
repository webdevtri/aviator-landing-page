/**
 * Live Winners & Real-time Bets Feed Controller
 * Generates dynamic, realistic player cash-outs with authentic icons, formatted currency, and live pool ticker.
 */

class LiveWinnersWidget {
  constructor() {
    this.feedContainer = document.getElementById('liveWinnersFeed');
    this.poolCounterEl = document.getElementById('livePoolCounter');
    this.activePlayersCountEl = document.getElementById('activePlayersCount');

    this.currentPool = 41304886;
    this.currentCurrency = 'INR';

    this.mockNames = [
      "StarChaser", "Player ••••7", "RaniOfRisk", "Aarav_Pro", "SkyQueen",
      "Vikram99", "LuckyAces", "ViperKing", "TigerBet_88", "ThunderAce",
      "Rohan_VIP", "SpeedJet", "Ananya_7", "Pilot_Kabir", "GoldFalcon",
      "ShadowFlight", "CasinoKing_9", "Pooja_Wins", "RocketMan_X", "HighRoller_8"
    ];

    this.avatars = [
      { type: 'star', svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`, bg: 'var(--badge-blue)' },
      { type: 'mask', svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`, bg: 'var(--badge-dark)' },
      { type: 'crown', svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z"/></svg>`, bg: 'var(--badge-purple)' },
      { type: 'rocket', svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.13 2.18c-3.13.91-5.74 3.19-7.07 6.17-.67 1.5-.96 3.11-.96 4.75 0 .7.08 1.39.23 2.05L2 18.5V22h3.5l3.35-3.33c.66.15 1.35.23 2.05.23 1.64 0 3.25-.29 4.75-.96 2.98-1.33 5.26-3.94 6.17-7.07.13-.43.18-.88.18-1.34 0-.48-.06-.95-.19-1.41l-8.68-6.14zM9.5 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`, bg: 'var(--badge-red)' }
    ];

    if (window.CMS) this.mockNames = window.CMS.get('players.names').split('\n').map(s=>s.trim()).filter(Boolean);
    if (!this.mockNames.length) this.mockNames = ['Pilot'];
    document.addEventListener('cms:change', () => {
      this.mockNames = window.CMS.get('players.names').split('\n').map(s=>s.trim()).filter(Boolean);
      if (!this.mockNames.length) this.mockNames = ['Pilot'];
      this.seedInitialFeed();
    });
    this.init();
  }

  init() {
    this.updatePoolDisplay();
    this.seedInitialFeed();
    this.startLiveStream();
  }

  setCurrency(curr) {
    this.currentCurrency = curr;
    this.updatePoolDisplay();
  }

  formatCurrency(amount) {
    if (this.currentCurrency === 'USD') {
      return '$' + Math.round(amount / 85).toLocaleString('en-US');
    }
    // Indian numbering format (e.g. ₹4,13,04,886)
    return '₹' + amount.toLocaleString('en-IN');
  }

  updatePoolDisplay() {
    if (this.poolCounterEl) {
      this.poolCounterEl.textContent = this.formatCurrency(this.currentPool);
    }
  }

  seedInitialFeed() {
    const initialItems = [
      { name: "Player ••••7", mult: 1.72, amount: 3440, avatarIdx: 1 },
      { name: "StarChaser", mult: 1.57, amount: 315, avatarIdx: 0 },
      { name: "RaniOfRisk", mult: 1.25, amount: 250, avatarIdx: 2 }
    ];

    if (!this.feedContainer) return;
    this.feedContainer.innerHTML = '';
    initialItems.forEach((item,i) => this.renderItem({...item,name:this.mockNames[i % this.mockNames.length]}, false));
  }

  renderItem(item, animate = true) {
    if (!this.feedContainer) return;

    const avatar = this.avatars[item.avatarIdx % this.avatars.length];
    const row = document.createElement('div');
    row.className = `winner-row ${animate ? 'new-entry' : ''}`;

    const customAvatar = window.CMS?.get('avatar.'+(item.avatarIdx % this.avatars.length));
    const safeName = window.CMS ? window.CMS.esc(item.name) : item.name;
    const avatarMarkup = customAvatar ? '<img alt="" src="'+window.CMS.esc(customAvatar)+'">' : avatar.svg;
    row.innerHTML = `
      <div class="winner-avatar" style="background: ${avatar.bg};">
        ${avatarMarkup}
      </div>
      <div class="winner-info">
        <span class="winner-name">${safeName}</span>
        <span class="winner-mult">${item.mult.toFixed(2)}x</span>
      </div>
      <div class="winner-amount">
        ${this.formatCurrency(item.amount)}
      </div>
    `;

    this.feedContainer.prepend(row);

    // Keep only last 4 visible
    while (this.feedContainer.children.length > 4) {
      this.feedContainer.removeChild(this.feedContainer.lastChild);
    }
  }

  startLiveStream() {
    const scheduleNext = () => {
      const delay = Math.random() * 2500 + 1500; // 1.5s - 4.0s
      setTimeout(() => {
        this.addRandomWinner();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  addRandomWinner() {
    const name = this.mockNames[Math.floor(Math.random() * this.mockNames.length)];
    const avatarIdx = Math.floor(Math.random() * this.avatars.length);
    // Weighted multipliers: mostly 1.2x - 3.5x, occasionally 10x - 50x
    const isBig = Math.random() < 0.15;
    const mult = isBig ? +(10 + Math.random() * 40).toFixed(2) : +(1.15 + Math.random() * 2.5).toFixed(2);
    const baseBet = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
    const amount = Math.round(baseBet * mult);

    this.renderItem({ name, mult, amount, avatarIdx }, true);

    // Increment pool slightly
    this.currentPool += Math.floor(Math.random() * 850 + 120);
    this.updatePoolDisplay();

    // Random slight variation in active players count
    if (this.activePlayersCountEl) {
      const count = 190 + Math.floor(Math.random() * 18);
      this.activePlayersCountEl.textContent = count;
    }
  }
}

window.LiveWinnersWidget = LiveWinnersWidget;
