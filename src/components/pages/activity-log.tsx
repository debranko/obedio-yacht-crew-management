import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { useAppData } from "../../contexts/AppDataContext";
import { useDeviceLogs } from "../../hooks/useDeviceLogs";
import { useCrewChangeLogs } from "../../hooks/useCrewChangeLogsApi";
import { useActivityLogs } from "../../hooks/useActivityLogs";
import { Search, Smartphone, Bell, Users, Circle, User, MapPin, Loader2, Activity } from "lucide-react";

// Simple date formatting helper
const formatDateTime = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ActivityLogPage() {
  const { crewMembers } = useAppData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [deviceLogStatus, setDeviceLogStatus] = useState<string | undefined>();
  const [crewChangeAction, setCrewChangeAction] = useState<string | undefined>();
  const [activityLogType, setActivityLogType] = useState<string | undefined>();
  
  // Fetch device logs from backend API
  const { data: deviceLogs = [], isLoading: isLoadingDeviceLogs, error: deviceLogsError } = useDeviceLogs({
    search: searchQuery || undefined,
    status: deviceLogStatus,
    limit: itemsPerPage,
  });

  // Fetch ALL activity logs (we'll filter for service requests on frontend)
  const {
    logs: allActivityLogsForFiltering = [],
    isLoading: isLoadingServiceRequestActivity,
    error: serviceRequestActivityError
  } = useActivityLogs({
    limit: itemsPerPage * 3, // Get more since we're filtering on frontend
    page: 1,
  });

  // Fetch crew change logs from backend API
  const {
    data: crewChangeLogsResponse,
    isLoading: isLoadingCrewChanges,
    error: crewChangesError
  } = useCrewChangeLogs({
    search: searchQuery || undefined,
    limit: itemsPerPage,
    action: crewChangeAction,
    page: 1,
  });

  // Fetch comprehensive activity logs from backend API
  const {
    logs: activityLogs = [],
    isLoading: isLoadingActivityLogs,
    error: activityLogsError
  } = useActivityLogs({
    type: activityLogType,
    limit: itemsPerPage,
    page: 1,
  });

  const crewChangeLogs = crewChangeLogsResponse?.data || [];

  // Get unique users for filter
  const allUsers = useMemo(() => {
    const users = new Set<string>();
    if (Array.isArray(deviceLogs)) {
      deviceLogs.forEach((log: any) => log.user && users.add(log.user));
    }
    if (Array.isArray(crewChangeLogs)) {
      crewChangeLogs.forEach((log: any) => log.performedBy && users.add(log.performedBy));
    }
    if (Array.isArray(activityLogs)) {
      activityLogs.forEach((log: any) => log.user?.username && users.add(log.user.username));
    }
    return Array.from(users);
  }, [deviceLogs, crewChangeLogs, activityLogs]);

  // Process device logs - already filtered by API
  const filteredDeviceLogs = useMemo(() => {
    if (!Array.isArray(deviceLogs)) return [];
    
    // Additional client-side filtering if needed
    return deviceLogs.filter((log: any) => {
      const matchesUser = filterUser === "all" || log.user === filterUser;
      return matchesUser;
    });
  }, [deviceLogs, filterUser]);

  // Filter service request related activity (Button Press, Request Accepted, Request Completed)
  const filteredServiceRequests = useMemo(() => {
    if (!Array.isArray(allActivityLogsForFiltering)) return [];

    // Filter for service request flow events
    const serviceRequestEvents = allActivityLogsForFiltering.filter((log: any) => {
      // Include: Button Press (type=device), Request Accepted, Request Completed (type=service_request)
      return (log.type === 'device' && log.action === 'Button Press') ||
             (log.type === 'service_request');
    });

    // Filter by user if specified
    if (filterUser === "all") return serviceRequestEvents;

    return serviceRequestEvents.filter((log: any) => {
      return log.user?.username === filterUser;
    });
  }, [allActivityLogsForFiltering, filterUser]);

  // Filter crew change logs by user (search is handled by API)
  const filteredCrewChangeLogs = useMemo(() => {
    if (!Array.isArray(crewChangeLogs)) return [];
    if (filterUser === "all") return crewChangeLogs;
    
    return crewChangeLogs.filter((log: any) => log.performedBy === filterUser);
  }, [crewChangeLogs, filterUser]);

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
          <Select value={itemsPerPage.toString()} onValueChange={(v: string) => setItemsPerPage(Number(v))}>
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
      <Tabs defaultValue="all-activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-activity" className="gap-2">
            <Activity className="h-4 w-4" />
            All Activity
            <Badge variant="secondary" className="ml-1">{activityLogs.length}</Badge>
          </TabsTrigger>
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

        {/* All Activity Logs */}
        <TabsContent value="all-activity" className="space-y-0">
          <Card>
            {/* Type Filter for Activity Logs */}
            <div className="p-4 border-b border-border">
              <Select value={activityLogType || "all"} onValueChange={(v: string) => setActivityLogType(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="device">Device Events</SelectItem>
                  <SelectItem value="service_request">Service Requests</SelectItem>
                  <SelectItem value="crew">Crew Changes</SelectItem>
                  <SelectItem value="guest">Guest Activity</SelectItem>
                  <SelectItem value="system">System Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="p-4 font-medium text-muted-foreground">Type</th>
                    <th className="p-4 font-medium text-muted-foreground">Action</th>
                    <th className="p-4 font-medium text-muted-foreground">Details</th>
                    <th className="p-4 font-medium text-muted-foreground">Location</th>
                    <th className="p-4 font-medium text-muted-foreground">User/Device</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingActivityLogs ? (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading activity logs...
                        </div>
                      </td>
                    </tr>
                  ) : activityLogsError ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-error">
                        Failed to load activity logs. Please try again.
                      </td>
                    </tr>
                  ) : activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No activity logs found. Activity will appear here as you use the system.
                      </td>
                    </tr>
                  ) : (
                    activityLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4 text-sm">
                          {formatDateTime(new Date(log.timestamp || log.createdAt))}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="capitalize">
                            {log.type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm font-medium">{log.action}</td>
                        <td className="p-4 text-sm max-w-md truncate" title={log.details || ''}>
                          {log.details || '—'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {log.location?.name || '—'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {log.user?.username || log.device?.name || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Device Logs */}
        <TabsContent value="devices" className="space-y-0">
          <Card>
            {/* Status Filter for Device Logs */}
            <div className="p-4 border-b border-border">
              <Select value={deviceLogStatus || "all"} onValueChange={(v: string) => setDeviceLogStatus(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
                  {isLoadingDeviceLogs ? (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading device logs...
                        </div>
                      </td>
                    </tr>
                  ) : deviceLogsError ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-error">
                        Failed to load device logs. Please try again.
                      </td>
                    </tr>
                  ) : filteredDeviceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No device logs found
                      </td>
                    </tr>
                  ) : (
                    filteredDeviceLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4 text-sm">
                          {formatDateTime(new Date(log.timestamp || log.createdAt))}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{log.deviceName || log.deviceId || 'Unknown Device'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{log.location || '—'}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={getStatusColor(log.status || 'unknown')}>
                            <Circle className="h-2 w-2 mr-1 fill-current" />
                            {log.status || 'unknown'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{log.message || log.event || '—'}</td>
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
                    <th className="p-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="p-4 font-medium text-muted-foreground">Action</th>
                    <th className="p-4 font-medium text-muted-foreground">Details</th>
                    <th className="p-4 font-medium text-muted-foreground">Location</th>
                    <th className="p-4 font-medium text-muted-foreground">Guest</th>
                    <th className="p-4 font-medium text-muted-foreground">User/Device</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingServiceRequestActivity ? (
                    <tr>
                      <td colSpan={6} className="p-8">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading service request activity...
                        </div>
                      </td>
                    </tr>
                  ) : serviceRequestActivityError ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-error">
                        Failed to load service request activity. Please try again.
                      </td>
                    </tr>
                  ) : filteredServiceRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No service request activity found
                      </td>
                    </tr>
                  ) : (
                    filteredServiceRequests.map((log: any) => (
                      <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4 text-sm">
                          {formatDateTime(new Date(log.timestamp || log.createdAt))}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="capitalize">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm max-w-md truncate" title={log.details || ''}>
                          {log.details || '—'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {log.location?.name || '—'}
                        </td>
                        <td className="p-4 text-sm">
                          {log.guest ? `${log.guest.firstName} ${log.guest.lastName}` : '—'}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {log.user?.username || log.device?.name || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Crew Changes */}
        <TabsContent value="crew-changes" className="space-y-0">
          <Card>
            {/* Action Filter for Crew Change Logs */}
            <div className="p-4 border-b border-border">
              <Select value={crewChangeAction || "all"} onValueChange={(v: string) => setCrewChangeAction(v === "all" ? undefined : v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="added">Added</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                  <SelectItem value="status_changed">Status Changed</SelectItem>
                  <SelectItem value="duty_started">Duty Started</SelectItem>
                  <SelectItem value="duty_ended">Duty Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="p-4 font-medium text-muted-foreground">Crew Member</th>
                    <th className="p-4 font-medium text-muted-foreground">Action</th>
                    <th className="p-4 font-medium text-muted-foreground">Details</th>
                    <th className="p-4 font-medium text-muted-foreground">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCrewChanges ? (
                    <tr>
                      <td colSpan={5} className="p-8">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading crew change logs...
                        </div>
                      </td>
                    </tr>
                  ) : crewChangesError ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-error">
                        Failed to load crew change logs. Please try again.
                      </td>
                    </tr>
                  ) : filteredCrewChangeLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No crew change logs found. Changes will appear here after duty roster updates.
                      </td>
                    </tr>
                  ) : (
                    filteredCrewChangeLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <td className="p-4 text-sm">
                          {formatDateTime(new Date(log.timestamp))}
                        </td>
                        <td className="p-4 text-sm font-medium">{log.crewMemberName}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={getChangeTypeColor(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{log.details || '—'}</td>
                        <td className="p-4 text-sm">{log.performedBy}</td>
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
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-primary">{activityLogs.length}</p>
            <p className="text-sm text-muted-foreground">Total Activity</p>
          </div>
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
