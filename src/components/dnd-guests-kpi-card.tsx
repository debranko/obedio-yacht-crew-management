/**
 * DND Guests KPI Card - Compact version for Guests List page
 * Shows which guests have Do Not Disturb active
 */

import { BellOff, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useDND } from "../hooks/useDND";
import { useAppData } from "../contexts/AppDataContext";

export function DNDGuestsKpiCard() {
  const { dndLocations, count } = useDND();
  const { guests, getGuestByLocationId } = useAppData();

  // Match guests with DND locations using proper foreign key relationship
  const dndGuests = dndLocations.map(location => {
    const guest = getGuestByLocationId(location.id);
    // Only include if guest has DND active and is onboard
    const validGuest = guest && guest.doNotDisturb && guest.status === 'onboard' ? guest : null;
    
    return {
      location,
      guest: validGuest,
    };
  }).filter(item => item.guest); // Only show entries with actual guests

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <Card className="p-6 hover:border-warning/30 transition-colors cursor-pointer">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <BellOff className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Do Not Disturb</p>
              <p className="text-2xl font-medium">{count}</p>
            </div>
          </div>
        </div>

        {/* Guest List */}
        {dndGuests.length > 0 ? (
          <div className="space-y-2">
            {dndGuests.slice(0, 2).map(({ location, guest }) => {
              if (!guest) return null;
              
              return (
                <div
                  key={location.id}
                  className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2"
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    {guest.photo && <AvatarImage src={guest.photo} />}
                    <AvatarFallback className="bg-warning/10 text-warning text-xs">
                      {getInitials(guest.firstName, guest.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {guest.firstName} {guest.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {location.name}
                    </div>
                  </div>
                  {(guest.type === 'vip' || guest.type === 'owner') && (
                    <Badge variant="outline" className="text-xs border-warning/30 text-warning flex-shrink-0">
                      VIP
                    </Badge>
                  )}
                </div>
              );
            })}
            
            {dndGuests.length > 2 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{dndGuests.length - 2} more guest{dndGuests.length - 2 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No guests have DND active
          </p>
        )}
      </div>
    </Card>
  );
}
