import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppData } from '../../contexts/AppDataContext';
import { useLocations } from '../../hooks/useLocations';
import { useGuests, useGuestsStats, useGuestsMeta } from '../../hooks/useGuests';
import { useGuestsQueryParams } from '../../hooks/useGuestsQueryParams';
import { useGuestMutations } from '../../hooks/useGuestMutations';
import { useWebSocket } from '../../hooks/useWebSocket';
import { GuestsService } from '../../services/guests';
import { Button } from '../ui/button';
import { MoreVertical, Users, Calendar, Star, AlertTriangle, Loader2, BellOff, MapPin, Edit2, Download, Plus, UserCheck, Wifi, WifiOff } from 'lucide-react';
import { Card } from '../ui/card';
import GuestsToolbar, { FilterState } from '../guests/GuestsToolbar';
import { DNDGuestsKpiCard } from '../dnd-guests-kpi-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { GuestFormDialog } from '../guest-form-dialog';
import { GuestDetailsDialog } from '../guest-details-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import type { Guest } from '../../contexts/AppDataContext';
import { KpiCard } from '../kpi-card';
import { GuestStatusWidget } from '../guest-status-widget';

export function GuestsListPage() {
  const queryClient = useQueryClient();
  const { guests, updateGuest, getLocationByGuestId } = useAppData();
  const { locations, updateLocation } = useLocations();
  const { qp, set, reset } = useGuestsQueryParams();
  const { deleteGuest, isDeleting } = useGuestMutations();

  // WebSocket for real-time updates
  const { isConnected: wsConnected, on: wsOn, off: wsOff } = useWebSocket();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);
  const [viewingGuest, setViewingGuest] = useState<Guest | null>(null);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Fetch data using server-side ready hooks
  const { data: guestsData, isLoading: isLoadingGuests } = useGuests(qp);
  const { data: stats, isLoading: isLoadingStats } = useGuestsStats();
  const { data: meta } = useGuestsMeta();

  // WebSocket listeners for real-time guest updates
  useEffect(() => {
    if (!wsOn || !wsOff) return;

    // Handle guest events - invalidate queries to refetch
    const handleGuestEvent = (data: any) => {
      console.log('👥 Guest event received:', data);

      // Invalidate all guest-related queries
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests-stats'] });
      queryClient.invalidateQueries({ queryKey: ['guests-meta'] });
    };

    const unsubscribeCreated = wsOn('guest:created', handleGuestEvent);
    const unsubscribeUpdated = wsOn('guest:updated', handleGuestEvent);
    const unsubscribeDeleted = wsOn('guest:deleted', handleGuestEvent);

    // Cleanup
    return () => {
      if (unsubscribeCreated) unsubscribeCreated();
      if (unsubscribeUpdated) unsubscribeUpdated();
      if (unsubscribeDeleted) unsubscribeDeleted();
    };
  }, [wsOn, wsOff, queryClient]);

  // Calculate active filters for UI display
  const activeFilters = useMemo(() => {
    const filters = [];
    if (qp.q) filters.push('search');
    if (qp.status !== 'All') filters.push('status');
    if (qp.type !== 'All') filters.push('type');
    if (qp.vip !== 'All') filters.push('vip');
    if (qp.allergy !== 'All') filters.push('allergy');
    if (qp.diet !== 'All') filters.push('diet');
    return filters;
  }, [qp]);

  // Convert FilterState from new toolbar to query params
  const handleFiltersChange = (filters: FilterState) => {
    // Map new toolbar filters to existing query params
    const updates: any = {
      q: filters.search || '',
      status: filters.status.length === 1 ? filters.status[0] : 'All',
      type: filters.types.length === 1 ? filters.types[0] : 'All',
      vip: filters.vipOnly ? 'vip' : 'All',
      sort: filters.sort || 'name:asc',
    };

    // Handle allergies/dietary from alerts array
    if (filters.alerts.includes('allergy')) {
      updates.allergy = 'has-allergies';
    }
    if (filters.alerts.includes('dietary')) {
      updates.diet = 'has-dietary';
    }

    set(updates);
  };

  // Export handler for new toolbar
  const handleExportFromToolbar = async (filters: FilterState) => {
    const allFiltered = await GuestsService.list({ ...qp, limit: 10000, page: 1 });
    const csv = GuestsService.exportToCsv(allFiltered.items);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${allFiltered.total} guests`);
  };

  // Get guests with DND active
  const dndGuests = useMemo(() => {
    return guests.filter(g => g.doNotDisturb && g.status === 'onboard');
  }, [guests]);

  // Handler to remove DND from guest
  const handleRemoveDND = async (guest: Guest) => {
    // Use proper foreign key relationship to find guest's location
    const location = getLocationByGuestId(guest.id);

    updateGuest(guest.id, { doNotDisturb: false });

    if (location) {
      await updateLocation({
        id: location.id,
        doNotDisturb: false
      });
    }

    toast.success("DND Removed", {
      description: `${guest.firstName} ${guest.lastName} can now receive requests`
    });
  };

  // Handle guest deletion
  const handleDeleteGuest = () => {
    if (!deletingGuest) return;
    
    deleteGuest(deletingGuest.id, {
      onSuccess: () => {
        setDeletingGuest(null);
      },
    });
  };



  const handleSort = (field: string) => {
    const [currentField, currentDirection] = qp.sort.split(':');
    
    if (currentField === field) {
      // Toggle direction
      const newDirection = currentDirection === 'desc' ? 'asc' : 'desc';
      set({ sort: `${field}:${newDirection}` });
    } else {
      // New field, default to desc
      set({ sort: `${field}:desc` });
    }
  };

  const getSortIcon = (field: string) => {
    const [currentField, direction] = qp.sort.split(':');
    if (currentField !== field) return null;
    return direction === 'desc' ? '↓' : '↑';
  };

  const toggleVip = (guest: Guest, e: React.MouseEvent) => {
    e.stopPropagation();
    const newType = (guest.type === 'vip' || guest.type === 'owner') ? 'primary' : 'vip';
    updateGuest(guest.id, { type: newType });
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['guests'] });
    
    toast.success(
      newType === 'vip' ? 'Guest marked as VIP' : 'VIP status removed'
    );
  };

  const handleBulkAction = (action: 'export' | 'message' | 'delete') => {
    const selectedGuests = guestsData?.items.filter(g => selectedIds.has(g.id)) || [];
    
    switch (action) {
      case 'export':
        const csv = GuestsService.exportToCsv(selectedGuests);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guests-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${selectedIds.size} guests`);
        break;
      case 'message':
        toast.info(`Message feature for ${selectedIds.size} guests (coming soon)`);
        break;
      case 'delete':
        toast.info(`Bulk delete for ${selectedIds.size} guests (coming soon)`);
        break;
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === guestsData?.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(guestsData?.items.map(g => g.id) || []));
    }
  };



  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const getStatusBadgeVariant = (status: Guest['status']) => {
    switch (status) {
      case 'onboard': return 'default';
      case 'expected': return 'secondary';
      case 'departed': return 'outline';
    }
  };

  const getStatusLabel = (status: Guest['status']) => {
    switch (status) {
      case 'onboard': return 'Onboard';
      case 'expected': return 'Expected';
      case 'departed': return 'Departed';
    }
  };

  const getAllergyColor = (allergy: string): string => {
    // Consistent colors for common allergies
    const allergyColors: Record<string, string> = {
      'Shellfish': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Nuts': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Dairy': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Gluten': 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      'Eggs': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      'Soy': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
    return allergyColors[allergy] || 'bg-destructive/10 text-destructive';
  };

  const getDietaryColor = (diet: string): string => {
    // Consistent colors for dietary restrictions
    const dietColors: Record<string, string> = {
      'Vegetarian': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Vegan': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
      'Kosher': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Halal': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      'Pescatarian': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
    };
    return dietColors[diet] || 'bg-secondary text-secondary-foreground';
  };

  return (
    <div className="space-y-6">
      {/* DND Alert Widget */}
      {dndGuests.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <BellOff className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-destructive">Do Not Disturb Active</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {dndGuests.length} guest{dndGuests.length !== 1 ? 's' : ''} currently blocking service requests
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dndGuests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={guest.photo} alt={guest.firstName} />
                      <AvatarFallback className="text-sm bg-primary/10 text-primary">
                        {guest.firstName[0]}{guest.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{guest.firstName} {guest.lastName}</p>
                      {guest.locationId && (() => {
                        const cabin = locations.find(l => l.id === guest.locationId);
                        return cabin ? (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cabin.name}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDND(guest)}
                    className="flex-shrink-0 h-8 px-2"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Compact Status Row: Guest Status (75%) + Dietary Alerts (25%) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Guest Status Widget - 3/4 width */}
        <div className="col-span-3">
          <GuestStatusWidget />
        </div>
        
        {/* Dietary Alerts - 1/4 width */}
        <div className="col-span-1">
          <KpiCard
            title="Dietary Alerts"
            value={isLoadingStats ? "..." : stats?.dietaryAlerts.toString() || "0"}
            icon={AlertTriangle}
            iconColor="text-destructive"
            inlineValue={true}
            onClick={() => {
              reset();
              set({ status: 'onboard', allergy: 'has-allergies' });
            }}
            details={
              stats && stats.dietaryAlerts > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Active allergy alerts
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No active allergies</p>
              )
            }
          />
        </div>
      </div>

      {/* New GuestsToolbar Component */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <GuestsToolbar
            onFiltersChange={handleFiltersChange}
            onExport={handleExportFromToolbar}
            onAddGuest={() => setIsAddDialogOpen(true)}
          />

          {/* WebSocket Status Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
              wsConnected
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}
            title={wsConnected ? 'Real-time updates active' : 'Real-time updates offline'}
          >
            {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Results Info and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground" aria-live="polite">
            {isLoadingGuests ? (
              <span>Loading...</span>
            ) : (
              <span>
                Showing {guestsData?.items.length || 0} of {guestsData?.total || 0} guests
                {qp.page > 1 && ` (page ${qp.page})`}
              </span>
            )}
          </div>
          
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('message')}
                >
                  Message
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Page Size Selector */}
        <Select
          value={qp.limit.toString()}
          onValueChange={(v: string) => set({ limit: parseInt(v) })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {isLoadingGuests ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <Table className="table-zebra">
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedIds.size === guestsData?.items.length && guestsData?.items.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all guests"
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                  aria-sort={qp.sort.startsWith('name:') ? (qp.sort.endsWith(':desc') ? 'descending' : 'ascending') : 'none'}
                >
                  Guest {getSortIcon('name')}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cabin</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('checkinAt')}
                  aria-sort={qp.sort.startsWith('checkinAt:') ? (qp.sort.endsWith(':desc') ? 'descending' : 'ascending') : 'none'}
                >
                  Check-in {getSortIcon('checkinAt')}
                </TableHead>
                <TableHead>Allergies</TableHead>
                <TableHead>Dietary</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestsData?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-12 w-12 opacity-20" />
                      <p>No guests found</p>
                      {activeFilters.length > 0 ? (
                        <Button variant="outline" size="sm" onClick={reset}>
                          Clear filters
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Guest
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                guestsData?.items.map((guest, index) => (
                  <TableRow
                    key={guest.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setViewingGuest(guest)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(guest.id)}
                        onCheckedChange={(checked: boolean) => {
                          const newSet = new Set(selectedIds);
                          if (checked) {
                            newSet.add(guest.id);
                          } else {
                            newSet.delete(guest.id);
                          }
                          setSelectedIds(newSet);
                        }}
                        aria-label={`Select ${guest.firstName} ${guest.lastName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        {guest.photo && <AvatarImage src={guest.photo} />}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(guest.firstName, guest.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {guest.firstName} {guest.lastName}
                            {guest.doNotDisturb && (
                              <Badge variant="destructive" className="h-5 px-1.5 flex items-center gap-1">
                                <BellOff className="h-3 w-3" />
                                <span className="text-[10px] font-bold">DND</span>
                              </Badge>
                            )}
                          </div>
                          {guest.preferredName && (
                            <div className="text-xs text-muted-foreground">
                              "{guest.preferredName}"
                            </div>
                          )}
                        </div>
                        {(guest.type === 'vip' || guest.type === 'owner') && (
                          <button
                            onClick={(e) => toggleVip(guest, e)}
                            className="text-warning hover:text-warning/80 transition-colors"
                            aria-label="Toggle VIP status"
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        )}
                        {!(guest.type === 'vip' || guest.type === 'owner') && (
                          <button
                            onClick={(e) => toggleVip(guest, e)}
                            className="text-muted-foreground/30 hover:text-warning transition-colors"
                            aria-label="Mark as VIP"
                          >
                            <Star className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{guest.type}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(guest.status)}>
                        {getStatusLabel(guest.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {guest.locationId
                          ? (() => {
                              const location = locations.find(l => l.id === guest.locationId);
                              return location ? (
                                <span className="flex items-center gap-1">
                                  {location.name}
                                  {location.doNotDisturb && (
                                    <BellOff className="h-3 w-3 text-destructive" />
                                  )}
                                </span>
                              ) : '—';
                            })()
                          : '—'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(guest.checkInDate).toLocaleDateString()}</div>
                        {guest.checkInTime && (
                          <div className="text-xs text-muted-foreground">{guest.checkInTime}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {guest.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {guest.allergies.slice(0, 2).map((allergy, idx) => (
                            <Badge
                              key={idx}
                              className={`text-xs ${getAllergyColor(allergy)}`}
                            >
                              {allergy}
                            </Badge>
                          ))}
                          {guest.allergies.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{guest.allergies.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.dietaryRestrictions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {guest.dietaryRestrictions.slice(0, 2).map((diet, idx) => (
                            <Badge
                              key={idx}
                              className={`text-xs ${getDietaryColor(diet)}`}
                            >
                              {diet}
                            </Badge>
                          ))}
                          {guest.dietaryRestrictions.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{guest.dietaryRestrictions.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingGuest(guest)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingGuest(guest)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingGuest(guest)}
                            className="text-destructive focus:text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {guestsData && guestsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {guestsData.page} of {guestsData.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => set({ page: qp.page - 1 })}
              disabled={qp.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => set({ page: qp.page + 1 })}
              disabled={qp.page >= guestsData.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Full Details Dialog */}
      <GuestDetailsDialog
        open={viewingGuest !== null}
        onOpenChange={(open) => !open && setViewingGuest(null)}
        guest={viewingGuest}
        onEdit={(guest) => {
          setViewingGuest(null);
          setEditingGuest(guest);
        }}
      />

      {/* Add/Edit Dialog */}
      <GuestFormDialog
        open={isAddDialogOpen || editingGuest !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingGuest(null);
          }
        }}
        guest={editingGuest}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deletingGuest !== null} onOpenChange={() => setDeletingGuest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                {deletingGuest?.firstName} {deletingGuest?.lastName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuest}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
