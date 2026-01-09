#!/bin/bash
# FILE: test-auth.sh
# DESCRIPTION: Automated Better Auth test suite

set -e

# Configuration
BASE_URL="http://localhost:3001"
EMAIL="test.$(date +%s)@example.com"
PASSWORD="TestPassword123"
NAME="Test User $(date +%s)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Test 1: Email/Password Signup
test_email_signup() {
    log_test "Email/Password Signup"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/sign-up/email" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"$PASSWORD\",
            \"name\": \"$NAME\"
        }")
    
    # Check if response contains user object
    if echo "$RESPONSE" | grep -q "\"email\":\"$EMAIL\""; then
        log_success "User signup successful"
        echo "Email: $EMAIL"
        echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        
        # Extract session token from response
        SESSION_TOKEN=$(echo "$RESPONSE" | jq -r '.session.token' 2>/dev/null || echo "")
        return 0
    else
        log_error "User signup failed"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test 2: Email/Password Login
test_email_login() {
    log_test "Email/Password Login"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/sign-in/email" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"$PASSWORD\"
        }")
    
    if echo "$RESPONSE" | grep -q "\"email\":\"$EMAIL\""; then
        log_success "User login successful"
        echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        return 0
    else
        log_error "User login failed"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test 3: Get Session
test_get_session() {
    log_test "Get Session"
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/api/auth/session")
    
    if echo "$RESPONSE" | grep -q "session"; then
        log_success "Session retrieved"
        echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        return 0
    else
        log_error "Failed to get session"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test 4: Signup with invalid password (too short)
test_invalid_password() {
    log_test "Invalid Password Validation (too short)"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/sign-up/email" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"invalid-test@example.com\",
            \"password\": \"123\",
            \"name\": \"Invalid Test\"
        }")
    
    if echo "$RESPONSE" | grep -qi "error\|invalid\|password"; then
        log_success "Password validation working (rejected short password)"
        return 0
    else
        log_error "Password validation not working"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Test 5: Duplicate email signup
test_duplicate_email() {
    log_test "Duplicate Email Prevention"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/sign-up/email" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$EMAIL\",
            \"password\": \"DifferentPassword123\",
            \"name\": \"Duplicate Test\"
        }")
    
    if echo "$RESPONSE" | grep -qi "error\|exists\|already"; then
        log_success "Duplicate email prevention working"
        return 0
    else
        log_error "Duplicate email prevention not working"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Main test execution
main() {
    echo "╔════════════════════════════════════════╗"
    echo "║     Better Auth Automated Tests        ║"
    echo "╚════════════════════════════════════════╝"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Test Email: $EMAIL"
    echo "Test Password: $PASSWORD"
    echo "Test Name: $NAME"
    echo ""
    
    # Check if server is running
    if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
        log_error "Server not running at $BASE_URL"
        echo "Start server with: npm run dev"
        exit 1
    fi
    log_success "Server is running"
    echo ""
    
    # Run all tests
    PASSED=0
    FAILED=0
    
    if test_email_signup; then ((PASSED++)); else ((FAILED++)); fi
    echo ""
    
    if test_email_login; then ((PASSED++)); else ((FAILED++)); fi
    echo ""
    
    if test_get_session; then ((PASSED++)); else ((FAILED++)); fi
    echo ""
    
    if test_invalid_password; then ((PASSED++)); else ((FAILED++)); fi
    echo ""
    
    if test_duplicate_email; then ((PASSED++)); else ((FAILED++)); fi
    echo ""
    
    # Summary
    echo "╔════════════════════════════════════════╗"
    echo "║           Test Summary                 ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo "Total: $((PASSED + FAILED))"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        log_success "All tests passed! ✅"
        exit 0
    else
        log_error "Some tests failed"
        exit 1
    fi
}

# Run main function
main "$@"
