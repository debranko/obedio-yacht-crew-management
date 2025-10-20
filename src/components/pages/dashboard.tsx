import { Activity, Users, Clock, Smartphone } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { StatusChip } from "../status-chip";
import { useAppData } from "../../contexts/AppDataContext";
import { DashboardGrid, DashboardGridHandle } from "../dashboard-grid";
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { ManageWidgetsDialog } from "../manage-widgets-dialog";

export interface DashboardPageHandle {
  resetLayout: () => void;
  openManageWidgets: () => void;
}

interface DashboardPageProps {
  isEditMode?: boolean;
  onEditModeChange?: (isEdit: boolean) => void;
  onNavigate?: (page: string) => void;
}

// Default active widgets - Clean Dashboard Layout
const DEFAULT_ACTIVE_WIDGETS = [
  "serving-now",
  "weather",
  "duty-timer",
  "active-crew",
];

export const DashboardPage = forwardRef<DashboardPageHandle, DashboardPageProps>(
  ({ isEditMode = false, onEditModeChange, onNavigate }, ref) => {
  const dashboardGridRef = useRef<DashboardGridHandle>(null);
  const [showManageWidgets, setShowManageWidgets] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem("obedio-active-widgets");
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVE_WIDGETS;
  });

  // Save active widgets to localStorage
  useEffect(() => {
    localStorage.setItem("obedio-active-widgets", JSON.stringify(activeWidgets));
  }, [activeWidgets]);
  
  // Expose functions to parent
  useImperativeHandle(ref, () => ({
    resetLayout: () => {
      dashboardGridRef.current?.resetLayout();
    },
    openManageWidgets: () => {
      setShowManageWidgets(true);
    }
  }));

  return (
    <>
      <ManageWidgetsDialog
        isOpen={showManageWidgets}
        onClose={() => setShowManageWidgets(false)}
        activeWidgets={activeWidgets}
        onUpdateWidgets={setActiveWidgets}
      />
      
      <div className="space-y-6">
        {/* Draggable Dashboard Grid */}
        <DashboardGrid 
          ref={dashboardGridRef}
          isEditMode={isEditMode} 
          onEditModeChange={onEditModeChange}
          activeWidgets={activeWidgets}
          onActiveWidgetsChange={setActiveWidgets}
          onOpenManageWidgets={() => setShowManageWidgets(true)}
          onNavigate={onNavigate}
        />

      {/* Quick Actions removed - will be implemented differently later */}
      </div>
    </>
  );
});

DashboardPage.displayName = "DashboardPage";
