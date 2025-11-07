import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHeader } from "./components/app-header";
import { AppSidebar } from "./components/app-sidebar";
import { DashboardPage, DashboardPageHandle } from "./components/pages/dashboard";
import { CrewManagementPage } from "./components/pages/crew-management";
import { GuestsListPage } from "./components/pages/guests-list";
import { DeviceManagerPage } from "./components/pages/device-manager-full";
import { ButtonSimulatorPage } from "./components/pages/button-simulator";
import { LocationsPage } from "./components/pages/locations";
import { ActivityLogPage } from "./components/pages/activity-log";
import { ServiceRequestsPage } from "./components/pages/service-requests";
import ServiceRequestsNew from "./components/pages/service-requests-new";
import { SettingsPage } from "./components/pages/settings";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { IncomingRequestDialog, useIncomingRequests } from "./components/incoming-request-dialog";
import { EmergencyShakeDialog } from "./components/emergency-shake-dialog";
import { LoginPage } from "./components/pages/login";
import { toast } from "sonner";
import { ErrorBoundary, PageErrorBoundary } from "./components/ErrorBoundary";

// Loading fallback component for Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Initialize TanStack Query with retry logic and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: 3, // Retry failed requests up to 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff: 1s, 2s, 4s (max 30s)
      // Only retry on network errors or 5xx server errors, not on 4xx client errors
      retryOnMount: true,
      refetchOnReconnect: true,
      // Global error handler for failed queries
      onError: (error: any) => {
        // Don't show toast for auth errors (handled separately)
        if (error?.status === 401 || error?.status === 403) {
          return;
        }
        // Show error toast for other failures after all retries exhausted
        console.error('Query failed after retries:', error);
        toast.error('Failed to load data', {
          description: error?.message || 'Please check your connection and try again',
        });
      },
    },
    mutations: {
      retry: 2, // Retry mutations up to 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff for mutations
      onError: (error: any) => {
        // Don't show toast for auth errors
        if (error?.status === 401 || error?.status === 403) {
          return;
        }
        console.error('Mutation failed:', error);
      },
    },
  },
});

// Inner App component to access AppDataContext and AuthContext
function AppContent() {
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [settingsTab, setSettingsTab] = useState<"general" | "roles" | "system">("general");
  const [isEditingDashboard, setIsEditingDashboard] = useState(false);
  const dashboardPageRef = useRef<DashboardPageHandle>(null);
  
  // Auth context
  const { user } = useAuth();
  
  // Global incoming request handling
  const { getCurrentDutyStatus, assignments, shifts, acceptServiceRequest, crewMembers, guests, locations, getGuestByLocationId } = useAppData();
  const { showDialog, currentRequest, closeDialog } = useIncomingRequests();

  // Emergency shake-to-call state
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyRequest, setEmergencyRequest] = useState<any>(null);
  const [emergencyGuest, setEmergencyGuest] = useState<any>(null);
  
  // Track processed emergency requests to prevent re-opening
  const processedEmergencyIds = useRef<Set<string>>(new Set());

  // NOTE: WebSocket connection is now handled by useWebSocket hook in child components
  // No need for manual WebSocket initialization in App.tsx

  // Get real-time duty status
  const dutyStatus = useMemo(() => getCurrentDutyStatus(), [assignments, shifts, crewMembers, getCurrentDutyStatus]);
  
  // Listen for emergency requests
  useEffect(() => {
    // Check if latest request is emergency priority and not already processed
    if (currentRequest && 
        currentRequest.priority === 'emergency' && 
        !processedEmergencyIds.current.has(currentRequest.id)) {
      
      // Mark as processed
      processedEmergencyIds.current.add(currentRequest.id);
      
      // Find guest using proper relationship - first find location by name, then get guest by locationId
      const location = locations.find((loc: any) =>
        loc.name.toLowerCase() === currentRequest.guestCabin?.toLowerCase()
      );
      const guest = location ? getGuestByLocationId(location.id) : null;
      
      // Close normal dialog and show emergency dialog
      closeDialog();
      setEmergencyRequest(currentRequest);
      setEmergencyGuest(guest || null);
      setShowEmergencyDialog(true);
    }
  }, [currentRequest, closeDialog, guests]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };
  
  const handleAcceptEmergency = () => {
    if (emergencyRequest) {
      const onDutyCrew = dutyStatus.onDuty[0];
      if (onDutyCrew) {
        acceptServiceRequest(emergencyRequest.id, onDutyCrew.name);
      }
      setShowEmergencyDialog(false);
      setEmergencyRequest(null);
    }
  };
  
  const handleCallAllCrew = () => {
    if (emergencyRequest) {
      // Accept request with all on-duty crew
      const allOnDuty = dutyStatus.onDuty.map((c: any) => c.name).join(', ');
      acceptServiceRequest(emergencyRequest.id, allOnDuty || 'All Crew');
      setShowEmergencyDialog(false);
      setEmergencyRequest(null);
    }
  };
  
  const handleCloseEmergency = () => {
    setShowEmergencyDialog(false);
    setEmergencyRequest(null);
    setEmergencyGuest(null);
  };

  const pageConfig: Record<string, { title: string }> = {
    dashboard: { title: "Dashboard" },
    crew: { title: "Crew Management" },
    "guests-list": { title: "Guests List" },
    "device-manager": { title: "Device Manager" },
    "button-simulator": { title: "Smart Button Simulator" },
    locations: { title: "Locations" },
    "service-requests": { title: "Service Requests" },
    "activity-log": { title: "Activity Log" },
    settings: { title: "Settings" }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Reset settings tab when navigating away from settings
    if (page !== "settings") {
      setSettingsTab("general");
    }
    // Reset edit mode when navigating away from dashboard
    if (page !== "dashboard") {
      setIsEditingDashboard(false);
    }
  };

  const handleNavigateToSettingsRoles = () => {
    setCurrentPage("settings");
    setSettingsTab("roles");
  };

  const renderPage = () => {
    const getPageComponent = () => {
      switch (currentPage) {
        case "dashboard":
          return <DashboardPage ref={dashboardPageRef} isEditMode={isEditingDashboard} onEditModeChange={setIsEditingDashboard} onNavigate={handleNavigate} />;
        case "crew":
          return <CrewManagementPage onNavigate={handleNavigate} onNavigateToSettingsRoles={handleNavigateToSettingsRoles} />;
        case "guests-list":
          return <GuestsListPage />;
        case "device-manager":
          return <DeviceManagerPage />;
        case "button-simulator":
          return <ButtonSimulatorPage />;
        case "locations":
          return <LocationsPage />;
        case "service-requests":
          return <ServiceRequestsPage />;
        case "service-requests-new":
          return <ServiceRequestsNew />;
        case "activity-log":
          return <ActivityLogPage />;
        case "settings":
          return <SettingsPage initialTab={settingsTab} />;
        default:
          return <DashboardPage />;
      }
    };

    return (
      <Suspense fallback={<PageLoader />}>
        <PageErrorBoundary>{getPageComponent()}</PageErrorBoundary>
      </Suspense>
    );
  };

  const config = pageConfig[currentPage] || pageConfig.dashboard;
  
  // Crew and Service Requests pages have their own layout with sidebar, don't show page header
  const showPageHeader = currentPage !== "crew" && currentPage !== "service-requests";

  return (
    <>
      {/* Global Emergency Shake-to-Call Dialog */}
      <EmergencyShakeDialog
        isOpen={showEmergencyDialog}
        onClose={handleCloseEmergency}
        request={emergencyRequest}
        guest={emergencyGuest}
        onAccept={handleAcceptEmergency}
        onCallAll={handleCallAllCrew}
      />
      
      {/* Global Incoming Request Dialog (for normal/urgent requests) */}
      <IncomingRequestDialog
        isOpen={showDialog && !showEmergencyDialog}
        onClose={closeDialog}
        request={currentRequest}
      />
      
      <div className="h-screen flex flex-col bg-background">
        <AppHeader 
          onThemeToggle={toggleTheme} 
          isDark={isDark}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <AppSidebar 
            currentPath={`/${currentPage}`}
            onNavigate={(path) => setCurrentPage(path)}
          />
          
          {/* Right side: Page header + content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Page Header - Conditional */}
            {showPageHeader && (
              <div className="border-b border-border bg-muted/30 px-4 lg:px-6 py-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-base font-semibold">{config.title}</h1>
                  
                  {/* Dashboard Edit Layout Buttons */}
                  {currentPage === "dashboard" && (
                    <div className="flex gap-2">
                      {isEditingDashboard && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => dashboardPageRef.current?.openManageWidgets()}
                          >
                            Manage Widgets
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => dashboardPageRef.current?.resetLayout()}
                          >
                            Reset Layout
                          </Button>
                        </>
                      )}
                      <Button 
                        variant={isEditingDashboard ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setIsEditingDashboard(!isEditingDashboard)}
                      >
                        {isEditingDashboard ? "Done" : "Edit Layout"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-background">
              <div className="p-3 lg:p-4">
                {renderPage()}
              </div>
            </main>
          </div>
        </div>

        <Toaster />
      </div>
    </>
  );
}

// Auth-aware router component
function AuthRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('🔄 AuthRouter render:', { 
    isAuthenticated, 
    isLoading, 
    user: user ? `${user.name} (${user.role})` : 'null' 
  });

  if (isLoading) {
    console.log('⏳ Loading state - showing loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔓 Not authenticated (user:', user, ') - showing login page');
    return <LoginPage />;
  }

  console.log('✅ Authenticated - showing app content');
  return (
    <ErrorBoundary>
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </ErrorBoundary>
  );
}

// Main App wrapper with providers
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
}
