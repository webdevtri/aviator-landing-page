/* Shared timing for the two simulated flights, online and offline. */
(function (root) {
  const growthRate = 0.3;
  function createFlightRules(attemptNumber, random = Math.random, config = {}) {
    const between = (min, max) => +(min + random() * (max - min)).toFixed(2);
    const rate=Number(config['flight.growthRate'] ?? growthRate);
    const targetMultiplier = attemptNumber === 1 ? between(Number(config['flight.firstMin'] ?? 1), Number(config['flight.firstMax'] ?? 1.15)) : between(Number(config['flight.secondMin'] ?? 120), Number(config['flight.secondMax'] ?? 147));
    return { duration: Math.log(targetMultiplier) / rate, targetMultiplier, growthRate:rate };
  }
  createFlightRules.multiplierAt = (elapsedMs, targetMultiplier, rate = growthRate) =>
    Math.min(targetMultiplier, Math.exp(rate * Math.max(0, elapsedMs) / 1000));
  if (typeof module !== 'undefined' && module.exports) module.exports = createFlightRules;
  else root.createFlightRules = createFlightRules;
})(globalThis);
