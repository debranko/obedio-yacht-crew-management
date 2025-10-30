import { useState, useEffect, useMemo } from 'react';
import { type Guest } from '../contexts/AppDataContext';
import { useLocations } from '../hooks/useLocations';
import { useGuestMutations } from '../hooks/useGuestMutations';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CameraDialog } from './camera-dialog';
import { Camera, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface GuestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: Guest | null;
}

// Cabin Select Component - Now returns locationId for bidirectional assignment
function CabinSelect({ value, onValueChange, locationId, onLocationChange }: {
  value?: string;
  onValueChange: (value: string) => void;
  locationId?: string;
  onLocationChange?: (locationId: string, cabinName: string) => void;
}) {
  const { locations } = useLocations();

  // Get only cabin-type locations
  const cabins = useMemo(() => {
    return locations
      .filter(loc => loc.type === 'cabin')
      .sort((a, b) => {
        // Sort by floor then name
        const floorOrder = ['Sun Deck', 'Bridge Deck', 'Sun Deck Aft (Owner\'s Deck)', 'Main Deck', 'Lower Deck'];
        const floorA = floorOrder.indexOf(a.floor || '');
        const floorB = floorOrder.indexOf(b.floor || '');
        if (floorA !== floorB) return floorA - floorB;
        return a.name.localeCompare(b.name);
      });
  }, [locations]);

  // ✅ Find current cabin by locationId or cabin name
  const currentCabinId = locationId || cabins.find(c => c.name === value)?.id || '';

  const handleChange = (newLocationId: string) => {
    const selectedCabin = cabins.find(c => c.id === newLocationId);
    if (selectedCabin) {
      onValueChange(selectedCabin.name); // Update cabin name for backward compatibility
      onLocationChange?.(newLocationId, selectedCabin.name); // ✅ Update locationId for bidirectional assignment
    }
  };

  return (
    <Select value={currentCabinId} onValueChange={handleChange}>
      <SelectTrigger id="cabin">
        <SelectValue placeholder="Select cabin..." />
      </SelectTrigger>
      <SelectContent>
        {cabins.length === 0 ? (
          <SelectItem value="none" disabled>
            No cabins available
          </SelectItem>
        ) : (
          cabins.map((cabin) => (
            <SelectItem key={cabin.id} value={cabin.id}>
              {cabin.name} {cabin.floor && `(${cabin.floor})`}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function GuestFormDialog({ open, onOpenChange, guest }: GuestFormDialogProps) {
  const { createGuest, updateGuest, isCreating, isUpdating } = useGuestMutations();
  const { updateLocation } = useLocations();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Guest>>({
    firstName: '',
    lastName: '',
    preferredName: '',
    photo: undefined,
    type: 'guest',
    status: 'expected',
    nationality: '',
    languages: [],
    passportNumber: '',
    cabin: '',
    locationId: undefined, // ✅ Added for bidirectional assignment
    checkInDate: new Date().toISOString().split('T')[0],
    checkInTime: '14:00',
    checkOutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkOutTime: '11:00',
    allergies: [],
    medicalConditions: [],
    dietaryRestrictions: [],
    foodDislikes: [],
    favoriteFoods: [],
    favoriteDrinks: [],
    specialOccasion: '',
    specialOccasionDate: '',
    specialRequests: '',
    vipNotes: '',
    crewNotes: '',
    contactPerson: {
      name: '',
      phone: '',
      email: '',
      role: '',
    },
    createdBy: 'Chief Stewardess',
  });

  // Temporary inputs for adding items
  const [languageInput, setLanguageInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [dietaryInput, setDietaryInput] = useState('');
  const [foodDislikeInput, setFoodDislikeInput] = useState('');
  const [favoriteFoodInput, setFavoriteFoodInput] = useState('');
  const [favoriteDrinkInput, setFavoriteDrinkInput] = useState('');

  useEffect(() => {
    if (guest) {
      setFormData(guest);
    } else {
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        preferredName: '',
        photo: undefined,
        type: 'guest',
        status: 'expected',
        nationality: '',
        languages: [],
        passportNumber: '',
        cabin: '',
        locationId: undefined,
        checkInDate: new Date().toISOString().split('T')[0],
        checkInTime: '14:00',
        checkOutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOutTime: '11:00',
        allergies: [],
        medicalConditions: [],
        dietaryRestrictions: [],
        foodDislikes: [],
        favoriteFoods: [],
        favoriteDrinks: [],
        specialOccasion: '',
        specialOccasionDate: '',
        specialRequests: '',
        vipNotes: '',
        crewNotes: '',
        contactPerson: {
          name: '',
          phone: '',
          email: '',
          role: '',
        },
        createdBy: 'Chief Stewardess',
      });
    }
  }, [guest, open]);

  const handlePhotoCapture = (photoData: string) => {
    setFormData({ ...formData, photo: photoData });
    setIsCameraOpen(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData({ ...formData, photo: undefined });
  };

  const addArrayItem = (field: keyof Guest, value: string, setInput: (val: string) => void) => {
    if (value.trim()) {
      const currentArray = (formData[field] as string[]) || [];
      setFormData({
        ...formData,
        [field]: [...currentArray, value.trim()],
      });
      setInput('');
    }
  };

  const removeArrayItem = (field: keyof Guest, index: number) => {
    const currentArray = (formData[field] as string[]) || [];
    setFormData({
      ...formData,
      [field]: currentArray.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter guest first and last name');
      return;
    }

    if (!formData.checkInDate || !formData.checkOutDate) {
      toast.error('Please enter check-in and check-out dates');
      return;
    }

    if (guest) {
      // Update existing guest via backend API
      const previousLocationId = guest.locationId;
      const newLocationId = formData.locationId;

      updateGuest(
        { id: guest.id, data: formData },
        {
          onSuccess: async () => {
            // ✅ Bidirectional assignment: Update location side
            if (previousLocationId !== newLocationId) {
              // If location changed, update both old and new locations
              if (previousLocationId) {
                // Clear guest from old location (no longer assigned)
                // Location will automatically show no guest
              }
              if (newLocationId) {
                // Location will automatically pick up the new guest via foreign key
                toast.success(`Guest assigned to ${formData.cabin}`);
              }
            }
            onOpenChange(false);
          },
        }
      );
    } else {
      // Add new guest via backend API
      createGuest(
        formData as Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>,
        {
          onSuccess: async () => {
            // ✅ Bidirectional assignment: If locationId is set, it's automatically handled by foreign key
            if (formData.locationId) {
              toast.success(`Guest added and assigned to ${formData.cabin}`);
            }
            onOpenChange(false);
          },
        }
      );
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{guest ? 'Edit Guest' : 'Add New Guest'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
              <TabsTrigger value="dietary">Dietary</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Photo */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.photo} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(formData.firstName || '', formData.lastName || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCameraOpen(true)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                  {formData.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred Name</Label>
                <Input
                  id="preferredName"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                  placeholder="Optional nickname"
                />
              </div>

              {/* Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Guest Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: string) => setFormData({ ...formData, type: value as Guest['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: string) => setFormData({ ...formData, status: value as Guest['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expected">Expected</SelectItem>
                      <SelectItem value="onboard">Onboard</SelectItem>
                      <SelectItem value="departed">Departed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Nationality & Passport */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="e.g. USA, UK, France"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={formData.passportNumber}
                    onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                    placeholder="AB1234567"
                  />
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <Label>Languages</Label>
                <div className="flex gap-2">
                  <Input
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('languages', languageInput, setLanguageInput);
                      }
                    }}
                    placeholder="Add language and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('languages', languageInput, setLanguageInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.languages?.map((lang, idx) => (
                    <Badge key={idx} variant="secondary">
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeArrayItem('languages', idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Person */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <h4 className="font-medium">Contact Person</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Family Office, Manager, Agent, or designated representative
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={formData.contactPerson?.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson!, name: e.target.value },
                        })
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactRole">Role</Label>
                    <Input
                      id="contactRole"
                      value={formData.contactPerson?.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson!, role: e.target.value },
                        })
                      }
                      placeholder="e.g. Family Office, Manager, Agent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPerson?.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson!, phone: e.target.value },
                        })
                      }
                      placeholder="+1 555 1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactPerson?.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: { ...formData.contactPerson!, email: e.target.value },
                        })
                      }
                      placeholder="contact@familyoffice.com"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Accommodation Tab */}
            <TabsContent value="accommodation" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cabin">Cabin Assignment</Label>
                <CabinSelect
                  value={formData.cabin}
                  locationId={formData.locationId}
                  onValueChange={(value) => setFormData({ ...formData, cabin: value })}
                  onLocationChange={(locationId, cabinName) =>
                    setFormData({ ...formData, cabin: cabinName, locationId })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkInDate">Check-in Date *</Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkInTime">Check-in Time</Label>
                  <Input
                    id="checkInTime"
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkOutDate">Check-out Date *</Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({ ...formData, checkOutDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkOutTime">Check-out Time</Label>
                  <Input
                    id="checkOutTime"
                    type="time"
                    value={formData.checkOutTime}
                    onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="specialOccasion">Special Occasion</Label>
                  <Input
                    id="specialOccasion"
                    value={formData.specialOccasion}
                    onChange={(e) => setFormData({ ...formData, specialOccasion: e.target.value })}
                    placeholder="e.g. Birthday, Anniversary, Honeymoon"
                  />
                </div>
                {formData.specialOccasion && (
                  <div className="space-y-2">
                    <Label htmlFor="specialOccasionDate">Occasion Date</Label>
                    <Input
                      id="specialOccasionDate"
                      type="date"
                      value={formData.specialOccasionDate}
                      onChange={(e) => setFormData({ ...formData, specialOccasionDate: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Dietary Tab */}
            <TabsContent value="dietary" className="space-y-4">
              {/* Allergies */}
              <div className="space-y-2">
                <Label className="text-destructive">Allergies (CRITICAL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('allergies', allergyInput, setAllergyInput);
                      }
                    }}
                    placeholder="Add allergy and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('allergies', allergyInput, setAllergyInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allergies?.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive">
                      {allergy}
                      <button
                        type="button"
                        onClick={() => removeArrayItem('allergies', idx)}
                        className="ml-1 hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Dietary Restrictions */}
              <div className="space-y-2">
                <Label>Dietary Restrictions</Label>
                <div className="flex gap-2">
                  <Input
                    value={dietaryInput}
                    onChange={(e) => setDietaryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('dietaryRestrictions', dietaryInput, setDietaryInput);
                      }
                    }}
                    placeholder="e.g. Vegetarian, Vegan, Gluten-Free"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('dietaryRestrictions', dietaryInput, setDietaryInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.dietaryRestrictions?.map((dietary, idx) => (
                    <Badge key={idx} variant="secondary">
                      {dietary}
                      <button
                        type="button"
                        onClick={() => removeArrayItem('dietaryRestrictions', idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Food Dislikes */}
              <div className="space-y-2">
                <Label>Food Dislikes</Label>
                <div className="flex gap-2">
                  <Input
                    value={foodDislikeInput}
                    onChange={(e) => setFoodDislikeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('foodDislikes', foodDislikeInput, setFoodDislikeInput);
                      }
                    }}
                    placeholder="Add food dislike"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('foodDislikes', foodDislikeInput, setFoodDislikeInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.foodDislikes?.map((dislike, idx) => (
                    <Badge key={idx} variant="outline">
                      {dislike}
                      <button
                        type="button"
                        onClick={() => removeArrayItem('foodDislikes', idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Favorite Foods */}
              <div className="space-y-2">
                <Label>Favorite Foods</Label>
                <div className="flex gap-2">
                  <Input
                    value={favoriteFoodInput}
                    onChange={(e) => setFavoriteFoodInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('favoriteFoods', favoriteFoodInput, setFavoriteFoodInput);
                      }
                    }}
                    placeholder="Add favorite food"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('favoriteFoods', favoriteFoodInput, setFavoriteFoodInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.favoriteFoods?.map((food, idx) => (
                    <Badge key={idx} variant="secondary">
                      {food}
                      <button
                        type="button"
                        onClick={() => removeArrayItem('favoriteFoods', idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Favorite Drinks */}
              <div className="space-y-2">
                <Label>Favorite Drinks</Label>
                <div className="flex gap-2">
                  <Input
                    value={favoriteDrinkInput}
                    onChange={(e) => setFavoriteDrinkInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addArrayItem('favoriteDrinks', favoriteDrinkInput, setFavoriteDrinkInput);
                      }
                    }}
                    placeholder="Add favorite drink"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayItem('favoriteDrinks', favoriteDrinkInput, setFavoriteDrinkInput)}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.favoriteDrinks?.map((drink, idx) => (
                    <Badge key={idx} variant="secondary">
                      {drink}
                      <button
                        type="button"
                        onClick={() => removeArrayItem('favoriteDrinks', idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  placeholder="Any special requests from the guest..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vipNotes">VIP Notes</Label>
                <Textarea
                  id="vipNotes"
                  value={formData.vipNotes}
                  onChange={(e) => setFormData({ ...formData, vipNotes: e.target.value })}
                  placeholder="VIP-specific notes, preferences, protocols..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crewNotes">Crew Notes</Label>
                <Textarea
                  id="crewNotes"
                  value={formData.crewNotes}
                  onChange={(e) => setFormData({ ...formData, crewNotes: e.target.value })}
                  placeholder="Internal notes for crew members..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? 'Saving...' : guest ? 'Update Guest' : 'Add Guest'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <CameraDialog
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handlePhotoCapture}
      />
    </>
  );
}
