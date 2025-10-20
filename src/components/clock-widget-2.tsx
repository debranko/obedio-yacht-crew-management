import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { MapPin } from "lucide-react";

interface ClockWidget2Props {
  className?: string;
  timezone?: string;
}

export function ClockWidget2({ className, timezone = "auto" }: ClockWidget2Props) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<string>("Local");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Detect location
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone === "auto" ? undefined : timezone
    };
    return currentTime.toLocaleDateString('en-US', options);
  };

  const time = getFormattedTime();
  const date = getFormattedDate();

  return (
    <Card className={`p-3 h-full flex flex-col justify-center items-center ${className}`}>
      {/* Just the time - big and centered */}
      <div 
        className="font-light tabular-nums text-center"
        style={{ 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          fontSize: 'clamp(2rem, 10vmin, 5rem)',
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          fontWeight: 200,
        }}
      >
        {time}
      </div>
      
      {/* Small date and location below */}
      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
        <span 
          className="text-center"
          style={{ fontSize: 'clamp(9px, 1.5vmin, 12px)' }}
        >
          {date}
        </span>
        <span className="text-muted-foreground/50">•</span>
        <div className="flex items-center gap-1">
          <MapPin 
            className="flex-shrink-0" 
            style={{ 
              width: 'clamp(10px, 1.5vmin, 14px)',
              height: 'clamp(10px, 1.5vmin, 14px)'
            }} 
          />
          <span 
            className="truncate max-w-[80px]"
            style={{ fontSize: 'clamp(9px, 1.5vmin, 12px)' }}
          >
            {location}
          </span>
        </div>
      </div>
    </Card>
  );
}
