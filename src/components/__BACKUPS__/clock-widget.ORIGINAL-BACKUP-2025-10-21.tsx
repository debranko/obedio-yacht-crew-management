import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Clock as ClockIcon, MapPin } from "lucide-react";

interface ClockWidgetProps {
  className?: string;
  timezone?: string; // e.g., "Europe/Monaco", "America/New_York"
}

export function ClockWidget({ className, timezone = "auto" }: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<string>("Local Time");

  useEffect(() => {
    // Update every second for real-time clock
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Detect timezone/location
    if (timezone === "auto") {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = detectedTimezone.split('/').pop()?.replace(/_/g, ' ') || "Local";
      setLocation(city);
    } else {
      const city = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
      setLocation(city);
    }

    return () => clearInterval(interval);
  }, [timezone]);

  // Format time based on timezone
  const getFormattedTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: timezone === "auto" ? undefined : timezone
    };
    return currentTime.toLocaleTimeString('en-GB', options);
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone === "auto" ? undefined : timezone
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  const time = getFormattedTime();
  const date = getFormattedDate();

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <ClockIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Current Time</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Display */}
      <div className="space-y-2">
        <div 
          className="font-light tabular-nums"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontSize: '3.5rem',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            fontWeight: 300
          }}
        >
          {time}
        </div>
        
        <p className="text-sm text-muted-foreground">
          {date}
        </p>
      </div>

      {/* Timezone indicator */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {timezone === "auto" ? "Automatic timezone detection" : `Timezone: ${timezone}`}
        </p>
      </div>
    </Card>
  );
}
