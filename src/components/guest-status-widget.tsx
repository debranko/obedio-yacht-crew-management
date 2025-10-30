/**
 * Guest Status Widget - Shows guests by cabin
 * Displays who's onboard and where they're staying
 */

import { Card } from './ui/card';
import { MapPin, Users } from 'lucide-react';
import { cn } from './ui/utils';
import { useAppData } from '../contexts/AppDataContext';
import { useMemo } from 'react';

interface GuestStatusWidgetProps {
  className?: string;
}

export function GuestStatusWidget({ 
  className
}: GuestStatusWidgetProps) {
  
  const { guests, locations } = useAppData();
  
  // Get guests with their cabin information
  const guestsWithCabins = useMemo(() => {
    return guests
      .filter(g => g.status === 'onboard' && g.locationId)
      .map(guest => {
        const location = locations.find(l => l.id === guest.locationId);
        return {
          name: `${guest.firstName} ${guest.lastName}`,
          cabin: location?.name || 'Unknown',
          photo: guest.photo,
          id: guest.id
        };
      })
      .sort((a, b) => a.cabin.localeCompare(b.cabin));
  }, [guests, locations]);
  
  const totalGuests = guestsWithCabins.length;
  
  return (
    <Card 
      className={cn(
        "p-3 h-full relative overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-muted-foreground">Guests Onboard</h3>
        </div>
        <div className="text-xs font-bold text-primary">
          {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
        </div>
      </div>

      {/* Guest List with Photos - Scrollable */}
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100% - 36px)' }}>
        {guestsWithCabins.length > 0 ? (
          guestsWithCabins.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {/* Guest Photo */}
              <div className="flex-shrink-0">
                {guest.photo ? (
                  <img 
                    src={guest.photo} 
                    alt={guest.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background">
                    <Users className="h-5 w-5 text-primary/50" />
                  </div>
                )}
              </div>
              
              {/* Guest Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{guest.name}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{guest.cabin}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No guests onboard</p>
          </div>
        )}
      </div>
    </Card>
  );
}
