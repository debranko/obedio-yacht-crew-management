// Guest Management Types
export interface Guest {
  id: string;

  // Basic Info
  firstName: string;
  lastName: string;
  preferredName?: string;
  photo?: string;
  type: 'owner' | 'vip' | 'guest' | 'partner' | 'family';
  status: 'expected' | 'onboard' | 'ashore' | 'departed';

  // Contact Information
  email?: string;
  phone?: string;

  nationality?: string;
  languages: string[];
  passportNumber?: string;

  // Accommodation
  cabin?: string; // Cabin name/ID (legacy - deprecated)
  locationId?: string; // Foreign key to Location.id (proper relationship)
  checkInDate: string;
  checkInTime?: string;
  checkOutDate: string;
  checkOutTime?: string;
  
  // Do Not Disturb
  doNotDisturb?: boolean;
  
  // Dietary & Allergies - CRITICAL
  allergies: string[];
  medicalConditions: string[]; // Medical conditions (e.g., diabetes, heart condition)
  dietaryRestrictions: string[];
  foodDislikes: string[];
  favoriteFoods: string[];
  favoriteDrinks: string[];
  
  // Special Occasions & Preferences
  specialOccasion?: string;
  specialOccasionDate?: string;
  
  // Notes & Requests
  specialRequests?: string;
  vipNotes?: string;
  crewNotes?: string;
  preferences?: string; // General guest preferences (from database)
  notes?: string; // Staff notes (from database)
  
  // Emergency Contact (CRITICAL for emergencies)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string; // e.g., "Spouse", "Parent", "Sibling"
  
  // Contact Person (Family Office, Manager, Agent, etc.)
  contactPerson?: {
    name: string;
    phone: string;
    email?: string;
    role: string; // e.g., "Family Office", "Manager", "Agent", "Assistant"
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}