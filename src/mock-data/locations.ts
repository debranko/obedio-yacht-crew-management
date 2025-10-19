import { Location, LocationType } from '../domain/locations';

// Generate mock locations data matching actual yacht GA
export function generateMockLocations(): Location[] {
  const locations: Location[] = [];
  const now = new Date();

  // Sun Deck - Top deck with sun deck lounge
  const sunDeckLocations = [
    { name: 'Sun Deck Lounge', type: 'outdoor' as LocationType, capacity: 12, description: 'Open-air lounge area with sun beds and panoramic views' },
  ];

  const sunDeckImages: Record<string, string> = {
    'Sun Deck Lounge': 'https://images.unsplash.com/photo-1686845928517-8ffc9009a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  };

  sunDeckLocations.forEach((loc, index) => {
    locations.push({
      id: `sun-${index + 1}`,
      name: loc.name,
      type: loc.type,
      description: loc.description,
      floor: 'Sun Deck',
      capacity: loc.capacity,
      status: 'active',
      deviceCount: Math.floor(Math.random() * 2),
      image: sunDeckImages[loc.name],
      doNotDisturb: false,
      smartButtonId: `BTN-SUN-${index + 1}`,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });

  // Bridge Deck - Gym
  const bridgeDeckLocations = [
    { name: 'Gym', type: 'common' as LocationType, capacity: 4, description: 'Fitness center with state-of-the-art equipment' },
  ];

  const bridgeDeckImages: Record<string, string> = {
    'Gym': 'https://images.unsplash.com/photo-1719024483000-e72451273b5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  };

  bridgeDeckLocations.forEach((loc, index) => {
    locations.push({
      id: `bridge-${index + 1}`,
      name: loc.name,
      type: loc.type,
      description: loc.description,
      floor: 'Bridge Deck',
      capacity: loc.capacity,
      status: 'active',
      deviceCount: Math.floor(Math.random() * 2),
      image: bridgeDeckImages[loc.name],
      doNotDisturb: false,
      smartButtonId: `BTN-BRG-${index + 1}`,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });

  // Sun Deck Aft (Owner's Deck) - Owner's stateroom, VIP areas, salons
  const ownerDeckLocations = [
    { name: 'Owner\'s Stateroom', type: 'cabin' as LocationType, capacity: 2, description: 'Luxurious master suite with private amenities' },
    { name: 'VIP Cabin', type: 'cabin' as LocationType, capacity: 2, description: 'Premium guest stateroom with ensuite' },
    { name: 'VIP Office', type: 'common' as LocationType, capacity: 2, description: 'Private office and study area' },
    { name: 'Dining Room', type: 'common' as LocationType, capacity: 12, description: 'Formal dining area for elegant meals' },
    { name: 'Music Salon', type: 'common' as LocationType, capacity: 8, description: 'Entertainment and music room' },
    { name: 'Main Salon', type: 'common' as LocationType, capacity: 14, description: 'Primary living and social space' },
    { name: 'External Salon', type: 'outdoor' as LocationType, capacity: 10, description: 'Outdoor lounge and entertaining area' },
  ];

  const ownerDeckImages: Record<string, string> = {
    'Owner\'s Stateroom': 'https://images.unsplash.com/photo-1753505889211-9cfbac527474?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'VIP Cabin': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'VIP Office': 'https://images.unsplash.com/photo-1697124510316-13efcb2e3abd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'Dining Room': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'Music Salon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'Main Salon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'External Salon': 'https://images.unsplash.com/photo-1722032259251-91cc9365b349?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  };

  ownerDeckLocations.forEach((loc, index) => {
    // Set DND for Owner's Stateroom and VIP Cabin (matching guests with DND)
    const hasDND = loc.name === 'Owner\'s Stateroom' || loc.name === 'VIP Cabin';
    
    locations.push({
      id: `owner-${index + 1}`,
      name: loc.name,
      type: loc.type,
      description: loc.description,
      floor: 'Sun Deck Aft (Owner\'s Deck)',
      capacity: loc.capacity,
      status: 'active',
      deviceCount: (loc.type === 'cabin' || loc.type === 'common') ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 2),
      image: ownerDeckImages[loc.name],
      doNotDisturb: hasDND,
      smartButtonId: `BTN-OWNER-${index + 1}`,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });

  // Main Deck - Conference room and welcome salon
  const mainDeckLocations = [
    { name: 'Conference Room', type: 'common' as LocationType, capacity: 10, description: 'Professional meeting room with AV equipment' },
    { name: 'Welcome Salon', type: 'common' as LocationType, capacity: 8, description: 'Elegant reception and greeting area' },
  ];

  const mainDeckImages: Record<string, string> = {
    'Conference Room': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'Welcome Salon': 'https://images.unsplash.com/photo-1674606878551-f424ad6ce965?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  };

  mainDeckLocations.forEach((loc, index) => {
    locations.push({
      id: `main-${index + 1}`,
      name: loc.name,
      type: loc.type,
      description: loc.description,
      floor: 'Main Deck',
      capacity: loc.capacity,
      status: 'active',
      deviceCount: Math.floor(Math.random() * 2) + 1,
      image: mainDeckImages[loc.name],
      doNotDisturb: false,
      smartButtonId: `BTN-MAIN-${index + 1}`,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });

  // Lower Deck - Cabin 6 and lazarette/swimming platform
  const lowerDeckLocations = [
    { name: 'Cabin 6', type: 'cabin' as LocationType, capacity: 2, description: 'Guest stateroom with comfortable accommodations' },
    { name: 'Lazarette / Swimming Platform', type: 'outdoor' as LocationType, capacity: 8, description: 'Water level platform for swimming and water sports' },
  ];

  const lowerDeckImages: Record<string, string> = {
    'Cabin 6': 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    'Lazarette / Swimming Platform': 'https://images.unsplash.com/photo-1712142369890-8202255a278a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  };

  lowerDeckLocations.forEach((loc, index) => {
    locations.push({
      id: `lower-${index + 1}`,
      name: loc.name,
      type: loc.type,
      description: loc.description,
      floor: 'Lower Deck',
      capacity: loc.capacity,
      status: 'active',
      deviceCount: loc.type === 'cabin' ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 2),
      image: lowerDeckImages[loc.name],
      smartButtonId: `BTN-LWR-${index + 1}`,
      doNotDisturb: false,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
  });

  return locations;
}