/**
 * Windy Widget - Interactive Weather & Wind Map
 * Perfect for yacht navigation and weather planning
 */

import { Card } from './ui/card';
import { Wind, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { useYachtSettings } from '../hooks/useYachtSettings';

interface WindyWidgetProps {
  className?: string;
}

export function WindyWidget({ className }: WindyWidgetProps) {
  const { getCurrentCoordinates, settings } = useYachtSettings();

  // Get yacht's current coordinates from settings
  const coords = getCurrentCoordinates();
  const lat = coords.latitude;
  const lon = coords.longitude;
  const zoom = 8;

  // Windy embed URL with custom parameters
  const windyUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

  const openWindyFullscreen = () => {
    window.open(`https://www.windy.com/?${lat},${lon},${zoom}`, '_blank');
  };

  return (
    <Card className={`p-0 h-full relative overflow-hidden group ${className || ''}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Wind & Weather</h3>
          <span className="text-xs text-muted-foreground">{settings.locationName || 'Current Location'}</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openWindyFullscreen}
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Open in Windy.com"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Windy Iframe */}
      <div className="w-full h-full">
        <iframe
          src={windyUrl}
          className="w-full h-full border-0"
          title="Windy Weather Map"
          allow="geolocation"
        />
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border/50 px-4 py-1.5">
        <p className="text-xs text-muted-foreground text-center">
          Interactive wind & weather forecast • Click for full map
        </p>
      </div>
    </Card>
  );
}
