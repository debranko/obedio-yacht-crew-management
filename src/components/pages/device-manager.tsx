import { useState, useMemo, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { SkeletonDeviceCard, SkeletonStat } from "../ui/skeleton";
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
  Radio,
  Loader2,
  ShieldCheck,
  XCircle,
  User,
  Trash2
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
import { Alert, AlertDescription } from "../ui/alert";
import { useLocations } from "../../hooks/useLocations";
import { useAppData } from "../../contexts/AppDataContext";
import type { Location } from "../../domain/locations";

// Device types
type DeviceType = "smart_button" | "watch" | "repeater" | "mobile_app";
type DeviceStatus = "online" | "offline" | "low_battery" | "error";

// Discovered device interface
interface DiscoveredDevice {
  deviceId: string;
  name: string;
  type: DeviceType;
  signalStrength: number;
  firmwareVersion: string;
  hardwareVersion: string;
  batteryLevel?: number;
}

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
  const [assignDevice, setAssignDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<Device | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Device discovery state
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredDevice | null>(null);
  const [isPairing, setIsPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch devices from API
  const { data: devices = [], isLoading, refetch } = useDevices();
  
  // Fetch locations and crew for assignment
  const { locations = [] } = useLocations();
  const { crewMembers } = useAppData();

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

  // Start device discovery
  const startDiscovery = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    setPairingError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/device-discovery/discover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start discovery');
      }
      
      // Poll for discovered devices every 2 seconds
      scanIntervalRef.current = setInterval(async () => {
        try {
          const devicesRes = await fetch('/api/device-discovery/pairing', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (devicesRes.ok) {
            const devices = await devicesRes.json();
            setDiscoveredDevices(devices);
          }
        } catch (error) {
          console.error('Error polling devices:', error);
        }
      }, 2000);
      
      // Stop scanning after 30 seconds
      setTimeout(() => {
        stopDiscovery();
      }, 30000);
    } catch (error) {
      toast.error('Failed to start device discovery');
      setIsScanning(false);
    }
  };
  
  // Stop device discovery
  const stopDiscovery = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };
  
  // Pair selected device
  const handlePairDevice = async () => {
    if (!selectedDevice) return;
    
    setIsPairing(true);
    setPairingError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/device-discovery/pair/${selectedDevice.deviceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedDevice.name,
          type: selectedDevice.type
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to pair device');
      }
      
      toast.success(`Successfully paired ${selectedDevice.name}`);
      stopDiscovery();
      setShowPairingDialog(false);
      refetch(); // Refresh devices list
    } catch (error: any) {
      setPairingError(error.message || 'Failed to pair device');
      toast.error('Failed to pair device');
    } finally {
      setIsPairing(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const handleTestDevice = async (device: Device) => {
    const token = localStorage.getItem('token');
    
    toast.promise(
      fetch(`/api/devices/${device.id}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      {
        loading: `Testing ${device.name}...`,
        success: `Test signal sent to ${device.name}`,
        error: `Failed to test ${device.name}`
      }
    );
  };

  const handleSaveConfig = async () => {
    if (!configDevice) return;
    
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`/api/devices/${configDevice.id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: configDevice.name,
          config: configDevice.config
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }
      
      toast.success('Configuration saved successfully');
      setConfigDevice(null);
      refetch(); // Refresh devices list
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving config:', error);
    }
  };
  
  const handleAssignDevice = async () => {
    if (!assignDevice) return;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/devices/${assignDevice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          locationId: assignDevice.location?.id || null,
          crewMemberId: assignDevice.crewMember?.id || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign device');
      }

      toast.success('Device assignment updated');
      setAssignDevice(null);
      refetch(); // Refresh devices list
    } catch (error) {
      toast.error('Failed to assign device');
      console.error('Error assigning device:', error);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteDevice) return;

    setIsDeleting(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/devices/${deleteDevice.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete device');
      }

      toast.success(`${deleteDevice.name} has been removed`);
      setDeleteDevice(null);
      refetch(); // Refresh devices list
    } catch (error) {
      toast.error('Failed to delete device');
      console.error('Error deleting device:', error);
    } finally {
      setIsDeleting(false);
    }
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
        {isLoading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
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
          </>
        )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonDeviceCard key={i} />
              ))}
            </div>
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
                 onAssign={() => setAssignDevice(device)}
                 onDelete={() => setDeleteDevice(device)}
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
                onAssign={() => setAssignDevice(device)}
                onDelete={() => setDeleteDevice(device)}
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

        {/* Watches Tab */}
        <TabsContent value="watches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Watch Features</CardTitle>
              <CardDescription>
                Wearable devices for crew members with real-time notifications and status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Watch className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time service request notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Health monitoring and activity tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Quick response buttons</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Personal device assignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Multi-day battery life</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm">Bluetooth & LoRa connectivity</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {devicesByType.watch?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devicesByType.watch.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onTest={handleTestDevice}
                  onConfigure={() => setConfigDevice(device)}
                  onAssign={() => setAssignDevice(device)}
                  onDelete={() => setDeleteDevice(device)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">No smart watches found</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Infrastructure</CardTitle>
              <CardDescription>
                LoRa repeaters and network devices for extended range and coverage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">LoRa 868MHz mesh network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Extended range up to 1km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Signal className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Signal strength monitoring</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Auto-routing and mesh healing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Power over Ethernet (PoE)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Encrypted communication</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {devicesByType.repeater?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devicesByType.repeater.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onTest={handleTestDevice}
                  onConfigure={() => setConfigDevice(device)}
                  onAssign={() => setAssignDevice(device)}
                  onDelete={() => setDeleteDevice(device)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">No repeaters found</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Device Pairing Dialog */}
      <Dialog
        open={showPairingDialog}
        onOpenChange={(open: boolean) => {
          setShowPairingDialog(open);
          if (!open) {
            stopDiscovery();
            setSelectedDevice(null);
            setPairingError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Put your device in pairing mode and it will appear here. The device LED should be blinking blue.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Discovery Controls */}
            {!isScanning && discoveredDevices.length === 0 && (
              <div className="text-center py-8">
                <Wifi className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Click the button below to start scanning for devices
                </p>
                <Button onClick={startDiscovery}>
                  <Search className="h-4 w-4 mr-2" />
                  Start Scanning
                </Button>
              </div>
            )}
            
            {/* Scanning Animation */}
            {isScanning && (
              <div className="text-center py-4">
                <div className="relative">
                  <Wifi className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scanning for devices... Make sure your device is in pairing mode
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopDiscovery}
                  className="mt-4"
                >
                  Stop Scanning
                </Button>
              </div>
            )}
            
            {/* Discovered Devices List */}
            {discoveredDevices.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium mb-2">Discovered Devices ({discoveredDevices.length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {discoveredDevices.map((device) => {
                    const DeviceIcon = deviceTypeInfo[device.type].icon;
                    const isSelected = selectedDevice?.deviceId === device.deviceId;
                    
                    return (
                      <Card
                        key={device.deviceId}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-primary' : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <DeviceIcon className={`h-5 w-5 ${deviceTypeInfo[device.type].color}`} />
                              <div>
                                <p className="font-medium">{device.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {device.deviceId} • v{device.firmwareVersion}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {device.batteryLevel !== undefined && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Battery className="h-3 w-3" />
                                  {device.batteryLevel}%
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-sm">
                                <Signal className="h-3 w-3" />
                                {device.signalStrength}dBm
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* No devices found message */}
            {!isScanning && discoveredDevices.length === 0 && scanIntervalRef.current && (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No devices found. Make sure your device is powered on and in pairing mode.
                </p>
              </div>
            )}
            
            {/* Pairing Error */}
            {pairingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{pairingError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPairingDialog(false)}
              disabled={isPairing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePairDevice}
              disabled={!selectedDevice || isPairing}
            >
              {isPairing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pairing...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Pair Selected Device
                </>
              )}
            </Button>
          </DialogFooter>
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
                      onCheckedChange={(checked: boolean) =>
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
                      onCheckedChange={(checked: boolean) =>
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
                      onCheckedChange={(checked: boolean) =>
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
                      onValueChange={(value: string) =>
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
      
      {/* Device Assignment Dialog */}
      {assignDevice && (
        <Dialog open={!!assignDevice} onOpenChange={() => setAssignDevice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign {assignDevice.name}</DialogTitle>
              <DialogDescription>
                Assign this device to a location or crew member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Assign to Location</Label>
                <Select
                  value={assignDevice.location?.id || "none"}
                  onValueChange={(value: string) =>
                    setAssignDevice({
                      ...assignDevice,
                      location: value === "none" ? undefined : locations.find((l: Location) => l.id === value)
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Location</SelectItem>
                    {locations.map((location: Location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} {location.floor && `(${location.floor})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Assign to Crew Member</Label>
                <Select
                  value={assignDevice.crewMember?.id || "none"}
                  onValueChange={(value: string) =>
                    setAssignDevice({
                      ...assignDevice,
                      crewMember: value === "none" ? undefined : crewMembers.find(c => c.id === value)
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crew member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Crew Member</SelectItem>
                    {crewMembers.map(crew => (
                      <SelectItem key={crew.id} value={crew.id}>
                        {crew.name} - {crew.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {assignDevice.type === "smart_button"
                    ? "Smart buttons are typically assigned to locations (cabins, common areas)"
                    : assignDevice.type === "watch"
                    ? "Smart watches are typically assigned to crew members"
                    : "Assign this device based on its intended use"
                  }
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignDevice(null)}>
                Cancel
              </Button>
              <Button onClick={handleAssignDevice}>
                Save Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Device Delete Confirmation Dialog */}
      {deleteDevice && (
        <Dialog open={!!deleteDevice} onOpenChange={() => setDeleteDevice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Device</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this device? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = deviceTypeInfo[deleteDevice.type].icon;
                      return <Icon className={`h-5 w-5 ${deviceTypeInfo[deleteDevice.type].color}`} />;
                    })()}
                    <div>
                      <p className="font-medium">{deleteDevice.name}</p>
                      <p className="text-xs text-muted-foreground">{deleteDevice.deviceId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This device will be completely removed from the system. All configuration and history will be lost.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDevice(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteDevice}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Device
                  </>
                )}
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
  onConfigure,
  onAssign,
  onDelete
}: {
  device: Device;
  onTest: (device: Device) => void;
  onConfigure: (device: Device) => void;
  onAssign: (device: Device) => void;
  onDelete?: (device: Device) => void;
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
        <div className="grid grid-cols-4 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onTest(device)}
            title="Test Device"
          >
            <Zap className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAssign(device)}
            title="Assign Device"
          >
            <User className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onConfigure(device)}
            title="Configure Device"
          >
            <Settings className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(device)}
              title="Delete Device"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}