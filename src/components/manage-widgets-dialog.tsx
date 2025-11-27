/**
 * Manage Widgets Dialog
 * Allows users to add/remove widgets from dashboard
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import {
  Clock,
  Cloud,
  Wind,
  UserCheck,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  defaultSize: { w: number; h: number; minW: number; minH: number };
  category: "status" | "kpi" | "chart";
  requiredPermissions?: string[]; // Permissions needed to see this widget
  recommendedForRoles?: string[]; // Which roles should have this in default layout
}

export const availableWidgets: WidgetConfig[] = [
  {
    id: "clock",
    name: "Clock",
    description: "Real-time clock with timezone support",
    icon: Clock,
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    category: "status",
    // No permissions required - everyone sees the clock
    recommendedForRoles: ["admin", "chief-stewardess", "stewardess", "eto", "crew"],
  },
  {
    id: "clock2",
    name: "Clock (Minimal)",
    description: "Simple, clean time display",
    icon: Clock,
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    category: "status",
    // No permissions required - alternative clock style
    recommendedForRoles: [],
  },
  {
    id: "guest-status",
    name: "Guest Status",
    description: "Guests onboard status with service mode",
    icon: UserCheck,
    defaultSize: { w: 2, h: 2, minW: 2, minH: 2 },
    category: "status",
    requiredPermissions: ["guests.view"],
    recommendedForRoles: ["admin", "chief-stewardess", "stewardess", "crew"],
  },
  {
    id: "weather-windy",
    name: "Weather + Wind Map",
    description: "Current weather combined with interactive Windy forecast map",
    icon: Cloud,
    defaultSize: { w: 4, h: 5, minW: 3, minH: 4 },
    category: "status",
    // No permissions required - weather is public info
    recommendedForRoles: ["admin"],
  },
  {
    id: "weather",
    name: "Weather",
    description: "Current weather with live updates",
    icon: Cloud,
    defaultSize: { w: 3, h: 3, minW: 2, minH: 3 },
    category: "status",
    // No permissions required - weather is public info
    recommendedForRoles: ["chief-stewardess", "stewardess", "eto", "crew"],
  },
  {
    id: "windy",
    name: "Windy Map",
    description: "Interactive wind & weather forecast map",
    icon: Wind,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    category: "status",
    // No permissions required - weather is public info
    recommendedForRoles: [],
  },
  // DND widget removed from here - it's now auto-managed (always active, auto-show/hide)
  {
    id: "serving-now",
    name: "Serving Now",
    description: "Active service requests with live timers",
    icon: Clock,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    category: "status",
    requiredPermissions: ["service-requests.view"],
    recommendedForRoles: ["admin", "chief-stewardess", "stewardess", "crew"],
  },
  {
    id: "duty-timer",
    name: "Duty Status",
    description: "Current shift status with countdown timer and crew roster",
    icon: Clock,
    defaultSize: { w: 6, h: 3, minW: 4, minH: 3 },
    category: "status",
    requiredPermissions: ["crew.view"],
    recommendedForRoles: ["admin", "chief-stewardess"],
  },
  {
    id: "button-simulator",
    name: "ESP32 Button Simulator",
    description: "Virtual smart button for testing MQTT and service requests",
    icon: Radio,
    defaultSize: { w: 3, h: 4, minW: 3, minH: 4 },
    category: "status",
    // Not shown by default - can be added manually from Manage Widgets
    recommendedForRoles: [],
  },
  // Mock/hardcoded widgets removed: Active Devices, Service Requests Chart, Response Time Chart
  // These had fake data and are not production-ready
];

/**
 * Get all permissions for a given role
 * Matches backend role permissions from backend/src/middleware/auth.ts
 */
export function getRolePermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'admin': ['*'], // Admin has all permissions
    'chief-stewardess': [
      'service-requests.view',
      'service-requests.create',
      'service-requests.accept',
      'service-requests.complete',
      'guests.view',
      'crew.view',
      'devices.view',
      'system.view-logs'
    ],
    'stewardess': [
      'service-requests.view',
      'service-requests.accept',
      'service-requests.complete',
      'guests.view'
    ],
    'eto': [
      'devices.view',
      'devices.add',
      'devices.edit',
      'system.view-logs'
    ],
    'crew': [
      'service-requests.view',
      'guests.view'
    ]
  };

  return rolePermissions[role] || [];
}

/**
 * Check if user has required permissions for a widget
 */
export function hasRequiredPermissions(userRole: string, requiredPermissions?: string[]): boolean {
  // If no permissions required, everyone can see it
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const userPermissions = getRolePermissions(userRole);

  // Admin has all permissions
  if (userPermissions.includes('*')) {
    return true;
  }

  // Check if user has at least one of the required permissions
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Filter widgets based on user role permissions
 */
export function getAvailableWidgetsForRole(role: string): WidgetConfig[] {
  return availableWidgets.filter(widget =>
    hasRequiredPermissions(role, widget.requiredPermissions)
  );
}

/**
 * Get default active widgets for a role
 * Returns widget IDs that match the standard dashboard layout (from screenshot)
 * This ensures a consistent experience for all users
 */
export function getDefaultWidgetsForRole(role: string): string[] {
  // Standard layout matching the screenshot: Serving Now, Duty Timer, Clock, Guest Status, Weather Map
  // This is the same for all roles to ensure consistency
  const standardWidgets = ["serving-now", "duty-timer", "clock", "guest-status", "weather-windy"];
  
  // Filter to only include widgets the user has permission to see
  const availableForRole = getAvailableWidgetsForRole(role);
  const availableIds = availableForRole.map(w => w.id);
  
  return standardWidgets.filter(id => availableIds.includes(id));
}

interface ManageWidgetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeWidgets: string[];
  onUpdateWidgets: (widgets: string[]) => void;
}

export function ManageWidgetsDialog({
  isOpen,
  onClose,
  activeWidgets,
  onUpdateWidgets,
}: ManageWidgetsDialogProps) {
  const { user } = useAuth();
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(activeWidgets);

  // Get widgets available to this user based on their role permissions
  const userRole = user?.role || 'crew';
  const availableForUser = getAvailableWidgetsForRole(userRole);

  const handleToggleWidget = (widgetId: string) => {
    setSelectedWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const handleSave = () => {
    onUpdateWidgets(selectedWidgets);
    toast.success("Dashboard widgets updated");
    onClose();
  };

  const handleCancel = () => {
    setSelectedWidgets(activeWidgets);
    onClose();
  };

  // Group widgets by category, but only show widgets available to this user
  const groupedWidgets = {
    status: availableForUser.filter((w) => w.category === "status"),
    kpi: availableForUser.filter((w) => w.category === "kpi"),
    chart: availableForUser.filter((w) => w.category === "chart"),
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Dashboard Widgets</DialogTitle>
          <DialogDescription>
            Select which widgets to display on your dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Widgets */}
          <div>
            <h3 className="text-sm mb-3 text-muted-foreground">Status Widgets</h3>
            <div className="grid gap-3">
              {groupedWidgets.status.map((widget) => {
                const Icon = widget.icon;
                const isSelected = selectedWidgets.includes(widget.id);
                
                return (
                  <Card
                    key={widget.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "hover:border-accent/50"
                    }`}
                    onClick={() => handleToggleWidget(widget.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleWidget(widget.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-accent" />
                          <Label className="cursor-pointer">{widget.name}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* KPI Widgets */}
          <div>
            <h3 className="text-sm mb-3 text-muted-foreground">KPI Widgets</h3>
            <div className="grid grid-cols-2 gap-3">
              {groupedWidgets.kpi.map((widget) => {
                const Icon = widget.icon;
                const isSelected = selectedWidgets.includes(widget.id);
                
                return (
                  <Card
                    key={widget.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "hover:border-accent/50"
                    }`}
                    onClick={() => handleToggleWidget(widget.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleWidget(widget.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-accent" />
                          <Label className="text-xs cursor-pointer">{widget.name}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Chart Widgets */}
          <div>
            <h3 className="text-sm mb-3 text-muted-foreground">Chart Widgets</h3>
            <div className="grid gap-3">
              {groupedWidgets.chart.map((widget) => {
                const Icon = widget.icon;
                const isSelected = selectedWidgets.includes(widget.id);
                
                return (
                  <Card
                    key={widget.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "hover:border-accent/50"
                    }`}
                    onClick={() => handleToggleWidget(widget.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleWidget(widget.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-accent" />
                          <Label className="cursor-pointer">{widget.name}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
