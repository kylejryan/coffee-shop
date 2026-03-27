diff --git a/test-poc.js b/test-poc.js
new file mode 100644
index 0000000..0f8bec2

/**
 * POC Test Script for Negative Price and Stock Quantity Vulnerability
 * This script tests whether negative values are accepted in product creation
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      let setCookies = res.headers['set-cookie'] || [];
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
            cookies: setCookies,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            cookies: setCookies,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Extract JWT token from Set-Cookie header
function extractToken(setCookies) {
  if (!setCookies || !Array.isArray(setCookies)) return null;
  
  for (const cookie of setCookies) {
    if (cookie.includes('token=')) {
      const match = cookie.match(/token=([^;]+)/);
      if (match) {
        return match[1];
      }
    }
  }
  return null;
}

async function runTests() {
  console.log('🧪 Starting POC Tests for Negative Price and Stock Quantity Vulnerability\n');

  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@coffeeshop.com',
      password: 'admin123',
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.data);
      process.exit(1);
    }

    const token = extractToken(loginResponse.cookies);
    if (!token) {
      console.error('❌ Could not extract token from login response');
      process.exit(1);
    }

    console.log('✅ Login successful, token obtained\n');

    // Step 2: Test negative price
    console.log('Step 2: Testing negative price (-100)...');
    const negPriceResponse = await makeRequest(
      'POST',
      '/api/products',
      {
        name: 'NegativePriceProduct_POC',
        description: 'Test product with negative price',
        price: -100,
        stock_quantity: 10,
      },
      {
        Cookie: `token=${token}`,
      }
    );

    console.log(`Response Status: ${negPriceResponse.status}`);
    console.log(`Response Body: ${JSON.stringify(negPriceResponse.data, null, 2)}`);

    if (negPriceResponse.status === 400 && negPriceResponse.data.error) {
      console.log(
        `✅ PATCHED: Negative price rejected with error: "${negPriceResponse.data.error}"`
      );
    } else if (
      negPriceResponse.status === 201 ||
      negPriceResponse.status === 200
    ) {
      if (
        negPriceResponse.data.price === -100 ||
        parseInt(negPriceResponse.data.price) === -100
      ) {
        console.log(
          '❌ VULNERABLE: Negative price was accepted and stored in database'
        );
        process.exit(1);
      } else {
        console.log(
          '⚠️  Unexpected response: Product created but price is different'
        );
      }
    } else {
      console.log(`⚠️  Unexpected response status: ${negPriceResponse.status}`);
    }

    console.log('');

    // Step 3: Test negative stock quantity
    console.log('Step 3: Testing negative stock quantity (-50)...');
    const negStockResponse = await makeRequest(
      'POST',
      '/api/products',
      {
        name: 'NegativeStockProduct_POC',
        description: 'Test product with negative stock',
        price: 5.0,
        stock_quantity: -50,
      },
      {
        Cookie: `token=${token}`,
      }
    );

    console.log(`Response Status: ${negStockResponse.status}`);
    console.log(`Response Body: ${JSON.stringify(negStockResponse.data, null, 2)}`);

    if (negStockResponse.status === 400 && negStockResponse.data.error) {
      console.log(
        `✅ PATCHED: Negative stock rejected with error: "${negStockResponse.data.error}"`
      );
    } else if (
      negStockResponse.status === 201 ||
      negStockResponse.status === 200
    ) {
      if (
        negStockResponse.data.stock_quantity === -50 ||
        parseInt(negStockResponse.data.stock_quantity) === -50
      ) {
        console.log(
          '❌ VULNERABLE: Negative stock quantity was accepted and stored in database'
        );
        process.exit(1);
      } else {
        console.log(
          '⚠️  Unexpected response: Product created but stock is different'
        );
      }
    } else {
      console.log(`⚠️  Unexpected response status: ${negStockResponse.status}`);
    }

    console.log('');
    console.log('✅ All tests passed! Vulnerability appears to be patched.');
    process.exit(0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run tests
runTests();