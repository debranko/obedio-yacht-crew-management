/**
 * Weather Widget - Android Inspired Design
 * Shows current weather with beautiful gradients
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
  Gauge
} from 'lucide-react';
import { cn } from './ui/utils';
import { useYachtSettings } from '../hooks/useYachtSettings';
import { useSizeMode } from '../hooks/useSizeMode';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  visibility: number;
  weather: {
    main: string;
    description: string;
    icon: string;
  };
  location: string;
}

interface WeatherWidgetProps {
  className?: string;
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const { getCurrentCoordinates, settings } = useYachtSettings();
  const { ref, mode } = useSizeMode();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get yacht's current coordinates from settings
      const coords = getCurrentCoordinates();
      const lat = coords.latitude;
      const lon = coords.longitude;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,visibility&timezone=Europe%2FParis`
      );

      if (!response.ok) throw new Error('Failed to fetch weather');

      const data = await response.json();
      
      // Map weather code to description
      const weatherCode = data.current.weather_code;
      const weatherInfo = getWeatherInfo(weatherCode);

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        feels_like: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        pressure: Math.round(data.current.pressure_msl),
        wind_speed: Math.round(data.current.wind_speed_10m),
        visibility: Math.round((data.current.visibility || 10000) / 1000), // Convert to km
        weather: weatherInfo,
        location: settings.locationName || 'Current Location'
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Unable to load weather');
      setLoading(false);
    }
  };

  // Map WMO weather codes to descriptions and types
  const getWeatherInfo = (code: number) => {
    if (code === 0) return { main: 'Clear', description: 'Clear sky', icon: 'sun' };
    if (code <= 3) return { main: 'Clouds', description: 'Partly cloudy', icon: 'cloud' };
    if (code <= 48) return { main: 'Fog', description: 'Foggy', icon: 'cloud' };
    if (code <= 67) return { main: 'Rain', description: 'Rainy', icon: 'rain' };
    if (code <= 77) return { main: 'Snow', description: 'Snowy', icon: 'snow' };
    if (code <= 82) return { main: 'Rain', description: 'Showers', icon: 'drizzle' };
    if (code <= 86) return { main: 'Snow', description: 'Snow showers', icon: 'snow' };
    return { main: 'Thunderstorm', description: 'Stormy', icon: 'rain' };
  };

  const getWeatherIcon = (iconType: string, size: 'sm' | 'md' | 'lg' = 'lg') => {
    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-16 w-16"
    };
    const iconClass = sizeClasses[size];
    
    switch (iconType) {
      case 'sun':
        return <Sun className={cn(iconClass, "text-yellow-400")} />;
      case 'cloud':
        return <Cloud className={cn(iconClass, "text-gray-400")} />;
      case 'rain':
        return <CloudRain className={cn(iconClass, "text-blue-400")} />;
      case 'drizzle':
        return <CloudDrizzle className={cn(iconClass, "text-blue-300")} />;
      case 'snow':
        return <CloudSnow className={cn(iconClass, "text-blue-200")} />;
      default:
        return <Sun className={cn(iconClass, "text-yellow-400")} />;
    }
  };

  const getGradientClass = (main: string) => {
    switch (main) {
      case 'Clear':
        return 'from-blue-400 via-blue-300 to-blue-200';
      case 'Clouds':
        return 'from-gray-400 via-gray-300 to-gray-200';
      case 'Rain':
        return 'from-blue-600 via-blue-500 to-blue-400';
      case 'Snow':
        return 'from-blue-300 via-blue-200 to-blue-100';
      default:
        return 'from-blue-400 via-blue-300 to-blue-200';
    }
  };

  if (loading) {
    return (
      <Card className={cn("p-6 h-full relative overflow-hidden", className)}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className={cn("p-6 h-full", className)}>
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Cloud className="h-8 w-8 mb-2 opacity-50" />
          <p className="text-sm">{error || 'No weather data'}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card ref={ref} className={cn("p-0 h-full relative overflow-hidden group", className)}>
      {/* Animated Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-10 dark:opacity-20 transition-opacity duration-500",
        getGradientClass(weather.weather.main)
      )} />
      
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-background/40" />

      {/* Content - Responsive based on size */}
      <div className="relative h-full flex flex-col">
        {/* COMPACT MODE - Minimal display */}
        {mode === "compact" && (
          <div className="p-3 h-full flex flex-col justify-center items-center">
            <div className="flex items-center justify-center mb-1">
              {getWeatherIcon(weather.weather.icon, 'sm')}
            </div>
            <div className="text-2xl font-bold">{weather.temp}°C</div>
            <div className="text-xs text-muted-foreground truncate max-w-full">
              {weather.location}
            </div>
          </div>
        )}

        {/* MEDIUM MODE - Balanced display */}
        {mode === "medium" && (
          <div className="p-4 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-medium text-muted-foreground">Current Weather</h3>
                <p className="text-xs text-muted-foreground truncate">{weather.location}</p>
              </div>
              {getWeatherIcon(weather.weather.icon, 'md')}
            </div>

            {/* Temperature */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{weather.temp}°</span>
                <span className="text-xl text-muted-foreground">C</span>
              </div>
              <p className="text-sm font-medium mt-1 capitalize truncate">
                {weather.weather.description}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Feels like {weather.feels_like}°C
              </p>
            </div>

            {/* Key Stats - 2 columns */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Droplets className="h-3 w-3 text-blue-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Humidity</p>
                  <p className="text-xs font-semibold truncate">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="h-3 w-3 text-cyan-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">Wind</p>
                  <p className="text-xs font-semibold truncate">{weather.wind_speed} km/h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPANDED MODE - Full details */}
        {mode === "expanded" && (
          <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current Weather</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{weather.location}</p>
              </div>
              {getWeatherIcon(weather.weather.icon, 'lg')}
            </div>

            {/* Temperature - Large Display */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-tight">
                  {weather.temp}°
                </span>
                <span className="text-2xl text-muted-foreground">C</span>
              </div>
              <p className="text-lg font-medium mt-2 capitalize">
                {weather.weather.description}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Feels like {weather.feels_like}°C
              </p>
            </div>

            {/* Weather Details Grid - Full */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border/50">
              {/* Humidity */}
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className="text-sm font-semibold">{weather.humidity}%</p>
                </div>
              </div>

              {/* Wind */}
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-cyan-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Wind</p>
                  <p className="text-sm font-semibold">{weather.wind_speed} km/h</p>
                </div>
              </div>

              {/* Pressure */}
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pressure</p>
                  <p className="text-sm font-semibold">{weather.pressure} hPa</p>
                </div>
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Visibility</p>
                  <p className="text-sm font-semibold">{weather.visibility} km</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Updated just now
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
