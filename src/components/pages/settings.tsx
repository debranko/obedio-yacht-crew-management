import { useState, Fragment, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Shield,
  Settings as SettingsIcon,
  Server,
  Save,
  RotateCcw,
  Info,
  Plus,
  X,
  XCircle,
  Bell,
  Download,
  Upload,
  Database,
  Wifi,
  Lock,
  AlertTriangle,
  CheckCircle,
  Globe,
  Mail,
  Smartphone,
  Volume2,
  Calendar,
  Clock,
  HardDrive,
  Activity,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  GripVertical,
  Edit2,
  Tag,
  User,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { useAppData, Role } from "../../contexts/AppDataContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { YACHT_TIMEZONES, VESSEL_TYPES } from "../../types/system-settings";
import { useYachtSettingsApi } from "../../hooks/useYachtSettingsApi";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../ui/alert";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Progress } from "../ui/progress";
import { useServiceCategories, useCreateServiceCategory, useUpdateServiceCategory, useDeleteServiceCategory, useReorderServiceCategories } from "../../hooks/useServiceCategories";
import type { ServiceCategory } from "../../hooks/useServiceCategories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

// Permission categories and their specific permissions
interface Permission {
  id: string;
  label: string;
  description: string;
  category: "crew" | "guests" | "duty-roster" | "devices" | "locations" | "system" | "communication";
}

const allPermissions: Permission[] = [
  // Crew Management
  { id: "crew.view", label: "View Crew", description: "View crew member list and basic info", category: "crew" },
  { id: "crew.add", label: "Add Crew", description: "Add new crew members", category: "crew" },
  { id: "crew.edit", label: "Edit Crew", description: "Edit crew member details", category: "crew" },
  { id: "crew.delete", label: "Delete Crew", description: "Remove crew members", category: "crew" },
  { id: "crew.create-account", label: "Create Accounts", description: "Create login accounts", category: "crew" },
  
  // Guest Management
  { id: "guests.view", label: "View Guests", description: "View guest list and preferences", category: "guests" },
  { id: "guests.add", label: "Add Guests", description: "Add new guests", category: "guests" },
  { id: "guests.edit", label: "Edit Guests", description: "Edit guest preferences", category: "guests" },
  { id: "guests.delete", label: "Delete Guests", description: "Remove guests", category: "guests" },
  
  // Duty Roster
  { id: "duty.view", label: "View Duty Roster", description: "View shift schedules", category: "duty-roster" },
  { id: "duty.manage", label: "Manage Duty", description: "Create and modify assignments", category: "duty-roster" },
  { id: "duty.configure", label: "Configure Shifts", description: "Create shift templates", category: "duty-roster" },
  
  // Device Management
  { id: "devices.view", label: "View Devices", description: "View device list", category: "devices" },
  { id: "devices.add", label: "Add Devices", description: "Add new devices", category: "devices" },
  { id: "devices.edit", label: "Edit Devices", description: "Modify device settings", category: "devices" },
  { id: "devices.delete", label: "Delete Devices", description: "Remove devices", category: "devices" },
  { id: "devices.assign", label: "Assign Devices", description: "Assign to crew", category: "devices" },
  
  // Location Management
  { id: "locations.view", label: "View Locations", description: "View itinerary", category: "locations" },
  { id: "locations.add", label: "Add Locations", description: "Add locations", category: "locations" },
  { id: "locations.edit", label: "Edit Locations", description: "Modify locations", category: "locations" },
  { id: "locations.delete", label: "Delete Locations", description: "Remove locations", category: "locations" },
  
  // Communication
  { id: "communication.send", label: "Send Messages", description: "Send messages", category: "communication" },
  { id: "communication.broadcast", label: "Broadcast", description: "Send announcements", category: "communication" },
  { id: "communication.emergency", label: "Emergency Alerts", description: "Send emergency alerts", category: "communication" },
  
  // System
  { id: "system.view-logs", label: "View Logs", description: "View activity logs", category: "system" },
  { id: "system.settings", label: "System Settings", description: "Change configuration", category: "system" },
  { id: "system.roles", label: "Manage Roles", description: "Configure permissions", category: "system" },
  { id: "system.backup", label: "Backup & Export", description: "Export data", category: "system" },
];

const roleInfo: Record<Role, { label: string; description: string; color: string }> = {
  "admin": {
    label: "Admin",
    description: "Full system access",
    color: "bg-destructive text-destructive-foreground"
  },
  "chief-stewardess": {
    label: "Chief Stew",
    description: "Manages interior operations",
    color: "bg-primary text-primary-foreground"
  },
  "stewardess": {
    label: "Stewardess",
    description: "Guest services",
    color: "bg-secondary text-secondary-foreground"
  },
  "crew": {
    label: "Crew",
    description: "Basic access",
    color: "bg-muted text-muted-foreground"
  },
  "eto": {
    label: "ETO",
    description: "Devices & technical",
    color: "bg-chart-3 text-white"
  },
};

const categoryLabels: Record<string, string> = {
  "crew": "Crew",
  "guests": "Guests",
  "duty-roster": "Duty",
  "devices": "Devices",
  "locations": "Locations",
  "communication": "Comms",
  "system": "System",
};

interface SettingsPageProps {
  initialTab?: "general" | "notifications" | "roles" | "system" | "backup" | "categories";
}

export function SettingsPage({ initialTab = "general" }: SettingsPageProps) {
  const { rolePermissions, updateRolePermissions, userPreferences, updateUserPreferences } = useAppData();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Use yacht settings API hook
  const { settings: yachtSettings, updateSettings: updateYachtSettings, isLoading: isLoadingSettings } = useYachtSettingsApi();
  
  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // General Settings State
  const [yachtName, setYachtName] = useState("");
  const [yachtType, setYachtType] = useState("motor-yacht");
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [timezone, setTimezone] = useState("Europe/Monaco");
  const [floors, setFloors] = useState<string[]>([]);
  const [newFloor, setNewFloor] = useState("");
  const [serviceRequestDisplayMode, setServiceRequestDisplayMode] = useState<"guest-name" | "location">(
    userPreferences.serviceRequestDisplayMode
  );
  const [servingNowTimeout, setServingNowTimeout] = useState<number>(
    userPreferences.servingNowTimeout || 5
  );
  const [requestDialogRepeatInterval, setRequestDialogRepeatInterval] = useState<number>(
    userPreferences.requestDialogRepeatInterval ?? 60
  );
  
  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<string[]>([]);
  const [newEmergencyContact, setNewEmergencyContact] = useState("");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("07:00");
  
  // Backend notification settings
  const [serviceRequests, setServiceRequests] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [systemMessages, setSystemMessages] = useState(true);
  const [guestMessages, setGuestMessages] = useState(true);
  const [crewMessages, setCrewMessages] = useState(true);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  // System Settings State
  const [serverPort, setServerPort] = useState("8080");
  const [wsPort, setWsPort] = useState("8080");
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [apiTimeout, setApiTimeout] = useState("30");
  const [logLevel, setLogLevel] = useState("info");
  const [enableMetrics, setEnableMetrics] = useState(true);
  const [enableDebugMode, setEnableDebugMode] = useState(false);
  
  // Backup Settings State
  const [backupSchedule, setBackupSchedule] = useState("daily");
  const [backupTime, setBackupTime] = useState("02:00");
  const [backupRetention, setBackupRetention] = useState("30");
  const [backupLocation, setBackupLocation] = useState("local");
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  
  // Initialize state from backend settings
  useEffect(() => {
    if (yachtSettings) {
      setYachtName(yachtSettings.vesselName || "");
      setYachtType(yachtSettings.vesselType || "motor-yacht");
      setTimezone(yachtSettings.timezone || "Europe/Monaco");
      setFloors(yachtSettings.floors || []);
    }
  }, [yachtSettings]);
  
  // Sync with context when it changes
  useEffect(() => {
    setServiceRequestDisplayMode(userPreferences.serviceRequestDisplayMode);
    setServingNowTimeout(userPreferences.servingNowTimeout || 5);
    setRequestDialogRepeatInterval(userPreferences.requestDialogRepeatInterval ?? 60);
  }, [userPreferences.serviceRequestDisplayMode, userPreferences.servingNowTimeout, userPreferences.requestDialogRepeatInterval]);
  
  // Local state for permissions (will be saved on "Save" button)
  const [localPermissions, setLocalPermissions] = useState(rolePermissions);
  
  // Service Categories State
  const { data: serviceCategories = [], isLoading: isLoadingCategories } = useServiceCategories();
  const createCategory = useCreateServiceCategory();
  const updateCategory = useUpdateServiceCategory();
  const deleteCategory = useDeleteServiceCategory();
  const reorderCategories = useReorderServiceCategories();
  
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [editingCategoryData, setEditingCategoryData] = useState({
    name: "",
    icon: "",
    color: "#007bff",
    description: "",
    isActive: true
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "",
    color: "#007bff",
    description: ""
  });
  
  // When editing category changes, update the form data
  useEffect(() => {
    if (editingCategory) {
      setEditingCategoryData({
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
        description: editingCategory.description || "",
        isActive: editingCategory.isActive
      });
    }
  }, [editingCategory]);
  
  const handleSaveGeneral = async () => {
    // Save user preferences to context
    updateUserPreferences({
      serviceRequestDisplayMode,
      servingNowTimeout,
      requestDialogRepeatInterval,
    });
    
    // Save vessel settings to backend
    try {
      await updateYachtSettings({
        vesselName: yachtName,
        vesselType: yachtType,
        timezone: timezone,
        floors: floors,
      });
      toast.success("General settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };
  
  const handleAddFloor = () => {
    if (newFloor.trim() && !floors.includes(newFloor.trim())) {
      setFloors([...floors, newFloor.trim()]);
      setNewFloor("");
    }
  };
  
  const handleRemoveFloor = (floor: string) => {
    setFloors(floors.filter(f => f !== floor));
  };
  
  const handleAddEmergencyContact = () => {
    if (newEmergencyContact.trim() && !emergencyContacts.includes(newEmergencyContact.trim())) {
      setEmergencyContacts([...emergencyContacts, newEmergencyContact.trim()]);
      setNewEmergencyContact("");
    }
  };
  
  const handleRemoveEmergencyContact = (contact: string) => {
    setEmergencyContacts(emergencyContacts.filter(c => c !== contact));
  };
  
  const handleTogglePermission = (role: Role, permissionId: string) => {
    setLocalPermissions(prev => ({
      ...prev,
      [role]: prev[role].includes(permissionId)
        ? prev[role].filter(p => p !== permissionId)
        : [...prev[role], permissionId]
    }));
  };
  
  const handleResetAll = () => {
    setLocalPermissions(rolePermissions);
    toast.success("All changes reset");
  };
  
  const handleSavePermissions = () => {
    // Save each role's permissions
    (Object.keys(localPermissions) as Role[]).forEach(role => {
      updateRolePermissions(role, localPermissions[role]);
    });
    toast.success("Role permissions saved successfully");
  };
  
  // Load system status and settings from backend
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/system-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data.status);
          if (data.settings) {
            setServerPort(data.settings.serverPort);
            setWsPort(data.settings.wsPort);
            setApiTimeout(data.settings.apiTimeout);
            setLogLevel(data.settings.logLevel);
            setEnableMetrics(data.settings.enableMetrics);
            setEnableDebugMode(data.settings.enableDebugMode);
          }
        }
      } catch (error) {
        console.error('Failed to load system settings:', error);
      }
    };

    loadSystemSettings();
  }, []);

  // Load backup status and settings from backend
  useEffect(() => {
    const loadBackupSettings = async () => {
      try {
        const token = localStorage.getItem('token');

        // Load backup settings
        const settingsRes = await fetch('/api/backup/settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.settings) {
            setBackupSchedule(data.settings.backupSchedule);
            setBackupTime(data.settings.backupTime);
            setBackupRetention(String(data.settings.backupRetention));
            setBackupLocation(data.settings.backupLocation);
            setCloudBackupEnabled(data.settings.cloudBackupEnabled);
          }
        }

        // Load backup status
        const statusRes = await fetch('/api/backup/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statusRes.ok) {
          const data = await statusRes.json();
          setBackupStatus(data.status);
          if (data.status?.lastBackup) {
            setLastBackupTime(new Date(data.status.lastBackup));
          }
        }
      } catch (error) {
        console.error('Failed to load backup settings:', error);
      }
    };

    loadBackupSettings();
  }, []);

  // Load notification settings from backend
  useEffect(() => {
    const loadNotificationSettings = async () => {
      setIsLoadingNotifications(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/notification-settings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const settings = await response.json();
          setPushNotifications(settings.pushEnabled);
          setServiceRequests(settings.serviceRequests);
          setEmergencyAlerts(settings.emergencyAlerts);
          setSystemMessages(settings.systemMessages);
          setGuestMessages(settings.guestMessages);
          setCrewMessages(settings.crewMessages);
          setQuietHoursEnabled(settings.quietHoursEnabled);
          if (settings.quietHoursStart) setQuietHoursStart(settings.quietHoursStart);
          if (settings.quietHoursEnd) setQuietHoursEnd(settings.quietHoursEnd);
          
          // Get email from user preferences (since backend doesn't store it)
          const userEmail = localStorage.getItem('userEmail');
          if (userEmail) setNotificationEmail(userEmail);
          
          // Emergency contacts are stored separately in localStorage for now
          const savedContacts = localStorage.getItem('emergencyContacts');
          if (savedContacts) {
            try {
              setEmergencyContacts(JSON.parse(savedContacts));
            } catch (e) {
              console.error('Failed to parse emergency contacts');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    
    loadNotificationSettings();
  }, [yachtSettings]);

  const handleSaveNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Save notification settings to backend
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pushEnabled: pushNotifications,
          serviceRequests,
          emergencyAlerts,
          systemMessages,
          guestMessages,
          crewMessages,
          quietHoursEnabled,
          quietHoursStart: quietHoursEnabled ? quietHoursStart : null,
          quietHoursEnd: quietHoursEnabled ? quietHoursEnd : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }
      
      // Save email notification preference to user preferences
      if (emailNotifications && notificationEmail) {
        localStorage.setItem('userEmail', notificationEmail);
        localStorage.setItem('emailNotifications', String(emailNotifications));
      }
      
      // Save emergency contacts to localStorage for now
      if (emergencyContacts.length > 0) {
        localStorage.setItem('emergencyContacts', JSON.stringify(emergencyContacts));
      }
      
      toast.success("Notification settings saved successfully");
    } catch (error) {
      toast.error("Failed to save notification settings");
      console.error('Error saving notifications:', error);
    }
  };
  
  const handleSaveSystem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/system-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serverPort,
          wsPort,
          databaseUrl,
          apiTimeout,
          logLevel,
          enableMetrics,
          enableDebugMode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save system settings');
      }

      const data = await response.json();
      toast.success(data.message || "System settings saved successfully");
    } catch (error) {
      toast.error("Failed to save system settings");
      console.error('Error saving system settings:', error);
    }
  };
  
  const handleSaveBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/backup/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          backupSchedule,
          backupTime,
          backupRetention: parseInt(backupRetention),
          backupLocation,
          cloudBackupEnabled
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save backup settings');
      }

      toast.success("Backup settings saved successfully");
    } catch (error) {
      toast.error("Failed to save backup settings");
      console.error('Error saving backup settings:', error);
    }
  };

  const handleRunBackup = async () => {
    const token = localStorage.getItem('token');

    toast.promise(
      fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Backup failed');
        }

        const data = await response.json();

        // Refresh backup status
        const statusRes = await fetch('/api/backup/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setBackupStatus(statusData.status);
          if (statusData.status?.lastBackup) {
            setLastBackupTime(new Date(statusData.status.lastBackup));
          }
        }

        return data;
      }),
      {
        loading: 'Creating backup...',
        success: 'Backup completed successfully',
        error: (error) => error.message || 'Backup failed',
      }
    );
  };

  const handleRestoreBackup = async () => {
    // Show file selection dialog (would need a file picker component)
    // For now, just show info that user needs to select a backup file
    toast.info("Please contact administrator to restore from a specific backup file");
  };
  
  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const roles: Role[] = ["admin", "eto", "chief-stewardess", "stewardess", "crew"];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vessel Information</CardTitle>
                <CardDescription>
                  Basic information about your vessel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="yacht-name">Vessel Name</Label>
                  <Input
                    id="yacht-name"
                    value={yachtName}
                    onChange={(e) => setYachtName(e.target.value)}
                    placeholder="Enter vessel name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="yacht-type">Vessel Type</Label>
                  <Select value={yachtType} onValueChange={setYachtType}>
                    <SelectTrigger id="yacht-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VESSEL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="floors-decks">Floors / Decks</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="floors-decks"
                        value={newFloor}
                        onChange={(e) => setNewFloor(e.target.value)}
                        placeholder="e.g., Sun Deck, Upper Deck, Main Deck"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddFloor()}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddFloor}
                        disabled={!newFloor.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {floors.map((floor, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {floor}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => handleRemoveFloor(floor)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    {floors.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No floors/decks defined yet. Add floors/decks to organize your vessel's locations.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Time & Location</CardTitle>
                <CardDescription>
                  Configure timezone and regional settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YACHT_TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Set the timezone for displaying times throughout the system
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Display Preferences</CardTitle>
                <CardDescription>
                  Customize how information is displayed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service-request-display">Service Request Display</Label>
                  <Select value={serviceRequestDisplayMode} onValueChange={(value: "guest-name" | "location") => setServiceRequestDisplayMode(value)}>
                    <SelectTrigger id="service-request-display">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest-name">Show Guest Name</SelectItem>
                      <SelectItem value="location">Show Location/Cabin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Choose how service requests are displayed. "Guest Name" shows who is calling (e.g., Mr. Anderson). "Location" shows where the call is from (e.g., Owner's Stateroom, Dining Room).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serving-timeout">Serving Now Timeout</Label>
                  <Select 
                    value={String(servingNowTimeout)}
                    onValueChange={(value: string) => setServingNowTimeout(Number(value))}
                  >
                    <SelectTrigger id="serving-timeout">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 seconds</SelectItem>
                      <SelectItem value="5">5 seconds (Default)</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How long completed requests remain visible before moving to history.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-repeat">Unaccepted Request Reminder</Label>
                  <Select 
                    value={String(requestDialogRepeatInterval)}
                    onValueChange={(value: string) => setRequestDialogRepeatInterval(Number(value))}
                  >
                    <SelectTrigger id="request-repeat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Never (Show Once)</SelectItem>
                      <SelectItem value="30">Every 30 seconds</SelectItem>
                      <SelectItem value="60">Every 1 minute (Default)</SelectItem>
                      <SelectItem value="120">Every 2 minutes</SelectItem>
                      <SelectItem value="180">Every 3 minutes</SelectItem>
                      <SelectItem value="300">Every 5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How often to show dialog again for pending requests that haven't been accepted.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={isLoadingSettings}>
                <Save className="h-4 w-4 mr-2" />
                Save General Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Service Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Request Categories</CardTitle>
                <CardDescription>
                  Manage categories for service requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Category Form */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-medium">Add New Category</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-category-name">Category Name</Label>
                      <Input
                        id="new-category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Housekeeping"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-category-icon">Icon Name</Label>
                      <Input
                        id="new-category-icon"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="e.g., Home"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-category-color">Color</Label>
                      <Input
                        id="new-category-color"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-category-description">Description</Label>
                      <Input
                        id="new-category-description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (newCategory.name && newCategory.icon) {
                        createCategory.mutate({
                          name: newCategory.name,
                          icon: newCategory.icon,
                          color: newCategory.color,
                          description: newCategory.description || undefined,
                          isActive: true
                        }, {
                          onSuccess: () => {
                            setNewCategory({ name: "", icon: "", color: "#007bff", description: "" });
                            toast.success("Category created successfully");
                          }
                        });
                      }
                    }}
                    disabled={!newCategory.name || !newCategory.icon || createCategory.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>

                {/* Categories List */}
                <div className="space-y-2">
                  <h4 className="font-medium">Existing Categories</h4>
                  {isLoadingCategories ? (
                    <p className="text-sm text-muted-foreground">Loading categories...</p>
                  ) : serviceCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories defined yet</p>
                  ) : (
                    <div className="space-y-2">
                      {serviceCategories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center gap-4 p-3 border rounded-lg"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-sm text-muted-foreground">{category.description}</div>
                            )}
                          </div>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              deleteCategory.mutate(category.id, {
                                onSuccess: () => toast.success("Category deleted"),
                                onError: () => toast.error("Cannot delete category in use")
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
               </CardContent>
             </Card>
             
             {/* Edit Category Dialog */}
             <Dialog open={!!editingCategory} onOpenChange={(open: boolean) => !open && setEditingCategory(null)}>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>Edit Service Category</DialogTitle>
                   <DialogDescription>
                     Update the category details below
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                   <div className="space-y-2">
                     <Label htmlFor="edit-category-name">Category Name</Label>
                     <Input
                       id="edit-category-name"
                       value={editingCategoryData.name}
                       onChange={(e) => setEditingCategoryData(prev => ({ ...prev, name: e.target.value }))}
                       placeholder="e.g., Housekeeping"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="edit-category-icon">Icon Name</Label>
                     <Input
                       id="edit-category-icon"
                       value={editingCategoryData.icon}
                       onChange={(e) => setEditingCategoryData(prev => ({ ...prev, icon: e.target.value }))}
                       placeholder="e.g., Home"
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="edit-category-color">Color</Label>
                     <Input
                       id="edit-category-color"
                       type="color"
                       value={editingCategoryData.color}
                       onChange={(e) => setEditingCategoryData(prev => ({ ...prev, color: e.target.value }))}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="edit-category-description">Description</Label>
                     <Input
                       id="edit-category-description"
                       value={editingCategoryData.description}
                       onChange={(e) => setEditingCategoryData(prev => ({ ...prev, description: e.target.value }))}
                       placeholder="Optional description"
                     />
                   </div>
                   <div className="flex items-center justify-between">
                     <Label htmlFor="edit-category-active">Active</Label>
                     <Switch
                       id="edit-category-active"
                       checked={editingCategoryData.isActive}
                       onCheckedChange={(checked: boolean) => setEditingCategoryData(prev => ({ ...prev, isActive: checked }))}
                     />
                   </div>
                 </div>
                 <DialogFooter>
                   <Button variant="outline" onClick={() => setEditingCategory(null)}>
                     Cancel
                   </Button>
                   <Button
                     onClick={() => {
                       if (editingCategory && editingCategoryData.name && editingCategoryData.icon) {
                         updateCategory.mutate({
                           id: editingCategory.id,
                           name: editingCategoryData.name,
                           icon: editingCategoryData.icon,
                           color: editingCategoryData.color,
                           description: editingCategoryData.description || undefined,
                           isActive: editingCategoryData.isActive
                         }, {
                           onSuccess: () => {
                             setEditingCategory(null);
                             toast.success("Category updated successfully");
                           },
                           onError: () => {
                             toast.error("Failed to update category");
                           }
                         });
                       }
                     }}
                     disabled={!editingCategoryData.name || !editingCategoryData.icon || updateCategory.isPending}
                   >
                     Save Changes
                   </Button>
                 </DialogFooter>
               </DialogContent>
             </Dialog>
           </div>
         </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {isLoadingNotifications ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">Loading notification settings...</div>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Push Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications on mobile devices
                    </p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Sound Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound for important notifications
                    </p>
                  </div>
                  <Switch checked={soundAlerts} onCheckedChange={setSoundAlerts} />
                </div>
                
                {emailNotifications && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="notification-email">Notification Email</Label>
                    <Input
                      id="notification-email"
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="notifications@yacht.com"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Choose which types of notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Service Requests
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for new service requests
                    </p>
                  </div>
                  <Switch
                    checked={serviceRequests}
                    onCheckedChange={setServiceRequests}
                    disabled={!pushNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Emergency Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Critical emergency notifications (always enabled)
                    </p>
                  </div>
                  <Switch
                    checked={emergencyAlerts}
                    onCheckedChange={setEmergencyAlerts}
                    disabled={true}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      System Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      System updates and maintenance alerts
                    </p>
                  </div>
                  <Switch
                    checked={systemMessages}
                    onCheckedChange={setSystemMessages}
                    disabled={!pushNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Guest Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Direct messages from guests
                    </p>
                  </div>
                  <Switch
                    checked={guestMessages}
                    onCheckedChange={setGuestMessages}
                    disabled={!pushNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Crew Messages
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Messages from other crew members
                    </p>
                  </div>
                  <Switch
                    checked={crewMessages}
                    onCheckedChange={setCrewMessages}
                    disabled={!pushNotifications}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Quiet Hours</CardTitle>
                <CardDescription>
                  Reduce notifications during specific hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Enable Quiet Hours
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Only emergency notifications during quiet hours
                    </p>
                  </div>
                  <Switch checked={quietHoursEnabled} onCheckedChange={setQuietHoursEnabled} />
                </div>
                
                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start">Start Time</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiet-end">End Time</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>
                  Contacts to notify in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newEmergencyContact}
                      onChange={(e) => setNewEmergencyContact(e.target.value)}
                      placeholder="Email or phone number"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmergencyContact()}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddEmergencyContact}
                      disabled={!newEmergencyContact.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{contact}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmergencyContact(contact)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {emergencyContacts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No emergency contacts configured
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications} disabled={isLoadingNotifications}>
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </div>
          </div>
          )}
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permission Matrix</CardTitle>
              <CardDescription>
                Configure permissions for each role in the Interior Department
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Banner */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Permission Information</AlertTitle>
                <AlertDescription>
                  <strong>Admin</strong> has all permissions by default and cannot be modified. <strong>ETO</strong> has high-level technical access including location deletion.
                </AlertDescription>
              </Alert>
              
              {/* Permission Matrix Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-10">
                          Permission
                        </TableHead>
                        {roles.map(role => (
                          <TableHead key={role} className="text-center min-w-[100px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs">{roleInfo[role].label}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <Fragment key={`category-group-${category}`}>
                          {/* Category Header Row */}
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={roles.length + 1} className="sticky left-0 z-10 bg-muted/30">
                              <span className="text-sm uppercase tracking-wide text-muted-foreground">
                                {categoryLabels[category]}
                              </span>
                            </TableCell>
                          </TableRow>
                          
                          {/* Permission Rows */}
                          {permissions.map(permission => (
                            <TableRow key={permission.id} className="hover:bg-muted/30">
                              <TableCell className="sticky left-0 bg-background z-10">
                                <div>
                                  <p className="text-sm">{permission.label}</p>
                                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                                </div>
                              </TableCell>
                              {roles.map(role => {
                                const isEnabled = localPermissions[role]?.includes(permission.id) || false;
                                const isAdminDisabled = role === "admin";
                                
                                return (
                                  <TableCell key={`${role}-${permission.id}`} className="text-center">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={isEnabled}
                                        onCheckedChange={() => handleTogglePermission(role, permission.id)}
                                        disabled={isAdminDisabled}
                                        className={isAdminDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                      />
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={handleResetAll}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Changes
                </Button>
                <Button onClick={handleSavePermissions}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Permissions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Server Configuration</CardTitle>
                <CardDescription>
                  Configure server and network settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="server-port">Server Port</Label>
                    <Input
                      id="server-port"
                      type="number"
                      value={serverPort}
                      onChange={(e) => setServerPort(e.target.value)}
                      placeholder="8080"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ws-port">WebSocket Port</Label>
                    <Input
                      id="ws-port"
                      type="number"
                      value={wsPort}
                      onChange={(e) => setWsPort(e.target.value)}
                      placeholder="8080"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="database-url">Database URL</Label>
                  <Input
                    id="database-url"
                    type="password"
                    value={databaseUrl}
                    onChange={(e) => setDatabaseUrl(e.target.value)}
                    placeholder="postgresql://user:pass@localhost/obedio"
                  />
                  <p className="text-sm text-muted-foreground">
                    Connection string for PostgreSQL database
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-timeout">API Timeout (seconds)</Label>
                    <Input
                      id="api-timeout"
                      type="number"
                      value={apiTimeout}
                      onChange={(e) => setApiTimeout(e.target.value)}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="log-level">Log Level</Label>
                    <Select value={logLevel} onValueChange={setLogLevel}>
                      <SelectTrigger id="log-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Features</CardTitle>
                <CardDescription>
                  Enable or disable system features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Performance Metrics
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Collect and display performance metrics
                    </p>
                  </div>
                  <Switch checked={enableMetrics} onCheckedChange={setEnableMetrics} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Debug Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detailed error messages and logging
                    </p>
                  </div>
                  <Switch checked={enableDebugMode} onCheckedChange={setEnableDebugMode} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current system health and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Connection</span>
                    <div className="flex items-center gap-2">
                      {systemStatus?.database?.connected ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">{systemStatus.database.status}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-error" />
                          <span className="text-sm text-error">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WebSocket Server</span>
                    <div className="flex items-center gap-2">
                      {systemStatus?.webSocket?.active ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">{systemStatus.webSocket.status}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-error" />
                          <span className="text-sm text-error">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Server</span>
                    <div className="flex items-center gap-2">
                      {systemStatus?.apiServer?.running ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">{systemStatus.apiServer.status}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-error" />
                          <span className="text-sm text-error">Stopped</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-sm text-muted-foreground">
                      {systemStatus?.uptime?.formatted || 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Restart</span>
                    <span className="text-sm text-muted-foreground">
                      {systemStatus?.lastRestart
                        ? new Date(systemStatus.lastRestart).toLocaleString()
                        : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Version</span>
                    <span className="text-sm text-muted-foreground">
                      Obedio v{systemStatus?.version || '1.0.0'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSystem}>
                <Save className="h-4 w-4 mr-2" />
                Save System Settings
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid gap-6">
            {/* Security Status - FIXED 2025-01-30 */}
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-700 dark:text-green-300 font-semibold">
                ✅ Security: Backup Permissions Active
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                <strong>FIXED 2025-01-30:</strong> Backup endpoints now properly require 'system.backup' permission.
                Only authorized administrators can access backup operations.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Backup Schedule</CardTitle>
                <CardDescription>
                  Configure automatic backup settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Backup Frequency</Label>
                  <RadioGroup value={backupSchedule} onValueChange={setBackupSchedule}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hourly" id="hourly" />
                      <Label htmlFor="hourly">Hourly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily (Recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual Only</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {backupSchedule !== "manual" && (
                  <div className="space-y-2">
                    <Label htmlFor="backup-time">Backup Time</Label>
                    <Input
                      id="backup-time"
                      type="time"
                      value={backupTime}
                      onChange={(e) => setBackupTime(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Time when automatic backup will run (in vessel timezone)
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="backup-retention">Retention Period (days)</Label>
                  <Input
                    id="backup-retention"
                    type="number"
                    value={backupRetention}
                    onChange={(e) => setBackupRetention(e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-sm text-muted-foreground">
                    How long to keep backup files before automatic deletion
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Backup Storage</CardTitle>
                <CardDescription>
                  Configure where backups are stored
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Storage Location</Label>
                  <RadioGroup value={backupLocation} onValueChange={setBackupLocation}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="local" id="local" />
                      <Label htmlFor="local" className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4" />
                        Local Server Storage
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="network" id="network" />
                      <Label htmlFor="network" className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Network Attached Storage (NAS)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Cloud Backup
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Also backup to cloud storage (requires internet)
                    </p>
                  </div>
                  <Switch checked={cloudBackupEnabled} onCheckedChange={setCloudBackupEnabled} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Backup Status</CardTitle>
                <CardDescription>
                  Current backup information and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastBackupTime && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Last Backup</AlertTitle>
                    <AlertDescription>
                      Successfully completed on {lastBackupTime.toLocaleDateString()} at {lastBackupTime.toLocaleTimeString()}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Backup Size</span>
                    <span className="text-sm text-muted-foreground">
                      {backupStatus?.totalSize
                        ? `${(backupStatus.totalSize / (1024 ** 3)).toFixed(2)} GB`
                        : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Number of Backups</span>
                    <span className="text-sm text-muted-foreground">
                      {backupStatus?.backupCount !== undefined
                        ? `${backupStatus.backupCount} backup${backupStatus.backupCount !== 1 ? 's' : ''} stored`
                        : 'Loading...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available Storage</span>
                    <span className="text-sm text-muted-foreground">
                      {backupStatus?.availableSpace
                        ? `${(backupStatus.availableSpace / (1024 ** 3)).toFixed(1)} GB free`
                        : 'Loading...'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button onClick={handleRunBackup} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Run Backup Now
                  </Button>
                  <Button onClick={handleRestoreBackup} variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Restore from Backup
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveBackup}>
                <Save className="h-4 w-4 mr-2" />
                Save Backup Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
