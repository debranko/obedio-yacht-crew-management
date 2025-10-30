import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Calendar, MapPin, Mail, Phone, AlertTriangle, Utensils } from 'lucide-react';
import type { Guest } from '../contexts/AppDataContext';

interface GuestCardViewProps {
  guests: Guest[];
  onView: (guest: Guest) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

export function GuestCardView({ guests, onView, onEdit, onDelete }: GuestCardViewProps) {
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
      case 'primary':
        return 'Primary Guest';
      case 'partner':
        return 'Partner';
      case 'family':
        return 'Family';
      case 'child':
        return 'Child';
      case 'vip':
        return 'VIP';
      case 'owner':
        return 'Owner';
      case 'charter':
        return 'Charter';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (guests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No guests found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {guests.map((guest) => (
        <Card 
          key={guest.id} 
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          onClick={() => onView(guest)}
        >
          <CardContent className="p-6 flex flex-col flex-1">
            {/* Header: Avatar + Name + Status */}
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={guest.photo} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(guest.firstName, guest.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {guest.firstName} {guest.lastName}
                </h3>
                {guest.preferredName && (
                  <p className="text-sm text-muted-foreground">
                    "{guest.preferredName}"
                  </p>
                )}
                <div className="flex gap-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(guest.status)} className="text-xs">
                    {getStatusLabel(guest.status)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getGuestTypeLabel(guest.type)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4 text-sm">
              {/* Cabin */}
              {guest.cabin && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{guest.cabin}</span>
                </div>
              )}

              {/* Check-in */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  {new Date(guest.checkInDate).toLocaleDateString()}
                  {guest.checkInTime && ` at ${guest.checkInTime}`}
                </span>
              </div>

              {/* Contact */}
              {guest.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{guest.email}</span>
                </div>
              )}

              {guest.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{guest.phone}</span>
                </div>
              )}
            </div>

            {/* Allergies & Dietary */}
            {(guest.allergies.length > 0 || guest.dietaryRestrictions.length > 0) && (
              <div className="space-y-2 mb-4 pt-4 border-t border-border">
                {guest.allergies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Allergies</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {guest.allergies.map((allergy, idx) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {guest.dietaryRestrictions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Utensils className="h-3 w-3" />
                      <span>Dietary</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {guest.dietaryRestrictions.map((dietary, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {dietary}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIP or Special Notes */}
            {(guest.vipNotes || guest.specialRequests) && (
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                <div className="font-medium text-xs text-muted-foreground mb-1">Notes</div>
                <div className="text-foreground line-clamp-2">
                  {guest.vipNotes || guest.specialRequests}
                </div>
              </div>
            )}

            {/* Spacer to push actions to bottom */}
            <div className="flex-1"></div>

            {/* Actions - Always at bottom */}
            <div className="flex gap-2 pt-4 mt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(guest);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(guest);
                }}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
