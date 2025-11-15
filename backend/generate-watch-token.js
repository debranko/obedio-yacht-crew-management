const jwt = require('jsonwebtoken');

// JWT Secret from .env
const JWT_SECRET = "af7bae6536b8a4d6a79139ebfaf48c0d22ca77b3a86837081391b7971fd436c4d6defa1037e571a3a94325a5f8e87ba139e4a94f021a903a69c1df43f1a2b27e";

// Payload for test crew member on watch
const payload = {
  sub: 'test-crew-123',  // User ID
  userId: 'test-crew-123',  // Legacy support
  role: 'chief-stewardess',  // Role with service-requests.accept permission
  username: 'crew-watch',
  type: 'watch-auth'
};

// Generate token that expires in 10 years (for MVP)
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '3650d' });

console.log('\n==============================================');
console.log('WEAR OS WATCH - JWT AUTH TOKEN');
console.log('==============================================\n');
console.log('Token:');
console.log(token);
console.log('\n==============================================');
console.log('Add this to ApiClient.kt as Authorization header');
console.log('==============================================\n');
