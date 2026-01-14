diff --git a/test-poc.sh b/test-poc.sh
new file mode 100755
index 0000000..64771bd

# POC Test Script for Negative Price and Stock Quantity Vulnerability
# This script tests whether negative values are accepted in product creation

BASE_URL="http://localhost:3000"
TEMP_COOKIE_JAR=$(mktemp)

echo "🧪 Starting POC Tests for Negative Price and Stock Quantity Vulnerability"
echo ""

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -c "$TEMP_COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coffeeshop.com","password":"admin123"}')

if ! echo "$LOGIN_RESPONSE" | grep -q '"id"'; then
  echo "❌ Login failed"
  rm -f "$TEMP_COOKIE_JAR"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Test negative price
echo "Step 2: Testing negative price (-100)..."
NEG_PRICE_RESPONSE=$(curl -s -b "$TEMP_COOKIE_JAR" -X POST "$BASE_URL/api/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"NegativePriceProduct_POC","description":"Test product with negative price","price":-100,"stock_quantity":10}')

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$TEMP_COOKIE_JAR" -X POST "$BASE_URL/api/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"NegativePriceProduct_POC2","description":"Test product with negative price","price":-100,"stock_quantity":10}')

echo "Response: $NEG_PRICE_RESPONSE"

if echo "$NEG_PRICE_RESPONSE" | grep -q '"error"'; then
  echo "✅ PATCHED: Negative price rejected with error"
  PATCH_TEST1="passed"
elif echo "$NEG_PRICE_RESPONSE" | grep -q '"price":-100'; then
  echo "❌ VULNERABLE: Negative price was accepted"
  rm -f "$TEMP_COOKIE_JAR"
  exit 1
fi

echo ""

# Step 3: Test negative stock quantity
echo "Step 3: Testing negative stock quantity (-50)..."
NEG_STOCK_RESPONSE=$(curl -s -b "$TEMP_COOKIE_JAR" -X POST "$BASE_URL/api/products" \
  -H "Content-Type: application/json" \
  -d '{"name":"NegativeStockProduct_POC","description":"Test product with negative stock","price":5.00,"stock_quantity":-50}')

echo "Response: $NEG_STOCK_RESPONSE"

if echo "$NEG_STOCK_RESPONSE" | grep -q '"error"'; then
  echo "✅ PATCHED: Negative stock rejected with error"
  PATCH_TEST2="passed"
elif echo "$NEG_STOCK_RESPONSE" | grep -q '"stock_quantity":-50'; then
  echo "❌ VULNERABLE: Negative stock was accepted"
  rm -f "$TEMP_COOKIE_JAR"
  exit 1
fi

echo ""

# Clean up
rm -f "$TEMP_COOKIE_JAR"

if [ "$PATCH_TEST1" = "passed" ] && [ "$PATCH_TEST2" = "passed" ]; then
  echo "✅ All tests passed! Vulnerability appears to be patched."
  exit 0
else
  echo "❌ Some tests did not pass"
  exit 1
fi