import { DashboardGrid, DashboardGridHandle } from "../dashboard-grid";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ManageWidgetsDialog } from "../manage-widgets-dialog";
import { useUserPreferences } from "../../hooks/useUserPreferences";

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
  "clock",
  "duty-timer",
];

export const DashboardPage = forwardRef<DashboardPageHandle, DashboardPageProps>(
  ({ isEditMode = false, onEditModeChange, onNavigate }, ref) => {
  const dashboardGridRef = useRef<DashboardGridHandle>(null);
  const [showManageWidgets, setShowManageWidgets] = useState(false);
  
  // Load active widgets from backend (user preferences)
  const { preferences, updateDashboard } = useUserPreferences();
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    return preferences?.activeWidgets || DEFAULT_ACTIVE_WIDGETS;
  });

  // Update activeWidgets when preferences load from backend
  useState(() => {
    if (preferences?.activeWidgets) {
      setActiveWidgets(preferences.activeWidgets);
    }
  });
  
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
        {/* Draggable Dashboard Grid - Duty Timer now inside grid as resizable widget */}
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
