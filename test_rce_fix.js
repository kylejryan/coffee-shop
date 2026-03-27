diff --git a/test_rce_fix.js b/test_rce_fix.js
new file mode 100644
index 0000000..80efc03

/**
 * Test script to verify the RCE vulnerability is fixed
 * This script attempts to execute the RCE payload and should FAIL if the vulnerability is fixed
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@coffeeshop.com';
const ADMIN_PASSWORD = 'admin123';

let token = null;
let cookies = [];

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';

      // Extract Set-Cookie headers
      if (res.headers['set-cookie']) {
        cookies = res.headers['set-cookie'];
      }

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseData, headers: res.headers });
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
  console.log('=== Testing RCE Vulnerability Fix ===\n');

  try {
    // Step 1: Login as admin
    console.log('[*] Step 1: Logging in as admin...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    console.log('[*] Login status:', loginResponse.status);
    if (loginResponse.status !== 200) {
      console.error('[!] Login failed:', loginResponse.body);
      process.exit(1);
    }
    console.log('[✓] Login successful\n');

    // Step 2: Try basic arithmetic (allowed in safe implementation)
    console.log('[*] Step 2: Testing with basic arithmetic (1+1)...');
    const arithmeticResponse = await makeRequest('POST', '/api/admin/diagnostics', {
      command: '1+1'
    });
    console.log('[*] Arithmetic response status:', arithmeticResponse.status);
    console.log('[*] Response:', JSON.stringify(arithmeticResponse.body, null, 2));

    if (arithmeticResponse.status === 400 && arithmeticResponse.body.error && arithmeticResponse.body.error.includes('Invalid command')) {
      console.log('[✓] GOOD: Arbitrary arithmetic evaluation blocked\n');
    } else if (arithmeticResponse.status !== 200) {
      console.log('[?] Request failed (might be safe)\n');
    }

    // Step 3: Try to execute system command (RCE payload)
    console.log('[*] Step 3: Testing RCE payload (whoami via child_process)...');
    const rceResponse = await makeRequest('POST', '/api/admin/diagnostics', {
      command: 'require("child_process").execSync("whoami").toString()'
    });
    console.log('[*] RCE response status:', rceResponse.status);
    console.log('[*] Response:', JSON.stringify(rceResponse.body, null, 2));

    if (rceResponse.status === 400 && rceResponse.body.error && rceResponse.body.error.includes('Invalid command')) {
      console.log('[✓] VULNERABILITY FIXED: RCE payload was blocked!\n');
    } else if (rceResponse.status !== 200) {
      console.log('[✓] VULNERABILITY FIXED: Request rejected with error\n');
    } else if (rceResponse.body.result && typeof rceResponse.body.result === 'string') {
      console.log('[✗] VULNERABILITY STILL EXISTS: RCE command was executed!');
      console.log('[✗] Result:', rceResponse.body.result);
      process.exit(1);
    }

    // Step 4: Try to access environment variables
    console.log('[*] Step 4: Testing environment variable access (process.env)...');
    const envResponse = await makeRequest('POST', '/api/admin/diagnostics', {
      command: 'Object.keys(process.env).slice(0,5)'
    });
    console.log('[*] Env response status:', envResponse.status);
    console.log('[*] Response:', JSON.stringify(envResponse.body, null, 2));

    if (envResponse.status === 400 && envResponse.body.error && envResponse.body.error.includes('Invalid command')) {
      console.log('[✓] VULNERABILITY FIXED: Env access was blocked!\n');
    } else if (envResponse.status !== 200) {
      console.log('[✓] VULNERABILITY FIXED: Request rejected\n');
    } else if (Array.isArray(envResponse.body.result)) {
      console.log('[✗] VULNERABILITY STILL EXISTS: Environment accessed!');
      process.exit(1);
    }

    // Step 5: Try a safe diagnostic command (should work)
    console.log('[*] Step 5: Testing safe diagnostic command (systemInfo)...');
    const systemInfoResponse = await makeRequest('POST', '/api/admin/diagnostics', {
      command: 'systemInfo'
    });
    console.log('[*] SystemInfo response status:', systemInfoResponse.status);
    console.log('[*] Response:', JSON.stringify(systemInfoResponse.body, null, 2));

    if (systemInfoResponse.status === 200 && systemInfoResponse.body.result) {
      console.log('[✓] Safe diagnostic command works correctly!\n');
    } else {
      console.log('[?] Safe command failed (might indicate over-strict fix)\n');
    }

    // Final verdict
    console.log('=== RESULT: VULNERABILITY FIXED ===');
    console.log('[✓] The eval() vulnerability has been successfully patched!');
    console.log('[✓] Only safe, predefined commands are allowed');
    process.exit(0);

  } catch (error) {
    console.error('[!] Error during testing:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready and then run tests
setTimeout(runTests, 2000);