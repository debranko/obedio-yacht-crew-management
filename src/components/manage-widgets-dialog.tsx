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
  BellOff,
  Clock,
  Users,
  Bell,
  BatteryLow,
  Smartphone,
  TrendingUp,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: any;
  defaultSize: { w: number; h: number; minW: number; minH: number };
  category: "status" | "kpi" | "chart";
}

export const availableWidgets: WidgetConfig[] = [
  {
    id: "dnd",
    name: "Do Not Disturb",
    description: "Shows locations with DND active",
    icon: BellOff,
    defaultSize: { w: 4, h: 2, minW: 2, minH: 2 },
    category: "status",
  },
  {
    id: "dnd-guests",
    name: "DND Guests",
    description: "Shows which guests have DND active and their locations",
    icon: BellOff,
    defaultSize: { w: 4, h: 3, minW: 2, minH: 2 },
    category: "status",
  },
  {
    id: "serving-now",
    name: "Serving Now",
    description: "Active service requests with live timers",
    icon: Clock,
    defaultSize: { w: 4, h: 3, minW: 3, minH: 2 },
    category: "status",
  },
  {
    id: "duty-timer",
    name: "Duty Timer",
    description: "Your current shift timer",
    icon: Timer,
    defaultSize: { w: 2, h: 2, minW: 1, minH: 2 },
    category: "kpi",
  },
  {
    id: "active-crew",
    name: "Active Crew",
    description: "Number of crew members on duty",
    icon: Users,
    defaultSize: { w: 2, h: 2, minW: 1, minH: 2 },
    category: "kpi",
  },
  {
    id: "pending-requests",
    name: "Pending Requests",
    description: "Total pending service requests",
    icon: Bell,
    defaultSize: { w: 2, h: 2, minW: 1, minH: 2 },
    category: "kpi",
  },
  {
    id: "battery-alerts",
    name: "Battery Alerts",
    description: "Devices with low battery",
    icon: BatteryLow,
    defaultSize: { w: 2, h: 2, minW: 1, minH: 2 },
    category: "kpi",
  },
  {
    id: "active-devices",
    name: "Active Devices",
    description: "Total devices online",
    icon: Smartphone,
    defaultSize: { w: 2, h: 2, minW: 1, minH: 2 },
    category: "kpi",
  },
  {
    id: "requests-chart",
    name: "Service Requests Chart",
    description: "Request volume over time",
    icon: TrendingUp,
    defaultSize: { w: 4, h: 3, minW: 2, minH: 2 },
    category: "chart",
  },
  {
    id: "response-time-chart",
    name: "Response Time Chart",
    description: "Average response time trends",
    icon: TrendingUp,
    defaultSize: { w: 4, h: 3, minW: 2, minH: 2 },
    category: "chart",
  },
];

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
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(activeWidgets);

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

  const groupedWidgets = {
    status: availableWidgets.filter((w) => w.category === "status"),
    kpi: availableWidgets.filter((w) => w.category === "kpi"),
    chart: availableWidgets.filter((w) => w.category === "chart"),
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
