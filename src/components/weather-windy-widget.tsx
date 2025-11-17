/**
 * Weather + Windy Combined Widget
 * Shows current weather conditions at the top with interactive Windy map below
 * Perfect for yacht weather monitoring and navigation
 */

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  CloudDrizzle,
  Wind,
  Droplets,
  Eye,
  Maximize2
} from 'lucide-react';
import { Button } from './ui/button';
import { useYachtSettings } from '../hooks/useYachtSettings';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  visibility: number;
  weather: {
    main: string;
    description: string;
  };
}

interface WeatherWindyWidgetProps {
  className?: string;
}

export function WeatherWindyWidget({ className }: WeatherWindyWidgetProps) {
  const { getCurrentCoordinates, settings } = useYachtSettings();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const coords = getCurrentCoordinates();

      // Guard: Return early if no coordinates available
      if (!coords || coords.latitude == null || coords.longitude == null) {
        console.warn('⚠️ Weather widget: No coordinates available');
        setLoading(false);
        return;
      }

      const lat = coords.latitude;
      const lon = coords.longitude;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&timezone=auto`
      );

      if (!response.ok) throw new Error('Failed to fetch weather');

      const data = await response.json();
      const weatherCode = data.current.weather_code;
      const weatherInfo = getWeatherInfo(weatherCode);

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        feels_like: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        wind_speed: Math.round(data.current.wind_speed_10m),
        visibility: Math.round(data.current.visibility / 1000), // km
        weather: weatherInfo
      });

      setLoading(false);
    } catch (error) {
      console.error('Weather fetch error:', error);
      setLoading(false);
    }
  };

  const getWeatherInfo = (code: number) => {
    // WMO Weather interpretation codes
    if (code === 0) return { main: 'Clear', description: 'Clear sky' };
    if (code <= 3) return { main: 'Clouds', description: 'Partly cloudy' };
    if (code <= 48) return { main: 'Fog', description: 'Foggy' };
    if (code <= 67) return { main: 'Rain', description: 'Rainy' };
    if (code <= 77) return { main: 'Snow', description: 'Snowy' };
    if (code <= 82) return { main: 'Rain', description: 'Rain showers' };
    if (code <= 86) return { main: 'Snow', description: 'Snow showers' };
    return { main: 'Storm', description: 'Thunderstorm' };
  };

  const getWeatherIcon = (main: string) => {
    switch (main) {
      case 'Clear': return <Sun className="h-8 w-8" />;
      case 'Clouds': return <Cloud className="h-8 w-8" />;
      case 'Rain': return <CloudRain className="h-8 w-8" />;
      case 'Drizzle': return <CloudDrizzle className="h-8 w-8" />;
      case 'Snow': return <CloudSnow className="h-8 w-8" />;
      default: return <Cloud className="h-8 w-8" />;
    }
  };

  // Windy map configuration with safe coordinates
  const coords = getCurrentCoordinates();
  const lat = coords?.latitude ?? 43.7384; // Default to Monaco if unavailable
  const lon = coords?.longitude ?? 7.4246;
  const zoom = 8;

  const windyUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=350&zoom=${zoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;

  const openWindyFullscreen = () => {
    window.open(`https://www.windy.com/?${lat},${lon},${zoom}`, '_blank');
  };

  return (
    <Card className={`p-0 h-full flex flex-col overflow-hidden ${className || ''}`}>
      {/* Current Weather Section - Top */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Current Weather</h3>
          </div>
          <span className="text-xs text-muted-foreground">{settings?.locationName || 'Current Location'}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : weather ? (
          <div className="space-y-3">
            {/* Main temp and icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-primary">
                  {getWeatherIcon(weather.weather.main)}
                </div>
                <div>
                  <div className="text-3xl font-bold">{weather.temp}°C</div>
                  <p className="text-xs text-muted-foreground capitalize">{weather.weather.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Feels like</p>
                <p className="text-lg font-semibold">{weather.feels_like}°C</p>
              </div>
            </div>

            {/* Weather details grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Wind className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="text-sm font-medium">{weather.wind_speed} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="text-sm font-medium">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Visibility</p>
                  <p className="text-sm font-medium">{weather.visibility} km</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">Unable to load weather data</p>
        )}
      </div>

      {/* Windy Map Section - Bottom */}
      <div className="flex-1 relative group">
        {/* Map Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-primary" />
            <h3 className="text-xs font-semibold">Wind Forecast</h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openWindyFullscreen}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Open in Windy.com"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Windy Iframe */}
        <div className="w-full h-full pt-10">
          <iframe
            src={windyUrl}
            className="w-full h-full border-0"
            title="Windy Weather Map"
            allow="geolocation"
          />
        </div>
      </div>
    </Card>
  );
}
