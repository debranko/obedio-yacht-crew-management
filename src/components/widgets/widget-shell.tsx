import { Card } from "../ui/card";
import { cn } from "../ui/utils";

/**
 * Uniform widget shell component for consistent widget styling
 * across the dashboard
 */
export function WidgetShell({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("h-full p-4 flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium leading-tight truncate">{title}</div>
            {subtitle && (
              <div className="text-xs text-muted-foreground leading-none mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="min-h-[60px] flex-1 overflow-hidden">{children}</div>
    </Card>
  );
}
