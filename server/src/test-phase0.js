const http = require('http');
const app = require('./app');

async function runTests() {
  const testServer = http.createServer(app);

  await new Promise((resolve) => testServer.listen(0, resolve));
  const port = testServer.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // 1. Test /api/health
    const healthRes = await fetch(`http://localhost:${port}/api/health`);
    const healthJson = await healthRes.json();
    console.log('Health Endpoint Status:', healthRes.status);
    console.log('Health Endpoint Body:', JSON.stringify(healthJson));

    if (healthRes.status !== 200 || !healthJson.success) {
      throw new Error('Health check failed');
    }

    // 2. Test /api root
    const rootRes = await fetch(`http://localhost:${port}/api`);
    const rootJson = await rootRes.json();
    console.log('API Root Status:', rootRes.status);
    console.log('API Root Body:', JSON.stringify(rootJson));

    // 3. Test 404 Route
    const notFoundRes = await fetch(`http://localhost:${port}/api/non-existent-route`);
    const notFoundJson = await notFoundRes.json();
    console.log('404 Status:', notFoundRes.status);
    console.log('404 Body:', JSON.stringify(notFoundJson));

    if (notFoundRes.status !== 404 || notFoundJson.success !== false) {
      throw new Error('404 handler test failed');
    }

    console.log('>>> ALL PHASE 0 BACKEND TESTS PASSED <<<');
  } catch (err) {
    console.error('Phase 0 Verification Failed:', err);
    process.exitCode = 1;
  } finally {
    testServer.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
}

runTests();
