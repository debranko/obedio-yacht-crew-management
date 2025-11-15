/**
 * Yacht Position Map Widget
 * Displays the current yacht GPS position on an interactive map
 * Shows location name, coordinates, and last update time
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Navigation, Clock, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { useYachtSettings } from '../hooks/useYachtSettings';
import { Badge } from './ui/badge';

interface YachtPositionMapProps {
  className?: string;
}

export function YachtPositionMap({ className }: YachtPositionMapProps) {
  const { getCurrentCoordinates, settings } = useYachtSettings();
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    updateLastUpdateTime();
    // Refresh time display every minute
    const interval = setInterval(updateLastUpdateTime, 60 * 1000);
    return () => clearInterval(interval);
  }, [settings?.locationUpdatedAt]);

  const updateLastUpdateTime = () => {
    if (settings?.locationUpdatedAt) {
      const date = new Date(settings.locationUpdatedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) {
        setLastUpdate('Just now');
      } else if (diffMins < 60) {
        setLastUpdate(`${diffMins} minute${diffMins > 1 ? 's' : ''} ago`);
      } else if (diffHours < 24) {
        setLastUpdate(`${diffHours} hour${diffHours > 1 ? 's' : ''} ago`);
      } else {
        setLastUpdate(date.toLocaleDateString());
      }
    } else {
      setLastUpdate('Never');
    }
  };

  // Get coordinates from settings (manual or GPS)
  const coords = getCurrentCoordinates();
  const useManual = settings?.useManualLocation ?? false;
  const lat = useManual
    ? (settings?.manualLatitude ?? 43.7384)
    : (coords?.latitude ?? 43.7384); // Default to Monaco
  const lon = useManual
    ? (settings?.manualLongitude ?? 7.4246)
    : (coords?.longitude ?? 7.4246);

  const locationName = settings?.locationName || 'Unknown Location';
  const accuracy = coords?.accuracy;

  // OpenStreetMap embed URL
  const zoom = 12;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05},${lat - 0.05},${lon + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lon}`;

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  const formatCoordinate = (coord: number, isLat: boolean) => {
    const abs = Math.abs(coord);
    const degrees = Math.floor(abs);
    const minutes = ((abs - degrees) * 60).toFixed(4);
    const direction = isLat
      ? (coord >= 0 ? 'N' : 'S')
      : (coord >= 0 ? 'E' : 'W');
    return `${degrees}° ${minutes}' ${direction}`;
  };

  return (
    <Card className={`h-full flex flex-col overflow-hidden ${className || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Yacht Position
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={openInGoogleMaps}
            className="h-8 w-8"
            title="Open in Google Maps"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
        {/* Location Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{locationName}</span>
            {useManual && (
              <Badge variant="secondary" className="text-xs">
                Manual
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Latitude:</span>
              <div className="font-mono">{formatCoordinate(lat, true)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Longitude:</span>
              <div className="font-mono">{formatCoordinate(lon, false)}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{lastUpdate}</span>
            </div>
            {accuracy && !useManual && (
              <div>
                <span>Accuracy: ±{Math.round(accuracy)}m</span>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[300px] rounded-md overflow-hidden border">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            title="Yacht Position Map"
          />
        </div>

        {/* Coordinates in decimal format */}
        <div className="text-xs text-center text-muted-foreground font-mono">
          {lat.toFixed(6)}, {lon.toFixed(6)}
        </div>
      </CardContent>
    </Card>
  );
}
