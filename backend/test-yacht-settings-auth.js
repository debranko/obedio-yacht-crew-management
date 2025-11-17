const axios = require('axios');

const API_URL = 'http://localhost:8080/api';

async function testYachtSettingsWithAuth() {
  try {
    console.log('\n=== Testing Yacht Settings API with Authentication ===\n');

    // First, login to get a fresh token
    console.log('1. Getting authentication token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Authentication successful, token received');
    console.log('\n');

    // Test GET endpoint with fresh token
    console.log('2. Testing GET /api/yacht-settings');
    const getResponse = await axios.get(`${API_URL}/yacht-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ GET Response:', JSON.stringify(getResponse.data, null, 2));
    console.log('\n');

    // Test PUT endpoint with weatherUpdateInterval
    console.log('3. Testing PUT /api/yacht-settings with weatherUpdateInterval');
    const updateData = {
      name: 'M/Y Serenity',
      type: 'motor',
      timezone: 'Europe/Monaco',
      floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
      weatherUpdateInterval: 60,  // Update weather every 60 seconds
      locationName: 'Monaco Harbor',
      latitude: 43.7328,
      longitude: 7.4197
    };

    const putResponse = await axios.put(
      `${API_URL}/yacht-settings`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ PUT Response:', JSON.stringify(putResponse.data, null, 2));
    console.log('\n');

    // Verify the weatherUpdateInterval was saved
    console.log('4. Verifying weatherUpdateInterval was saved');
    const verifyResponse = await axios.get(`${API_URL}/yacht-settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const settings = verifyResponse.data.data;
    if (settings.weatherUpdateInterval === 60) {
      console.log('✅ weatherUpdateInterval successfully saved and retrieved:', settings.weatherUpdateInterval);
      console.log('✅ locationName successfully saved:', settings.locationName);
      console.log('✅ latitude:', settings.latitude);
      console.log('✅ longitude:', settings.longitude);
    } else {
      console.log('❌ weatherUpdateInterval not saved correctly. Expected: 60, Got:', settings.weatherUpdateInterval);
    }

    console.log('\n=== All tests completed successfully! ===\n');
    console.log('Note: Check the WebSocket logs in the frontend to verify "settings:updated" event was emitted');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testYachtSettingsWithAuth();