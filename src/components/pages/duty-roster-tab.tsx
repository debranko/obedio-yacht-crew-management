import { useState, useMemo, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAppData } from '../../contexts/AppDataContext';
import { useUpdateShift, useCreateShift, useDeleteShift } from '../../hooks/useShifts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Settings,
  Sparkles,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Bell,
  Undo2,
  Trash2,
  Download,
  Printer,
  FileDown,
} from 'lucide-react';
import { Assignment, ViewMode, ShiftConfig, CrewMember } from '../duty-roster/types';
import { CrewMemberItem } from '../duty-roster/crew-member-item';
import { CalendarDayCell } from '../duty-roster/calendar-day-cell';
import { CalendarSettingsDialog } from '../duty-roster/calendar-settings-dialog';
import { DayDetailDialog } from '../duty-roster/day-detail-dialog';
import {
  getMonthDates,
  getWeekDates,
  getTodayDate,
  formatDateDisplay,
  getDayName,
  detectAndContinuePattern,
  autoFillAssignments,
  formatDate,
  parseDate,
} from '../duty-roster/utils';
import { toast } from 'sonner';
import { NotifyCrewDialog } from '../notify-crew-dialog';

export function DutyRosterTab() {
  const {
    crewMembers: contextCrewMembers,
    assignments: contextAssignments,
    setAssignments: setContextAssignments,
    shifts: contextShifts,
    setShifts: setContextShifts,
    saveAssignments,
    lastSaved,
    isSaving,
    detectRosterChanges,
    markChangesAsNotified,
  } = useAppData();

  // Mutation hooks for shift management
  const updateShiftMutation = useUpdateShift();
  const createShiftMutation = useCreateShift();
  const deleteShiftMutation = useDeleteShift();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>(contextAssignments);
  const [shifts, setShifts] = useState<ShiftConfig[]>(contextShifts);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<Assignment[][]>([]);

  // Sync with context on mount only
  useEffect(() => {
    setAssignments(contextAssignments);
    setShifts(contextShifts);
  }, []);

  // Track unsaved changes
  useEffect(() => {
    const isDifferent = JSON.stringify(assignments) !== JSON.stringify(contextAssignments);
    setHasUnsavedChanges(isDifferent);
  }, [assignments, contextAssignments]);

  const today = getTodayDate();

  // Get dates based on view mode
  const dates = useMemo(() => {
    if (viewMode === 'month') {
      return getMonthDates(currentDate.getFullYear(), currentDate.getMonth());
    } else if (viewMode === 'week') {
      return getWeekDates(currentDate);
    } else {
      // day view
      return [formatDate(currentDate)];
    }
  }, [viewMode, currentDate]);

  // Filter and sort crew members - on-leave at bottom
  const filteredCrewMembers = useMemo(() => {
    let filtered = contextCrewMembers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (crew) =>
          crew.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crew.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crew.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Show only available filter
    if (showOnlyAvailable && viewMode === 'day') {
      const assignedCrewIds = new Set(
        assignments
          .filter((a) => a.date === today)
          .map((a) => a.crewId)
      );
      filtered = filtered.filter((crew) => !assignedCrewIds.has(crew.id));
    }

    // IMPORTANT: Sort crew - available crew first, on-leave at bottom
    return filtered.sort((a, b) => {
      const aOnLeave = a.status === 'on-leave';
      const bOnLeave = b.status === 'on-leave';
      
      if (aOnLeave && !bOnLeave) return 1; // a goes to bottom
      if (!aOnLeave && bOnLeave) return -1; // b goes to bottom
      
      // Both same status - sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [searchTerm, showOnlyAvailable, assignments, viewMode, today, contextCrewMembers]);
  
  // Separate available and on-leave crew for visual grouping
  const availableCrewMembers = useMemo(
    () => filteredCrewMembers.filter((crew) => crew.status !== 'on-leave'),
    [filteredCrewMembers]
  );
  
  const onLeaveCrewMembers = useMemo(
    () => filteredCrewMembers.filter((crew) => crew.status === 'on-leave'),
    [filteredCrewMembers]
  );



  // Save to history before making changes
  const saveToHistory = (currentAssignments: Assignment[]) => {
    setAssignmentHistory((prev) => [...prev, currentAssignments]);
  };

  // Handle assignment
  const handleAssign = (crewId: string, date: string, shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    const crew = contextCrewMembers.find((c) => c.id === crewId);
    const crewName = crew?.name.split(' ')[0] || 'Crew member';

    // Check if crew is on leave for this date
    if (crew?.status === 'on-leave' && crew.leaveStart && crew.leaveEnd) {
      if (date >= crew.leaveStart && date <= crew.leaveEnd) {
        toast.error(`${crewName} is on leave and cannot be assigned`);
        return;
      }
    }

    // Check if crew is already assigned to this shift on this date
    const existingAssignment = assignments.find(
      (a) => a.crewId === crewId && a.date === date && a.shiftId === shiftId
    );

    if (existingAssignment) {
      toast.error(`${crewName} is already assigned to ${shift.name}`);
      return;
    }

    // Save current state to history
    saveToHistory(assignments);

    // Use functional update to ensure we have the latest state
    setAssignments((prevAssignments) => {
      const currentAssignments = prevAssignments.filter(
        (a) => a.date === date && a.shiftId === shiftId
      );
      const primaryCount = currentAssignments.filter((a) => a.type === 'primary').length;
      const backupCount = currentAssignments.filter((a) => a.type === 'backup').length;

      let type: 'primary' | 'backup' = 'primary';
      if (primaryCount >= shift.primaryCount) {
        if (backupCount >= shift.backupCount) {
          toast.error('Shift is at full capacity');
          return prevAssignments; // Return unchanged state
        }
        type = 'backup';
      }

      const newAssignment: Assignment = {
        crewId,
        date,
        shiftId,
        type,
      };

      toast.success(`${crewName} assigned to ${shift.name} as ${type}`);
      return [...prevAssignments, newAssignment];
    });
  };

  // Handle remove assignment
  const handleRemove = (crewId: string, date: string, shiftId: string) => {
    // Save current state to history
    saveToHistory(assignments);
    
    setAssignments(
      assignments.filter(
        (a) => !(a.crewId === crewId && a.date === date && a.shiftId === shiftId)
      )
    );
    toast.success('Assignment removed');
  };

  // Handle autofill
  const handleAutofill = () => {
    // Filter dates to only include TODAY and FUTURE dates (exclude past)
    const futureDates = dates.filter(date => date >= today);

    if (futureDates.length === 0) {
      toast.error('No future dates available for auto-fill');
      return;
    }

    // Filter out dates that already have complete assignments for all shifts
    const datesToFill = futureDates.filter(date => {
      // Check if this date already has assignments for all shifts
      const dateAssignments = assignments.filter(a => a.date === date);
      const dateShiftIds = new Set(dateAssignments.map(a => a.shiftId));

      // If not all shifts are assigned for this date, include it
      return dateShiftIds.size < shifts.length;
    });

    if (datesToFill.length === 0) {
      toast.info('All future dates are already assigned');
      return;
    }

    const newAssignments = autoFillAssignments(datesToFill, shifts, contextCrewMembers, true);

    if (newAssignments.length === 0) {
      toast.error('No crew members available for assignment');
      return;
    }

    // Save current state to history
    saveToHistory(assignments);

    // Keep existing assignments and append new ones (don't replace!)
    setAssignments([...assignments, ...newAssignments]);
    toast.success(`Auto-filled ${datesToFill.length} days with ${newAssignments.length} assignments`);
  };

  // Handle continue pattern
  const handleContinuePattern = () => {
    if (assignments.length === 0) {
      toast.error('No pattern to detect. Please assign crew manually first.');
      return;
    }

    // Save current state to history
    saveToHistory(assignments);

    const allNewAssignments: Assignment[] = [];

    shifts.forEach((shift) => {
      const newAssignments = detectAndContinuePattern(
        assignments,
        dates,
        shift.id,
        contextCrewMembers,
        true
      );
      allNewAssignments.push(...newAssignments);
    });

    if (allNewAssignments.length === 0) {
      toast.error('No pattern detected or roster already complete');
      return;
    }

    setAssignments([...assignments, ...allNewAssignments]);
    toast.success(`Pattern continued - ${allNewAssignments.length} assignments added`);
  };

  // Handle save shifts to database
  const handleSaveShifts = async (newShifts: ShiftConfig[]) => {
    try {
      // Compare old shifts with new shifts to determine what changed
      const oldShiftsMap = new Map(shifts.map(s => [s.id, s]));
      const newShiftsMap = new Map(newShifts.map(s => [s.id, s]));

      // Find shifts to update (exist in both, but values changed)
      const shiftsToUpdate = newShifts.filter(newShift => {
        const oldShift = oldShiftsMap.get(newShift.id);
        if (!oldShift) return false;
        // Check if any values changed
        return JSON.stringify(oldShift) !== JSON.stringify(newShift);
      });

      // Find shifts to create (exist in new but not in old)
      const shiftsToCreate = newShifts.filter(newShift => !oldShiftsMap.has(newShift.id));

      // Find shifts to delete (exist in old but not in new)
      const shiftsToDelete = shifts.filter(oldShift => !newShiftsMap.has(oldShift.id));

      // Execute all mutations
      const promises = [];

      for (const shift of shiftsToUpdate) {
        promises.push(updateShiftMutation.mutateAsync(shift));
      }

      for (const shift of shiftsToCreate) {
        promises.push(createShiftMutation.mutateAsync(shift));
      }

      for (const shift of shiftsToDelete) {
        promises.push(deleteShiftMutation.mutateAsync(shift.id));
      }

      // Wait for all mutations to complete
      await Promise.all(promises);

      // Update local state
      setShifts(newShifts);
      setContextShifts(newShifts);

      toast.success('Shift settings saved successfully');
    } catch (error) {
      console.error('Failed to save shift settings:', error);
      toast.error('Failed to save shift settings');
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (assignmentHistory.length === 0) {
      toast.error('Nothing to undo');
      return;
    }

    const previousState = assignmentHistory[assignmentHistory.length - 1];
    setAssignments(previousState);
    setAssignmentHistory((prev) => prev.slice(0, -1));
    toast.success('Last action undone');
  };

  // Handle clear
  const handleClear = () => {
    if (assignments.length === 0) {
      toast.info('Roster is already empty');
      return;
    }

    // Save current state to history
    saveToHistory(assignments);

    // Filter assignments based on view mode
    let filteredAssignments: Assignment[] = [];
    
    if (viewMode === 'day') {
      // Clear only today's assignments
      filteredAssignments = assignments.filter((a) => a.date !== today);
      toast.success('Today\'s roster cleared');
    } else if (viewMode === 'week') {
      // Clear only current week's assignments
      const weekDates = new Set(dates);
      filteredAssignments = assignments.filter((a) => !weekDates.has(a.date));
      toast.success('Week\'s roster cleared');
    } else {
      // Clear entire month's assignments
      const monthDates = new Set(dates);
      filteredAssignments = assignments.filter((a) => !monthDates.has(a.date));
      toast.success('Month\'s roster cleared');
    }

    setAssignments(filteredAssignments);
  };

  // Navigate month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  // Navigate day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Get week range display
  const weekRange = useMemo(() => {
    if (viewMode !== 'week' || dates.length === 0) return '';
    const firstDate = parseDate(dates[0]);
    const lastDate = parseDate(dates[dates.length - 1]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${monthNames[firstDate.getMonth()]} ${firstDate.getDate()}-${lastDate.getDate()}, ${firstDate.getFullYear()}`;
    }
    return `${monthNames[firstDate.getMonth()]} ${firstDate.getDate()} - ${monthNames[lastDate.getMonth()]} ${lastDate.getDate()}, ${firstDate.getFullYear()}`;
  }, [viewMode, dates]);

  // Get day display
  const dayDisplay = useMemo(() => {
    if (viewMode !== 'day' || dates.length === 0) return '';
    const date = parseDate(dates[0]);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [viewMode, dates]);

  // Handle notify crew
  const handleNotifyCrew = () => {
    const allChanges = detectRosterChanges();
    
    // Filter changes to only include current view period
    const visibleDates = new Set(dates);
    const filteredChanges = allChanges.filter(change => visibleDates.has(change.date));
    
    if (filteredChanges.length === 0) {
      toast.info('No roster changes detected in current view', {
        description: 'Make changes to the roster and save before notifying crew.',
      });
      return;
    }
    setPendingChanges(filteredChanges);
    setNotifyDialogOpen(true);
  };

  const handleConfirmNotify = () => {
    markChangesAsNotified(pendingChanges);
    setPendingChanges([]);
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const csvRows: string[] = [];
    
    // Header
    csvRows.push(['Date', 'Day', 'Shift', 'Crew Member', 'Type', 'Department'].join(','));
    
    // Data rows
    dates.forEach(date => {
      const dayName = getDayName(date);
      const dateAssignments = assignments.filter(a => a.date === date);
      
      dateAssignments.forEach(assignment => {
        const crew = contextCrewMembers.find(c => c.id === assignment.crewId);
        const shift = shifts.find(s => s.id === assignment.shiftId);
        
        if (crew && shift) {
          csvRows.push([
            formatDateDisplay(date, 'long'),
            dayName,
            shift.name,
            crew.name,
            assignment.type,
            crew.department
          ].join(','));
        }
      });
    });
    
    // Create and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duty-roster-${viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Duty roster exported successfully');
  };

  // Handle print
  const handlePrint = () => {
    window.print();
    toast.success('Opening print dialog');
  };

  // Handle day click
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setDayDetailOpen(true);
  };

  // Handle day navigation in detail dialog
  const handleNavigateDay = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const currentDateObj = new Date(selectedDate);
    if (direction === 'prev') {
      currentDateObj.setDate(currentDateObj.getDate() - 1);
    } else {
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    setSelectedDate(currentDateObj.toISOString().split('T')[0]);
  };

  // Helper to organize dates into weeks for month view
  const calendarWeeks = useMemo(() => {
    if (viewMode !== 'month') return [];
    
    const weeks: string[][] = [];
    let currentWeek: string[] = [];
    
    dates.forEach((date, index) => {
      currentWeek.push(date);
      if (currentWeek.length === 7 || index === dates.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    return weeks;
  }, [dates, viewMode]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Top Controls */}
        <Card className="p-4 no-print">
          <div className="space-y-3">
            {/* Row 1: Undo/Clear | Save + Notify + Last Saved */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUndo}
                  disabled={assignmentHistory.length === 0}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Undo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                  disabled={assignments.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={async () => {
                    setContextAssignments(assignments);
                    await saveAssignments();
                    setAssignmentHistory([]); // Clear history after save
                    toast.success('Duty roster saved successfully');
                  }}
                  disabled={!hasUnsavedChanges || isSaving}
                  className="min-w-[100px]"
                >
                  {isSaving ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : hasUnsavedChanges ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={handleNotifyCrew}
                  disabled={hasUnsavedChanges}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notify Crew
                </Button>
                {lastSaved && !hasUnsavedChanges && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Last saved: {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Row 2: Action buttons only */}
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleAutofill}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Autofill
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[250px]">
                    <p className="text-xs">
                      Automatically populate the roster based on your shift settings and crew availability
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleContinuePattern}>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Continue Pattern
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px]">
                    <p className="text-xs">
                      Let AI detect and continue your pattern. Create shifts for 2-3 days, then let the system generate the rest automatically
                    </p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <FileDown className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Export roster as CSV file</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Print duty roster</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Configure shifts and roster settings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </Card>

        {/* Main Roster Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[170px_1fr] gap-4">
          {/* Left Sidebar - Crew List */}
          <Card className="p-2 h-fit lg:sticky lg:top-6 no-print">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xs">Crew Members</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Drag to assign
                  </p>
                </div>
                {filteredCrewMembers.length > 0 && (
                  <div className="flex flex-col items-end gap-0.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {availableCrewMembers.length}
                    </Badge>
                    {onLeaveCrewMembers.length > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 opacity-50">
                        {onLeaveCrewMembers.length} away
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Filters */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-7 text-xs"
                  />
                </div>

                {viewMode === 'day' && (
                  <label className="flex items-center gap-1 text-[10px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showOnlyAvailable}
                      onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                      className="rounded border-border h-3 w-3"
                    />
                    Only available
                  </label>
                )}
              </div>

              <Separator />

              {/* Crew List */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                {/* Available Crew */}
                {availableCrewMembers.map((crew) => (
                  <CrewMemberItem key={crew.id} crew={crew} />
                ))}
                
                {/* Separator between available and on-leave */}
                {availableCrewMembers.length > 0 && onLeaveCrewMembers.length > 0 && (
                  <div className="py-2">
                    <Separator />
                    <div className="flex items-center justify-center gap-1 mt-2 mb-1">
                      <p className="text-[10px] text-muted-foreground text-center">
                        Unavailable
                      </p>
                      <span className="text-[9px] text-muted-foreground/60">
                        (On Leave)
                      </span>
                    </div>
                  </div>
                )}
                
                {/* On Leave Crew */}
                {onLeaveCrewMembers.map((crew) => (
                  <CrewMemberItem key={crew.id} crew={crew} />
                ))}
                
                {/* Empty state */}
                {filteredCrewMembers.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    No crew found
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Right Side - Calendar Grid */}
          <Card className="p-6 duty-roster-calendar">
            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-6 text-center">
              <h1 className="text-2xl font-semibold mb-2">Duty Roster</h1>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'month' && monthName}
                {viewMode === 'week' && weekRange}
                {viewMode === 'day' && dayDisplay}
              </p>
            </div>

            {/* Month View - Traditional Calendar Grid */}
            {viewMode === 'month' && (
              <div className="space-y-4">
                {/* Calendar Header with View Mode and Navigation */}
                <div className="flex items-center justify-between pb-2 border-b no-print">
                  <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month View</SelectItem>
                      <SelectItem value="week">Week View</SelectItem>
                      <SelectItem value="day">Day View</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[160px] text-center">
                      {monthName}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="text-center py-2">
                      <p className="text-sm font-medium text-muted-foreground">{day}</p>
                    </div>
                  ))}
                </div>

                {/* Calendar Weeks */}
                {calendarWeeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-2">
                    {week.map((date) => (
                      <CalendarDayCell
                        key={date}
                        date={date}
                        shifts={shifts}
                        assignments={assignments}
                        crewMembers={contextCrewMembers}
                        onAssign={handleAssign}
                        onRemove={handleRemove}
                        onDayClick={handleDayClick}
                        isToday={date === today}
                        viewMode={viewMode}
                        currentMonth={currentDate.getMonth()}
                        currentYear={currentDate.getFullYear()}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Week View - 7 Day Horizontal */}
            {viewMode === 'week' && (
              <div className="space-y-4">
                {/* Calendar Header with View Mode and Navigation */}
                <div className="flex items-center justify-between pb-2 border-b no-print">
                  <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month View</SelectItem>
                      <SelectItem value="week">Week View</SelectItem>
                      <SelectItem value="day">Day View</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[240px] text-center">
                      {weekRange}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2">
                  {dates.map((date) => {
                    const isToday = date === today;
                    return (
                      <div key={date} className="text-center py-2">
                        <p className={`text-sm font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {getDayName(date)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateDisplay(date, 'short')}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-2">
                  {dates.map((date) => (
                    <CalendarDayCell
                      key={date}
                      date={date}
                      shifts={shifts}
                      assignments={assignments}
                      crewMembers={contextCrewMembers}
                      onAssign={handleAssign}
                      onRemove={handleRemove}
                      onDayClick={handleDayClick}
                      isToday={date === today}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Day View - Single Day Detail */}
            {viewMode === 'day' && (
              <div className="space-y-4">
                {/* Calendar Header with View Mode and Navigation */}
                <div className="flex items-center justify-between pb-2 border-b no-print">
                  <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month View</SelectItem>
                      <SelectItem value="week">Week View</SelectItem>
                      <SelectItem value="day">Day View</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateDay('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[240px] text-center">
                      {dayDisplay}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateDay('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-6">
                    <h2 className="text-primary">Today's Schedule</h2>
                    <p className="text-muted-foreground">{formatDateDisplay(today, 'long')}</p>
                  </div>
                  
                  <CalendarDayCell
                    date={today}
                    shifts={shifts}
                    assignments={assignments}
                    crewMembers={contextCrewMembers}
                    onAssign={handleAssign}
                    onRemove={handleRemove}
                    onDayClick={handleDayClick}
                    isToday={true}
                    viewMode={viewMode}
                  />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Settings Dialog */}
      <CalendarSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        shifts={shifts}
        onSave={handleSaveShifts}
      />

      {/* Notify Crew Dialog */}
      <NotifyCrewDialog
        open={notifyDialogOpen}
        onOpenChange={setNotifyDialogOpen}
        changes={pendingChanges}
        onConfirm={handleConfirmNotify}
      />

      {/* Day Detail Dialog */}
      {selectedDate && (
        <DayDetailDialog
          open={dayDetailOpen}
          onOpenChange={setDayDetailOpen}
          date={selectedDate}
          shifts={shifts}
          assignments={assignments}
          crewMembers={contextCrewMembers}
          onNavigate={handleNavigateDay}
          onAddCrew={handleAssign}
          onRemoveCrew={handleRemove}
        />
      )}
    </DndProvider>
  );
}
