/**
 * Dashboard Grid with Draggable & Resizable Widgets
 * Uses react-grid-layout for drag and drop functionality
 */

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { toast } from "sonner";
import { availableWidgets } from "./manage-widgets-dialog";

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardGridHandle {
  resetLayout: () => void;
  openManageWidgets: () => void;
}
import { Card } from "./ui/card";
import { WidgetCard } from "./widget-card";
import { DNDGuestsWidget } from "./dnd-guests-widget";
import { ServingNowWidget } from "./serving-now-widget";
import { WeatherWidget } from "./weather-widget";
import { WindyWidget } from "./windy-widget";
import { GuestStatusWidget } from "./guest-status-widget";
import { ClockWidget } from "./clock-widget";
import { WeatherWindyWidget } from "./weather-windy-widget";
import { DutyTimerCard } from "./duty-timer-card";
import { useAppData } from "../contexts/AppDataContext";
import { useDND } from "../hooks/useDND";
import { Activity, Clock, BatteryLow, Users, BellOff, GripVertical, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxH?: number;
}

const defaultLayout: WidgetLayout[] = [
  // Clean 2x2 Grid Layout
  { i: "clock", x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "serving-now", x: 2, y: 0, w: 4, h: 4, minW: 2, minH: 3 },
  { i: "weather", x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 3 },
  { i: "duty-timer", x: 6, y: 0, w: 6, h: 3, minW: 4, minH: 3 },
  // Additional widgets (if enabled via Manage Widgets)
  { i: "weather-windy", x: 0, y: 6, w: 4, h: 5, minW: 3, minH: 4 },
  { i: "guest-status", x: 4, y: 6, w: 2, h: 2, minW: 2, minH: 2 },
  { i: "windy", x: 0, y: 11, w: 6, h: 4, minW: 3, minH: 3 },
  // Auto-managed widgets (always active, auto-show/hide)
  { i: "dnd-auto", x: 6, y: 11, w: 6, h: 3, minW: 4, minH: 3 },
  // pending-requests and battery-alerts removed - hardcoded data
];

interface DashboardGridProps {
  isEditMode?: boolean;
  onEditModeChange?: (isEdit: boolean) => void;
  activeWidgets?: string[];
  onActiveWidgetsChange?: (widgets: string[]) => void;
  onOpenManageWidgets?: () => void;
  onNavigate?: (page: string) => void;
}

export const DashboardGrid = forwardRef<DashboardGridHandle, DashboardGridProps>(
  ({ isEditMode = false, onEditModeChange, activeWidgets = [], onActiveWidgetsChange, onOpenManageWidgets, onNavigate }, ref) => {
  // Check if there are any DND active locations/guests
  const { hasDND } = useDND();
  
  const [layout, setLayout] = useState<WidgetLayout[]>(() => {
    // Load saved layout from localStorage
    const saved = localStorage.getItem("obedio-dashboard-layout");
    return saved ? JSON.parse(saved) : defaultLayout;
  });

  // Save layout to localStorage
  const handleLayoutChange = (newLayout: any[]) => {
    const updatedLayout = newLayout.map(item => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxH: item.maxH,
    }));
    setLayout(updatedLayout);
    localStorage.setItem("obedio-dashboard-layout", JSON.stringify(updatedLayout));
  };

  // Update layout when widgets are added/removed
  useEffect(() => {
    if (activeWidgets.length === 0) return;
    
    // Check if any new widgets need to be added to layout
    const layoutIds = layout.map(l => l.i);
    const missingWidgets = activeWidgets.filter(id => !layoutIds.includes(id));
    
    if (missingWidgets.length > 0) {
      // Add new widgets with default positions
      const newLayouts: WidgetLayout[] = missingWidgets.map((widgetId, index) => {
        const config = availableWidgets.find(w => w.id === widgetId);
        if (!config) return null;
        
        // Find next available position
        const maxY = layout.length > 0 ? Math.max(...layout.map(l => l.y + l.h)) : 0;
        
        return {
          i: widgetId,
          x: (index * config.defaultSize.w) % 8,
          y: maxY,
          w: config.defaultSize.w,
          h: config.defaultSize.h,
          minW: config.defaultSize.minW,
          minH: config.defaultSize.minH,
        };
      }).filter(Boolean) as WidgetLayout[];
      
      const updatedLayout = [...layout, ...newLayouts];
      setLayout(updatedLayout);
      localStorage.setItem("obedio-dashboard-layout", JSON.stringify(updatedLayout));
    }
    
    // Remove widgets that are no longer active
    const filteredLayout = layout.filter(l => activeWidgets.includes(l.i));
    if (filteredLayout.length !== layout.length) {
      setLayout(filteredLayout);
      localStorage.setItem("obedio-dashboard-layout", JSON.stringify(filteredLayout));
    }
  }, [activeWidgets]);

  // Expose functions to parent via ref
  useImperativeHandle(ref, () => ({
    resetLayout: () => {
      // Reset to default layout but only for active widgets
      const filteredDefault = defaultLayout.filter(l => activeWidgets.includes(l.i));
      setLayout(filteredDefault);
      localStorage.setItem("obedio-dashboard-layout", JSON.stringify(filteredDefault));
      toast.success("Dashboard layout reset to default");
    },
    openManageWidgets: () => {
      if (onOpenManageWidgets) {
        onOpenManageWidgets();
      }
    }
  }));

  // Widget wrapper with drag handle
  const WidgetWrapper = ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div className="relative h-full">
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 cursor-move drag-handle">
          <Badge variant="secondary" className="cursor-move">
            <GripVertical className="h-3 w-3" />
          </Badge>
        </div>
      )}
      <div className={`h-full ${isEditMode ? 'opacity-90' : ''}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-4"
>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout, md: layout, sm: layout, xs: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 8, md: 6, sm: 4, xs: 2 }}
        rowHeight={80}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        compactType="vertical"
        preventCollision={false}
      >
        {activeWidgets.includes("guest-status") && (
          <div key="guest-status" className="dashboard-widget">
            <WidgetWrapper id="guest-status">
              <GuestStatusWidget 
                guestsOnboard={true}
                guestCount={6}
                expectedGuests={3}
                expectedArrival="Tomorrow 14:00"
                onToggle={(onboard) => {
                  console.log('Guest status toggled:', onboard);
                  // TODO: Connect to state management
                }}
              />
            </WidgetWrapper>
          </div>
        )}

        {activeWidgets.includes("weather-windy") && (
          <div key="weather-windy" className="dashboard-widget">
            <WidgetWrapper id="weather-windy">
              <WeatherWindyWidget />
            </WidgetWrapper>
          </div>
        )}

        {activeWidgets.includes("weather") && (
          <div key="weather" className="dashboard-widget">
            <WidgetWrapper id="weather">
              <WeatherWidget />
            </WidgetWrapper>
          </div>
        )}

        {activeWidgets.includes("windy") && (
          <div key="windy" className="dashboard-widget">
            <WidgetWrapper id="windy">
              <WindyWidget />
            </WidgetWrapper>
          </div>
        )}

        {/* DND Widget - Auto-managed (always active, auto-show/hide based on DND status) */}
        {hasDND && (
          <div key="dnd-auto" className="dashboard-widget">
            <WidgetWrapper id="dnd-auto">
              <DNDGuestsWidget />
            </WidgetWrapper>
          </div>
        )}

        {activeWidgets.includes("serving-now") && (
          <div key="serving-now" className="dashboard-widget">
            <WidgetWrapper id="serving-now">
              <ServingNowWidget onNavigate={onNavigate} />
            </WidgetWrapper>
          </div>
        )}

        {/* Pending Requests and Battery Alerts removed - hardcoded data */}

        {/* Duty Timer Widget - Resizable in Grid */}
        {activeWidgets.includes("duty-timer") && (
          <div key="duty-timer" className="dashboard-widget">
            <WidgetWrapper id="duty-timer">
              <Card className="p-0 overflow-hidden h-full">
                <DutyTimerCard />
              </Card>
            </WidgetWrapper>
          </div>
        )}

        {/* Clock Widget */}
        {activeWidgets.includes("clock") && (
          <div key="clock" className="dashboard-widget">
            <WidgetWrapper id="clock">
              <ClockWidget timezone="auto" />
            </WidgetWrapper>
          </div>
        )}

        {/* Mock/hardcoded widgets removed: Active Devices, Service Requests Chart, Response Time Chart */}
      </ResponsiveGridLayout>
    </div>
  );
});

DashboardGrid.displayName = "DashboardGrid";
