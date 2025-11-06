import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  Calendar,
  MapPin,
  Globe,
  Languages,
  FileText,
  AlertTriangle,
  Utensils,
  ThumbsDown,
  Heart,
  Wine,
  Cake,
  User,
  Phone,
  Mail,
  Briefcase,
} from 'lucide-react';
import type { Guest } from '../contexts/AppDataContext';

interface GuestDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  onEdit?: (guest: Guest) => void;
}

export function GuestDetailsDialog({ open, onOpenChange, guest, onEdit }: GuestDetailsDialogProps) {
  if (!guest) return null;

  const getStatusBadgeVariant = (status: Guest['status']) => {
    switch (status) {
      case 'onboard':
        return 'default';
      case 'expected':
        return 'secondary';
      case 'departed':
        return 'outline';
    }
  };

  const getStatusLabel = (status: Guest['status']) => {
    switch (status) {
      case 'onboard':
        return 'Onboard';
      case 'expected':
        return 'Expected';
      case 'departed':
        return 'Departed';
    }
  };

  const getGuestTypeLabel = (type: Guest['type']) => {
    switch (type) {
      case 'guest':
        return 'Guest';
      case 'partner':
        return 'Partner';
      case 'family':
        return 'Family';
      case 'vip':
        return 'VIP';
      case 'owner':
        return 'Owner';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Guest Details</DialogTitle>
        </DialogHeader>

        {/* Guest Header */}
        <div className="flex items-start gap-6 pb-6 border-b border-border">
          <Avatar className="h-24 w-24">
            <AvatarImage src={guest.photo} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {getInitials(guest.firstName, guest.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-2xl mb-1">
              {guest.firstName} {guest.lastName}
            </h2>
            {guest.preferredName && (
              <p className="text-muted-foreground mb-2">Preferred: "{guest.preferredName}"</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusBadgeVariant(guest.status)}>
                {getStatusLabel(guest.status)}
              </Badge>
              <Badge variant="outline">{getGuestTypeLabel(guest.type)}</Badge>
            </div>
          </div>

          <Button onClick={() => onEdit?.(guest)}>Edit Guest</Button>
        </div>

        {/* Basic Information Card */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h3 className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guest.nationality && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Nationality</div>
                <div className="font-medium">{guest.nationality}</div>
              </div>
            )}

            {guest.languages?.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Languages</div>
                <div className="font-medium">{guest.languages.join(', ')}</div>
              </div>
            )}

            {guest.passportNumber && (
              <div className="space-y-1 md:col-span-2">
                <div className="text-sm text-muted-foreground">Passport Number</div>
                <div className="font-mono font-medium">{guest.passportNumber}</div>
              </div>
            )}
          </div>
        </div>

        {/* Accommodation Card */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-4">
          <h3 className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Accommodation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guest.cabin && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Cabin</div>
                <div className="font-medium">{guest.cabin}</div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Check-in</div>
              <div className="font-medium">
                {formatDate(guest.checkInDate)}
              </div>
              {guest.checkInTime && (
                <div className="text-sm text-muted-foreground">{guest.checkInTime}</div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Check-out</div>
              <div className="font-medium">
                {formatDate(guest.checkOutDate)}
              </div>
              {guest.checkOutTime && (
                <div className="text-sm text-muted-foreground">{guest.checkOutTime}</div>
              )}
            </div>

            {guest.specialOccasion && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Special Occasion</div>
                <div className="font-medium flex items-center gap-2">
                  <Cake className="h-4 w-4 text-primary" />
                  {guest.specialOccasion}
                </div>
                {guest.specialOccasionDate && (
                  <div className="text-sm text-muted-foreground">{formatDate(guest.specialOccasionDate)}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dietary Information Card */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Dietary Information
          </h3>

          {/* Allergies - Critical Alert */}
          {guest.allergies?.length > 0 && (
            <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div className="font-medium text-destructive">Allergies (CRITICAL)</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {guest.allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="destructive" className="text-sm px-3 py-1">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dietary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guest.dietaryRestrictions?.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Dietary Restrictions</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guest.dietaryRestrictions.map((dietary, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {dietary}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {guest.foodDislikes?.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Food Dislikes</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guest.foodDislikes.map((dislike, idx) => (
                    <Badge key={idx} variant="outline" className="text-sm">
                      {dislike}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {guest.favoriteFoods?.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Favorite Foods</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guest.favoriteFoods.map((food, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {food}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {guest.favoriteDrinks?.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wine className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">Favorite Drinks</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {guest.favoriteDrinks.map((drink, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {drink}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Requests */}
        {(guest.specialRequests || guest.vipNotes || guest.crewNotes) && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes & Requests
            </h3>

            <div className="space-y-3">
              {guest.specialRequests && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">Special Requests</div>
                  <p className="text-muted-foreground">{guest.specialRequests}</p>
                </div>
              )}

              {guest.vipNotes && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <div className="font-medium text-sm text-primary mb-2">VIP Notes</div>
                  <p>{guest.vipNotes}</p>
                </div>
              )}

              {guest.crewNotes && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">Crew Notes</div>
                  <p className="text-muted-foreground">{guest.crewNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Person */}
        {guest.contactPerson && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contact Person
            </h3>
            <div className="bg-muted/30 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{guest.contactPerson.name}</div>
                  <div className="text-sm text-muted-foreground">{guest.contactPerson.role}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">{guest.contactPerson.phone}</div>
                </div>

                {guest.contactPerson.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">{guest.contactPerson.email}</div>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground pt-3 border-t border-border">
                For inquiries or communications regarding this guest, please contact the designated person above.
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
          <div>Created by {guest.createdBy} on {formatDate(guest.createdAt)}</div>
          <div>Last updated {formatDate(guest.updatedAt)}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
