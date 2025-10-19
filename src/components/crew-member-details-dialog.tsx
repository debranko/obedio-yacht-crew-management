import { useState, useMemo } from 'react';
import { CrewMember, Assignment, ShiftConfig } from './duty-roster/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Mail,
  Phone,
  Radio,
  Edit,
  UserPlus,
  UserX,
  Calendar as CalendarIcon,
  Clock,
  Languages,
  Award,
  X,
  Smartphone,
  Watch,
  Tablet,
  Wifi,
  WifiOff,
  BatteryLow,
  Camera,
  Upload,
} from 'lucide-react';
import { formatDate, parseDate, formatDateDisplay, getDayName } from './duty-roster/utils';
import { toast } from 'sonner';
import { useAppData } from '../contexts/AppDataContext';
import { CameraDialog } from './camera-dialog';

interface CrewMemberDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewMember: CrewMember;
  assignments: Assignment[];
  shifts: ShiftConfig[];
  onUpdate: (updatedCrew: CrewMember) => void;
  onAssignToShift?: () => void;
}

export function CrewMemberDetailsDialog({
  open,
  onOpenChange,
  crewMember,
  assignments,
  shifts,
  onUpdate,
  onAssignToShift,
}: CrewMemberDetailsDialogProps) {
  const { getCrewDevice, assignDeviceToCrew, removeDeviceFromCrew } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [editedCrew, setEditedCrew] = useState<CrewMember>(crewMember);
  const [showLeaveCalendar, setShowLeaveCalendar] = useState(false);
  const [leaveRange, setLeaveRange] = useState<{ from?: Date; to?: Date }>({
    from: crewMember.leaveStart ? parseDate(crewMember.leaveStart) : undefined,
    to: crewMember.leaveEnd ? parseDate(crewMember.leaveEnd) : undefined,
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  
  // Get current device assignment
  const currentDevice = getCrewDevice(crewMember.id);
  
  // Mock available devices - In production, this would come from AppDataContext
  const availableDevices = [
    { id: 'watch-001', name: 'Apple Watch Series 9', type: 'watch' as const },
    { id: 'watch-002', name: 'Samsung Galaxy Watch 6', type: 'watch' as const },
    { id: 'watch-003', name: 'Apple Watch Ultra 2', type: 'watch' as const },
    { id: 'tablet-001', name: 'iPad Pro 12.9"', type: 'tablet' as const },
    { id: 'tablet-002', name: 'Samsung Galaxy Tab S9', type: 'tablet' as const },
    { id: 'phone-001', name: 'iPhone 15 Pro', type: 'phone' as const },
  ];
  
  const handleAssignDevice = () => {
    if (!selectedDeviceId) {
      toast.error('Please select a device');
      return;
    }
    
    const device = availableDevices.find(d => d.id === selectedDeviceId);
    if (!device) return;
    
    assignDeviceToCrew({
      crewMemberId: crewMember.id,
      crewMemberName: crewMember.name,
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type,
      status: 'connected',
    });
    
    toast.success(`${device.name} assigned to ${crewMember.name.split(' ')[0]}`);
    setSelectedDeviceId('');
  };
  
  const handleRemoveDevice = () => {
    if (!currentDevice) return;
    
    removeDeviceFromCrew(crewMember.id);
    toast.success(`${currentDevice.deviceName} removed from ${crewMember.name.split(' ')[0]}`);
  };
  
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'watch':
        return Watch;
      case 'tablet':
        return Tablet;
      case 'phone':
        return Smartphone;
      default:
        return Smartphone;
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setEditedCrew({ ...editedCrew, avatar: imageDataUrl });
    toast.success('Photo captured successfully');
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditedCrew({ ...editedCrew, avatar: e.target?.result as string });
          toast.success('Photo uploaded successfully');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Calculate current schedule overview
  const scheduleOverview = useMemo(() => {
    const today = formatDate(new Date());
    const now = new Date();
    
    // Find today's assignments
    const todayAssignments = assignments.filter(
      (a) => a.crewId === crewMember.id && a.date === today
    );
    
    // Find future assignments
    const futureAssignments = assignments
      .filter((a) => a.crewId === crewMember.id && a.date > today)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const nextAssignment = futureAssignments[0];
    
    // Calculate hours worked this week (last 7 days)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = formatDate(weekStart);
    
    const weekAssignments = assignments.filter(
      (a) => a.crewId === crewMember.id && a.date >= weekStartStr && a.date <= today
    );
    
    // Estimate hours (each shift ~8 hours for calculation)
    const hoursThisWeek = weekAssignments.length * 8;
    
    // Calculate days off (days without assignments in last 7 days)
    const assignedDays = new Set(weekAssignments.map((a) => a.date));
    let daysOff = 0;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = formatDate(checkDate);
      if (!assignedDays.has(checkDateStr)) {
        daysOff++;
      }
    }
    
    return {
      currentShift: todayAssignments.length > 0 ? todayAssignments[0] : null,
      nextShift: nextAssignment,
      hoursThisWeek,
      daysOffThisWeek: daysOff,
    };
  }, [assignments, crewMember.id]);

  const handleSave = () => {
    // Update leave dates from calendar selection
    if (leaveRange.from) {
      editedCrew.leaveStart = formatDate(leaveRange.from);
      editedCrew.leaveEnd = leaveRange.to ? formatDate(leaveRange.to) : formatDate(leaveRange.from);
      editedCrew.status = 'on-leave';
    } else {
      editedCrew.leaveStart = undefined;
      editedCrew.leaveEnd = undefined;
      if (editedCrew.status === 'on-leave') {
        editedCrew.status = 'off-duty';
      }
    }
    
    onUpdate(editedCrew);
    setIsEditing(false);
    toast.success('Crew member details updated');
  };

  const handleMarkUnavailable = () => {
    const updated = {
      ...crewMember,
      status: crewMember.status === 'off-duty' ? 'on-duty' : 'off-duty' as const,
    };
    onUpdate(updated);
    toast.success(
      updated.status === 'off-duty'
        ? `${crewMember.name.split(' ')[0]} removed from duty`
        : `${crewMember.name.split(' ')[0]} activated for duty`
    );
  };

  const handleSetOnLeave = () => {
    setShowLeaveCalendar(!showLeaveCalendar);
  };

  const addLanguage = () => {
    const lang = prompt('Enter language:');
    if (lang && lang.trim()) {
      setEditedCrew({
        ...editedCrew,
        languages: [...(editedCrew.languages || []), lang.trim()],
      });
    }
  };

  const removeLanguage = (index: number) => {
    setEditedCrew({
      ...editedCrew,
      languages: editedCrew.languages?.filter((_, i) => i !== index) || [],
    });
  };

  const addSkill = () => {
    const skill = prompt('Enter skill:');
    if (skill && skill.trim()) {
      setEditedCrew({
        ...editedCrew,
        skills: [...(editedCrew.skills || []), skill.trim()],
      });
    }
  };

  const removeSkill = (index: number) => {
    setEditedCrew({
      ...editedCrew,
      skills: editedCrew.skills?.filter((_, i) => i !== index) || [],
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'on-leave':
        return <Badge variant="destructive">On Leave</Badge>;
      case 'on-duty':
        return <Badge className="bg-success text-white">On Duty</Badge>;
      case 'off-duty':
      default:
        return <Badge variant="secondary">Off Duty</Badge>;
    }
  };

  const getShiftName = (shiftId: string) => {
    const shift = shifts.find((s) => s.id === shiftId);
    return shift ? `${shift.name} (${shift.startTime} - ${shift.endTime})` : 'Unknown';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crew Member Details</DialogTitle>
          <DialogDescription>
            View and edit crew member information, schedule, and availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Avatar and Status */}
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={isEditing ? editedCrew.avatar : crewMember.avatar} />
                <AvatarFallback
                  className="text-white"
                  style={{ backgroundColor: crewMember.color }}
                >
                  {crewMember.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <div className="flex flex-col gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFileUpload}
                    className="w-full"
                  >
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCameraDialogOpen(true)}
                    className="w-full"
                  >
                    <Camera className="h-3.5 w-3.5 mr-2" />
                    Camera
                  </Button>
                  {editedCrew.avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditedCrew({ ...editedCrew, avatar: '' })}
                      className="w-full text-xs"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-1">{crewMember.name}</h3>
                  {crewMember.nickname && (
                    <p className="text-sm text-muted-foreground mb-2">"{crewMember.nickname}"</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {crewMember.position} • {crewMember.department}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(crewMember.status)}
                  {crewMember.leaveStart && crewMember.leaveEnd && (
                    <p className="text-xs text-muted-foreground">
                      Until {formatDateDisplay(crewMember.leaveEnd, 'short')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4>Contact Information</h4>

            {isEditing ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={editedCrew.email || ''}
                      onChange={(e) =>
                        setEditedCrew({ ...editedCrew, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={editedCrew.phone || ''}
                      onChange={(e) =>
                        setEditedCrew({ ...editedCrew, phone: e.target.value })
                      }
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>On Board Contact</Label>
                  <div className="relative">
                    <Radio className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={editedCrew.onBoardContact || ''}
                      onChange={(e) =>
                        setEditedCrew({ ...editedCrew, onBoardContact: e.target.value })
                      }
                      placeholder="Ext. 101"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{crewMember.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{crewMember.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Radio className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    On Board: {crewMember.onBoardContact || 'Not provided'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Current Schedule Overview */}
          <div className="space-y-4">
            <h4>Current Schedule</h4>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Current Shift</p>
                </div>
                <p className="font-medium">
                  {scheduleOverview.currentShift
                    ? getShiftName(scheduleOverview.currentShift.shiftId)
                    : 'Not assigned today'}
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Next Shift</p>
                </div>
                <p className="font-medium">
                  {scheduleOverview.nextShift
                    ? `${formatDateDisplay(scheduleOverview.nextShift.date, 'short')} - ${getShiftName(
                        scheduleOverview.nextShift.shiftId
                      )}`
                    : 'No upcoming shifts'}
                </p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Hours This Week</p>
                <p className="font-medium">{scheduleOverview.hoursThisWeek}h</p>
              </Card>

              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Days Off This Week</p>
                <p className="font-medium">{scheduleOverview.daysOffThisWeek} days</p>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Skills & Languages */}
          <div className="space-y-4">
            <h4>Skills & Languages</h4>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <Label>Languages</Label>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={addLanguage}>
                      Add
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedCrew.languages && editedCrew.languages.length > 0 ? (
                    editedCrew.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="gap-2">
                        {lang}
                        {isEditing && (
                          <button
                            onClick={() => removeLanguage(index)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No languages specified</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-primary" />
                  <Label>Special Skills</Label>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={addSkill}>
                      Add
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedCrew.skills && editedCrew.skills.length > 0 ? (
                    editedCrew.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-2">
                        {skill}
                        {isEditing && (
                          <button
                            onClick={() => removeSkill(index)}
                            className="hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No special skills specified</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Assigned Device */}
          <div className="space-y-4">
            <h4>Assigned Device</h4>

            {currentDevice ? (
              <div className="space-y-3">
                <div className="p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const DeviceIcon = getDeviceIcon(currentDevice.deviceType);
                        return <DeviceIcon className="h-5 w-5 mt-0.5 text-primary" />;
                      })()}
                      <div>
                        <p>{currentDevice.deviceName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {currentDevice.deviceType}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {currentDevice.status === 'connected' ? (
                            <>
                              <Wifi className="h-3.5 w-3.5 text-success" />
                              <span className="text-sm text-success">Connected</span>
                            </>
                          ) : currentDevice.status === 'low-battery' ? (
                            <>
                              <BatteryLow className="h-3.5 w-3.5 text-warning" />
                              <span className="text-sm text-warning">Low Battery</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Disconnected</span>
                            </>
                          )}
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            Last sync: {new Date(currentDevice.lastSync).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveDevice}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Assigned on {new Date(currentDevice.assignedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No device currently assigned to this crew member
                </p>
                <div className="flex gap-2">
                  <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a device..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.map((device) => {
                        const DeviceIcon = getDeviceIcon(device.type);
                        return (
                          <SelectItem key={device.id} value={device.id}>
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4" />
                              {device.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignDevice}>Assign</Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Availability & Leave */}
          <div className="space-y-4">
            <h4>Availability & Leave</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Current Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {crewMember.status === 'on-leave'
                      ? `On leave from ${formatDateDisplay(
                          crewMember.leaveStart!,
                          'short'
                        )} to ${formatDateDisplay(crewMember.leaveEnd!, 'short')}`
                      : crewMember.status === 'on-duty'
                      ? 'Currently on duty'
                      : 'Available for duty'}
                  </p>
                </div>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <Label>Set Leave Period</Label>
                  <Popover open={showLeaveCalendar} onOpenChange={setShowLeaveCalendar}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {leaveRange.from ? (
                          leaveRange.to ? (
                            <>
                              {formatDateDisplay(formatDate(leaveRange.from), 'short')} -{' '}
                              {formatDateDisplay(formatDate(leaveRange.to), 'short')}
                            </>
                          ) : (
                            formatDateDisplay(formatDate(leaveRange.from), 'short')
                          )
                        ) : (
                          'Select leave dates'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={leaveRange}
                        onSelect={(range) => {
                          setLeaveRange(range || {});
                        }}
                        numberOfMonths={2}
                      />
                      <div className="p-3 border-t flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setLeaveRange({});
                            setShowLeaveCalendar(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowLeaveCalendar(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <>
              <Separator />

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={editedCrew.notes || ''}
                  onChange={(e) =>
                    setEditedCrew({ ...editedCrew, notes: e.target.value })
                  }
                  placeholder="Additional notes about this crew member..."
                  rows={3}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedCrew(crewMember);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </Button>
                  {onAssignToShift && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAssignToShift}
                      disabled={crewMember.status === 'on-leave'}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign to Shift
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkUnavailable}
                    disabled={crewMember.status === 'on-leave'}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    {crewMember.status === 'off-duty'
                      ? 'Activate for Duty'
                      : 'Remove from Duty'}
                  </Button>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedCrew(crewMember);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Camera Dialog */}
      <CameraDialog
        open={isCameraDialogOpen}
        onOpenChange={setIsCameraDialogOpen}
        onCapture={handleCameraCapture}
      />
    </Dialog>
  );
}
