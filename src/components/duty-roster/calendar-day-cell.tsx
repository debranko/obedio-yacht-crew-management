import { useState } from 'react';
import { useDrop } from 'react-dnd';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Assignment, CrewMember, ShiftConfig, ViewMode } from './types';
import { X, Clock, Search, Users, ChevronDown } from 'lucide-react';
import { formatDateDisplay } from './utils';
import { getCrewAvatarUrl } from '../crew-avatars';

// Crew List Component
interface CrewListProps {
  availableCrew: CrewMember[];
  searchTerm: string;
  showOtherDepartments: boolean;
  onToggleOtherDepartments: () => void;
  onSelectCrew: (crewId: string) => void;
}

function CrewList({
  availableCrew,
  searchTerm,
  showOtherDepartments,
  onToggleOtherDepartments,
  onSelectCrew,
}: CrewListProps) {
  // Filter by search
  const filteredCrew = searchTerm
    ? availableCrew.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.position.toLowerCase().includes(term) ||
          c.department.toLowerCase().includes(term) ||
          c.nickname?.toLowerCase().includes(term)
        );
      })
    : availableCrew;

  // Empty state
  if (filteredCrew.length === 0) {
    return (
      <div className="p-3 text-center py-6 text-muted-foreground">
        <Users className="h-6 w-6 mx-auto mb-2 opacity-20" />
        <p className="text-xs">
          {availableCrew.length === 0 ? 'All crew members assigned' : 'No crew found'}
        </p>
      </div>
    );
  }

  // Separate by department
  const interiorCrew = filteredCrew.filter((c) => c.department === 'Interior');
  const otherCrew = filteredCrew.filter((c) => c.department !== 'Interior');

  return (
    <div className="p-3">
      {/* Interior Department */}
      {interiorCrew.length > 0 && (
        <div className="space-y-1">
          {interiorCrew.map((crew) => (
            <button
              key={crew.id}
              onClick={() => onSelectCrew(crew.id)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar className="h-9 w-9">
                <img
                  src={getCrewAvatarUrl(crew.name)}
                  alt={crew.name}
                  className="object-cover"
                />
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{crew.name}</p>
                <p className="text-xs text-muted-foreground truncate">{crew.position}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {crew.department}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Toggle for Other Departments */}
      {interiorCrew.length > 0 && otherCrew.length > 0 && (
        <>
          <div className="my-2">
            <Separator />
          </div>
          <button
            onClick={onToggleOtherDepartments}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showOtherDepartments ? 'rotate-180' : ''
              }`}
            />
            <span>
              {showOtherDepartments ? 'Hide other departments' : 'Include other departments'}
            </span>
          </button>
          <div className="mb-2">
            <Separator />
          </div>
        </>
      )}

      {/* Other Departments - shown when expanded */}
      {showOtherDepartments && otherCrew.length > 0 && (
        <div className="space-y-1">
          {otherCrew.map((crew) => (
            <button
              key={crew.id}
              onClick={() => onSelectCrew(crew.id)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar className="h-9 w-9">
                <img
                  src={getCrewAvatarUrl(crew.name)}
                  alt={crew.name}
                  className="object-cover"
                />
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{crew.name}</p>
                <p className="text-xs text-muted-foreground truncate">{crew.position}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {crew.department}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Show only other departments if no interior crew */}
      {interiorCrew.length === 0 && otherCrew.length > 0 && (
        <div className="space-y-1">
          {otherCrew.map((crew) => (
            <button
              key={crew.id}
              onClick={() => onSelectCrew(crew.id)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar className="h-9 w-9">
                <img
                  src={getCrewAvatarUrl(crew.name)}
                  alt={crew.name}
                  className="object-cover"
                />
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{crew.name}</p>
                <p className="text-xs text-muted-foreground truncate">{crew.position}</p>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {crew.department}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CalendarDayCellProps {
  date: string;
  shifts: ShiftConfig[];
  assignments: Assignment[];
  crewMembers: CrewMember[];
  onAssign: (crewId: string, date: string, shiftId: string) => void;
  onRemove: (crewId: string, date: string, shiftId: string) => void;
  onDayClick?: (date: string) => void;
  isToday?: boolean;
  viewMode: ViewMode;
  currentMonth?: number;
  currentYear?: number;
}

export function CalendarDayCell({
  date,
  shifts,
  assignments,
  crewMembers,
  onAssign,
  onRemove,
  onDayClick,
  isToday = false,
  viewMode,
  currentMonth,
  currentYear,
}: CalendarDayCellProps) {
  const getCrewById = (id: string) => crewMembers.find((c) => c.id === id);

  // Parse day number from date string (YYYY-MM-DD)
  const dayNumber = parseInt(date.split('-')[2], 10);
  
  // Check if date is in current viewing month (for month view)
  const dateObj = new Date(date);
  const isCurrentMonth = viewMode !== 'month' || 
    (currentMonth !== undefined && currentYear !== undefined && 
     dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all ${
        isToday ? 'ring-2 ring-primary/40 border-primary/30' : 'border-border'
      } ${viewMode === 'day' ? '' : 'min-h-[180px]'} ${
        !isCurrentMonth ? 'opacity-40 bg-muted/30' : 'bg-card'
      }`}
    >
      {/* Day Header */}
      <div 
        className={`px-2 py-1 border-b ${isToday ? 'bg-primary/10' : 'bg-muted/30'} ${onDayClick ? 'cursor-pointer hover:bg-primary/20 transition-colors' : ''}`}
        onClick={() => onDayClick?.(date)}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isToday ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
            {dayNumber}
          </span>
          {viewMode === 'month' && dayNumber === 1 && (
            <span className="text-[10px] text-muted-foreground">
              {formatDateDisplay(date, 'short').split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Shifts Container - Only show if current month or not month view */}
      {isCurrentMonth && (
        <div>
          {shifts.map((shift) => (
            <ShiftDropZone
              key={shift.id}
              date={date}
              shift={shift}
              assignments={assignments}
              crewMembers={crewMembers}
              onAssign={onAssign}
              onRemove={onRemove}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ShiftDropZoneProps {
  date: string;
  shift: ShiftConfig;
  assignments: Assignment[];
  crewMembers: CrewMember[];
  onAssign: (crewId: string, date: string, shiftId: string) => void;
  onRemove: (crewId: string, date: string, shiftId: string) => void;
  viewMode: ViewMode;
}

function ShiftDropZone({
  date,
  shift,
  assignments,
  crewMembers,
  onAssign,
  onRemove,
  viewMode,
}: ShiftDropZoneProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOtherDepartments, setShowOtherDepartments] = useState(false);

  const currentAssignments = assignments.filter(
    (a) => a.date === date && a.shiftId === shift.id
  );

  const primaryAssignments = currentAssignments.filter((a) => a.type === 'primary');
  const backupAssignments = currentAssignments.filter((a) => a.type === 'backup');

  const primaryCount = primaryAssignments.length;
  const backupCount = backupAssignments.length;

  const canAddPrimary = primaryCount < shift.primaryCount;
  const canAddBackup = backupCount < shift.backupCount;

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'crew-member',
    canDrop: (item: { crewId: string }) => {
      // Check if crew member is on leave
      const crew = crewMembers.find(c => c.id === item.crewId);
      if (crew?.status === 'on-leave') {
        // Check if date is within leave period
        if (crew.leaveStart && crew.leaveEnd && date >= crew.leaveStart && date <= crew.leaveEnd) {
          return false;
        }
      }
      
      // Check if crew member is already assigned to this shift
      const isAlreadyAssigned = currentAssignments.some(
        (a) => a.crewId === item.crewId
      );
      if (isAlreadyAssigned) {
        return false;
      }
      // Check capacity
      return canAddPrimary || canAddBackup;
    },
    drop: (item: { crewId: string }) => {
      onAssign(item.crewId, date, shift.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [currentAssignments, canAddPrimary, canAddBackup, date, shift.id, onAssign, crewMembers]);

  const getCrewById = (id: string) => crewMembers.find((c) => c.id === id);

  // Get available crew for this shift (not already assigned and not on leave)
  const getAvailableCrew = () => {
    const assignedCrewIds = currentAssignments.map((a) => a.crewId);
    return crewMembers.filter((crew) => {
      // Filter out already assigned crew
      if (assignedCrewIds.includes(crew.id)) return false;
      
      // Filter out crew on leave for this date
      if (crew.status === 'on-leave' && crew.leaveStart && crew.leaveEnd) {
        if (date >= crew.leaveStart && date <= crew.leaveEnd) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getShiftIcon = (shiftName: string) => {
    if (shiftName.toLowerCase().includes('morning')) return '☀️';
    if (shiftName.toLowerCase().includes('afternoon')) return '🌤️';
    if (shiftName.toLowerCase().includes('night')) return '🌙';
    return '⏰';
  };

  const getShiftBackground = (shiftName: string) => {
    const name = shiftName.toLowerCase();
    if (name.includes('morning')) return 'bg-blue-50 dark:bg-blue-950/20';
    if (name.includes('afternoon')) return 'bg-amber-50 dark:bg-amber-950/20';
    if (name.includes('night')) return 'bg-indigo-50 dark:bg-indigo-950/20';
    return 'bg-muted/30';
  };

  const renderAssignedCrew = (assignment: Assignment) => {
    const crew = getCrewById(assignment.crewId);
    if (!crew) return null;

    const displayName = crew.nickname || crew.name.split(' ')[0];
    const initials = crew.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    const isBackup = assignment.type === 'backup';

    return (
      <TooltipProvider key={`${assignment.crewId}-${assignment.date}-${assignment.shiftId}-${assignment.type}`} delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`group relative flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-all cursor-pointer ${
                isBackup
                  ? 'bg-muted/60 border border-dashed border-border'
                  : 'border-l-2 border-y border-r'
              }`}
              style={
                !isBackup
                  ? {
                      backgroundColor: `${crew.color}35`,
                      borderLeftColor: crew.color,
                      borderRightColor: 'var(--border)',
                      borderTopColor: 'var(--border)',
                      borderBottomColor: 'var(--border)',
                    }
                  : undefined
              }
            >
              <Avatar className="h-3.5 w-3.5 shrink-0">
                <AvatarImage src={getCrewAvatarUrl(crew.name)} alt={crew.name} />
                <AvatarFallback
                  className="text-[8px] bg-muted text-foreground"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span 
                className="truncate flex-1 text-[10px] text-foreground min-w-0"
              >
                {displayName}
              </span>
              {isBackup && (
                <Badge
                  variant="outline"
                  className="h-3 px-0.5 text-[7px] border-muted-foreground/30 shrink-0"
                >
                  B
                </Badge>
              )}
              <button
                onClick={() => onRemove(assignment.crewId, date, shift.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-destructive/10 rounded p-0.5"
              >
                <X className="h-2 w-2 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-3 max-w-xs">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={getCrewAvatarUrl(crew.name)} alt={crew.name} />
                <AvatarFallback
                  className="text-sm"
                  style={{ backgroundColor: crew.color, color: 'white' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{crew.name}</p>
                {crew.nickname && (
                  <p className="text-sm text-muted-foreground">"{crew.nickname}"</p>
                )}
                <p className="text-xs text-muted-foreground">{crew.position}</p>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div
      ref={drop}
      className={`transition-all ${getShiftBackground(shift.name)} ${
        isOver && canDrop ? 'ring-1 ring-primary/30 ring-inset' : ''
      } ${!canDrop && isOver ? 'ring-1 ring-destructive/30 ring-inset' : ''} ${
        viewMode === 'day' ? 'p-2.5' : 'p-2'
      }`}
    >
      {/* Shift Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-0.5">
          <span className="text-[9px]">{getShiftIcon(shift.name)}</span>
          <span className={`${viewMode === 'day' ? 'text-sm' : 'text-[10px]'} font-medium text-primary`}>
            {shift.name}
          </span>
        </div>
        {viewMode === 'day' && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{shift.startTime} - {shift.endTime}</span>
          </div>
        )}
      </div>

      {/* Assigned Crew */}
      <div className="space-y-0.5">
        {currentAssignments.map(renderAssignedCrew)}
      </div>

      {/* Add Button / Drop Zone Hint */}
      {(canAddPrimary || canAddBackup) && currentAssignments.length === 0 && (
        <div className="mt-1">
          <Popover
            open={popoverOpen}
            onOpenChange={(open) => {
              setPopoverOpen(open);
              if (!open) {
                setSearchTerm('');
                setShowOtherDepartments(false);
              }
            }}
          >
            <PopoverTrigger asChild>
              <button
                className="w-full text-left px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                + Add
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              {/* Header */}
              <div className="p-3 border-b border-border">
                <h4 className="text-sm font-medium mb-2">Add Crew to {shift.name}</h4>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search crew..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              {/* Crew List */}
              <div className="max-h-[280px] overflow-y-auto">
                <CrewList
                  availableCrew={getAvailableCrew()}
                  searchTerm={searchTerm}
                  showOtherDepartments={showOtherDepartments}
                  onToggleOtherDepartments={() => setShowOtherDepartments(!showOtherDepartments)}
                  onSelectCrew={(crewId) => {
                    onAssign(crewId, date, shift.id);
                    setPopoverOpen(false);
                    setSearchTerm('');
                    setShowOtherDepartments(false);
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Capacity Indicator */}
      {viewMode === 'day' && (
        <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
          <span className={primaryCount >= shift.primaryCount ? 'text-warning' : ''}>
            {primaryCount}/{shift.primaryCount} Primary
          </span>
          <span>•</span>
          <span className={backupCount >= shift.backupCount ? 'text-warning' : ''}>
            {backupCount}/{shift.backupCount} Backup
          </span>
        </div>
      )}
    </div>
  );
}
