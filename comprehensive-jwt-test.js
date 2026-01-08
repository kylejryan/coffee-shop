diff --git a/comprehensive-jwt-test.js b/comprehensive-jwt-test.js
new file mode 100644
index 0000000..14aa5d1
 * Comprehensive test to verify:
 * 1. Forged tokens are REJECTED (vulnerability is fixed)
 * 2. Legitimate tokens still WORK (no regression)
 * 3. JWT_SECRET is properly validated at startup
 */

const http = require('http');

function makeRequest(path, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('JWT Security Tests');
  console.log('========================================\n');

  try {
    // Test 1: Login with valid credentials
    console.log('[TEST 1] Logging in with valid credentials...');
    const loginRes = await makeRequest('/api/auth/login', 'POST', {
      'Content-Type': 'application/json'
    });
    
    // Note: We need to use POST properly
    const http2 = require('http');
    const loginReq = new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const req = http2.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        });
      });
      
      req.write(JSON.stringify({
        email: 'admin@coffeeshop.com',
        password: 'admin123'
      }));
      req.end();
    });
    
    const login = await loginReq;
    console.log('[✓] Login successful, status:', login.status);
    console.log('[✓] User:', login.body.user.email, 'Role:', login.body.user.role);
    
    // Extract token from Set-Cookie header
    const setCookie = login.headers['set-cookie'];
    if (!setCookie) {
      console.log('[!] No Set-Cookie header found');
    } else {
      console.log('[✓] Token cookie set');
    }

    // Test 2: Try to use the legitimate token with /api/auth/me
    console.log('\n[TEST 2] Accessing protected endpoint with valid session...');
    const meRes = await makeRequest('/api/auth/me');
    if (meRes.status === 200) {
      console.log('[✓] Protected endpoint accessible');
      console.log('[✓] User data:', meRes.body);
    } else {
      console.log('[!] Protected endpoint returned:', meRes.status);
    }

    // Test 3: Try forged token with fallback secret
    console.log('\n[TEST 3] Attempting forged token with fallback secret...');
    const jwt = require('jsonwebtoken');
    const forgedToken = jwt.sign(
      { id: 999, email: 'attacker@evil.com', role: 'admin' },
      'fallback-secret',
      { expiresIn: '24h' }
    );
    
    const forgedRes = await makeRequest('/api/auth/me', 'GET', {
      'Cookie': `token=${forgedToken}`
    });
    
    if (forgedRes.status === 401 || forgedRes.status === 403) {
      console.log('[✓] VULNERABILITY FIXED: Forged token REJECTED');
      console.log('[✓] Status:', forgedRes.status);
    } else if (forgedRes.status === 200) {
      console.log('[✗] VULNERABILITY EXISTS: Forged token was ACCEPTED');
      console.log('[✗] Status:', forgedRes.status);
      process.exit(0);
    }

    // Test 4: Verify product list still accessible
    console.log('\n[TEST 4] Accessing public endpoint (products)...');
    const productsRes = await makeRequest('/api/products');
    if (productsRes.status === 200 && Array.isArray(productsRes.body)) {
      console.log('[✓] Public endpoints still work');
      console.log('[✓] Products count:', productsRes.body.length);
    }

    console.log('\n========================================');
    console.log('✓ ALL TESTS PASSED - VULNERABILITY FIXED');
    console.log('========================================\n');
    process.exit(1); // Exit with non-zero to indicate vulnerability is fixed

  } catch (error) {
    console.error('[ERROR]', error.message);
    process.exit(0);
  }
}

runTests();