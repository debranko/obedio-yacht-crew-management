/**
 * Do Not Disturb Widget - Responsive
 * Displays all active DND locations with responsive layout
 * (compact / medium / expanded)
 */

import { BellOff, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { WidgetShell } from "./widgets/widget-shell";
import { useDND } from "../hooks/useDND";
import { useSizeMode } from "../hooks/useSizeMode";
import { useAppData } from "../contexts/AppDataContext";
import { useLocations } from "../hooks/useLocations";
import { useGuests } from "../hooks/useGuests";
import { useGuestMutations } from "../hooks/useGuestMutations";
import { toast } from "sonner";
import { Location } from "../domain/locations";

interface DNDWidgetProps {
  dndList?: Location[];
}

export function DNDWidget({ dndList }: DNDWidgetProps) {
  const { dndLocations: internalDndList, count } = useDND();
  const { updateLocation: updateLocationService } = useLocations();
  const { addActivityLog } = useAppData();

  // ✅ Use React Query for guests data
  const { data: guestsData } = useGuests({ page: 1, limit: 1000 });
  const guests = (guestsData as any)?.items || [];
  const { updateGuest: updateGuestMutation } = useGuestMutations();

  const { ref, mode } = useSizeMode();

  // Use provided list or fallback to internal hook
  const data = dndList || internalDndList;

  const handleRemoveDND = async (locationId: string, locationName: string) => {
    // ✅ Find guest in this location using React Query data
    const guest = guests.find(g => g.locationId === locationId);

    try {
      // Remove DND from location
      await updateLocationService({
        id: locationId,
        doNotDisturb: false
      });

      // ✅ Remove DND from guest using mutation
      if (guest) {
        updateGuestMutation({ id: guest.id, data: { doNotDisturb: false } });
      }

      // Log activity
      if (addActivityLog) {
        addActivityLog({
          type: 'dnd',
          action: 'DND Deactivated',
          location: locationName,
          user: 'Crew (Manual)',
          details: `Do Not Disturb manually removed from ${locationName}${guest ? ` (${guest.firstName} ${guest.lastName})` : ''}`
        });
      }

      toast.success("DND Removed", {
        description: `${locationName} can now receive requests`
      });
    } catch (error) {
      toast.error("Failed to remove DND");
    }
  };

  if (data.length === 0) {
    return null;
  }

  const content = (
    <div ref={ref} className="h-full w-full">
      {/* Compact Mode - Just count */}
      {mode === "compact" && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm truncate">Active</div>
          <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
        </div>
      )}

      {/* Medium Mode - First 3 locations */}
      {mode === "medium" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="truncate">Active</div>
            <Badge variant="secondary" className="flex-shrink-0">{count}</Badge>
          </div>
          <div className="space-y-1.5">
            {data.slice(0, 3).map(loc => (
              <div
                key={loc.id}
                className="flex items-center justify-between gap-2 rounded border border-warning/20 bg-warning/5 px-2 py-1.5 hover:border-warning/40 transition-colors"
              >
                <div className="truncate text-sm font-medium flex-1 min-w-0">{loc.name}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 hover:bg-warning/10 hover:text-warning"
                  aria-label="Remove DND"
                  onClick={() => handleRemoveDND(loc.id, loc.name)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {data.length > 3 && (
              <div className="text-xs text-muted-foreground px-2">
                +{data.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Mode - Full scrollable list */}
      {mode === "expanded" && (
        <ScrollArea className="h-[220px]">
          <div className="space-y-1.5 pr-2">
            {data.map(loc => {
              // ✅ Find guest by locationId for accurate matching
              const guest = guests.find(g => g.locationId === loc.id);

              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between gap-2 rounded border border-warning/20 bg-warning/5 p-2 hover:border-warning/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{loc.name}</div>
                    {loc.floor && (
                      <div className="text-xs text-muted-foreground">{loc.floor}</div>
                    )}
                    {guest && (
                      <div className="text-xs text-muted-foreground">
                        {guest.firstName} {guest.lastName}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDND(loc.id, loc.name)}
                    className="h-8 px-3 text-xs hover:bg-warning/10 hover:text-warning flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              );
            })}
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
          <span className="text-muted-foreground">active</span>
        </span>
      }
      icon={<BellOff className="h-4 w-4 text-warning" />}
    >
      {content}
    </WidgetShell>
  );
}
