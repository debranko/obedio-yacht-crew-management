import { Search, Filter, Download, Plus, QrCode, MapPin, RefreshCw, Activity, User, UserX } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { StatusChip } from "../status-chip";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { useAppData } from "../../contexts/AppDataContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";

// NOTE: This is mock data for demonstration. 
// In production, this would come from AppDataContext/locations service with real device data
const devices = {
  buttons: [
    { id: "BTN-001", name: "Owner's Stateroom - Bedside", location: "Owner's Stateroom", status: "online", battery: 85, lastSeen: "2m ago" },
    { id: "BTN-002", name: "VIP Cabin - Bathroom", location: "VIP Cabin", status: "online", battery: 72, lastSeen: "5m ago" },
    { id: "BTN-003", name: "Sun Deck Lounge - Bar Area", location: "Sun Deck Lounge", status: "low-battery", battery: 15, lastSeen: "1m ago" },
    { id: "BTN-004", name: "Main Salon - Entry", location: "Main Salon", status: "online", battery: 91, lastSeen: "3m ago" },
  ],
  watches: [
    { id: "WCH-001", name: "Maria Lopez", role: "Chief Stewardess", status: "online", battery: 68, lastSeen: "1m ago" },
    { id: "WCH-002", name: "Sarah Johnson", role: "Second Stewardess", status: "online", battery: 45, lastSeen: "2m ago" },
    { id: "WCH-003", name: "Sophie Martin", role: "Stewardess", status: "online", battery: 82, lastSeen: "1m ago" },
    { id: "WCH-004", name: "David Brown", role: "Chef de Cuisine", status: "low-battery", battery: 12, lastSeen: "4m ago" },
  ],
  repeaters: [
    { id: "RPT-001", name: "Main Deck Repeater", location: "Main Deck", status: "online", connectedDevices: 24, lastSeen: "30s ago" },
    { id: "RPT-002", name: "Bridge Deck Repeater", location: "Bridge Deck", status: "online", connectedDevices: 18, lastSeen: "45s ago" },
    { id: "RPT-003", name: "Lower Deck Repeater", location: "Lower Deck", status: "online", connectedDevices: 15, lastSeen: "1m ago" },
  ]
};

export function DeviceManagerPage() {
  const { getDeviceAssignment } = useAppData();
  
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search devices..." 
              className="pl-9 max-w-md"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Provision
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            OTA Update
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Device Tabs */}
      <Tabs defaultValue="buttons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="buttons">Smart Buttons</TabsTrigger>
          <TabsTrigger value="watches">Smart Watches</TabsTrigger>
          <TabsTrigger value="repeaters">Repeaters</TabsTrigger>
          <TabsTrigger value="provisioning">Provisioning</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        {/* Smart Buttons */}
        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.buttons.map((device) => (
                  <TableRow key={device.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{device.id}</TableCell>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{device.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={device.status as any} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={device.battery} className="h-2" />
                        <span className="text-sm text-muted-foreground min-w-[3ch]">{device.battery}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{device.lastSeen}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Activity className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Smart Watches */}
        <TabsContent value="watches" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.watches.map((device) => {
                  const assignment = getDeviceAssignment(device.id);
                  return (
                    <TableRow key={device.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{device.id}</TableCell>
                      <TableCell>{device.name}</TableCell>
                      <TableCell>
                        {assignment ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span>{assignment.crewMemberName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <UserX className="h-4 w-4" />
                            <span className="text-sm">Not Assigned</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={device.status as any} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={device.battery} className="h-2" />
                          <span className="text-sm text-muted-foreground min-w-[3ch]">{device.battery}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{device.lastSeen}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Activity className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Repeaters */}
        <TabsContent value="repeaters" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected Devices</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.repeaters.map((device) => (
                  <TableRow key={device.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{device.id}</TableCell>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{device.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={device.status as any} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{device.connectedDevices} devices</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{device.lastSeen}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Activity className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Provisioning */}
        <TabsContent value="provisioning" className="space-y-4">
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                <QrCode className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3>No devices in provisioning</h3>
              <p className="text-muted-foreground">
                Scan QR codes or add devices manually to begin provisioning.
              </p>
              <Button>
                <QrCode className="h-4 w-4 mr-2" />
                Start QR Provisioning
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Health */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4>System Health</h4>
                <Badge variant="secondary" className="bg-success/10 text-success">Excellent</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">All Devices</span>
                  <span className="font-medium">100 / 100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Online</span>
                  <span className="font-medium">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4>Battery Status</h4>
                <Badge variant="secondary" className="bg-warning/10 text-warning">Fair</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Low Battery</span>
                  <span className="font-medium">3 devices</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Battery</span>
                  <span className="font-medium">64%</span>
                </div>
                <Progress value={64} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4>Network Health</h4>
                <Badge variant="secondary" className="bg-success/10 text-success">Good</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Repeaters</span>
                  <span className="font-medium">3 / 3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coverage</span>
                  <span className="font-medium">98%</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
