const axios = require('axios');

async function checkAPI() {
  try {
    // Get auth token (using test/demo user)
    const loginResponse = await axios.post('http://localhost:5000/api/modules/auth/login', {
      email: 'testuser@example.com',
      password: 'password123'
    }).catch(err => {
      console.log('❌ Cannot login test user');
      throw err;
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in, token:', token.slice(0, 20) + '...');

    // Get notifications
    const notifResponse = await axios.get('http://localhost:5000/api/modules/notifications/unread?limit=20', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n📋 API Response from /api/modules/notifications/unread:');
    console.log(JSON.stringify(notifResponse.data, null, 2));

    // Check if data field is present
    if (notifResponse.data.notifications && notifResponse.data.notifications.length > 0) {
      console.log('\n🔍 First notification data field:');
      const firstNotif = notifResponse.data.notifications[0];
      console.log(`  Type: ${firstNotif.type}`);
      console.log(`  Data field: ${firstNotif.data ? JSON.stringify(firstNotif.data) : 'NULL'}`);
      console.log(`  Has token: ${firstNotif.data?.token ? 'YES ✅' : 'NO ❌'}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

checkAPI();
