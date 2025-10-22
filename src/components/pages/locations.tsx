/**
 * Locations Page - Management of areas/zones within a single yacht or villa
 * For Interior department to track different locations within the property
 */

import { useState, useRef } from "react";
import { useLocations } from "../../hooks/useLocations";
import { useGuests } from "../../hooks/useGuests";
import { useGuestMutations } from "../../hooks/useGuestMutations";
import { useDND } from "../../hooks/useDND";
import { useAppData } from "../../contexts/AppDataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Location, LOCATION_TYPES, LOCATION_STATUS_LABELS } from "../../domain/locations";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Plus, MapPin, Smartphone, Edit2, Trash2, Search, Image as ImageIcon, X, Upload, BellOff, Bell, Users } from "lucide-react";
import { Switch } from "../ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { DNDWidget } from "../dnd-widget";

export function LocationsPage() {
  const { locations, isLoading, createLocation, updateLocation, deleteLocation } = useLocations();
  const { dndLocations, hasDND } = useDND();
  
  // Use React Query for guests (real-time updates from database)
  const { data: guestsData } = useGuests({ page: 1, limit: 1000 });
  const guests = (guestsData as any)?.items || [];
  
  // Use React Query mutations for database updates
  const { updateGuest: updateGuestMutation } = useGuestMutations();
  
  const { addActivityLog, getGuestByLocationId } = useAppData();
  const { user } = useAuth();
  
  // Get current user role from auth context
  const currentUserRole = user?.role || "stewardess";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Permission check - only Admin and ETO can delete locations
  const canDeleteLocation = currentUserRole === "admin" || currentUserRole === "eto";

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "common" as Location["type"],
    description: "",
    floor: "",
    status: "active" as Location["status"],
    notes: "",
    smartButtonId: "", // Smart button assignment
    assignedGuestId: "", // Guest assignment (new)
    doNotDisturb: false // Do Not Disturb status
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "common",
      description: "",
      floor: "",
      status: "active",
      notes: "",
      smartButtonId: "",
      assignedGuestId: "",
      doNotDisturb: false
    });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a location name");
      return;
    }

    try {
      await createLocation({
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        floor: formData.floor.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined
      });
      
      toast.success("Location created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to create location");
    }
  };

  // Mock available floors/decks - will be replaced with settings from context
  const availableFloors = [
    "Sun Deck",
    "Upper Deck",
    "Main Deck",
    "Lower Deck"
  ];

  // Mock smart buttons - will be replaced with real data from Device Manager
  const mockSmartButtons = [
    { id: "btn-001", name: "Owner's Stateroom Button", location: "Owner's Stateroom" },
    { id: "btn-002", name: "VIP Cabin Button", location: "VIP Cabin" },
    { id: "btn-003", name: "Main Salon Button", location: "Main Salon" },
    { id: "btn-004", name: "Sun Deck Lounge Button", location: "Sun Deck Lounge" },
    { id: "btn-005", name: "Gym Button", location: "Gym" },
    { id: "btn-006", name: "Dining Room Button", location: "Dining Room" },
    { id: "btn-007", name: "Music Salon Button", location: "Music Salon" },
    { id: "btn-008", name: "VIP Office Button", location: "VIP Office" },
    { id: "btn-009", name: "Conference Room Button", location: "Conference Room" },
    { id: "btn-010", name: "Welcome Salon Button", location: "Welcome Salon" },
    { id: "btn-011", name: "External Salon Button", location: "External Salon" },
    { id: "btn-012", name: "Cabin 6 Button", location: "Cabin 6" },
    { id: "unassigned-1", name: "Unassigned Button #1", location: null },
    { id: "unassigned-2", name: "Unassigned Button #2", location: null },
  ];

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    // Find guest currently assigned to this location
    const currentGuest = getGuestByLocationId(location.id);
    setFormData({
      name: location.name,
      type: location.type,
      description: location.description || "",
      floor: location.floor || "",
      status: location.status,
      notes: location.notes || "",
      smartButtonId: location.smartButtonId || "",
      assignedGuestId: currentGuest?.id || "",
      doNotDisturb: location.doNotDisturb || false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedLocation) return;
    if (!formData.name.trim()) {
      toast.error("Please enter a location name");
      return;
    }

    // Find selected button name
    const selectedButton = mockSmartButtons.find(b => b.id === formData.smartButtonId);

    // Find guest currently assigned to this location
    const currentGuest = getGuestByLocationId(selectedLocation.id);
    const previousGuestId = currentGuest?.id;
    const newGuestId = formData.assignedGuestId;

    try {
      // Handle guest assignment changes
      if (previousGuestId !== newGuestId) {
        // Remove previous guest from this location
        if (previousGuestId) {
          updateGuestMutation({ id: previousGuestId, data: { locationId: undefined } });
        }
        
        // Assign new guest to this location
        if (newGuestId) {
          updateGuestMutation({ id: newGuestId, data: { locationId: selectedLocation.id } });
        }
        
        // Log guest assignment change
        if (addActivityLog) {
          const newGuest = guests.find(g => g.id === newGuestId);
          const previousGuest = guests.find(g => g.id === previousGuestId);
          
          if (newGuest && previousGuest) {
            addActivityLog({
              type: 'guest',
              action: 'Guest Reassigned',
              location: selectedLocation.name,
              user: 'Crew (Manual)',
              details: `${previousGuest.firstName} ${previousGuest.lastName} moved out, ${newGuest.firstName} ${newGuest.lastName} moved in`
            });
          } else if (newGuest) {
            addActivityLog({
              type: 'guest',
              action: 'Guest Assigned',
              location: selectedLocation.name,
              user: 'Crew (Manual)',
              details: `${newGuest.firstName} ${newGuest.lastName} assigned to ${selectedLocation.name}`
            });
          } else if (previousGuest) {
            addActivityLog({
              type: 'guest',
              action: 'Guest Unassigned',
              location: selectedLocation.name,
              user: 'Crew (Manual)',
              details: `${previousGuest.firstName} ${previousGuest.lastName} removed from ${selectedLocation.name}`
            });
          }
        }
      }

      // Update location details
      await updateLocation({
        id: selectedLocation.id,
        name: formData.name.trim(),
        type: formData.type,
        description: formData.description.trim() || undefined,
        floor: formData.floor.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        smartButtonId: formData.smartButtonId || undefined,
        doNotDisturb: formData.doNotDisturb,
      });

      // Update guest DND status if guest is in this location
      const assignedGuest = newGuestId ? guests.find(g => g.id === newGuestId) : null;
      if (assignedGuest) {
        updateGuestMutation({ id: assignedGuest.id, data: { doNotDisturb: formData.doNotDisturb } });
      }

      // Log DND activity
      if (addActivityLog && formData.doNotDisturb !== selectedLocation.doNotDisturb) {
        addActivityLog({
          type: 'dnd',
          action: formData.doNotDisturb ? 'DND Activated' : 'DND Deactivated',
          location: selectedLocation.name,
          user: 'Crew (Manual)',
          details: `Do Not Disturb ${formData.doNotDisturb ? 'enabled' : 'disabled'} for ${selectedLocation.name}${assignedGuest ? ` (${assignedGuest.firstName} ${assignedGuest.lastName})` : ''}`
        });
      }
      
      toast.success("Location updated successfully");
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to update location");
    }
  };

  const handleDelete = () => {
    if (!selectedLocation) return;
    
    if (!canDeleteLocation) {
      toast.error("You don't have permission to delete locations");
      return;
    }

    // Open confirmation dialog instead of deleting immediately
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedLocation) return;

    try {
      await deleteLocation(selectedLocation.id);
      toast.success("Location deleted successfully");
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
      resetForm();
    } catch (error) {
      toast.error("Failed to delete location");
    }
  };

  const handleEditImage = (location: Location) => {
    setSelectedLocation(location);
    setImageUrl(location.image || "");
    setUploadedImage(null);
    setUploadedFile(null);
    setIsImageDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Store the file object for later upload
    setUploadedFile(file);
    setImageUrl(""); // Clear URL when file is uploaded

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData); // Preview only
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = async () => {
    if (!selectedLocation) return;

    try {
      let finalImageUrl = imageUrl;

      // If a file was uploaded, send it to the backend first
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('image', uploadedFile);

        const token = localStorage.getItem('obedio-auth-token');
        const uploadResponse = await fetch('http://localhost:8080/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.message || 'Failed to upload image');
        }

        const uploadData = await uploadResponse.json();
        // Get the URL from the upload response
        finalImageUrl = `http://localhost:8080${uploadData.data.url}`;
        console.log('✅ Image uploaded:', finalImageUrl);
      }

      // Update location with the image URL
      await updateLocation({
        id: selectedLocation.id,
        image: finalImageUrl || undefined
      });

      toast.success(`Image ${finalImageUrl ? 'updated' : 'removed'} for ${selectedLocation.name}`);
      setIsImageDialogOpen(false);
      setImageUrl("");
      setUploadedImage(null);
      setUploadedFile(null);
      setSelectedLocation(null);
    } catch (error: any) {
      console.error('❌ Failed to update image:', error);
      toast.error(error.message || "Failed to update image");
    }
  };

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.floor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group locations by deck and sort DND locations first
  const locationsByFloor = filteredLocations.reduce((acc, location) => {
    const floor = location.floor || "No Deck";
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(location);
    return acc;
  }, {} as Record<string, Location[]>);

  // Sort locations within each floor: DND first, then alphabetically
  Object.keys(locationsByFloor).forEach(floor => {
    locationsByFloor[floor].sort((a, b) => {
      // DND locations come first
      if (a.doNotDisturb && !b.doNotDisturb) return -1;
      if (!a.doNotDisturb && b.doNotDisturb) return 1;
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
  });

  // Sort decks in a logical order (Sun Deck, Bridge Deck, Owner's Deck, Main Deck, Lower Deck, Tank Deck, etc.)
  const floorOrder = ["Sun Deck", "Bridge Deck", "Owner's Deck", "Main Deck", "Lower Deck", "Tank Deck", "No Deck"];
  const sortedFloors = Object.keys(locationsByFloor).sort((a, b) => {
    const aIndex = floorOrder.indexOf(a);
    const bIndex = floorOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  // Note: dndLocations now comes from useDND() hook

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading locations...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-9 space-y-6">
        {/* DND Alert Widget */}
        {hasDND && (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <BellOff className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-destructive">Do Not Disturb Active</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {dndLocations.length} location{dndLocations.length !== 1 ? 's' : ''} currently blocking service requests
                </p>
              </div>
            </div>

            {/* DND Locations List */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dndLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <MapPin className="h-4 w-4 text-destructive flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{location.name}</p>
                      {location.floor && (
                        <p className="text-xs text-muted-foreground truncate">{location.floor}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(location)}
                    className="flex-shrink-0 h-8 px-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage areas and zones within your property
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Locations Grid - Grouped by Floor/Deck */}
      <div className="space-y-8">
        {sortedFloors.map((floor, floorIndex) => (
          <div key={floor}>
            {/* Floor Header with Separator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <h3 className="text-sm font-medium text-muted-foreground px-3">{floor}</h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Locations Grid for this Floor */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locationsByFloor[floor].map((location) => (
                <Card key={location.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image Section */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {location.image ? (
                      <ImageWithFallback
                        src={location.image}
                        alt={location.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Header with Name and DND Badge */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h3 className="truncate flex-1">{location.name}</h3>
                        {location.doNotDisturb && (
                          <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0 bg-warning/20 text-warning border-warning">
                            <BellOff className="h-3 w-3" />
                            DND
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Guest Assignment - Show only for cabin types */}
                    {(() => {
                      // Only show guest info for cabin types (not common areas)
                      const isCabin = ['master_suite', 'vip_suite', 'guest_cabin', 'crew_cabin', 'cabin'].includes(location.type);
                      if (!isCabin) return null;
                      
                      // Find all guests in this cabin and prefer owner > vip > partner
                      const guestsAtLocation = guests.filter(g => g.locationId === location.id);
                      let assignedGuest = null;
                      
                      if (guestsAtLocation.length > 0) {
                        // Sort by priority: owner > vip > partner > family > guest
                        const priorityOrder = { owner: 1, vip: 2, partner: 3, family: 4, guest: 5 };
                        guestsAtLocation.sort((a, b) => {
                          const aPriority = priorityOrder[a.type as keyof typeof priorityOrder] || 10;
                          const bPriority = priorityOrder[b.type as keyof typeof priorityOrder] || 10;
                          return aPriority - bPriority;
                        });
                        assignedGuest = guestsAtLocation[0];  // Take highest priority guest
                      } else {
                        // Fallback to context helper
                        assignedGuest = getGuestByLocationId(location.id);
                      }
                      
                      if (assignedGuest) {
                        return (
                          <div className="bg-primary/5 rounded-md p-2.5 border border-primary/20">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {assignedGuest.firstName} {assignedGuest.lastName}
                                </p>
                                {assignedGuest.preferredName && (
                                  <p className="text-xs text-muted-foreground">
                                    ({assignedGuest.preferredName})
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="bg-muted/30 rounded-md p-2.5 border border-dashed border-muted-foreground/30">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                              <p className="text-sm text-muted-foreground">No guest assigned</p>
                            </div>
                          </div>
                        );
                      }
                    })()}

                    {/* Smart Button Assignment */}
                    {location.smartButtonId && (
                      <div className="bg-primary/5 rounded-md p-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Smartphone className="h-3.5 w-3.5 text-primary" />
                          <span className="text-muted-foreground">Smart Button:</span>
                          <span className="font-medium text-foreground">{location.smartButtonId}</span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(location)}
                        className="flex-1"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <h3>No locations found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Start by creating your first location"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
        </div>
      )}

      {/* Create Location Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Location</DialogTitle>
            <DialogDescription>
              Add a new location to your property
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Owner's Stateroom, Main Salon"
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this location"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="floor">Floor/Deck</Label>
              <Select value={formData.floor || "none"} onValueChange={(value: string) => setFormData({ ...formData, floor: value === "none" ? "" : value })}>
                <SelectTrigger id="floor">
                  <SelectValue placeholder="Select floor/deck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No floor/deck</SelectItem>
                  {availableFloors.map((floor) => (
                    <SelectItem key={floor} value={floor}>
                      {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Configure available floors/decks in Settings
              </p>
            </div>

            <div>
              <Label htmlFor="smartButton">Smart Button (Optional)</Label>
              <Select value={formData.smartButtonId || "none"} onValueChange={(value: string) => setFormData({ ...formData, smartButtonId: value === "none" ? "" : value })}>
                <SelectTrigger id="smartButton">
                  <SelectValue placeholder="No button assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No button assigned</SelectItem>
                  {mockSmartButtons.map((button) => (
                    <SelectItem key={button.id} value={button.id}>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3 w-3" />
                        <span>{button.name}</span>
                        {button.location && (
                          <span className="text-xs text-muted-foreground">({button.location})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Assign a smart call button to this location (synced with Device Manager)
              </p>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or instructions"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog - Redesigned */}
      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsEditDialogOpen(false);
            setSelectedLocation(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update location information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Location Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Owner's Stateroom, Main Salon"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="edit-type" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger id="edit-status" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this location"
                  rows={2}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="edit-floor">Floor/Deck</Label>
                <Select value={formData.floor || "none"} onValueChange={(value: string) => setFormData({ ...formData, floor: value === "none" ? "" : value })}>
                  <SelectTrigger id="edit-floor" className="mt-1.5">
                    <SelectValue placeholder="Select floor/deck" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No floor/deck</SelectItem>
                    {availableFloors.map((floor) => (
                      <SelectItem key={floor} value={floor}>
                        {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure available floors/decks in Settings
                </p>
              </div>
            </div>

            {/* Guest Assignment Section */}
            <div className="border-t border-border pt-4 space-y-4">
              <h4 className="text-sm font-medium">Guest Assignment</h4>
              
              <div>
                <Label htmlFor="edit-guest">Assign Guest to Location</Label>
                <Select value={formData.assignedGuestId || "none"} onValueChange={(value: string) => setFormData({ ...formData, assignedGuestId: value === "none" ? "" : value })}>
                  <SelectTrigger id="edit-guest" className="mt-1.5">
                    <SelectValue placeholder="No guest assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>No guest assigned</span>
                      </div>
                    </SelectItem>
                    {guests
                      .filter(g => g.status === 'onboard')
                      .map((guest) => {
                        const currentLocation = guest.locationId ? locations.find(l => l.id === guest.locationId) : null;
                        const isInThisLocation = guest.locationId === selectedLocation?.id;
                        const isInAnotherLocation = guest.locationId && !isInThisLocation;
                        
                        return (
                          <SelectItem key={guest.id} value={guest.id}>
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>{guest.firstName} {guest.lastName}</span>
                              {guest.preferredName && (
                                <span className="text-xs text-muted-foreground">({guest.preferredName})</span>
                              )}
                              {isInAnotherLocation && currentLocation && (
                                <span className="text-xs text-warning">• {currentLocation.name}</span>
                              )}
                              {isInThisLocation && (
                                <span className="text-xs text-success">• Current</span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
                {formData.assignedGuestId && formData.assignedGuestId !== "none" && (() => {
                  const selectedGuest = guests.find(g => g.id === formData.assignedGuestId);
                  return selectedGuest ? (
                    <p className="text-xs text-success mt-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {selectedGuest.firstName} {selectedGuest.lastName} will be assigned to this location
                    </p>
                  ) : null;
                })()}
                {(!formData.assignedGuestId || formData.assignedGuestId === "none") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Assign a guest to this cabin/location
                  </p>
                )}
              </div>
            </div>

            {/* Device Assignment Section */}
            <div className="border-t border-border pt-4 space-y-4">
              <h4 className="text-sm font-medium">Device Assignment</h4>
              
              <div>
                <Label htmlFor="edit-smartButton">Smart Button (Optional)</Label>
                <Select value={formData.smartButtonId || "none"} onValueChange={(value: string) => setFormData({ ...formData, smartButtonId: value === "none" ? "" : value })}>
                  <SelectTrigger id="edit-smartButton" className="mt-1.5">
                    <SelectValue placeholder="No button assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No button assigned</SelectItem>
                    {mockSmartButtons.map((button) => (
                      <SelectItem key={button.id} value={button.id}>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3 w-3" />
                          <span>{button.name}</span>
                          {button.location && button.location !== selectedLocation?.name && (
                            <span className="text-xs text-muted-foreground">({button.location})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.smartButtonId && formData.smartButtonId !== "none" && (
                  <p className="text-xs text-success mt-2 flex items-center gap-1">
                    <Smartphone className="h-3 w-3" />
                    {mockSmartButtons.find(b => b.id === formData.smartButtonId)?.name} assigned
                  </p>
                )}
                {(!formData.smartButtonId || formData.smartButtonId === "none") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Assign a smart call button to this location
                  </p>
                )}
              </div>
            </div>

            {/* DND Status (Read-Only Display) */}
            {selectedLocation?.doNotDisturb && (
              <div className="border-t border-border pt-4">
                <div className="rounded-md bg-warning/10 border border-warning/30 p-3">
                  <div className="flex items-center gap-2">
                    <BellOff className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-sm font-medium text-warning">Guest Privacy Mode Active</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Guest activated Do Not Disturb from their room. Service requests will still be received and visible to crew.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or instructions"
                  rows={2}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 border-t border-border pt-4">
            <div className="flex-1 flex justify-start">
              {canDeleteLocation && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Location
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  handleEditImage(selectedLocation!);
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Edit Image
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog 
        open={isImageDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsImageDialogOpen(false);
            setImageUrl('');
            setUploadedImage(null);
            setSelectedLocation(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLocation?.image ? 'Edit' : 'Add'} Location Image
            </DialogTitle>
            <DialogDescription>
              {selectedLocation ? `Set image for ${selectedLocation.name}` : 'Update location image'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Image Preview */}
            {selectedLocation?.image && !uploadedImage && (
              <div className="space-y-2">
                <Label>Current Image</Label>
                <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={selectedLocation.image}
                    alt={selectedLocation.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Upload Options */}
            <div className="space-y-3">
              <Label>Upload Image</Label>
              
              {/* File Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-dashed gap-3"
              >
                <Upload className="h-6 w-6" />
                <div className="text-left">
                  <p>Choose Image File</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, or WebP (max 5MB)</p>
                </div>
              </Button>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter URL</span>
                </div>
              </div>

              {/* Image URL Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="image-url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setUploadedImage(null); // Clear uploaded image when URL is entered
                    }}
                    disabled={!!uploadedImage}
                    className="flex-1"
                  />
                  {imageUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setImageUrl('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste image URL from Unsplash or other hosting service
                </p>
              </div>
            </div>

            {/* Uploaded/URL Image Preview */}
            {(uploadedImage || (imageUrl && imageUrl !== selectedLocation?.image)) && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={uploadedImage || imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Suggestions */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-start gap-2">
                <ImageIcon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="text-foreground mb-1">Image Tips:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Upload your own photos or use URLs from Unsplash</li>
                    <li>Images appear in Service Requests when guests call from this location</li>
                    <li>Recommended size: 1920×1080 or similar landscape ratio</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImageDialogOpen(false);
                setImageUrl('');
                setUploadedImage(null);
                setSelectedLocation(null);
              }}
            >
              Cancel
            </Button>
            {selectedLocation?.image && (
              <Button
                variant="outline"
                onClick={() => {
                  setImageUrl('');
                  setUploadedImage(null);
                  handleSaveImage();
                }}
              >
                Remove Image
              </Button>
            )}
            <Button
              onClick={handleSaveImage}
              disabled={!uploadedImage && !imageUrl}
            >
              Save Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning if location has guests */}
            {selectedLocation?.guests && selectedLocation.guests.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive mb-1">Warning: Location has assigned guests</p>
                    <p className="text-muted-foreground">
                      This location currently has {selectedLocation.guests.length} guest(s) assigned. 
                      Deleting it will remove these assignments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning if location has smart button */}
            {selectedLocation?.smartButtonId && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                <div className="flex items-start gap-2">
                  <Smartphone className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-warning mb-1">Smart Button Assigned</p>
                    <p className="text-muted-foreground">
                      This location has smart button "{selectedLocation.smartButtonId}" assigned.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>

      {/* Sidebar - DND Widget */}
      <div className="lg:col-span-3 space-y-6">
        <DNDWidget />
      </div>
    </div>
  );
}
