import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, User, Users, X, Plus, Search } from 'lucide-react';
import { ShiftConfig, CrewMember, Assignment } from './types';
import { getCrewAvatarUrl } from '../crew-avatars';

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  shifts: ShiftConfig[];
  assignments: Assignment[];
  crewMembers: CrewMember[];
  onNavigate?: (direction: 'prev' | 'next') => void;
  onAddCrew?: (crewId: string, date: string, shiftId: string) => void;
  onRemoveCrew?: (crewId: string, date: string, shiftId: string) => void;
}

// Helper function to get background color based on shift name
const getShiftBackground = (shiftName: string): string => {
  const name = shiftName.toLowerCase();
  if (name.includes('morning')) {
    return 'bg-blue-50 dark:bg-blue-950/20';
  }
  if (name.includes('afternoon')) {
    return 'bg-amber-50 dark:bg-amber-950/20';
  }
  if (name.includes('night')) {
    return 'bg-indigo-50 dark:bg-indigo-950/20';
  }
  return 'bg-muted/30';
};

export function DayDetailDialog({
  open,
  onOpenChange,
  date,
  shifts,
  assignments,
  crewMembers,
  onNavigate,
  onAddCrew,
  onRemoveCrew,
}: DayDetailDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [showOtherDepartments, setShowOtherDepartments] = useState<Record<string, boolean>>({});
  
  // Get all assignments for this date
  const dayAssignments = assignments.filter((a) => a.date === date);

  // Format date for display
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
  const isToday = date === new Date().toISOString().split('T')[0];

  // Get crew member details by ID
  const getCrewById = (crewId: string) => {
    return crewMembers.find((c) => c.id === crewId);
  };

  // Get assignments for a specific shift
  const getShiftAssignments = (shiftId: string, type: 'primary' | 'backup') => {
    return dayAssignments
      .filter((a) => a.shiftId === shiftId && a.type === type)
      .map((a) => getCrewById(a.crewId))
      .filter(Boolean) as CrewMember[];
  };

  // Get available crew for a shift (not already assigned to that shift)
  // IMPORTANT: Filter out crew members who are on leave
  const getAvailableCrew = (shiftId: string) => {
    const assignedCrewIds = dayAssignments
      .filter((a) => a.shiftId === shiftId)
      .map((a) => a.crewId);
    
    return crewMembers.filter(
      (crew) => !assignedCrewIds.includes(crew.id) && crew.status !== 'on-leave'
    );
  };

  // Filter crew by search term
  const filterCrewBySearch = (crew: CrewMember[]) => {
    if (!searchTerm) return crew;
    
    const term = searchTerm.toLowerCase();
    return crew.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.position.toLowerCase().includes(term) ||
        c.department.toLowerCase().includes(term) ||
        c.nickname?.toLowerCase().includes(term)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 pt-4 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {dayOfWeek}, {dateObj.getDate()}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </DialogDescription>
              </div>
            </div>
            {isToday && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs h-5">
                Today
              </Badge>
            )}
          </div>

          {/* Navigation */}
          {onNavigate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('prev')}
                className="h-7 text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('next')}
                className="h-7 text-xs"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <Separator />

        {/* Content - No horizontal padding to allow full-width shift sections */}
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {shifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground px-4">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No shifts configured</p>
                <p className="text-xs mt-1">Configure shifts in roster settings</p>
              </div>
            ) : (
              shifts.map((shift) => {
                const primaryCrew = getShiftAssignments(shift.id, 'primary');
                const backupCrew = getShiftAssignments(shift.id, 'backup');
                const totalAssigned = primaryCrew.length + backupCrew.length;

                return (
                  <div
                    key={shift.id}
                    className={`${getShiftBackground(shift.name)} px-4 py-3`}
                  >
                    {/* Shift Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium">{shift.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="bg-background/60 text-xs h-5">
                          {totalAssigned}
                        </Badge>
                        {onAddCrew && (
                          <Popover
                            open={openPopoverId === shift.id}
                            onOpenChange={(open) => {
                              setOpenPopoverId(open ? shift.id : null);
                              if (!open) {
                                setSearchTerm('');
                                setShowOtherDepartments({});
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0 bg-background/60"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                              <div className="p-3 border-b border-border">
                                <h4 className="font-medium mb-2">Add Crew to {shift.name}</h4>
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search crew..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                              <ScrollArea className="max-h-[320px]">
                                <div className="p-3">
                                  {(() => {
                                    const availableCrew = getAvailableCrew(shift.id);
                                    const filteredCrew = filterCrewBySearch(availableCrew);
                                    
                                    if (filteredCrew.length === 0) {
                                      return (
                                        <div className="text-center py-8 text-muted-foreground">
                                          <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                          <p className="text-sm">
                                            {availableCrew.length === 0
                                              ? 'All crew members assigned'
                                              : 'No crew found'}
                                          </p>
                                        </div>
                                      );
                                    }
                                    
                                    // Separate Interior crew from others
                                    const interiorCrew = filteredCrew.filter(c => c.department === 'Interior');
                                    const otherCrew = filteredCrew.filter(c => c.department !== 'Interior');
                                    
                                    const renderCrewButton = (crew: CrewMember) => (
                                      <button
                                        key={crew.id}
                                        onClick={() => {
                                          onAddCrew(crew.id, date, shift.id);
                                          setOpenPopoverId(null);
                                          setSearchTerm('');
                                          setShowOtherDepartments({});
                                        }}
                                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors"
                                      >
                                        <Avatar className="h-9 w-9">
                                          <img
                                            src={getCrewAvatarUrl(crew.name)}
                                            alt={crew.name}
                                            className="object-cover"
                                          />
                                        </Avatar>
                                        <div className="flex-1 text-left min-w-0">
                                          <p className="font-medium text-sm truncate">
                                            {crew.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {crew.position}
                                          </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                          {crew.department}
                                        </Badge>
                                      </button>
                                    );
                                    
                                    return (
                                      <>
                                        {/* Interior Crew */}
                                        {interiorCrew.length > 0 && (
                                          <div className="space-y-1">
                                            {interiorCrew.map(renderCrewButton)}
                                          </div>
                                        )}
                                        
                                        {/* Expandable Other Departments */}
                                        {interiorCrew.length > 0 && otherCrew.length > 0 && (
                                          <>
                                            <div className="my-2">
                                              <Separator />
                                            </div>
                                            <button
                                              onClick={() => setShowOtherDepartments(prev => ({
                                                ...prev,
                                                [shift.id]: !prev[shift.id]
                                              }))}
                                              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
                                            >
                                              <ChevronDown className={`h-4 w-4 transition-transform ${showOtherDepartments[shift.id] ? 'rotate-180' : ''}`} />
                                              <span>{showOtherDepartments[shift.id] ? 'Hide other departments' : 'Include other departments'}</span>
                                            </button>
                                            <div className="mb-2">
                                              <Separator />
                                            </div>
                                          </>
                                        )}
                                        
                                        {/* Other Departments Crew - Only show when expanded */}
                                        {showOtherDepartments[shift.id] && otherCrew.length > 0 && (
                                          <div className="space-y-1">
                                            {otherCrew.map(renderCrewButton)}
                                          </div>
                                        )}
                                        
                                        {/* Show only other crew if no interior crew */}
                                        {interiorCrew.length === 0 && otherCrew.length > 0 && (
                                          <div className="space-y-1">
                                            {otherCrew.map(renderCrewButton)}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>

                    {/* Primary Crew */}
                    {primaryCrew.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Primary</span>
                        </div>
                        <div className="space-y-1.5">
                          {primaryCrew.map((crew) => (
                            <div
                              key={crew.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-border/50 group"
                            >
                              <Avatar className="h-7 w-7">
                                <img
                                  src={getCrewAvatarUrl(crew.name)}
                                  alt={crew.name}
                                  className="object-cover"
                                />
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{crew.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {crew.position}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                {crew.department}
                              </Badge>
                              {onRemoveCrew && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => onRemoveCrew(crew.id, date, shift.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Backup Crew */}
                    {backupCrew.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Backup</span>
                        </div>
                        <div className="space-y-1.5">
                          {backupCrew.map((crew) => (
                            <div
                              key={crew.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-background/30 border border-dashed border-border/30 group"
                            >
                              <Avatar className="h-7 w-7 opacity-75">
                                <img
                                  src={getCrewAvatarUrl(crew.name)}
                                  alt={crew.name}
                                  className="object-cover"
                                />
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium opacity-75">{crew.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {crew.position}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 opacity-75">
                                {crew.department}
                              </Badge>
                              {onRemoveCrew && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => onRemoveCrew(crew.id, date, shift.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {totalAssigned === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Users className="h-6 w-6 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No crew assigned</p>
                        {onAddCrew && (
                          <p className="text-[10px] mt-1">Click + to add</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="px-4 py-2.5 flex items-center justify-between bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {dayAssignments.length} {dayAssignments.length === 1 ? 'assignment' : 'assignments'}
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-7 text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
