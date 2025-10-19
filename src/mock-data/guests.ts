import { Guest, Location } from '../types';

export function generateMockGuests(locations: Location[] = []): Guest[] {
  const firstNames = ['Alexander', 'Victoria', 'James', 'Isabella', 'Michael', 'Sophia', 'William', 'Charlotte', 'Robert', 'Amelia'];
  const lastNames = ['Anderson', 'Chen', 'Williams', 'Rodriguez', 'Thompson', 'Martinez', 'Blackwood', 'Dubois', 'Van Der Berg', 'Al-Rashid'];
  const nationalities = ['USA', 'UK', 'France', 'Spain', 'Italy', 'Germany', 'UAE', 'Netherlands', 'China', 'Australia'];
  
  // Get cabins from locations with proper foreign key relationship
  const cabinLocations = locations
    .filter(loc => loc.type === 'cabin')
    .filter(loc => !loc.name.toLowerCase().includes('crew')); // Exclude crew cabins, only guest cabins
  
  const allergies = ['Shellfish', 'Nuts', 'Dairy', 'Gluten', 'Eggs', 'Soy', 'Fish'];
  const medicalConditions = ['Diabetes Type 2', 'Hypertension', 'Asthma', 'Heart Condition', 'Epilepsy', 'Migraine History'];
  const dietaryRestrictions = ['Vegetarian', 'Vegan', 'Pescatarian', 'Kosher', 'Halal', 'Gluten-Free', 'Keto', 'Low-Carb'];
  const foodDislikes = ['Mushrooms', 'Olives', 'Cilantro', 'Spicy Food', 'Raw Fish', 'Blue Cheese'];
  const favoriteFoods = ['Steak', 'Sushi', 'Pasta', 'Seafood', 'Mediterranean', 'French Cuisine', 'Asian Fusion', 'Organic'];
  const favoriteDrinks = ['Champagne', 'Red Wine', 'White Wine', 'Whiskey', 'Cocktails', 'Fresh Juices', 'Espresso', 'Green Tea'];
  const specialOccasions = ['Birthday', 'Anniversary', 'Honeymoon', 'Business', 'Family Reunion'];
  
  const guests: Guest[] = [];
  const now = new Date();
  
  for (let i = 0; i < 8; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i];
    const type = i === 0 ? 'primary' : i === 1 ? 'partner' : i < 4 ? 'vip' : i < 6 ? 'family' : 'charter';
    const status = i < 4 ? 'onboard' : i < 6 ? 'expected' : 'departed';
    
    const checkInDate = new Date(now);
    checkInDate.setDate(now.getDate() - (status === 'onboard' ? Math.floor(Math.random() * 3) + 1 : 0) + (status === 'expected' ? Math.floor(Math.random() * 3) + 1 : 0));
    
    const checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkInDate.getDate() + Math.floor(Math.random() * 7) + 3);
    
    // Random allergies, medical conditions, and dietary restrictions
    const hasAllergies = Math.random() > 0.6;
    const hasMedical = Math.random() > 0.7; // Less common
    const hasDietary = Math.random() > 0.5;
    
    const contactRoles = ['Family Office', 'Manager', 'Personal Assistant', 'Agent', 'Executive Assistant'];
    
    // Set DND for specific guests (Owner and first VIP guest)
    const hasDoNotDisturb = (i === 0 || i === 2) && status === 'onboard';
    
    guests.push({
      id: `guest-${i + 1}`,
      firstName,
      lastName,
      preferredName: Math.random() > 0.7 ? firstName.substring(0, 4) : undefined,
      photo: undefined, // Will be added via camera/upload
      type,
      status,
      nationality: nationalities[i],
      languages: i === 0 ? ['English', 'French'] : i === 1 ? ['English', 'Mandarin'] : i === 8 ? ['Arabic', 'English'] : ['English'],
      passportNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000000) + 1000000}`,
      // Set both cabin name (legacy) and locationId (proper foreign key)
      cabin: status === 'onboard' ? cabinLocations[i % cabinLocations.length]?.name : undefined,
      locationId: status === 'onboard' ? cabinLocations[i % cabinLocations.length]?.id : undefined,
      checkInDate: checkInDate.toISOString().split('T')[0],
      checkInTime: '14:00',
      checkOutDate: checkOutDate.toISOString().split('T')[0],
      checkOutTime: '11:00',
      allergies: hasAllergies ? [allergies[Math.floor(Math.random() * allergies.length)]] : [],
      medicalConditions: hasMedical ? [medicalConditions[Math.floor(Math.random() * medicalConditions.length)]] : [],
      dietaryRestrictions: hasDietary ? [dietaryRestrictions[Math.floor(Math.random() * dietaryRestrictions.length)]] : [],
      foodDislikes: Math.random() > 0.5 ? [foodDislikes[Math.floor(Math.random() * foodDislikes.length)]] : [],
      favoriteFoods: [favoriteFoods[Math.floor(Math.random() * favoriteFoods.length)], favoriteFoods[Math.floor(Math.random() * favoriteFoods.length)]],
      favoriteDrinks: [favoriteDrinks[Math.floor(Math.random() * favoriteDrinks.length)]],
      specialOccasion: Math.random() > 0.6 ? specialOccasions[Math.floor(Math.random() * specialOccasions.length)] : undefined,
      specialOccasionDate: Math.random() > 0.6 ? checkInDate.toISOString().split('T')[0] : undefined,
      specialRequests: i === 0 ? 'Late checkout preferred. Extra pillows in cabin.' : i === 1 ? 'Need high-speed internet for work calls.' : undefined,
      vipNotes: type === 'vip' || type === 'primary' ? 'VIP treatment. Discreet service.' : undefined,
      crewNotes: i === 3 ? 'Prefers breakfast at 9 AM. Likes newspapers.' : undefined,
      doNotDisturb: hasDoNotDisturb,
      contactPerson: Math.random() > 0.3 ? {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        phone: `+1 555 ${String(Math.floor(Math.random() * 9000) + 1000)}`,
        email: `contact${i}@familyoffice.com`,
        role: contactRoles[Math.floor(Math.random() * contactRoles.length)],
      } : undefined,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Chief Stewardess',
    });
  }
  
  return guests;
}