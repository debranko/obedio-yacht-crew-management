/**
 * DND Guests Widget - Shows which guests have Do Not Disturb active
 * Displays guest names and their locations
 */

import { BellOff, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { WidgetShell } from "./widgets/widget-shell";
import { useDND } from "../hooks/useDND";
import { useSizeMode } from "../hooks/useSizeMode";
import { useAppData } from "../contexts/AppDataContext";

export function DNDGuestsWidget() {
  const { dndLocations, count } = useDND();
  const { guests, getGuestByLocationId } = useAppData();
  const { ref, mode } = useSizeMode();

  // Match guests with DND locations using proper foreign key relationship
  const dndGuests = dndLocations.map(location => {
    const guest = getGuestByLocationId(location.id);
    // Only include if guest has DND active and is onboard
    const validGuest = guest && guest.doNotDisturb && guest.status === 'onboard' ? guest : null;
    
    return {
      location,
      guest: validGuest,
    };
  });

  if (dndGuests.length === 0) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const content = (
    <div ref={ref} className="h-full w-full">
      {/* Compact Mode - Just count */}
      {mode === "compact" && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm truncate">Active</div>
          <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
        </div>
      )}

      {/* Medium Mode - First 3 guests */}
      {mode === "medium" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="truncate">Active</div>
            <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
          </div>
          <div className="space-y-1.5">
            {dndGuests.slice(0, 3).map(({ location, guest }) => (
              <div
                key={location.id}
                className="flex items-center gap-2 rounded border border-warning/20 bg-warning/5 px-2 py-1.5 hover:border-warning/40 transition-colors"
              >
                {guest ? (
                  <>
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      {guest.photo && <AvatarImage src={guest.photo} />}
                      <AvatarFallback className="bg-warning/10 text-warning text-[10px]">
                        {getInitials(guest.firstName, guest.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {location.name}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-warning flex-shrink-0" />
                    <div className="text-xs font-medium truncate flex-1">
                      {location.name}
                    </div>
                  </>
                )}
              </div>
            ))}
            {dndGuests.length > 3 && (
              <div className="text-xs text-muted-foreground px-2">
                +{dndGuests.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Mode - Full scrollable list */}
      {mode === "expanded" && (
        <ScrollArea className="h-[220px]">
          <div className="space-y-2 pr-2">
            {dndGuests.map(({ location, guest }) => (
              <div
                key={location.id}
                className="flex items-center gap-3 rounded border border-warning/20 bg-warning/5 p-3 hover:border-warning/40 transition-colors"
              >
                {guest ? (
                  <>
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {guest.photo && <AvatarImage src={guest.photo} />}
                      <AvatarFallback className="bg-warning/10 text-warning">
                        {getInitials(guest.firstName, guest.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {location.name}
                      </div>
                      {location.floor && (
                        <div className="text-xs text-muted-foreground">
                          {location.floor}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="text-xs border-warning/30 text-warning">
                        {guest.type.toUpperCase()}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-warning/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{location.name}</div>
                      <div className="text-sm text-muted-foreground">No guest assigned</div>
                      {location.floor && (
                        <div className="text-xs text-muted-foreground">
                          {location.floor}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );

  return (
    <WidgetShell
      title="Do Not Disturb"
      subtitle={
        <span className="flex items-center gap-1">
          <span>{count}</span>
          <span className="text-muted-foreground">{count === 1 ? 'guest' : 'guests'}</span>
        </span>
      }
      icon={<BellOff className="h-4 w-4 text-warning" />}
    >
      {content}
    </WidgetShell>
  );
}
