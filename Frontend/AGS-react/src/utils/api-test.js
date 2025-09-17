// API Connection Test Script
// Run this in browser console or as a separate test file

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPIConnection() {
  console.log('🔍 Testing API Connection...');
  console.log(`Backend URL: ${API_BASE_URL}`);
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const response = await fetch('http://localhost:5000/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is responding:', data);
    } else {
      console.log('❌ Backend responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    return false;
  }

  try {
    // Test 2: Auth endpoint
    console.log('\n2️⃣ Testing auth endpoint...');
    const authResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });
    
    if (authResponse.status === 400 || authResponse.status === 401) {
      console.log('✅ Auth endpoint is working (correctly rejecting bad credentials)');
    } else {
      console.log('⚠️ Auth endpoint responded unexpectedly:', authResponse.status);
    }
  } catch (error) {
    console.log('❌ Auth endpoint error:', error.message);
  }

  try {
    // Test 3: Create test account
    console.log('\n3️⃣ Testing test account creation...');
    const testResponse = await fetch(`${API_BASE_URL}/test/create-test-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('✅ Test accounts created:', data);
    } else {
      const errorText = await testResponse.text();
      console.log('❌ Test account creation failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Test account creation error:', error.message);
  }

  console.log('\n🏁 API Connection Test Complete');
}

// Export for use
if (typeof window !== 'undefined') {
  window.testAPIConnection = testAPIConnection;
} else if (typeof module !== 'undefined') {
  module.exports = { testAPIConnection };
}

// Run test if called directly
if (typeof window !== 'undefined') {
  console.log('Run testAPIConnection() in console to test API');
}