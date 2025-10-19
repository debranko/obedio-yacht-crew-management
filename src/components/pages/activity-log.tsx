import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useAppData } from "../../contexts/AppDataContext";
import { Search, Smartphone, Bell, Users, Circle, User, MapPin } from "lucide-react";

// Simple date formatting helper
const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ActivityLogPage() {
  const { deviceLogs, serviceRequestHistory, crewChangeLogs, crewMembers } = useAppData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Get unique users for filter
  const allUsers = useMemo(() => {
    const users = new Set<string>();
    deviceLogs.forEach(log => log.user && users.add(log.user));
    crewChangeLogs.forEach(log => users.add(log.performedBy));
    serviceRequestHistory.forEach(log => log.completedBy && users.add(log.completedBy));
    return Array.from(users);
  }, [deviceLogs, crewChangeLogs, serviceRequestHistory]);

  // Filter and search device logs
  const filteredDeviceLogs = useMemo(() => {
    return deviceLogs
      .filter(log => {
        const matchesSearch = searchQuery === "" || 
          log.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.message.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesUser = filterUser === "all" || log.user === filterUser;
        
        return matchesSearch && matchesUser;
      })
      .slice(0, itemsPerPage);
  }, [deviceLogs, searchQuery, filterUser, itemsPerPage]);

  // Filter and search service request history
  const filteredServiceRequests = useMemo(() => {
    return serviceRequestHistory
      .filter(log => {
        const req = log.originalRequest;
        const matchesSearch = searchQuery === "" || 
          req.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.guestCabin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (req.voiceTranscript && req.voiceTranscript.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (req.notes && req.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (req.assignedTo && req.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
          log.completedBy.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesUser = filterUser === "all" || 
          req.assignedTo === filterUser || 
          log.completedBy === filterUser;
        
        return matchesSearch && matchesUser;
      })
      .slice(0, itemsPerPage);
  }, [serviceRequestHistory, searchQuery, filterUser, itemsPerPage]);

  // Filter and search crew change logs
  const filteredCrewChangeLogs = useMemo(() => {
    return crewChangeLogs
      .filter(log => {
        const matchesSearch = searchQuery === "" || 
          log.crewMember.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.shift.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.performedBy.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesUser = filterUser === "all" || log.performedBy === filterUser;
        
        return matchesSearch && matchesUser;
      })
      .slice(0, itemsPerPage);
  }, [crewChangeLogs, searchQuery, filterUser, itemsPerPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success/10 text-success border-success/20';
      case 'offline': return 'bg-muted text-muted-foreground border-border';
      case 'alert': return 'bg-warning/10 text-warning border-warning/20';
      case 'maintenance': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'normal': return 'bg-primary/10 text-primary border-primary/20';
      case 'urgent': return 'bg-warning/10 text-warning border-warning/20';
      case 'emergency': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-success/10 text-success border-success/20';
      case 'removed': return 'bg-error/10 text-error border-error/20';
      case 'moved_to_primary': return 'bg-primary/10 text-primary border-primary/20';
      case 'moved_to_backup': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter by User */}
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {allUsers.map(user => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Items per page */}
          <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">Show 20</SelectItem>
              <SelectItem value="50">Show 50</SelectItem>
              <SelectItem value="100">Show 100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabs with Logs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Devices
            <Badge variant="secondary" className="ml-1">{filteredDeviceLogs.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="service-requests" className="gap-2">
            <Bell className="h-4 w-4" />
            Service Requests
            <Badge variant="secondary" className="ml-1">{filteredServiceRequests.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="crew-changes" className="gap-2">
            <Users className="h-4 w-4" />
            Crew Changes
            <Badge variant="secondary" className="ml-1">{filteredCrewChangeLogs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Device Logs */}
        <TabsContent value="devices" className="space-y-0">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="p-4 font-medium text-muted-foreground">Device</th>
                    <th className="p-4 font-medium text-muted-foreground">Location</th>
                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                    <th className="p-4 font-medium text-muted-foreground">Message</th>
                    <th className="p-4 font-medium text-muted-foreground">User</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeviceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No device logs found
                      </td>
                    </tr>
                  ) : (
                    filteredDeviceLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4 text-sm">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{log.device}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{log.location}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={getStatusColor(log.status)}>
                            <Circle className="h-2 w-2 mr-1 fill-current" />
                            {log.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{log.message}</td>
                        <td className="p-4 text-sm text-muted-foreground">{log.user || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Service Requests */}
        <TabsContent value="service-requests" className="space-y-0">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Completed</th>
                    <th className="p-4 font-medium text-muted-foreground">Guest</th>
                    <th className="p-4 font-medium text-muted-foreground">Location</th>
                    <th className="p-4 font-medium text-muted-foreground">Request</th>
                    <th className="p-4 font-medium text-muted-foreground">Priority</th>
                    <th className="p-4 font-medium text-muted-foreground">Assigned To</th>
                    <th className="p-4 font-medium text-muted-foreground">Completed By</th>
                    <th className="p-4 font-medium text-muted-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServiceRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No completed service requests found
                      </td>
                    </tr>
                  ) : (
                    filteredServiceRequests.map((log) => {
                      const req = log.originalRequest;
                      return (
                        <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                          <td className="p-4 text-sm">
                            {formatDateTime(log.completedAt)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">{req.guestName}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{req.guestCabin}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm max-w-xs truncate" title={req.voiceTranscript || req.notes || 'Service request'}>
                            {req.voiceTranscript || req.notes || '—'}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={getPriorityColor(req.priority)}>
                              {req.priority}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">{req.assignedTo || '—'}</td>
                          <td className="p-4 text-sm font-medium">{log.completedBy}</td>
                          <td className="p-4 text-sm">
                            {formatDuration(log.duration)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Crew Changes */}
        <TabsContent value="crew-changes" className="space-y-0">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="p-4 font-medium text-muted-foreground">Crew Member</th>
                    <th className="p-4 font-medium text-muted-foreground">Change Type</th>
                    <th className="p-4 font-medium text-muted-foreground">Date</th>
                    <th className="p-4 font-medium text-muted-foreground">Shift</th>
                    <th className="p-4 font-medium text-muted-foreground">Details</th>
                    <th className="p-4 font-medium text-muted-foreground">Performed By</th>
                    <th className="p-4 font-medium text-muted-foreground">Notified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrewChangeLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No crew change logs found. Changes will appear here after using "Notify Crew" feature.
                      </td>
                    </tr>
                  ) : (
                    filteredCrewChangeLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4 text-sm">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="p-4 text-sm font-medium">{log.crewMember}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={getChangeTypeColor(log.changeType)}>
                            {log.changeType.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{formatDate(log.date)}</td>
                        <td className="p-4 text-sm">{log.shift}</td>
                        <td className="p-4 text-sm text-muted-foreground">{log.details || '—'}</td>
                        <td className="p-4 text-sm">{log.performedBy}</td>
                        <td className="p-4">
                          {log.notified ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              ✓ Notified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                              Not sent
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-primary">{filteredDeviceLogs.length}</p>
            <p className="text-sm text-muted-foreground">Device Events</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-primary">{filteredServiceRequests.length}</p>
            <p className="text-sm text-muted-foreground">Service Requests</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-primary">{filteredCrewChangeLogs.length}</p>
            <p className="text-sm text-muted-foreground">Crew Changes</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
