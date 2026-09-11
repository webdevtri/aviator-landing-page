const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const createFlightRules = require('../js/flight-rules');
const createFlightMessages = require('../js/flight-messages');

function harness(randomValue = 0) {
  let now = 0, nextId = 0;
  const timers = new Map(), frames = new Map(), elements = new Map(), records = [];
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set(), listeners = {};
    const el = { style: {}, dataset: {}, children: [], textContent: '', hidden: true,
      classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: v => classes.has(v) },
      addEventListener: (event, fn) => listeners[event] = fn,
      click: () => { if (!el.disabled) listeners.click?.({ target: el }); },
      dispatch: name => listeners[name]?.({ target: el, preventDefault() {} }),
      focus: () => document.activeElement = el, setAttribute() {},
      prepend: child => el.children.unshift(child), removeChild: child => el.children.splice(el.children.indexOf(child), 1)
    };
    elements.set(id, el); return el;
  }
  const document = { getElementById: element, querySelectorAll: () => [element('quick100'), element('quick200')],
    addEventListener: (name, fn) => { if (name === 'DOMContentLoaded') fn(); }, createElement: () => element('new' + nextId++) };
  const audio = new Proxy({}, { get: () => () => {} });
  const canvas = { setState: state => canvas.state = state, updateFlight() {} };
  const context = { document, window: { aviatorAudio: audio }, console,
    createFlightRules,
    createFlightMessages: () => createFlightMessages(() => 0.5),
    AviatorCanvas: function () { return canvas; }, LiveWinnersWidget: function () { return { renderItem() {} }; },
    AviatorAutoTour: function () { return { endTour() {} }; },
    AviatorAPI: { startFlight: async attempt => ({ ...createFlightRules(attempt, () => randomValue), sessionToken: 'test' }), completeFlight: data => records.push(data) },
    performance: { now: () => now },
    requestAnimationFrame: fn => { const id = ++nextId; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (fn, ms) => { const id = ++nextId; timers.set(id, { fn, at: now + ms }); return id; }, clearTimeout: id => timers.delete(id),
    setInterval: (fn, ms) => { const id = ++nextId; timers.set(id, { fn, at: now + ms, interval: ms }); return id; }, clearInterval: id => timers.delete(id)
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../js/app.js'), 'utf8'), context);
  const tick = async ms => {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + 50);
      for (const [id, timer] of [...timers]) if (timer.at <= now) {
        if (timer.interval) timer.at += timer.interval; else timers.delete(id);
        timer.fn();
      }
      const batch = [...frames]; frames.clear(); batch.forEach(([,fn]) => fn());
      await Promise.resolve();
    }
  };
  const click = async id => { element(id).click(); await Promise.resolve(); };
  return { element, click, tick, records, canvas };
}

test('Both random boundaries and sampled flight ranges', () => {
  for (const value of [0, 0.5, 1 - Number.EPSILON]) {
    const first = createFlightRules(1, () => value), second = createFlightRules(2, () => value);
    assert.ok(first.targetMultiplier >= 1 && first.targetMultiplier <= 1.15);
    assert.ok(first.duration >= 0 && first.duration <= Math.log(1.15) / 0.3);
    assert.ok(second.targetMultiplier >= 120 && second.targetMultiplier <= 147);
    assert.ok(second.duration >= Math.log(120) / 0.3 && second.duration <= Math.log(147) / 0.3);
  }
});

test('Loss, all timed messages, second loss without automatic cashout, replay', async () => {
  const h = harness();
  await h.click('mainBetBtn'); await h.tick(1050);
  assert.equal(h.records[0].outcome, 'LOSS');
  assert.equal(h.element('flightToastTitle').textContent, 'OOOPS! 😮‍💨');
  await h.click('mainBetBtn'); assert.equal(h.records.length, 1);
  await h.tick(11000); await h.click('mainBetBtn');
  await h.tick(1100); assert.equal(h.element('flightToast').hidden, false);
  await h.tick(3500); assert.equal(h.element('flightToast').hidden, false);
  await h.tick(3500); assert.equal(h.element('flightToast').hidden, false);
  await h.tick(9000);
  assert.equal(h.records[1].outcome, 'LOSS');
  assert.equal(h.records[1].multiplier, 120);
  assert.equal(h.canvas.state, 'FLEW_AWAY', h.element('multiplierValue').textContent);
  assert.equal(h.element('bonusModal').classList.contains('active'), false);
  assert.equal(h.element('betBtnText').textContent, 'Take Off');
});

test('Second-round win waits for fly-away and closed reward reopens from every bet control', async () => {
  const h = harness();
  await h.click('mainBetBtn'); await h.tick(12100); await h.click('mainBetBtn');
  await h.tick(2000); await h.click('mainBetBtn');
  assert.equal(h.element('bonusModal').classList.contains('active'), false);
  await h.tick(4000);
  assert.match(h.element('flightToastTitle').textContent, /STILL/);
  assert.equal(h.canvas.state, 'FLYING');
  assert.equal(h.element('bonusModal').classList.contains('active'), false);
  await h.tick(10200);
  assert.equal(h.canvas.state, 'FLEW_AWAY', h.element('multiplierValue').textContent);
  assert.equal(h.element('bonusModal').classList.contains('active'), false);
  await h.tick(700);
  assert.equal(h.element('congratsTitle').textContent, 'YOU COOKED. 🔥');
  assert.equal(h.element('bonusModal').classList.contains('active'), true);
  assert.equal(h.records.length, 2);
  assert.equal(h.records[1].outcome, 'WIN');
  for (const control of ['mainBetBtn', 'btnMinus', 'btnPlus', 'quick100', 'quick200', 'currencyToggleBtn', 'betAmountInput']) {
    await h.click('closeBonusBtn');
    assert.equal(h.element('bonusModal').classList.contains('active'), false);
    assert.equal(h.element('betBtnText').textContent, 'Claim Bonus');
    assert.equal(h.element('mainBetBtn').classList.contains('state-claim'), true);
    assert.equal(h.element('betBtnSub').style.display, 'none');
    await h.click(control);
    assert.equal(h.element('bonusModal').classList.contains('active'), true, control);
    assert.equal(h.canvas.state, 'FLEW_AWAY');
    assert.equal(h.records.length, 2);
  }
  await h.click('closeBonusBtn');
  h.element('betAmountInput').value = '999';
  h.element('betAmountInput').dispatch('change');
  assert.equal(h.element('betAmountInput').value, 100);
  assert.equal(h.element('bonusModal').classList.contains('active'), true);
});

test('A first-round cashout still allows ordinary betting for round two', async () => {
  const h = harness(0.5);
  await h.click('mainBetBtn');
  await h.tick(50);
  await h.click('mainBetBtn');
  await h.tick(12100);
  assert.equal(h.records[0].outcome, 'WIN');
  assert.equal(h.element('bonusModal').classList.contains('active'), false);
  await h.click('btnPlus');
  assert.equal(h.element('betAmountInput').value, 150);
  assert.equal(h.element('bonusModal').classList.contains('active'), false);
  await h.click('mainBetBtn');
  await h.tick(50);
  assert.equal(h.canvas.state, 'FLYING');
});

test('Both flights use exactly the same multiplier pace at the same elapsed time', () => {
  for (const elapsed of [0, 50, 100, 200, 400]) {
    assert.equal(createFlightRules.multiplierAt(elapsed, 1.15), createFlightRules.multiplierAt(elapsed, 147));
  }
  for (const attempt of [1, 2]) {
    const flight = createFlightRules(attempt, () => 0.5);
    assert.ok(Math.abs(createFlightRules.multiplierAt(flight.duration * 1000, flight.targetMultiplier) - flight.targetMultiplier) < 1e-10);
  }
});

test('Chatter does not repeat and milestones never announce unreached multipliers', () => {
  const messages = createFlightMessages(() => 0.5);
  const seen = new Set();
  for (let time = 1000; time < 43000; time += 3500) {
    const message = messages.next(time, 2);
    if (message) { assert.ok(!seen.has(message[0])); seen.add(message[0]); }
  }
  assert.equal(seen.size, 12);
  messages.cashout(8);
  assert.equal(messages.next(44000, 9.9), null);
  assert.equal(messages.next(45000, 10)[0], '10x?! 😳');
  assert.equal(messages.next(45100, 10), null);
  assert.equal(messages.next(46000, 20)[0], 'BROOO.');
  assert.equal(messages.next(47000, 35)[0], 'NO WAY. 🚀');
  assert.equal(messages.next(48000, 50)[0], '50x?! 🔥');
  assert.equal(messages.next(49000, 75)[0], 'THIS FLIGHT 😮‍💨');
  assert.equal(messages.next(50000, 100)[0], '100x. 👀');
  assert.equal(messages.next(51000, 139.99), null);
  assert.equal(messages.next(52000, 140)[0], 'WHAT A RUN. ✈️');
});

test('Milestone selection varies and early cashouts can see 3x and 5x', () => {
  const selected = createFlightMessages(() => 0.1);
  selected.cashout(1.5);
  assert.equal(selected.next(1000, 3)[0], 'AND… IT’S STILL CLIMBING. 🚀');
  assert.equal(selected.next(2000, 5)[0], 'STILL GOING…');
  const skipped = createFlightMessages(() => 0.95);
  skipped.cashout(1.5);
  assert.equal(skipped.next(1000, 3), null);
  assert.equal(skipped.next(2000, 5), null);
});
