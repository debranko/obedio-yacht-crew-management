/**
 * Widget Card Component
 * Standardized card wrapper for dashboard widgets
 * Provides consistent height and spacing
 */

import { Card } from "./ui/card";

interface WidgetCardProps {
  children: React.ReactNode;
  className?: string;
}

export function WidgetCard({ children, className = "" }: WidgetCardProps) {
  return (
    <Card className={`p-4 h-full ${className}`}>
      <div className="flex flex-col gap-3 min-h-[200px]">
        {children}
      </div>
    </Card>
  );
}