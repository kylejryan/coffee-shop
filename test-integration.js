diff --git a/test-integration.js b/test-integration.js
new file mode 100644
index 0000000..a0dab0f

/**
 * Integration test to verify the application still works correctly after the fix
 */

const http = require('http');

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("[*] Running integration tests on application endpoints\n");

  try {
    // Test 1: Login with valid credentials
    console.log("[TEST 1] Testing login with valid admin credentials...");
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@coffeeshop.com',
      password: 'password123'
    });

    if (loginRes.status === 200) {
      const loginData = JSON.parse(loginRes.body);
      if (loginData.token) {
        console.log("[PASS] ✓ Login successful, token received");
        const token = loginData.token;

        // Test 2: Use token to access protected endpoint
        console.log("\n[TEST 2] Testing protected endpoint with valid token...");
        const meResponse = await makeRequest('GET', '/api/auth/me', null, token);

        if (meResponse.status === 200) {
          const userData = JSON.parse(meResponse.body);
          console.log("[PASS] ✓ Protected endpoint accessible with valid token");
          console.log("       User: " + userData.email + ", Role: " + userData.role);
        } else {
          console.log("[FAIL] ✗ Protected endpoint returned status: " + meResponse.status);
          process.exit(1);
        }

        // Test 3: Try with forged token using fallback secret
        console.log("\n[TEST 3] Testing forged token with fallback-secret (should be rejected)...");
        const jwt = require('jsonwebtoken');
        const forgedToken = jwt.sign(
          { id: 999, email: 'attacker@evil.com', role: 'admin' },
          'fallback-secret',
          { expiresIn: '24h' }
        );

        const forgedResponse = await makeRequest('GET', '/api/auth/me', null, forgedToken);

        if (forgedResponse.status !== 200) {
          console.log("[PASS] ✓ Forged token REJECTED (status: " + forgedResponse.status + ")");
          console.log("       Application correctly rejects tokens with fallback-secret");
        } else {
          console.log("[FAIL] ✗ VULNERABILITY: Forged token was ACCEPTED!");
          process.exit(1);
        }
      } else {
        console.log("[FAIL] ✗ Login response missing token");
        console.log("Response:", loginRes.body);
        process.exit(1);
      }
    } else {
      console.log("[FAIL] ✗ Login failed with status: " + loginRes.status);
      console.log("Response:", loginRes.body);
      process.exit(1);
    }

    console.log("\n" + "=".repeat(70));
    console.log("[✓] All integration tests PASSED");
    console.log("=".repeat(70));
    console.log("\nVerified:");
    console.log("  ✓ Application starts successfully with proper JWT_SECRET");
    console.log("  ✓ Authentication endpoints work correctly");
    console.log("  ✓ Valid tokens are accepted");
    console.log("  ✓ Forged tokens using fallback-secret are rejected");
    process.exit(0);

  } catch (err) {
    console.log("[ERROR] Test failed with error: " + err.message);
    console.log(err.stack);
    process.exit(1);
  }
}

runTests();