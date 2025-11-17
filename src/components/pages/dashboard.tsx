import { DashboardGrid, DashboardGridHandle } from "../dashboard-grid";
import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { ManageWidgetsDialog, getDefaultWidgetsForRole } from "../manage-widgets-dialog";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { useAuth } from "../../contexts/AuthContext";

export interface DashboardPageHandle {
  resetLayout: () => void;
  openManageWidgets: () => void;
}

interface DashboardPageProps {
  isEditMode?: boolean;
  onEditModeChange?: (isEdit: boolean) => void;
  onNavigate?: (page: string) => void;
}

export const DashboardPage = forwardRef<DashboardPageHandle, DashboardPageProps>(
  ({ isEditMode = false, onEditModeChange, onNavigate }, ref) => {
  const { user } = useAuth();
  const dashboardGridRef = useRef<DashboardGridHandle>(null);
  const [showManageWidgets, setShowManageWidgets] = useState(false);

  // Load active widgets from backend (user preferences)
  const { preferences, updateDashboard, isLoading } = useUserPreferences();

  // Get role-based default widgets
  const userRole = user?.role || 'crew';
  const roleBasedDefaults = getDefaultWidgetsForRole(userRole);

  // Always include DND widget (auto-managed)
  const defaultActiveWidgets = [...roleBasedDefaults, "dnd-guests"];

  const [activeWidgets, setActiveWidgets] = useState<string[]>(defaultActiveWidgets);

  // Update activeWidgets when preferences load from backend
  useEffect(() => {
    if (!isLoading && preferences?.activeWidgets && preferences.activeWidgets.length > 0) {
      console.log('📦 Dashboard: Loading active widgets from preferences:', preferences.activeWidgets);
      setActiveWidgets(preferences.activeWidgets);
    } else if (!isLoading && (!preferences?.activeWidgets || preferences.activeWidgets.length === 0)) {
      // No saved preferences - use role-based defaults
      console.log('📦 Dashboard: No saved preferences, using role-based defaults for', userRole);
      setActiveWidgets(defaultActiveWidgets);
    }
  }, [preferences?.activeWidgets, isLoading, userRole]);

  // Update backend when widgets change
  const handleUpdateWidgets = (newWidgets: string[]) => {
    setActiveWidgets(newWidgets);
    updateDashboard({
      activeWidgets: newWidgets,
      dashboardLayout: preferences?.dashboardLayout || [],
    });
  };
  
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
        onUpdateWidgets={handleUpdateWidgets}
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
