import { useState, Fragment, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Shield, Settings as SettingsIcon, Server, Save, RotateCcw, Info } from "lucide-react";
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
  initialTab?: "general" | "roles" | "system";
}

export function SettingsPage({ initialTab = "general" }: SettingsPageProps) {
  const { rolePermissions, updateRolePermissions, userPreferences, updateUserPreferences } = useAppData();
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Update active tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // General Settings State
  const [yachtName, setYachtName] = useState("M/Y Serenity");
  const [yachtType, setYachtType] = useState<"yacht" | "villa">("yacht");
  const [notifications, setNotifications] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [timezone, setTimezone] = useState("Europe/Monaco");
  const [serviceRequestDisplayMode, setServiceRequestDisplayMode] = useState<"guest-name" | "location">(
    userPreferences.serviceRequestDisplayMode
  );
  const [servingNowTimeout, setServingNowTimeout] = useState<number>(
    userPreferences.servingNowTimeout || 5
  );
  const [requestDialogRepeatInterval, setRequestDialogRepeatInterval] = useState<number>(
    userPreferences.requestDialogRepeatInterval ?? 60
  );
  
  // Sync with context when it changes
  useEffect(() => {
    setServiceRequestDisplayMode(userPreferences.serviceRequestDisplayMode);
    setServingNowTimeout(userPreferences.servingNowTimeout || 5);
    setRequestDialogRepeatInterval(userPreferences.requestDialogRepeatInterval ?? 60);
  }, [userPreferences.serviceRequestDisplayMode, userPreferences.servingNowTimeout, userPreferences.requestDialogRepeatInterval]);
  
  // Local state for permissions (will be saved on "Save" button)
  const [localPermissions, setLocalPermissions] = useState(rolePermissions);
  
  const handleSaveGeneral = () => {
    // Save user preferences to context
    updateUserPreferences({ 
      serviceRequestDisplayMode,
      servingNowTimeout,
      requestDialogRepeatInterval,
    });
    
    // In production, these would be API calls
    toast.success("General settings saved successfully");
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
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="system">
            <Server className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="mb-4">Vessel Information</h3>
                
                <div className="space-y-4">
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
                    <Select value={yachtType} onValueChange={(value: "yacht" | "villa") => setYachtType(value)}>
                      <SelectTrigger id="yacht-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yacht">Yacht</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="floors-decks">Floors / Decks</Label>
                    <Input
                      id="floors-decks"
                      defaultValue="Sun Deck, Upper Deck, Main Deck, Lower Deck"
                      placeholder="e.g., Sun Deck, Upper Deck, Main Deck"
                    />
                    <p className="text-sm text-muted-foreground">
                      Define the floors/decks of your vessel. These will be used for organizing locations. Separate multiple floors with commas.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-4">Time & Location</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                        <SelectItem value="Europe/Monaco">Europe/Monaco</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                        <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                        <SelectItem value="Europe/Athens">Europe/Athens</SelectItem>
                        <SelectItem value="America/New_York">America/New York</SelectItem>
                        <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                        <SelectItem value="America/Miami">America/Miami (Eastern)</SelectItem>
                        <SelectItem value="America/Antigua">Caribbean/Antigua</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                        <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                        <SelectItem value="Asia/Hong_Kong">Asia/Hong Kong</SelectItem>
                        <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
                        <SelectItem value="Pacific/Auckland">Pacific/Auckland</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Set the timezone for displaying times throughout the system
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-4">Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts for important events
                      </p>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Automatic Backup</Label>
                      <p className="text-sm text-muted-foreground">
                        Daily backup of all data
                      </p>
                    </div>
                    <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="mb-4">Display Preferences</h3>
                
                <div className="space-y-4">
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
                      Choose how service requests are displayed. "Guest Name" shows who is calling (e.g., Mr. Anderson). "Location" shows where the call is from (e.g., Owner's Stateroom, Dining Room) - useful for public areas.
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
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral}>
                  <Save className="h-4 w-4 mr-2" />
                  Save General Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab - MATRIX TABLE */}
        <TabsContent value="roles" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="mb-2">Role Permission Matrix</h3>
                <p className="text-sm text-muted-foreground">
                  Configure permissions for each role in the Interior Department. Check the box to grant permission.
                </p>
              </div>
              
              <Separator />
              
              {/* Info Banner */}
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Admin</strong> has all permissions by default and cannot be modified. <strong>ETO</strong> has high-level technical access including location deletion.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {roles.map(role => (
                        <Badge key={role} className={roleInfo[role].color}>
                          {roleInfo[role].label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
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
            </div>
          </Card>
        </TabsContent>

        {/* System Tab (Placeholder for future) */}
        <TabsContent value="system" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="mb-2">System Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced system settings and server configuration.
                </p>
              </div>
              
              <Separator />
              
              <div className="p-8 text-center text-muted-foreground">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>System configuration will be available in a future update.</p>
                <p className="text-sm mt-2">This will include IP configuration, backup settings, and server management.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
