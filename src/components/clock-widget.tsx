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
    <Card className={`p-2.5 h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-1.5 min-h-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <ClockIcon className="h-2.5 w-2.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[9px] leading-none truncate">Current Time</h3>
            <div className="flex items-center gap-0.5 text-[8px] text-muted-foreground leading-none mt-0.5">
              <MapPin className="h-1.5 w-1.5 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Display - Fills remaining space */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-0 overflow-hidden py-1">
        <div 
          className="font-light tabular-nums text-center"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontSize: 'clamp(1.5rem, 8vmin, 4rem)', // Use vmin for better container scaling
            lineHeight: 0.9,
            letterSpacing: '-0.03em',
            fontWeight: 300,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {time}
        </div>
        
        <p 
          className="text-muted-foreground truncate text-center mt-1 max-w-full"
          style={{
            fontSize: 'clamp(8px, 1.2vmin, 11px)'
          }}
        >
          {date}
        </p>
      </div>
    </Card>
  );
}
