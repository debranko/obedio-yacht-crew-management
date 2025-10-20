/**
 * Guest Status Widget - Advanced
 * Shows guest onboard status, count, and service mode
 */

import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Users, UserX, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from './ui/utils';

interface GuestStatusWidgetProps {
  className?: string;
  guestsOnboard: boolean;
  guestCount: number;
  expectedGuests?: number;
  expectedArrival?: string; // e.g., "Tomorrow 14:00" or "In 2 days"
  onToggle?: (onboard: boolean) => void;
}

export function GuestStatusWidget({ 
  className, 
  guestsOnboard = true, 
  guestCount = 0,
  expectedGuests = 0,
  expectedArrival,
  onToggle
}: GuestStatusWidgetProps) {
  
  const serviceMode = guestsOnboard ? 'Full Service' : 'Maintenance Mode';
  const crewRequirement = guestsOnboard ? '24/7 Coverage' : 'Skeleton Crew';
  
  return (
    <Card 
      className={cn(
        "p-4 h-full relative overflow-hidden cursor-pointer transition-all hover:shadow-lg",
        className
      )}
      onClick={() => onToggle?.(!guestsOnboard)}
    >
      {/* Background gradient */}
      <div 
        className={cn(
          "absolute inset-0 opacity-5 transition-opacity",
          guestsOnboard 
            ? "bg-gradient-to-br from-green-500 to-emerald-500" 
            : "bg-gradient-to-br from-gray-400 to-gray-500"
        )}
      />
      
      {/* Content - Compact Layout */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header with Status Indicator */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {guestsOnboard ? (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
            )}
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Guest Status</h3>
          </div>
          {guestsOnboard ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {/* Main Status - Compact */}
        <div className="flex items-center gap-3 mb-3">
          {/* Icon - Smaller */}
          <div 
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
              guestsOnboard 
                ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {guestsOnboard ? (
              <Users className="h-6 w-6" />
            ) : (
              <UserX className="h-6 w-6" />
            )}
          </div>

          {/* Status Text - Compact */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate">
              {guestsOnboard ? 'Guests Onboard' : 'No Guests'}
            </h2>
            {guestsOnboard && guestCount > 0 && (
              <p className="text-2xl font-bold text-primary leading-tight">
                {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}
              </p>
            )}
          </div>
        </div>

        {/* Service Mode Info - Compact Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs flex-1">
          {/* Expected Arrivals or Service Mode */}
          {!guestsOnboard && expectedGuests > 0 ? (
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-muted-foreground font-medium">Expected</span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-sm text-primary">{expectedGuests}</span>
                <span className="font-semibold">{expectedGuests === 1 ? 'guest' : 'guests'}</span>
              </div>
              {expectedArrival && (
                <span className="text-[10px] text-muted-foreground">{expectedArrival}</span>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground font-medium">Service</span>
              <span className="font-semibold truncate">{serviceMode}</span>
            </div>
          )}

          {/* Butler Calls */}
          <div className={cn("flex flex-col gap-0.5", !guestsOnboard && expectedGuests > 0 && "col-span-2")}>
            <span className="text-muted-foreground font-medium">Calls</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 w-fit",
                guestsOnboard 
                  ? "border-green-500/30 text-green-600 dark:text-green-400" 
                  : "border-muted text-muted-foreground"
              )}
            >
              {guestsOnboard ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {/* Crew Coverage - Only if no expected guests shown */}
          {!(expectedGuests > 0 && !guestsOnboard) && (
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Coverage
              </span>
              <span className="font-semibold">{crewRequirement}</span>
            </div>
          )}
        </div>

        {/* Action Hint - Minimal */}
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] text-center text-muted-foreground">
            Click to toggle
          </p>
        </div>
      </div>
    </Card>
  );
}
