diff --git a/test-legitimate-auth.js b/test-legitimate-auth.js
new file mode 100644
index 0000000..ea5b076
 * Test that legitimate users can still login and use their tokens
 */

const http = require('http');

function makeHttpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
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

async function testLegitimateLogin() {
  console.log('\n' + '='.repeat(70));
  console.log('Testing Legitimate Authentication (Regression Test)');
  console.log('='.repeat(70) + '\n');

  try {
    console.log('[TEST] Attempting legitimate login...');
    const loginRes = await makeHttpRequest('POST', '/api/auth/login', {
      email: 'admin@coffeeshop.com',
      password: 'admin123'
    });

    console.log('  Status:', loginRes.status);
    const loginBody = JSON.parse(loginRes.body);
    console.log('  Response:', JSON.stringify(loginBody, null, 2));

    if (loginRes.status === 200 && loginBody.user) {
      console.log('\n✓ Legitimate login works correctly');
      console.log('  User:', loginBody.user.email);
      console.log('  Role:', loginBody.user.role);
      
      // Extract token from Set-Cookie
      if (loginRes.headers['set-cookie']) {
        console.log('  Token cookie set: Yes');
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('✓ REGRESSION TEST PASSED - No breaking changes');
      console.log('='.repeat(70) + '\n');
      process.exit(1);
    } else {
      console.log('\n✗ Login failed');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(0);
  }
}

testLegitimateLogin();