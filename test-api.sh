#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"

echo -e "${YELLOW}🧪 Testing IS2 Pandebugger API${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$HEALTH_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
fi
echo ""

# Test 2: Readiness Check
echo -e "${YELLOW}2. Testing Database Connection...${NC}"
READINESS_RESPONSE=$(curl -s "$BASE_URL/health/readiness")
if echo "$READINESS_RESPONSE" | grep -q '"database":"connected"'; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
    echo "$READINESS_RESPONSE" | jq '.'
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "$READINESS_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}3. Testing Login (CU06)...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pandebugger.com",
    "password": "Test123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
    echo "Token: ${TOKEN:0:50}..."
    echo "$LOGIN_RESPONSE" | jq '.data.user'
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
fi
echo ""

# Test 4: Get Current User
echo -e "${YELLOW}4. Testing Get Current User...${NC}"
USER_RESPONSE=$(curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$USER_RESPONSE" | grep -q '"status":"success"'; then
    echo -e "${GREEN}✓ Get current user successful${NC}"
    echo "$USER_RESPONSE" | jq '.data'
else
    echo -e "${RED}✗ Get current user failed${NC}"
    echo "$USER_RESPONSE" | jq '.'
fi
echo ""

# Test 5: Login with Wrong Password
echo -e "${YELLOW}5. Testing Login with Wrong Password...${NC}"
WRONG_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pandebugger.com",
    "password": "WrongPassword123!"
  }')

if echo "$WRONG_LOGIN" | grep -q '"status":"error"'; then
    echo -e "${GREEN}✓ Correctly rejected invalid credentials${NC}"
    echo "$WRONG_LOGIN" | jq '.message'
else
    echo -e "${RED}✗ Should have rejected invalid credentials${NC}"
fi
echo ""

# Test 6: Access Protected Route Without Token
echo -e "${YELLOW}6. Testing Protected Route Without Token...${NC}"
NO_TOKEN_RESPONSE=$(curl -s "$BASE_URL/auth/me")

if echo "$NO_TOKEN_RESPONSE" | grep -q '"status":"error"'; then
    echo -e "${GREEN}✓ Correctly rejected request without token${NC}"
    echo "$NO_TOKEN_RESPONSE" | jq '.message'
else
    echo -e "${RED}✗ Should have rejected request without token${NC}"
fi
echo ""

echo -e "${GREEN}✓ All tests completed!${NC}\n"
echo -e "${YELLOW}Summary:${NC}"
echo "• API is running on $BASE_URL"
echo "• Database is connected"
echo "• Authentication is working"
echo "• Test user: test@pandebugger.com / Test123!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "• Implement more use cases (CU09 Create User, CU01 Register Book, etc.)"
echo "• Add more test users"
echo "• Test with Postman or Thunder Client"
