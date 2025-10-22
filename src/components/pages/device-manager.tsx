import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Smartphone, 
  Watch, 
  Wifi, 
  Plus, 
  Search,
  Battery,
  Signal,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Zap,
  Mic,
  Speaker,
  Activity,
  Circle,
  Radio
} from "lucide-react";
import { useDevices } from "../../hooks/useDevices";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";

// Device types
type DeviceType = "smart_button" | "watch" | "repeater" | "mobile_app";
type DeviceStatus = "online" | "offline" | "low_battery" | "error";

interface Device {
  id: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  location?: { id: string; name: string };
  crewMember?: { id: string; name: string };
  batteryLevel?: number;
  signalStrength?: number;
  lastSeen?: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
  config?: {
    ledEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    shakeThreshold?: number;
    buttonActions?: Record<string, string>;
  };
}

const deviceTypeInfo: Record<DeviceType, { label: string; icon: any; color: string }> = {
  smart_button: { label: "Smart Button", icon: Radio, color: "text-blue-500" },
  watch: { label: "Smart Watch", icon: Watch, color: "text-green-500" },
  repeater: { label: "Repeater", icon: Wifi, color: "text-purple-500" },
  mobile_app: { label: "Mobile App", icon: Smartphone, color: "text-orange-500" }
};

const statusColors: Record<DeviceStatus, string> = {
  online: "bg-success/10 text-success border-success/20",
  offline: "bg-muted text-muted-foreground border-border",
  low_battery: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20"
};

export function DeviceManagerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<DeviceType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | "all">("all");
  const [showPairingDialog, setShowPairingDialog] = useState(false);
  const [configDevice, setConfigDevice] = useState<Device | null>(null);
  
  // Fetch devices from API
  const { data: devices = [], isLoading, refetch } = useDevices();

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((device: Device) => {
      const matchesSearch = 
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.location?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.crewMember?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === "all" || device.type === selectedType;
      const matchesStatus = selectedStatus === "all" || device.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [devices, searchQuery, selectedType, selectedStatus]);

  // Group devices by type
  const devicesByType = useMemo(() => {
    const grouped = filteredDevices.reduce((acc: Record<DeviceType, Device[]>, device: Device) => {
      if (!acc[device.type]) acc[device.type] = [];
      acc[device.type].push(device);
      return acc;
    }, {} as Record<DeviceType, Device[]>);
    
    return grouped;
  }, [filteredDevices]);

  const handleTestDevice = (device: Device) => {
    toast.promise(
      fetch(`/api/devices/${device.id}/test`, { method: 'POST' }),
      {
        loading: `Testing ${device.name}...`,
        success: `Test signal sent to ${device.name}`,
        error: `Failed to test ${device.name}`
      }
    );
  };

  const handleSaveConfig = () => {
    if (!configDevice) return;
    
    toast.promise(
      fetch(`/api/devices/${configDevice.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: configDevice.config })
      }),
      {
        loading: 'Saving configuration...',
        success: 'Configuration saved successfully',
        error: 'Failed to save configuration'
      }
    );
    
    setConfigDevice(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Manager</h1>
          <p className="text-muted-foreground">Monitor and configure all connected devices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowPairingDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {devices.filter((d: Device) => d.status === "online").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Battery</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {devices.filter((d: Device) => d.status === "low_battery").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {devices.filter((d: Device) => d.status === "offline").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices, locations, crew..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={(value: any) => setSelectedType(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="smart_button">Smart Buttons</SelectItem>
                <SelectItem value="watch">Smart Watches</SelectItem>
                <SelectItem value="repeater">Repeaters</SelectItem>
                <SelectItem value="mobile_app">Mobile Apps</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="low_battery">Low Battery</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Device Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Devices
            <Badge variant="secondary" className="ml-2">{filteredDevices.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="buttons">
            Smart Buttons
            <Badge variant="secondary" className="ml-2">
              {devicesByType.smart_button?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="watches">
            Watches
            <Badge variant="secondary" className="ml-2">
              {devicesByType.watch?.length || 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="network">
            Network
            <Badge variant="secondary" className="ml-2">
              {devicesByType.repeater?.length || 0}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* All Devices Tab */}
        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">Loading devices...</div>
              </CardContent>
            </Card>
          ) : filteredDevices.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">No devices found</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device: Device) => (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  onTest={handleTestDevice}
                  onConfigure={() => setConfigDevice(device)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Smart Buttons Tab */}
        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Button Features</CardTitle>
              <CardDescription>
                Custom PCB with LED ring, microphone, speaker, accelerometer, 4 aux buttons + main touch button
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Circle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">LED Ring for visual feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Built-in microphone for voice commands</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Speaker className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Speaker for audio feedback</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Accelerometer for shake detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">800mAh+ battery for extended life</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-red-500" />
                    <span className="text-sm">LoRa 868MHz long-range communication</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {devicesByType.smart_button?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devicesByType.smart_button.map((device) => (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  onTest={handleTestDevice}
                  onConfigure={() => setConfigDevice(device)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">No smart buttons found</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Other tabs would follow similar pattern */}
      </Tabs>

      {/* Device Pairing Dialog */}
      <Dialog open={showPairingDialog} onOpenChange={setShowPairingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Put your device in pairing mode and it will appear here
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center py-8">
              <div className="animate-pulse">
                <Wifi className="h-12 w-12 mx-auto text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Scanning for devices...</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device Configuration Dialog */}
      {configDevice && (
        <Dialog open={!!configDevice} onOpenChange={() => setConfigDevice(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure {configDevice.name}</DialogTitle>
              <DialogDescription>
                Adjust device settings and behavior
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Device ID</Label>
                <Input value={configDevice.deviceId} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>Device Name</Label>
                <Input 
                  value={configDevice.name} 
                  onChange={(e) => setConfigDevice({...configDevice, name: e.target.value})}
                />
              </div>

              {configDevice.type === "smart_button" && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>LED Ring</Label>
                    <Switch 
                      checked={configDevice.config?.ledEnabled ?? true}
                      onCheckedChange={(checked) => 
                        setConfigDevice({
                          ...configDevice, 
                          config: {...configDevice.config, ledEnabled: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Sound Feedback</Label>
                    <Switch 
                      checked={configDevice.config?.soundEnabled ?? true}
                      onCheckedChange={(checked) => 
                        setConfigDevice({
                          ...configDevice, 
                          config: {...configDevice.config, soundEnabled: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Vibration</Label>
                    <Switch 
                      checked={configDevice.config?.vibrationEnabled ?? true}
                      onCheckedChange={(checked) => 
                        setConfigDevice({
                          ...configDevice, 
                          config: {...configDevice.config, vibrationEnabled: checked}
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Shake Sensitivity</Label>
                    <Select 
                      value={String(configDevice.config?.shakeThreshold || 3)}
                      onValueChange={(value) => 
                        setConfigDevice({
                          ...configDevice, 
                          config: {...configDevice.config, shakeThreshold: Number(value)}
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Very Sensitive</SelectItem>
                        <SelectItem value="2">Sensitive</SelectItem>
                        <SelectItem value="3">Normal</SelectItem>
                        <SelectItem value="4">Less Sensitive</SelectItem>
                        <SelectItem value="5">Very Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDevice(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig}>
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Device Card Component
function DeviceCard({ 
  device, 
  onTest, 
  onConfigure 
}: { 
  device: Device; 
  onTest: (device: Device) => void;
  onConfigure: (device: Device) => void;
}) {
  const typeInfo = deviceTypeInfo[device.type];
  const Icon = typeInfo.icon;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${typeInfo.color}`} />
            <div>
              <CardTitle className="text-base">{device.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{device.deviceId}</p>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[device.status]}>
            <Circle className="h-2 w-2 mr-1 fill-current" />
            {device.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location/Assignment */}
        <div className="text-sm">
          {device.location && (
            <p>Location: <span className="font-medium">{device.location.name}</span></p>
          )}
          {device.crewMember && (
            <p>Assigned to: <span className="font-medium">{device.crewMember.name}</span></p>
          )}
        </div>

        {/* Battery & Signal */}
        <div className="space-y-2">
          {device.batteryLevel !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  Battery
                </span>
                <span>{device.batteryLevel}%</span>
              </div>
              <Progress 
                value={device.batteryLevel} 
                className={`h-1 ${device.batteryLevel < 20 ? 'bg-warning' : ''}`}
              />
            </div>
          )}
          
          {device.signalStrength !== undefined && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1">
                  <Signal className="h-3 w-3" />
                  Signal
                </span>
                <span>{device.signalStrength}dBm</span>
              </div>
              <Progress 
                value={Math.min(100, (device.signalStrength + 120) * 100 / 120)} 
                className="h-1"
              />
            </div>
          )}
        </div>

        {/* Last Seen */}
        {device.lastSeen && (
          <p className="text-xs text-muted-foreground">
            Last seen: {new Date(device.lastSeen).toLocaleString()}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onTest(device)}
          >
            <Zap className="h-4 w-4 mr-1" />
            Test
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onConfigure(device)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}