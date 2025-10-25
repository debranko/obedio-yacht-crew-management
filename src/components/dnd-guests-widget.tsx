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
import { useEffect, useState } from "react";

export function DNDGuestsWidget() {
  const { dndLocations, count } = useDND();
  const { guests, getGuestByLocationId } = useAppData();
  const { ref, mode } = useSizeMode();
  const [pulsingLocations, setPulsingLocations] = useState<Set<string>>(new Set());
  const [lastCount, setLastCount] = useState(count);

  // Track new DND activations and add pulsing effect
  useEffect(() => {
    if (count > lastCount) {
      // New DND activated - find which locations are new
      const newLocations = new Set(dndLocations.map(loc => loc.id));
      setPulsingLocations(newLocations);

      // Remove pulsing after 5 minutes
      const timer = setTimeout(() => {
        setPulsingLocations(new Set());
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(timer);
    }
    setLastCount(count);
  }, [count, lastCount, dndLocations]);

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const content = (
    <div ref={ref} className="h-full w-full">
      {/* Show empty state when no DND active */}
      {dndGuests.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No active DND
        </div>
      ) : (
        <>
          {/* Compact Mode - Just count */}
          {mode === "compact" && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm truncate">Active</div>
              <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
            </div>
          )}

          {/* Medium Mode - Show up to 6 guests */}
          {mode === "medium" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-warning">Active DND</div>
                <Badge variant="destructive" className="flex-shrink-0 bg-warning text-warning-foreground font-bold">
                  {count}
                </Badge>
              </div>
              <ScrollArea className="h-[140px]">
                <div className="space-y-2 pr-2">
                  {dndGuests.slice(0, 6).map(({ location, guest }) => (
                    <div
                      key={location.id}
                      className={`flex items-center gap-2.5 rounded-md border-2 border-warning/30 bg-warning/10 px-3 py-2 hover:border-warning/50 transition-all ${
                        pulsingLocations.has(location.id) ? 'animate-pulse border-warning/50' : ''
                      }`}
                    >
                      {guest ? (
                        <>
                          <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-warning/30">
                            {guest.photo && <AvatarImage src={guest.photo} />}
                            <AvatarFallback className="bg-warning/20 text-warning font-semibold text-xs">
                              {getInitials(guest.firstName, guest.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {guest.firstName} {guest.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {location.name}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-warning/20 flex items-center justify-center ring-2 ring-warning/30">
                            <User className="h-4 w-4 text-warning" />
                          </div>
                          <div className="text-sm font-semibold truncate flex-1">
                            {location.name}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {dndGuests.length > 6 && (
                    <div className="text-sm text-warning font-medium text-center py-1">
                      +{dndGuests.length - 6} more guests
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Expanded Mode - Full scrollable list */}
          {mode === "expanded" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-warning">Active Do Not Disturb</div>
                <Badge variant="destructive" className="flex-shrink-0 bg-warning text-warning-foreground font-bold text-sm px-3 py-1">
                  {count} {count === 1 ? 'GUEST' : 'GUESTS'}
                </Badge>
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-3 pr-3">
                  {dndGuests.map(({ location, guest }) => (
                    <div
                      key={location.id}
                      className={`flex items-center gap-3 rounded-lg border-2 border-warning/40 bg-warning/15 p-3 hover:border-warning/60 transition-all shadow-sm ${
                        pulsingLocations.has(location.id) ? 'animate-pulse border-warning/60 shadow-warning/20' : ''
                      }`}
                    >
                      {guest ? (
                        <>
                          <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-warning/40">
                            {guest.photo && <AvatarImage src={guest.photo} />}
                            <AvatarFallback className="bg-warning/25 text-warning font-bold">
                              {getInitials(guest.firstName, guest.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base truncate">
                              {guest.firstName} {guest.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground truncate font-medium">
                              {location.name}
                            </div>
                            {location.floor && (
                              <div className="text-xs text-muted-foreground">
                                {location.floor}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="text-xs border-warning/50 text-warning bg-warning/10 font-semibold">
                              {guest.type.toUpperCase()}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 flex-shrink-0 rounded-full bg-warning/25 flex items-center justify-center ring-2 ring-warning/40">
                            <User className="h-6 w-6 text-warning" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-base truncate">{location.name}</div>
                            <div className="text-sm text-muted-foreground font-medium">No guest assigned</div>
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
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <WidgetShell
      title="Do Not Disturb"
      subtitle={
        count > 0 ? (
          <span className="flex items-center gap-1 text-warning font-semibold">
            <span>{count}</span>
            <span>{count === 1 ? 'guest' : 'guests'}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">No active</span>
        )
      }
      icon={<BellOff className={`h-5 w-5 text-warning ${pulsingLocations.size > 0 ? 'animate-pulse' : ''}`} />}
      className={count > 0 ? "ring-2 ring-warning/30 shadow-lg shadow-warning/10" : ""}
    >
      {content}
    </WidgetShell>
  );
}
