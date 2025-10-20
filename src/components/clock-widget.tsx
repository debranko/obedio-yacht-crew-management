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
    <Card className={`p-3 h-full flex flex-col ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
            <ClockIcon className="h-3 w-3 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[10px] leading-tight">Current Time</h3>
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground leading-tight">
              <MapPin className="h-2 w-2" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Display - Responsive */}
      <div className="flex-1 flex flex-col justify-center space-y-0.5 overflow-hidden">
        <div 
          className="font-light tabular-nums w-full text-center"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
            fontSize: 'clamp(1.25rem, 6vw, 3rem)', // Better scaling for widget size
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {time}
        </div>
        
        <p className="text-[10px] text-muted-foreground truncate text-center">
          {date}
        </p>
      </div>
    </Card>
  );
}
