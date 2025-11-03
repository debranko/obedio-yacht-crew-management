const axios = require('axios');

const API_URL = 'http://localhost:8080/api';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJzeXN0ZW0tYWRtaW4iLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzMwNDA5NzE4LCJleHAiOjE3MzA0OTYxMTh9.4oMJfIG4mml8tZC-CguPRoPGpzzk9el_j0hVbLiJlR4';

async function testYachtSettingsAPI() {
  try {
    console.log('\n=== Testing Yacht Settings API ===\n');

    // Test GET endpoint
    console.log('1. Testing GET /api/yacht-settings');
    const getResponse = await axios.get(`${API_URL}/yacht-settings`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });
    
    console.log('✅ GET Response:', JSON.stringify(getResponse.data, null, 2));
    console.log('\n');

    // Test PUT endpoint with weatherUpdateInterval
    console.log('2. Testing PUT /api/yacht-settings with weatherUpdateInterval');
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
      { headers: { Authorization: `Bearer ${API_TOKEN}` } }
    );

    console.log('✅ PUT Response:', JSON.stringify(putResponse.data, null, 2));
    console.log('\n');

    // Verify the weatherUpdateInterval was saved
    console.log('3. Verifying weatherUpdateInterval was saved');
    const verifyResponse = await axios.get(`${API_URL}/yacht-settings`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });

    const settings = verifyResponse.data.data;
    if (settings.weatherUpdateInterval === 60) {
      console.log('✅ weatherUpdateInterval successfully saved and retrieved:', settings.weatherUpdateInterval);
    } else {
      console.log('❌ weatherUpdateInterval not saved correctly. Expected: 60, Got:', settings.weatherUpdateInterval);
    }

    console.log('\n=== All tests completed ===\n');
    console.log('Note: Check the WebSocket logs in the frontend to verify "settings:updated" event was emitted');

  } catch (error) {
    console.error('❌ Error testing yacht settings API:', error.response?.data || error.message);
  }
}

testYachtSettingsAPI();