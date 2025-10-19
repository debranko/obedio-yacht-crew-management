import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: "up" | "down" | "neutral" | null;
  trendValue?: string;
  chart?: React.ReactNode;
  details?: React.ReactNode;
  onClick?: () => void;
  inlineValue?: boolean; // Show value next to title
}

export function KpiCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  iconColor = "text-primary",
  trend,
  trendValue,
  chart,
  details,
  onClick,
  inlineValue = false
}: KpiCardProps) {
  const getIconBackground = () => {
    if (iconColor.includes('destructive')) return 'bg-destructive/15 border-destructive/20';
    if (iconColor.includes('warning')) return 'bg-warning/15 border-warning/20';
    if (iconColor.includes('success')) return 'bg-success/15 border-success/20';
    if (iconColor.includes('chart-3')) return 'bg-chart-3/15 border-chart-3/20';
    return 'bg-primary/15 border-primary/20';
  };

  return (
    <Card 
      className={`p-5 transition-all duration-200 ${
        onClick 
          ? 'cursor-pointer hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5' 
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {inlineValue ? (
            /* Inline Layout: Title with value on the same line */
            <>
              <div className="flex items-center gap-2 mb-0.5">
                <h3>{title}</h3>
                <span className="text-2xl font-semibold text-foreground tabular-nums">{value}</span>
              </div>
              {subtitle && (
                <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
              )}
            </>
          ) : (
            /* Standard Layout: Title and value on separate lines */
            <>
              {/* Title - fixed height */}
              <p className="text-sm font-medium text-muted-foreground mb-1.5 tracking-tight h-5 flex items-center">{title}</p>
              
              {/* Value - adaptive size based on content */}
              <div className="min-h-[40px] flex items-baseline gap-2 mb-1">
                <h3 className={`${
                  typeof value === 'string' && value.length > 3 
                    ? 'text-xl font-semibold tracking-tight leading-tight' 
                    : 'text-4xl font-semibold tracking-tight leading-[1] tabular-nums'
                }`}>
                  {value}
                </h3>
                {trendValue && trend && (
                  <span className={`text-sm font-medium leading-none ${
                    trend === 'up' ? 'text-success' : 
                    trend === 'down' ? 'text-error' : 
                    'text-muted-foreground'
                  }`}>
                    {trendValue}
                  </span>
                )}
              </div>
              
              {/* Subtitle - compact */}
              {subtitle && (
                <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
              )}
            </>
          )}
        </div>
        
        {/* Icon - fixed position */}
        {Icon && (
          <div className={`h-12 w-12 rounded-lg ${getIconBackground()} border shadow-sm flex items-center justify-center flex-shrink-0 transition-all duration-200`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        )}
      </div>
      
      {/* Details section - closer to content */}
      {details && (
        <div className="mt-2 pt-2 border-t border-border/60">
          {details}
        </div>
      )}
      
      {chart && (
        <div className="mt-3 -mx-2">
          {chart}
        </div>
      )}
    </Card>
  );
}
