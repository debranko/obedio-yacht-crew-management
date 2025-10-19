import { ServiceRequest, InteriorTeam } from '../types';

export function generateMockServiceRequests(): ServiceRequest[] {
  const requests: ServiceRequest[] = [];
  const now = new Date();

  // Mock audio URLs (for demonstration - in production these would be real audio files)
  const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  
  // Fallback image for locations without images
  const fallbackImage = 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

  const guestRequests = [
    // Cabin Requests
    {
      guestName: 'Mr. Anderson',
      cabin: 'Owner\'s Stateroom',
      cabinId: 'M01',
      voiceText: 'Could we have a bottle of champagne and some fresh towels brought to the sun deck please?',
    },
    {
      guestName: 'Mrs. Chen',
      cabin: 'VIP Cabin',
      cabinId: 'M02',
      voiceText: 'We would like evening turndown service at 8 PM.',
    },
    {
      guestName: 'Dr. Williams',
      cabin: 'Cabin 6',
      cabinId: 'U01',
      voiceText: 'I need a gluten-free meal prepared for dinner tonight, no dairy products please.',
    },
    {
      guestName: 'Ms. Taylor',
      cabin: 'VIP Cabin',
      cabinId: 'M03',
      voiceText: 'Can someone help set up the beach club area? We need water sports equipment.',
    },
    {
      guestName: 'Mr. Blackwood',
      cabin: 'Cabin 6',
      cabinId: 'U02',
      voiceText: 'The air conditioning in our cabin seems too cold. Could someone adjust it?',
    },
    {
      guestName: 'Ms. Rodriguez',
      cabin: 'Cabin 6',
      cabinId: 'U03',
      voiceText: 'We would like to have breakfast served on the external salon at 9 AM tomorrow.',
    },
    
    // Public Area Requests - Guests can call from anywhere on yacht
    {
      guestName: 'Mr. Anderson',
      cabin: 'Sun Deck Lounge',
      cabinId: 'SD-01',
      voiceText: 'We need more sunscreen and cold drinks here at the sun deck. Also, could you bring some fruit platters?',
    },
    {
      guestName: 'Mrs. Chen',
      cabin: 'Gym',
      cabinId: 'GYM-01',
      voiceText: 'Could someone bring fresh towels and cold water to the gym? We are finishing our workout.',
    },
    {
      guestName: 'Mr. Anderson',
      cabin: 'Main Salon',
      cabinId: 'SAL-01',
      voiceText: 'Could we have afternoon tea service prepared in the main salon at 4 PM?',
    },
    {
      guestName: 'Dr. Williams',
      cabin: 'Dining Room',
      cabinId: 'DIN-01',
      voiceText: 'We are ready for dinner service. Please inform the chef we are seated.',
    },
    {
      guestName: 'Ms. Taylor',
      cabin: 'Lazarette / Swimming Platform',
      cabinId: 'SWIM-01',
      voiceText: 'We need water toys set up at the swimming platform. Jet skis and paddleboards please.',
    },
    {
      guestName: 'Mr. Blackwood',
      cabin: 'Welcome Salon',
      cabinId: 'BAR-01',
      voiceText: 'Could someone prepare refreshments? We would like cocktails and appetizers.',
    },
    {
      guestName: 'Mrs. Chen',
      cabin: 'Music Salon',
      cabinId: 'SPA-01',
      voiceText: 'We would like to have some music playing. Could you set up the audio system?',
    },
    {
      guestName: 'Ms. Rodriguez',
      cabin: 'External Salon',
      cabinId: 'AFT-01',
      voiceText: 'Could you set up the outdoor dining table? We would like to have lunch on the external salon.',
    },
    {
      guestName: 'Mr. Anderson',
      cabin: 'VIP Office',
      cabinId: 'JAC-01',
      voiceText: 'I need the office prepared for a video conference. Please ensure high-speed internet and privacy.',
    },
    {
      guestName: 'Dr. Williams',
      cabin: 'Conference Room',
      cabinId: 'SKY-01',
      voiceText: 'We would like to have a business meeting. Could you prepare the conference room with AV equipment?',
    },
  ];

  // Generate 4-6 pending requests randomly
  const numRequests = Math.floor(Math.random() * 3) + 4;
  
  for (let i = 0; i < numRequests; i++) {
    const reqData = guestRequests[Math.floor(Math.random() * guestRequests.length)];
    const minutesAgo = Math.floor(Math.random() * 15) + 1;
    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
    
    const priorities: Array<'normal' | 'urgent' | 'emergency'> = ['normal', 'normal', 'normal', 'normal', 'urgent'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    requests.push({
      id: `req-${Date.now()}-${i}`,
      guestName: reqData.guestName,
      guestCabin: reqData.cabin,
      cabinId: reqData.cabinId,
      requestType: priority === 'emergency' ? 'emergency' : 'call',
      priority,
      timestamp,
      voiceTranscript: reqData.voiceText,
      voiceAudioUrl: mockAudioUrl,
      cabinImage: fallbackImage,
      status: 'pending',
    });
  }

  return requests.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function simulateNewServiceRequest(): ServiceRequest {
  // Mock cabin images
  const cabinImages = [
    'https://images.unsplash.com/photo-1697124510322-27ef594f67fd?w=800',
    'https://images.unsplash.com/photo-1737061296028-2eb5cb0a62df?w=800',
    'https://images.unsplash.com/photo-1573717865061-202c78c4b414?w=800',
  ];

  const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  const guestRequests = [
    {
      guestName: 'Mr. Anderson',
      cabin: 'Owner\'s Stateroom',
      cabinId: 'M01',
      voiceText: 'Could we have a bottle of champagne and some fresh towels brought to the sun deck please?',
    },
    {
      guestName: 'Mrs. Chen',
      cabin: 'VIP Cabin',
      cabinId: 'M02',
      voiceText: 'We would like evening turndown service at 8 PM.',
    },
    {
      guestName: 'Dr. Williams',
      cabin: 'Cabin 6',
      cabinId: 'U01',
      voiceText: 'I need a gluten-free meal prepared for dinner tonight, no dairy products please.',
    },
    {
      guestName: 'Ms. Taylor',
      cabin: 'VIP Cabin',
      cabinId: 'M03',
      voiceText: 'Can someone help set up the beach club area? We need water sports equipment.',
    },
    {
      guestName: 'Mr. Blackwood',
      cabin: 'Cabin 6',
      cabinId: 'U02',
      voiceText: 'The air conditioning in our cabin seems too cold. Could someone adjust it?',
    },
    {
      guestName: 'Ms. Rodriguez',
      cabin: 'Cabin 6',
      cabinId: 'U03',
      voiceText: 'We would like to have breakfast served on the external salon at 9 AM tomorrow.',
    },
  ];

  const reqData = guestRequests[Math.floor(Math.random() * guestRequests.length)];
  const priorities: Array<'normal' | 'urgent' | 'emergency'> = ['normal', 'normal', 'urgent', 'emergency'];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];

  const newRequest: ServiceRequest = {
    id: `req-${Date.now()}`,
    guestName: reqData.guestName,
    guestCabin: reqData.cabin,
    cabinId: reqData.cabinId,
    requestType: priority === 'emergency' ? 'emergency' : 'call',
    priority,
    timestamp: new Date(),
    voiceTranscript: reqData.voiceText,
    voiceAudioUrl: mockAudioUrl,
    cabinImage: cabinImages[Math.floor(Math.random() * cabinImages.length)],
    status: 'pending',
  };

  return newRequest;
}