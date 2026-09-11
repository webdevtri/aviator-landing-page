/* Shuffled flight chatter and milestone reactions for the simulated flight. */
(function (root) {
  const chatter = [
    ['Okay PILOT… 👀', 'We’re FLYING!'],
    ['BRO, it’s still GOING 🔥', ''],
    ['AYOOO 👀🔥', "Now we're TALKING."],
    ['👀 Still watching?', ''], ['🚀 Up we go!', ''],
    ['🔥 This is getting interesting.', ''], ['Pilots, stay sharp.', ''],
    ['😮‍💨 What a climb.', ''], ['👀 Don’t blink.', ''],
    ['✈️ Smooth flying.', ''], ['🚀 We’re going higher.', ''],
    ['🔥 Okayyy, Pilot!', ''], ['🫡 Locked in?', '']
  ];
  const milestones = [
    [3, 'AND… IT’S STILL CLIMBING. 🚀'], [5, 'STILL GOING…'],
    [10, '10x?! 😳'], [20, 'BROOO.'], [35, 'NO WAY. 🚀'],
    [50, '50x?! 🔥'], [75, 'THIS FLIGHT 😮‍💨'],
    [100, '100x. 👀'], [140, 'WHAT A RUN. ✈️']
  ];
  function createFlightMessages(random = Math.random) {
    const cms = typeof window !== 'undefined' && window.CMS;
    const pool = chatter.map((pair,i) => pair.map((value,j) => cms ? cms.get(`chatter.${i}.${j}`) : value));
    const reactions = milestones.map(([value, text]) => [value, cms ? cms.get('milestone.'+value) : text]);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    let nextAt = 1000, index = 0, cashoutAt = null, lastMilestone = 0;
    return {
      cashout(multiplier) { cashoutAt = multiplier; lastMilestone = multiplier; },
      next(elapsed, multiplier) {
        if (cashoutAt !== null) {
          // Use only newly crossed thresholds, never backfill milestones already passed.
          const crossed = reactions.filter(([value]) => value > lastMilestone && value <= multiplier);
          lastMilestone = multiplier;
          if (!crossed.length) return null;
          const [value, text] = crossed[crossed.length - 1];
          return random() < 0.8 || value === 140 ? [text, ''] : null;
        }
        if (elapsed < nextAt || index >= pool.length) return null;
        nextAt = elapsed + 2600 + random() * 800;
        return pool[index++];
      }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = createFlightMessages;
  else root.createFlightMessages = createFlightMessages;
})(globalThis);
