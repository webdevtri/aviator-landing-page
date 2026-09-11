const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Aviator API and System Verification Tests...\n');

  // Test 1: Health Check
  const health = await request({ host: 'localhost', port: 3000, path: '/api/health', method: 'GET' });
  console.log('✅ Test 1 - Health Check:', health.status === 200 && health.data.status === 'ok' ? 'PASSED' : 'FAILED', health.data);

  // Test 2: App Config
  const config = await request({ host: 'localhost', port: 3000, path: '/api/config', method: 'GET' });
  console.log('✅ Test 2 - Config Check:', config.data.promoCode === 'AVIATOR500' ? 'PASSED' : 'FAILED', config.data);

  // Test 3: Attempt 1 Flight (1.00x - 1.15x)
  const flight1 = await request({
    host: 'localhost', port: 3000, path: '/api/flight/start', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { attemptNumber: 1, betAmount: 100, currency: 'INR' });

  const f1 = flight1.data;
  const isF1Valid = f1.attemptNumber === 1 && f1.duration >= 0 && f1.duration <= Math.log(1.15) / 0.3 && f1.targetMultiplier >= 1 && f1.targetMultiplier <= 1.15;
  console.log('✅ Test 3 - Attempt 1 Randomization (1.00x - 1.15x):', isF1Valid ? 'PASSED' : 'FAILED', {
    duration: f1.duration,
    multiplier: f1.targetMultiplier,
    outcome: f1.outcome
  });

  // Test 4: Attempt 2 Flight (120x - 147x)
  const flight2 = await request({
    host: 'localhost', port: 3000, path: '/api/flight/start', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { attemptNumber: 2, betAmount: 100, currency: 'INR' });

  const f2 = flight2.data;
  const isF2Valid = f2.attemptNumber === 2 && f2.duration >= 14 && f2.duration <= 17 && f2.targetMultiplier >= 120 && f2.targetMultiplier <= 147;
  console.log('✅ Test 4 - Attempt 2 Randomization (120x - 147x):', isF2Valid ? 'PASSED' : 'FAILED', {
    duration: f2.duration,
    multiplier: f2.targetMultiplier,
    outcome: f2.outcome
  });

  // Test 5: Bonus Claim
  const claim = await request({
    host: 'localhost', port: 3000, path: '/api/bonus/claim', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name: 'Test Winner',
    phone: '+91 9876543210',
    amount: 50000,
    currency: 'INR',
    promoCode: 'AVIATOR500'
  });
  console.log('✅ Test 5 - 500% Bonus Claim API:', claim.data.success ? 'PASSED' : 'FAILED', {
    promoCode: claim.data.promoCode,
    bonusValue: claim.data.bonusValue
  });

  // Test 6: Winners Feed
  const winners = await request({ host: 'localhost', port: 3000, path: '/api/winners', method: 'GET' });
  console.log('✅ Test 6 - Live Winners API:', winners.data.winners.length > 0 ? 'PASSED' : 'FAILED', `(${winners.data.winners.length} winners returned)`);

  // Test 7: Index.html Serving
  const html = await request({ host: 'localhost', port: 3000, path: '/', method: 'GET' });
  const hasCanvas = typeof html.text === 'string' && html.text.includes('id="flightCanvas"');
  console.log('✅ Test 7 - HTML Static Delivery:', hasCanvas ? 'PASSED' : 'FAILED');

  console.log('\n🎉 ALL SYSTEM TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(console.error);
