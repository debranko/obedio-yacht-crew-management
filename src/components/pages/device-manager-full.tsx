/**
 * Device Manager Page - Complete Implementation
 * Manages all IoT devices: Smart Buttons, Watches, Repeaters, Mobile Apps
 */

import { useState } from 'react';
import { useDevices, useDeviceMutations, Device } from '../../hooks/useDevices';
import { useLocations } from '../../hooks/useLocations';
import { useAppData } from '../../contexts/AppDataContext';
import { SmartButtonConfigDialog } from '../devices/SmartButtonConfigDialog';
import { WatchConfigDialog } from '../devices/WatchConfigDialog';
import { AddDeviceDialog } from '../devices/AddDeviceDialog';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Plus,
  Edit2,
  Trash2,
  TestTube,
  Battery,
  Signal,
  MapPin,
  User,
  Wifi,
  Radio,
  Smartphone,
  Watch,
  Zap,
  Activity,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '../ui/progress';

export function DeviceManagerPage() {
  const [activeTab, setActiveTab] = useState('buttons');
  const [searchQuery] = useState('');
  const [statusFilter] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch data
  const { data: allDevices = [], refetch } = useDevices();
  const { locations } = useLocations();
  const { crewMembers } = useAppData();
  const { createDevice, updateDevice, deleteDevice, testDevice } = useDeviceMutations();

  // Filter devices by tab
  const filterByType = (type: string) => {
    return allDevices.filter((d) => d.type === type);
  };

  const smartButtons = filterByType('smart_button');
  const watches = filterByType('watch');
  const repeaters = filterByType('repeater');
  const mobileApps = filterByType('mobile_app');

  // Apply search and status filter
  const applyFilters = (devices: Device[]) => {
    return devices.filter((device) => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.deviceId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'all' || device.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      online: 'bg-green-500',
      offline: 'bg-gray-500',
      low_battery: 'bg-yellow-500',
      error: 'bg-red-500',
    };
    return <Badge className={`${colors[status] || 'bg-gray-500'} text-white`}>{status}</Badge>;
  };

  // Get battery icon color
  const getBatteryColor = (level?: number) => {
    if (!level) return 'text-gray-400';
    if (level < 20) return 'text-red-500';
    if (level < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get signal strength bars
  const getSignalBars = (rssi?: number) => {
    if (!rssi) return 0;
    if (rssi > -50) return 4;
    if (rssi > -60) return 3;
    if (rssi > -70) return 2;
    return 1;
  };

  // Get connection type icon
  const getConnectionIcon = (type?: string) => {
    if (type?.startsWith('lora')) return <Radio className="h-4 w-4" />;
    if (type === 'wifi') return <Wifi className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  // Handle test device
  const handleTest = async (device: Device) => {
    try {
      await testDevice(device.id);
      toast.success(`Test signal sent to ${device.name}`);
    } catch (error) {
      toast.error('Failed to send test signal');
    }
  };

  // Handle delete
  const handleDelete = async (device: Device) => {
    if (!confirm(`Delete ${device.name}?`)) return;

    try {
      await deleteDevice(device.id);
      toast.success('Device deleted');
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  // Handle add new device
  const handleAdd = async (deviceData: {
    deviceId: string;
    name: string;
    type: 'smart_button' | 'watch' | 'repeater' | 'mobile_app';
    subType?: string;
    locationId?: string;
    crewMemberId?: string;
    connectionType?: string;
  }) => {
    try {
      await createDevice({
        ...deviceData,
        status: 'offline', // New devices start as offline until they connect
      });
      toast.success(`Device ${deviceData.name} added successfully!`);
      refetch(); // Refresh device list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Failed to add device:', errorMessage);
      toast.error('Failed to add device', {
        description: errorMessage,
      });
      throw error; // Re-throw to let dialog handle it
    }
  };

  // Handle configuration save
  const handleConfigSave = async (config: any) => {
    if (!selectedDevice) return;
    
    try {
      await updateDevice({ id: selectedDevice.id, data: config });
      toast.success('Configuration saved successfully!');
      refetch(); // Refresh device list
    } catch (error) {
      toast.error('Failed to save configuration');
    }
  };

  // Smart Buttons Table
  const SmartButtonsTab = () => {
    const filtered = applyFilters(smartButtons);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Smart Buttons ({filtered.length})</h3>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Button
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>Connection</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
                <TableCell>{device.name}</TableCell>
                <TableCell>
                  {device.location ? (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-500" />
                      <span>{device.location.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(device.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Battery className={`h-4 w-4 ${getBatteryColor(device.batteryLevel)}`} />
                    <span>{device.batteryLevel || 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Signal className="h-4 w-4 text-gray-500" />
                    <div className="flex gap-0.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-3 rounded-sm ${
                            i < getSignalBars(device.signalStrength)
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">
                      {device.signalStrength} dBm
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getConnectionIcon(device.connectionType)}
                    <span className="text-xs">
                      {device.connectionType?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {device.lastSeen
                    ? new Date(device.lastSeen).toLocaleString()
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDevice(device);
                        setIsConfigDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTest(device)}
                    >
                      <TestTube className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(device)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No smart buttons found
          </div>
        )}
      </div>
    );
  };

  // Watches Tab
  const WatchesTab = () => {
    const filtered = applyFilters(watches);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Smart Watches ({filtered.length})</h3>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Watch
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned Crew</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Battery</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
                <TableCell>{device.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {device.subType?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  {device.crewMember ? (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-gray-500" />
                      <span>{device.crewMember.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(device.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={device.batteryLevel || 0} className="w-16" />
                    <span className="text-xs">{device.batteryLevel}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Signal className="h-4 w-4" />
                    <span className="text-xs">{device.signalStrength} dBm</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {device.lastSeen
                    ? new Date(device.lastSeen).toLocaleString()
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedDevice(device);
                        setIsConfigDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(device)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No watches found
          </div>
        )}
      </div>
    );
  };

  // Repeaters Tab
  const RepeatersTab = () => {
    const filtered = applyFilters(repeaters);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Repeaters ({filtered.length})</h3>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Repeater
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((device) => {
            const config = device.config as any;
            const connectedDevices = config?.connectedDevices || 0;
            const frequency = config?.frequency || 'Unknown';
            const powerSource = config?.powerSource || 'Unknown';

            return (
              <Card key={device.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{device.name}</h4>
                      <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
                    </div>
                    {getStatusBadge(device.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency:</span>
                      <Badge variant="outline">{frequency} MHz</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Power Source:</span>
                      <span className="font-mono">{powerSource}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connected Devices:</span>
                      <span className="font-semibold">{connectedDevices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Signal:</span>
                      <span>{device.signalStrength} dBm</span>
                    </div>
                    {device.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span>{device.location.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedDevice(device);
                        setIsConfigDialogOpen(true);
                      }}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(device)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No repeaters found
          </div>
        )}
      </div>
    );
  };

  // Mobile Apps Tab
  const MobileAppsTab = () => {
    const filtered = applyFilters(mobileApps);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Mobile Apps ({filtered.length})</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Assigned Crew</TableHead>
              <TableHead>App Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((device) => {
              const config = device.config as any;
              const appVersion = config?.appVersion || 'Unknown';

              return (
                <TableRow key={device.id}>
                  <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span>{device.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {device.subType?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {device.crewMember ? (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-500" />
                        <span>{device.crewMember.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{appVersion}</TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {device.lastSeen
                      ? new Date(device.lastSeen).toLocaleString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedDevice(device);
                          setIsConfigDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No mobile apps found
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 p-6">

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buttons">
            <Zap className="h-4 w-4 mr-2" />
            Smart Buttons ({smartButtons.length})
          </TabsTrigger>
          <TabsTrigger value="watches">
            <Watch className="h-4 w-4 mr-2" />
            Watches ({watches.length})
          </TabsTrigger>
          <TabsTrigger value="repeaters">
            <Radio className="h-4 w-4 mr-2" />
            Repeaters ({repeaters.length})
          </TabsTrigger>
          <TabsTrigger value="apps">
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile Apps ({mobileApps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buttons">
          <Card className="p-6">
            <SmartButtonsTab />
          </Card>
        </TabsContent>

        <TabsContent value="watches">
          <Card className="p-6">
            <WatchesTab />
          </Card>
        </TabsContent>

        <TabsContent value="repeaters">
          <Card className="p-6">
            <RepeatersTab />
          </Card>
        </TabsContent>

        <TabsContent value="apps">
          <Card className="p-6">
            <MobileAppsTab />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Smart Button Configuration Dialog */}
      {selectedDevice?.type === 'smart_button' && (
        <SmartButtonConfigDialog
          device={selectedDevice}
          open={isConfigDialogOpen}
          onClose={() => {
            setIsConfigDialogOpen(false);
            setSelectedDevice(null);
          }}
          onSave={handleConfigSave}
          locations={locations || []}
        />
      )}

      {/* Watch Configuration Dialog */}
      {selectedDevice?.type === 'watch' && (
        <WatchConfigDialog
          device={selectedDevice}
          open={isConfigDialogOpen}
          onClose={() => {
            setIsConfigDialogOpen(false);
            setSelectedDevice(null);
          }}
          onSave={handleConfigSave}
        />
      )}

      {/* TODO: Other device type dialogs (repeater, mobile_app) */}
      {selectedDevice?.type !== 'smart_button' && selectedDevice?.type !== 'watch' && (
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configure Device: {selectedDevice?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">
                Configuration dialog for {selectedDevice?.type} coming soon!
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
                <pre>{JSON.stringify(selectedDevice?.config, null, 2)}</pre>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsConfigDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Device Dialog */}
      <AddDeviceDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAdd}
        locations={locations || []}
        crewMembers={crewMembers}
        defaultType={activeTab === 'buttons' ? 'smart_button' : activeTab === 'watches' ? 'watch' : 'repeater'}
      />
    </div>
  );
}
