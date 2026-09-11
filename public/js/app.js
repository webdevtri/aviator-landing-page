/** Two simulated flights with timed messages and user-triggered cashout. */

document.addEventListener('DOMContentLoaded', () => {
  const cmsText = (key, fallback, variables = {}) => window.CMS ? window.CMS.text(key, variables) : fallback.replace(/\{(\w+)\}/g, (all, name) => variables[name] ?? all);
  // DOM Elements
  const canvas = new AviatorCanvas('flightCanvas');
  const winnersWidget = new LiveWinnersWidget();
  const audio = window.aviatorAudio;

  // Center Multiplier Overlay
  const multiplierDisplay = document.getElementById('multiplierDisplay');
  const multiplierValue = document.getElementById('multiplierValue');
  const flewAwayLabel = document.getElementById('flewAwayLabel');
  const winBanner = document.getElementById('winBanner');
  const winAmountText = document.getElementById('winAmountText');

  // Interactive Onboarding Auto-Tour
  const tour = new AviatorAutoTour();
  // The tour remains available from Help without covering the landing experience.

  // Reformed Bet Action Button & Sub-elements
  const mainBetBtn = document.getElementById('mainBetBtn');
  const betBtnIcon = document.getElementById('betBtnIcon');
  const betBtnText = document.getElementById('betBtnText');
  const betBtnSub = document.getElementById('betBtnSub');
  const betBtnProgressBar = document.getElementById('betBtnProgressBar');

  // Bet Controls & Inputs
  const betAmountInput = document.getElementById('betAmountInput');
  const btnMinus = document.getElementById('btnMinus');
  const btnPlus = document.getElementById('btnPlus');
  const quickBetBtns = document.querySelectorAll('.quick-chip');
  const currencyToggleBtn = document.getElementById('currencyToggleBtn');
  const userBalanceEl = document.getElementById('userBalance');

  // Top Bar & Controls
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const historyBar = document.getElementById('historyBar');

  // Claiming Dialogue Box (Modal)
  const bonusModal = document.getElementById('bonusModal');
  const closeBonusBtn = document.getElementById('closeBonusBtn');
  const bonusClaimBtn = document.getElementById('bonusClaimBtn');
  const congratsTitle = document.getElementById('congratsTitle');
  const congratsCredits = document.getElementById('congratsCredits');
  const flightToast = document.getElementById('flightToast');
  let toastTimer;
  let flightMessages = createFlightMessages();
  function hideFlightToast() {
    clearTimeout(toastTimer);
    flightToast.hidden = true;
  }
  function showFlightToast(title, body = '', duration = 3000) {
    hideFlightToast();
    document.getElementById('flightToastTitle').textContent = title;
    document.getElementById('flightToastBody').textContent = body;
    flightToast.hidden = false;
    toastTimer = setTimeout(hideFlightToast, duration);
  }
  function updateFlightMessage(elapsed, multiplier) {
    const message = flightMessages.next(elapsed, multiplier);
    if (message) showFlightToast(...message, hasCashedOutAttempt2 ? 1800 : 2400);
  }
  function setStakeLocked(locked) {
    [betAmountInput, btnMinus, btnPlus, currencyToggleBtn, ...quickBetBtns].forEach(el => el.disabled = locked);
  }

  // Application State Machine
  // READY | FLYING_1 | WAITING_1 | READY_2 | FLYING_2 | BONUS
  let gameState = 'READY';
  let currentAttempt = 1;
  let currentCurrency = 'INR';
  let betAmount = 100;
  let userBalance = 1042;
  let currentFlightData = null;
  let cashoutPending = false;
  let visitorTimer;
  let currentActiveMultiplier = 1.00;
  let flightAnimationTimer = null;
  let waitingCountdownInterval = null;

  let hasCashedOutAttempt1 = false;
  let cashedOutAmountRound1 = 0;
  let hasCashedOutAttempt2 = false;
  let cashedOutAmountRound2 = 0;

  // Initialize Sound State
  function updateSoundIcon() {
    if (audio.isMuted) {
      soundToggleBtn.classList.add('muted');
      soundIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
    } else {
      soundToggleBtn.classList.remove('muted');
      soundIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    }
  }
  updateSoundIcon();

  soundToggleBtn.addEventListener('click', () => {
    audio.unlock();
    audio.toggleMute();
    updateSoundIcon();
    audio.playClick();
  });

  // Currency Formatter
  function formatMoney(amount, currency = currentCurrency) {
    if (currency === 'USD') {
      return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  }

  function updateBalanceDisplay() {
    userBalanceEl.textContent = formatMoney(userBalance);
  }

  // ==========================================
  // BUTTON STATE MANAGEMENT SYSTEM
  // ==========================================
  function setButtonState(stateType, data = {}) {
    // Reset classes and progress bar
    mainBetBtn.className = 'bet-action-btn';
    if (betBtnProgressBar) {
      betBtnProgressBar.style.transition = 'none';
      betBtnProgressBar.style.width = '0%';
    }

    if (stateType === 'START') {
      mainBetBtn.disabled = false;
      mainBetBtn.classList.add('state-start');
      betBtnIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>`;
      betBtnText.textContent = cmsText("game.takeoff", 'Take Off');
      if (gameState === 'BONUS') {
        mainBetBtn.classList.remove('state-start');
        mainBetBtn.classList.add('state-claim');
        betBtnText.textContent = cmsText('game.claimBonus', 'Claim Bonus');
        betBtnIcon.textContent = '🎁';
      }
      betBtnSub.textContent = `· ${formatMoney(betAmount)}`;
      betBtnSub.style.display = gameState === 'BONUS' ? 'none' : 'inline';
    } else if (stateType === 'CASH_OUT') {
      mainBetBtn.disabled = false;
      mainBetBtn.classList.add('state-cashout');
      // Hand Tap Icon
      betBtnIcon.innerHTML = `<svg class="cashout-icon-svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74a4.5 4.5 0 0 0-9 0c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26a1.05 1.05 0 0 0-.54-.14H13v-6a1 1 0 0 0-2 0v10.74l-3.43-.72a1.05 1.05 0 0 0-1.03.31l-.79.8 4.94 4.94c.27.27.65.43 1.06.43h6.79c.75 0 1.33-.55 1.44-1.28l.75-5.27c.01-.07.01-.14.01-.21 0-.61-.38-1.16-.95-1.34z"/></svg>`;
      betBtnText.textContent = cmsText("game.cashout", 'Cash Out');
      const liveAmt = data && data.amount !== undefined ? data.amount : betAmount;
      betBtnSub.textContent = `· ${formatMoney(liveAmt)}`;
      betBtnSub.style.display = 'inline';
    } else if (stateType === 'CASHED_OUT') {
      mainBetBtn.disabled = true;
      mainBetBtn.classList.add('state-cashed-out');
      // White Checkmark in Circle Icon
      betBtnIcon.innerHTML = `<svg class="cashed-icon-svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
      betBtnText.textContent = cmsText("game.cashed", 'Cashed Out');
      const cashedAmt = data && data.amount !== undefined ? data.amount : betAmount;
      betBtnSub.textContent = `· ${formatMoney(cashedAmt)}`;
      betBtnSub.style.display = 'inline';
    } else if (stateType === 'WAITING') {
      mainBetBtn.disabled = true;
      mainBetBtn.classList.add('state-waiting');
      betBtnIcon.innerHTML = `<svg class="waiting-icon-svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.2 3.1.8-1.2-4.5-2.7V7z"/></svg>`;
      const seconds = data && data.seconds !== undefined ? data.seconds : 10;
      betBtnText.textContent = cmsText('game.waiting', 'Waiting ({seconds})', { seconds });
      betBtnSub.style.display = 'none';

      if (data && data.animate && betBtnProgressBar) {
        betBtnProgressBar.style.width = '100%';
        requestAnimationFrame(() => {
          betBtnProgressBar.style.transition = 'width 10s linear';
          betBtnProgressBar.style.width = '0%';
        });
      }
    }
    mainBetBtn.setAttribute('aria-label', betBtnText.textContent);
  }

  function updateBetDisplay() {
    betAmountInput.value = currentCurrency === 'USD' ? betAmount.toFixed(2) : Math.round(betAmount);
    if (gameState === 'READY' || gameState === 'READY_2') {
      setButtonState('START');
    }
  }

  document.addEventListener('cms:change', () => {
    if (gameState === 'READY' || gameState === 'READY_2' || gameState === 'BONUS') setButtonState('START');
    if (bonusModal.classList.contains('active')) {
      congratsTitle.textContent = cmsText('win.title', 'YOU COOKED. 🔥');
      congratsCredits.textContent = cmsText('win.subtitle', 'Pilot, you’re in. 🫡');
    }
  });

  // Initial Button Render
  setButtonState('START');
  updateBalanceDisplay();

  // Currency Switcher
  currencyToggleBtn.addEventListener('click', () => {
    if (reopenWonOffer()) return;
    audio.unlock();
    audio.playClick();
    if (currentCurrency === 'INR') {
      currentCurrency = 'USD';
      betAmount = 1.00;
      userBalance = 30000.00;
      currencyToggleBtn.textContent = cmsText("game.currencyUSD", 'USD ($)');
      const usdAmounts = [1, 2, 5, 10];
      quickBetBtns.forEach((btn, i) => {
        btn.textContent = `$${usdAmounts[i]}`;
        btn.dataset.val = usdAmounts[i];
      });
    } else {
      currentCurrency = 'INR';
      betAmount = 100;
      userBalance = 1042;
      currencyToggleBtn.textContent = cmsText("game.currencyINR", 'INR (₹)');
      const inrAmounts = [100, 200, 500, 1000];
      quickBetBtns.forEach((btn, i) => {
        btn.textContent = `₹${inrAmounts[i]}`;
        btn.dataset.val = inrAmounts[i];
      });
    }
    winnersWidget.setCurrency(currentCurrency);
    updateBalanceDisplay();
    updateBetDisplay();
  });

  // Quick Bet Selectors
  quickBetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (reopenWonOffer()) return;
      if (gameState !== 'READY' && gameState !== 'READY_2') return;
      audio.unlock();
      audio.playClick();
      quickBetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      betAmount = parseFloat(btn.dataset.val);
      updateBetDisplay();
    });
  });

  btnMinus.addEventListener('click', () => {
    if (reopenWonOffer()) return;
    if (gameState !== 'READY' && gameState !== 'READY_2') return;
    audio.unlock();
    audio.playClick();
    const step = currentCurrency === 'USD' ? 0.5 : 50;
    const min = currentCurrency === 'USD' ? 0.5 : 50;
    betAmount = Math.max(min, betAmount - step);
    updateBetDisplay();
  });

  btnPlus.addEventListener('click', () => {
    if (reopenWonOffer()) return;
    if (gameState !== 'READY' && gameState !== 'READY_2') return;
    audio.unlock();
    audio.playClick();
    const step = currentCurrency === 'USD' ? 0.5 : 50;
    const max = currentCurrency === 'USD' ? 500 : 50000;
    betAmount = Math.min(max, betAmount + step);
    updateBetDisplay();
  });

  betAmountInput.addEventListener('change', () => {
    if (reopenWonOffer()) return;
    const val = parseFloat(betAmountInput.value);
    if (!isNaN(val) && val > 0) {
      betAmount = val;
    }
    updateBetDisplay();
  });

  // Help Modal
  helpBtn.addEventListener('click', () => {
    audio.unlock();
    audio.playClick();
    helpModal.classList.add('active');
  });

  closeHelpBtn.addEventListener('click', () => {
    audio.playClick();
    helpModal.classList.remove('active');
  });

  const replayTourBtn = document.getElementById('replayTourBtn');
  if (replayTourBtn) {
    replayTourBtn.addEventListener('click', () => {
      audio.playClick();
      helpModal.classList.remove('active');
      tour.startTour({ autoPlay: true, stepDuration: 1800 });
    });
  }

  // Multipliers History Pills
  function addHistoryPill(multiplier) {
    const pill = document.createElement('span');
    pill.className = 'history-pill';

    if (multiplier < 2.0) {
      pill.classList.add('low');
    } else if (multiplier < 10.0) {
      pill.classList.add('medium');
    } else {
      pill.classList.add('high');
    }

    pill.textContent = `${multiplier.toFixed(2)}x`;
    historyBar.prepend(pill);

    while (historyBar.children.length > 8) {
      historyBar.removeChild(historyBar.lastChild);
    }
  }

  // ==========================================
  // MAIN ACTION BUTTON CLICK HANDLER
  // ==========================================
  mainBetBtn.addEventListener('click', () => {
    if (reopenWonOffer()) return;
    if (gameState === 'ERROR') { initializeVisitor(); return; }
    audio.unlock();
    tour.endTour();

    if (gameState === 'READY') {
      startAttempt1();
    } else if (gameState === 'FLYING_1') {
      cashOutAttempt1();
    } else if (gameState === 'READY_2') {
      startAttempt2();
    } else if (gameState === 'FLYING_2') {
      cashOutAttempt2();
    }
  });

  // ==========================================
  // ROUND 1 FLIGHT ORCHESTRATION
  // ==========================================
  async function startAttempt1() {
    hideFlightToast();
    setStakeLocked(true);
    gameState = 'STARTING';
    currentAttempt = 1;
    hasCashedOutAttempt1 = false;
    cashedOutAmountRound1 = 0;
    currentActiveMultiplier = 1.00;

    // Button becomes "Cash Out · ₹100" (Yellow)
    setButtonState('CASH_OUT', { amount: betAmount });

    // Reset center multiplier display
    flewAwayLabel.classList.remove('visible');
    multiplierDisplay.className = 'multiplier-display flying';
    multiplierValue.textContent = '1.00x';

    // Start API / Simulation
    mainBetBtn.disabled = true;
    try { currentFlightData = await AviatorAPI.startFlight(1, betAmount, currentCurrency); }
    catch(error) { showFlightToast('Flight unavailable', error.message, 5000); await initializeVisitor(); return; }
    gameState = 'FLYING_1';
    mainBetBtn.disabled = false;

    // Audio & Canvas start
    audio.startFlightSound();
    canvas.setState('FLYING', { targetMultiplier: currentFlightData.targetMultiplier });

    const startTime = performance.now() - Math.max(0, (currentFlightData.serverNow || 0) - (currentFlightData.startedAt || 0));
    const durationMs = currentFlightData.duration * 1000;
    const targetMult = currentFlightData.targetMultiplier;

    function frame() {
      if (gameState !== 'FLYING_1') return;

      const elapsed = performance.now() - startTime;
      const progress = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;

      // Identical elapsed-time growth in both rounds.
      const currentMult = createFlightRules.multiplierAt(elapsed, targetMult, currentFlightData.growthRate);
      currentActiveMultiplier = currentMult;
      multiplierValue.textContent = `${currentMult.toFixed(2)}x`;

      // If user hasn't clicked Cash Out yet, update live button amount in real time
      if (!hasCashedOutAttempt1) {
        const liveAmount = Math.round(betAmount * currentMult);
        betBtnSub.textContent = `· ${formatMoney(liveAmount)}`;
      }

      // Multiplier tier colors
      if (currentMult >= 2.0) {
        multiplierDisplay.classList.add('purple-tier');
      }

      // Audio & Canvas tick
      audio.updateFlightPitch(currentMult, progress);
      canvas.updateFlight(Math.pow(progress, 0.75), currentMult);

      if (progress < 1) {
        flightAnimationTimer = requestAnimationFrame(frame);
      } else {
        // Flight finishes / reaches limit
        handleAttempt1End(targetMult);
      }
    }

    flightAnimationTimer = requestAnimationFrame(frame);
  }

  // User Clicks "Cash Out" in Round 1
  async function cashOutAttempt1() {
    if (gameState !== 'FLYING_1' || hasCashedOutAttempt1) return;
    if (cashoutPending) return;
    cashoutPending = true;
    let receipt;
    try {
      receipt = AviatorAPI.cashout ? await AviatorAPI.cashout(currentFlightData.sessionToken) : null;
    } catch(error) {
      showFlightToast('Cashout unavailable', error.message, 3500);
      return;
    } finally { cashoutPending = false; }
    if (receipt) currentActiveMultiplier = receipt.multiplier;

    hasCashedOutAttempt1 = true;
    cashedOutAmountRound1 = receipt?.amount ?? Math.round(betAmount * currentActiveMultiplier);

    // Button immediately becomes "Cashed Out · ₹[Price]" (Orange)
    setButtonState('CASHED_OUT', { amount: cashedOutAmountRound1 });

    // Audio sounds
    audio.playCoins();
    audio.playWinFanfare();

    // Show win banner & live winners entry
    winnersWidget.renderItem({
      name: cmsText('game.you', 'YOU (Winner!)'),
      mult: currentActiveMultiplier,
      amount: cashedOutAmountRound1,
      avatarIdx: 0
    }, true);

    winBanner.classList.add('visible');
    winAmountText.textContent = cmsText('game.won', 'WON {amount}!', { amount: formatMoney(cashedOutAmountRound1) });

    // Plane is STILL flying in the air! Animation loop continues until duration completes.
  }

  // Round 1 Flight Concludes
  function handleAttempt1End(finalMultiplier) {
    cancelAnimationFrame(flightAnimationTimer);
    gameState = 'WAITING_1';
    setButtonState('WAITING', { seconds: 10 });
    audio.stopFlightSound();

    if (!hasCashedOutAttempt1) {
      showFlightToast(cmsText('loss.title', 'OOOPS! 😮‍💨'), cmsText('loss.body', 'That Flight Just Flew AWAY. Try Again!'), 5000);
      // User didn't cash out -> Flew Away
      audio.playCrash();
      canvas.setState('FLEW_AWAY');
      flewAwayLabel.classList.add('visible');
      multiplierDisplay.className = 'multiplier-display flew-away';
      multiplierValue.textContent = `${finalMultiplier.toFixed(2)}x`;
    } else {
      // User successfully cashed out -> Plane finishes its climb and flies off
      canvas.setState('FLEW_AWAY');
      flewAwayLabel.classList.add('visible');
      multiplierDisplay.className = 'multiplier-display flew-away';
      multiplierValue.textContent = `${finalMultiplier.toFixed(2)}x`;
    }

    // Dismiss win banner after short moment
    setTimeout(() => {
      winBanner.classList.remove('visible');
    }, 1000);

    // Add to history pill
    addHistoryPill(finalMultiplier);

    // Complete Flight Record
    AviatorAPI.completeFlight({
      sessionToken: currentFlightData ? currentFlightData.sessionToken : 'token_' + Date.now(),
      attemptNumber: 1,
      duration: currentFlightData ? currentFlightData.duration : 4.0,
      multiplier: finalMultiplier,
      outcome: hasCashedOutAttempt1 ? 'WIN' : 'LOSS',
      betAmount,
      currency: currentCurrency
    });

    // Transition to 10s Waiting countdown
    setTimeout(() => {
      startWaitingCountdown();
    }, 800);
  }

  // ==========================================
  // 10-SECOND WAITING BUTTON (Grey) & COUNTDOWN
  // ==========================================
  function startWaitingCountdown() {
    gameState = 'WAITING_1';
    currentAttempt = 2;

    let remainingSecs = 10;
    setButtonState('WAITING', { seconds: remainingSecs, animate: true });

    if (waitingCountdownInterval) clearInterval(waitingCountdownInterval);
    waitingCountdownInterval = setInterval(() => {
      remainingSecs--;

      if (remainingSecs > 0) {
        betBtnText.textContent = cmsText('game.waiting', 'Waiting ({seconds})', { seconds: remainingSecs });
      } else {
        clearInterval(waitingCountdownInterval);
        // Round 1 countdown finished -> Transition to Round 2 "Start" (Green)
        transitionToRound2Ready();
      }
    }, 1000);
  }

  function transitionToRound2Ready() {
    gameState = 'READY_2';
    setStakeLocked(false);

    // Reset center multiplier display
    canvas.setState('IDLE');
    multiplierDisplay.className = 'multiplier-display';
    multiplierValue.textContent = '1.00x';
    flewAwayLabel.classList.remove('visible');

    // Button returns to "Start · ₹100" (Green)
    setButtonState('START');
    audio.playClick();
  }

  // ==========================================
  // ROUND 2 FLIGHT ORCHESTRATION
  // ==========================================
  async function startAttempt2() {
    if (waitingCountdownInterval) clearInterval(waitingCountdownInterval);

    hideFlightToast();
    setStakeLocked(true);
    flightMessages = createFlightMessages();
    gameState = 'STARTING';
    hasCashedOutAttempt2 = false;
    cashedOutAmountRound2 = 0;
    currentActiveMultiplier = 1.00;

    // Button becomes "Cash Out · ₹100" (Yellow)
    setButtonState('CASH_OUT', { amount: betAmount });

    // Reset center display
    flewAwayLabel.classList.remove('visible');
    multiplierDisplay.className = 'multiplier-display flying intense';
    multiplierValue.textContent = '1.00x';

    // Fetch flight params from backend API
    mainBetBtn.disabled = true;
    try { currentFlightData = await AviatorAPI.startFlight(2, betAmount, currentCurrency); }
    catch(error) { showFlightToast('Flight unavailable', error.message, 5000); await initializeVisitor(); return; }
    gameState = 'FLYING_2';
    mainBetBtn.disabled = false;

    // Audio & Canvas start
    audio.startFlightSound();
    canvas.setState('FLYING', { targetMultiplier: currentFlightData.targetMultiplier });

    const startTime = performance.now() - Math.max(0, (currentFlightData.serverNow || 0) - (currentFlightData.startedAt || 0));
    const durationMs = currentFlightData.duration * 1000;
    const targetMult = currentFlightData.targetMultiplier; // 120x–147x

    function frame() {
      if (gameState !== 'FLYING_2') return;

      const elapsed = performance.now() - startTime;
      const progress = durationMs > 0 ? Math.min(1, elapsed / durationMs) : 1;

      const currentMult = createFlightRules.multiplierAt(elapsed, targetMult, currentFlightData.growthRate);

      currentActiveMultiplier = currentMult;
      multiplierValue.textContent = `${currentMult.toFixed(2)}x`;

      updateFlightMessage(elapsed, currentMult);

      // Update live cash out amount on button if not yet cashed out
      if (!hasCashedOutAttempt2) {
        const liveCashoutVal = Math.round(betAmount * currentMult);
        betBtnSub.textContent = `· ${formatMoney(liveCashoutVal)}`;
      }

      // Color tier upgrades
      if (currentMult >= 10.0) {
        multiplierDisplay.className = 'multiplier-display flying gold-tier';
      } else if (currentMult >= 2.0) {
        multiplierDisplay.className = 'multiplier-display flying purple-tier';
      }

      // Audio pitch sweep & canvas update
      audio.updateFlightPitch(currentMult, progress);
      canvas.updateFlight(progress, currentMult);

      if (progress < 1) {
        flightAnimationTimer = requestAnimationFrame(frame);
      } else {
        // Flight finishes taking off
        handleAttempt2End(targetMult);
      }
    }

    flightAnimationTimer = requestAnimationFrame(frame);
  }

  // User Clicks "Cash Out" in Round 2
  async function cashOutAttempt2() {
    if (gameState !== 'FLYING_2' || hasCashedOutAttempt2) return;
    if (cashoutPending) return;
    cashoutPending = true;
    let receipt;
    try {
      receipt = AviatorAPI.cashout ? await AviatorAPI.cashout(currentFlightData.sessionToken) : null;
    } catch(error) {
      showFlightToast('Cashout unavailable', error.message, 3500);
      return;
    } finally { cashoutPending = false; }
    if (receipt) currentActiveMultiplier = receipt.multiplier;

    hasCashedOutAttempt2 = true;
    flightMessages.cashout(currentActiveMultiplier);
    cashedOutAmountRound2 = receipt?.amount ?? Math.round(betAmount * currentActiveMultiplier);

    // Button immediately becomes "Cashed Out · ₹[Price]" (Orange)
    setButtonState('CASHED_OUT', { amount: cashedOutAmountRound2 });

    // Audio & celebratory effects
    audio.playWinFanfare();
    audio.playCoins();

    // UI win banner & feed
    winBanner.classList.remove('visible');
    winAmountText.textContent = cmsText('game.won', 'WON {amount}!', { amount: formatMoney(cashedOutAmountRound2) });

    winnersWidget.renderItem({
      name: cmsText('game.you', 'YOU (Winner!)'),
      mult: currentActiveMultiplier,
      amount: cashedOutAmountRound2,
      avatarIdx: 0
    }, true);

    hideFlightToast();
    // Keep the flight and milestone messages visible until the plane flies away.
  }

  // The second flight always flies away at its sampled limit.
  async function handleAttempt2End(finalMultiplier) {
    cancelAnimationFrame(flightAnimationTimer);
    if (!hasCashedOutAttempt2) hideFlightToast();
    audio.stopFlightSound();
    canvas.setState('FLEW_AWAY');
    multiplierDisplay.className = 'multiplier-display flew-away';
    multiplierValue.textContent = finalMultiplier.toFixed(2) + 'x';
    flewAwayLabel.classList.add('visible');
    addHistoryPill(finalMultiplier);
    AviatorAPI.completeFlight({
      sessionToken: currentFlightData.sessionToken,
      attemptNumber: 2,
      duration: currentFlightData.duration,
      multiplier: finalMultiplier,
      outcome: hasCashedOutAttempt2 ? 'WIN' : 'LOSS',
      betAmount,
      currency: currentCurrency
    });
    if (AviatorAPI.getState) {
      try { const state = await AviatorAPI.getState(); hasCashedOutAttempt2 = state.wonSecond; } catch {}
    }
    if (hasCashedOutAttempt2) {
      gameState = 'BONUS_PENDING';
      // Let the plane clear the viewport before presenting the reward.
      setTimeout(() => {
        if (gameState !== 'BONUS_PENDING') return;
        gameState = 'BONUS';
        hideFlightToast();
        setStakeLocked(false);
        setButtonState('START');
        openClaimingModal();
      }, 600);
    } else {
      audio.playCrash();
      if (AviatorAPI.getState && !AviatorAPI.isAdmin) { gameState = 'EXHAUSTED'; setStakeLocked(true); setButtonState('START'); mainBetBtn.disabled=true; betBtnText.textContent=cmsText('game.exhausted','Flights used'); betBtnSub.style.display='none'; }
      else { gameState = 'READY'; setStakeLocked(false); setButtonState('START'); }
      showFlightToast(cmsText('loss.title', 'OOOPS! 😮‍💨'), cmsText('loss.body', 'That Flight Just Flew AWAY. Try Again!'), 5000);
    }
  }

  function openClaimingModal() {
    AviatorAPI.track?.('popup_open','win');
    congratsTitle.textContent = cmsText("win.title", 'YOU COOKED. 🔥');
    congratsCredits.textContent = cmsText("win.subtitle", 'Pilot, you’re in. 🫡');
    bonusModal.classList.add('active');
    bonusModal.setAttribute('aria-modal', 'true');
    closeBonusBtn.focus();
  }

  function reopenWonOffer() {
    if (gameState !== 'BONUS') return false;
    betAmountInput.value = currentCurrency === 'USD' ? betAmount.toFixed(2) : Math.round(betAmount);
    openClaimingModal();
    return true;
  }

  betAmountInput.addEventListener('focus', reopenWonOffer);
  betAmountInput.addEventListener('click', reopenWonOffer);
  betAmountInput.addEventListener('beforeinput', event => {
    if (reopenWonOffer()) event.preventDefault();
  });

  // Claim Bonus Button in Modal
  // The promotion action is handled by kixo9.js; demo credits cannot be claimed.

  // Dismiss the offer while retaining the completed win.
  if (closeBonusBtn) {
    closeBonusBtn.addEventListener('click', () => {
      audio.playClick();
      bonusModal.classList.remove('active');
      AviatorAPI.track?.('popup_close','win');
      if (AviatorAPI.isAdmin) { gameState='READY'; setStakeLocked(false); setButtonState('START'); canvas.setState('IDLE'); multiplierDisplay.className='multiplier-display';multiplierValue.textContent='1.00x';flewAwayLabel.classList.remove('visible'); }
      mainBetBtn.focus();
    });
  }

  // Light dismiss on background click
  bonusModal.addEventListener('click', (e) => {
    if (e.target === bonusModal && closeBonusBtn) {
      closeBonusBtn.click();
    }
  });

  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      closeHelpBtn.click();
    }
  });

  // ESC key dismiss
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && bonusModal.classList.contains('active')) {
      e.preventDefault();
      (document.activeElement === closeBonusBtn ? bonusClaimBtn : closeBonusBtn).focus();
    }
    if (e.key === 'Escape') {
      if (bonusModal.classList.contains('active') && closeBonusBtn) {
        closeBonusBtn.click();
      } else if (helpModal.classList.contains('active')) {
        closeHelpBtn.click();
      }
    }
  });
  async function initializeVisitor() {
    clearTimeout(visitorTimer);
    gameState='CHECKING';setStakeLocked(true);mainBetBtn.disabled=true;
    betBtnText.textContent=cmsText('game.checking','Checking flights…');betBtnSub.style.display='none';
    try {
      const state=await AviatorAPI.getState();
      if(state.active) {
        gameState='CHECKING';canvas.setState('IDLE');
        betBtnText.textContent=cmsText('game.activeElsewhere','Flight in progress');
        visitorTimer=setTimeout(initializeVisitor,Math.max(250,state.active.endsAt-state.serverNow+650));
        return;
      }
      if(state.isAdmin){gameState='READY';setStakeLocked(false);setButtonState('START');return;}
      if(state.wonSecond){gameState='BONUS';setStakeLocked(false);setButtonState('START');openClaimingModal();return;}
      if(state.remaining===0){gameState='EXHAUSTED';mainBetBtn.disabled=true;betBtnText.textContent=cmsText('game.exhausted','Flights used');return;}
      gameState=state.nextAttempt===2?'READY_2':'READY';
      setStakeLocked(false);setButtonState('START');
    } catch(error) {
      gameState='ERROR';betBtnText.textContent=cmsText('game.retry','Retry connection');mainBetBtn.disabled=false;
      showFlightToast('Connection needed','Reconnect to check your remaining flights.',5000);
    }
  }
  if(AviatorAPI.getState) initializeVisitor();

});
