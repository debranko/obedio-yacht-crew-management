import React, { useState, useMemo } from "react";
import { Search, Download, UserPlus, ArrowUpDown, Edit, Trash2, MessageSquare, AlertTriangle, Power, Users, Shield, X, Plus, Camera, Upload, Bell } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { CameraDialog } from "../camera-dialog";
import { useAppData } from "../../contexts/AppDataContext";
import { DutyTimerCard } from "../duty-timer-card";
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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { getCrewAvatar } from "../crew-avatars";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { CrewMemberDetailsDialog } from "../crew-member-details-dialog";
import { CrewMember } from "../duty-roster/types";
import { SendMessageDialog } from "../send-message-dialog";
import { NotificationSettingsDialog, NotificationSettings } from "../notification-settings-dialog";
import { CrewCardView } from "../crew-card-view";
import { CredentialsDialog } from "../CredentialsDialog";
import { PermissionGuard } from "../PermissionGuard";
import { usePermissions } from "../../hooks/usePermissions";
import { ROLE_NAMES } from "../../config/permissions";
import { Role } from "../../types/crew";
import { api } from "../../services/api";

interface DutyInfo {
  shift: string;
  date: string;
  type?: 'primary' | 'backup';
}

interface CrewListPageProps {
  onNavigate?: (page: string) => void;
  onNavigateToSettingsRoles?: () => void;
}

export function CrewListPage({ onNavigate, onNavigateToSettingsRoles }: CrewListPageProps) {
  const { 
    crewMembers: contextCrewMembers, 
    getCurrentDutyStatus, 
    setCrewMembers: setContextCrewMembers,
    assignments: contextAssignments,
    setAssignments: setContextAssignments,
    shifts: contextShifts,
    notificationSettings,
    updateNotificationSettings
  } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof CrewMember; direction: "asc" | "desc" } | null>(null);
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isPermissionsPromptOpen, setIsPermissionsPromptOpen] = useState(false);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const [cameraDialogMode, setCameraDialogMode] = useState<'add' | 'edit'>('add');
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{
    username: string;
    password: string;
    crewMemberName: string;
  } | null>(null);
  
  // Permissions
  const { can } = usePermissions();
  
  // Selected items state
  const [selectedCrewForDetails, setSelectedCrewForDetails] = useState<CrewMember | null>(null);
  const [messageRecipient, setMessageRecipient] = useState<{ name: string; id: string } | null>(null);
  const [crewToRemove, setCrewToRemove] = useState<{ crew: CrewMember; dutyInfo: DutyInfo } | null>(null);
  const [newlyAddedCrewName, setNewlyAddedCrewName] = useState<string>("");
  const [crewToActivate, setCrewToActivate] = useState<CrewMember | null>(null);
  
  // Notification preferences
  const [shouldNotify, setShouldNotify] = useState(true);
  const [shouldNotifyActivate, setShouldNotifyActivate] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    position: "",
    department: "Interior",
    role: "crew" as Role,
    status: "off-duty" as "on-duty" | "off-duty" | "on-leave",
    contact: "",
    phone: "",
    onBoardContact: "",
    email: "",
    avatar: "",
    color: "#C8A96B",
    languages: [] as string[],
    skills: [] as string[],
    notes: "",
    leaveStart: "",
    leaveEnd: ""
  });

  // Get unique departments for filter
  const departments = ["All", ...Array.from(new Set(contextCrewMembers.map(c => c.department))).sort()];
  
  // Filter crew members
  const filteredCrewMembers = contextCrewMembers.filter((crew) => {
    const matchesSearch = 
      crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (crew.phone && crew.phone.includes(searchQuery)) ||
      (crew.onBoardContact && crew.onBoardContact.includes(searchQuery));
    
    const matchesDepartment = selectedDepartment === "All" || crew.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Status priority map for sorting
  const statusPriority: Record<string, number> = {
    'on-duty': 3,
    'off-duty': 2,
    'on-leave': 1
  };

  // Sort crew members
  const sortedCrewMembers = [...filteredCrewMembers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    // Special handling for status sorting
    if (sortConfig.key === 'status') {
      const aPriority = statusPriority[a.status || 'off-duty'] || 0;
      const bPriority = statusPriority[b.status || 'off-duty'] || 0;
      
      if (aPriority < bPriority) return sortConfig.direction === "asc" ? -1 : 1;
      if (aPriority > bPriority) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof CrewMember) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key, direction: "desc" };
      }
      return null;
    });
  };

  const handleAddCrew = async () => {
    if (!formData.name || !formData.position || !formData.email || !formData.role) {
      toast.error("Please fill in all required fields (Name, Position, Email, Role)");
      return;
    }

    try {
      // Call backend API to create crew member + user account
      const response = await fetch('http://localhost:3001/api/crew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          position: formData.position,
          department: formData.department,
          role: formData.role,
          status: formData.status,
          contact: formData.phone || formData.contact || null,
          email: formData.email,
          joinDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create crew member');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Update local state
        const newCrew: CrewMember = {
          id: data.data.id,
          name: data.data.name,
          nickname: formData.nickname || undefined,
          position: data.data.position,
          department: data.data.department,
          color: formData.color,
          email: data.data.email || undefined,
          phone: formData.phone || formData.contact || undefined,
          onBoardContact: formData.onBoardContact || formData.contact || undefined,
          status: data.data.status,
          avatar: formData.avatar || undefined,
          languages: formData.languages.length > 0 ? formData.languages : undefined,
          skills: formData.skills.length > 0 ? formData.skills : undefined,
          notes: formData.notes || undefined,
          leaveStart: formData.leaveStart || undefined,
          leaveEnd: formData.leaveEnd || undefined
        };

        setContextCrewMembers([...contextCrewMembers, newCrew]);
        
        // Show credentials dialog if credentials were generated
        if (data.data.credentials) {
          setNewCredentials({
            username: data.data.credentials.username,
            password: data.data.credentials.password,
            crewMemberName: data.data.name
          });
          setShowCredentialsDialog(true);
        }
        
        setIsAddDialogOpen(false);
        setNewlyAddedCrewName(formData.name);
        resetForm();
        toast.success(`${formData.name} has been added to the crew`);
      }
    } catch (error: any) {
      console.error('Error creating crew member:', error);
      toast.error(error.message || 'Failed to create crew member');
    }
  };

  // handleEditCrew removed - now using CrewMemberDetailsDialog for editing

  const handleDeleteCrew = async (crew: CrewMember) => {
    try {
      console.log('🗑️ Deleting crew member:', crew.id, crew.name);

      // ✅ Use API service with proper authentication and port (8080)
      await api.crew.delete(crew.id);

      console.log('✅ Crew member deleted from database successfully');

      // Update context state to remove deleted crew member
      setContextCrewMembers(contextCrewMembers.filter(c => c.id !== crew.id));

      // Close details dialog if open
      setIsDetailsDialogOpen(false);

      toast.success(`${crew.name} has been removed from the crew`);
    } catch (error: any) {
      console.error('❌ Error deleting crew member:', error);
      toast.error(error.message || 'Failed to delete crew member');
    }
  };

  // Handler for confirming removal of crew from duty
  const handleConfirmRemoval = async () => {
    if (!crewToRemove) return;

    const { crew, dutyInfo } = crewToRemove;

    // Find the crew member from context by ID
    const contextCrew = contextCrewMembers.find(c => c.id === crew.id);
    if (!contextCrew) return;

    // Check if this is an emergency override (not from Duty Roster)
    const isEmergencyOverride = dutyInfo.shift === 'Emergency';

    if (!isEmergencyOverride) {
      // Remove from Duty Roster assignments only if assigned in calendar
      const today = new Date().toISOString().split('T')[0];

      // Parse shift time string (e.g., "06:00 - 14:00") to find matching shift config
      const shiftTimeMatch = dutyInfo.shift.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
      let currentShiftId: string | undefined;

      if (shiftTimeMatch) {
        const [, startTime, endTime] = shiftTimeMatch;
        const currentShift = contextShifts.find(
          s => s.startTime === startTime && s.endTime === endTime
        );
        currentShiftId = currentShift?.id;
      }

      // Filter out assignments for this crew member on today's date and current shift
      const updatedAssignments = contextAssignments.filter(assignment => {
        // Remove assignment if it matches this crew member, today, and current shift
        if (
          assignment.crewId === contextCrew.id &&
          assignment.date === today &&
          currentShiftId &&
          assignment.shiftId === currentShiftId
        ) {
          return false; // Remove this assignment
        }
        return true; // Keep all other assignments
      });

      // Update context assignments
      setContextAssignments(updatedAssignments);
    }

    try {
      // Update crew status to off-duty in backend
      const response = await fetch(`http://localhost:3001/api/crew/${crew.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'off-duty',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update crew status');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Update context crew status with backend data
        const updatedContextCrew = contextCrewMembers.map(c =>
          c.id === crew.id ? { ...c, ...data.data } : c
        );
        setContextCrewMembers(updatedContextCrew);

        // Show success toast
        toast.success(`${crew.name} removed from duty`, {
          description: shouldNotify
            ? `Notification sent (${isEmergencyOverride ? 'Emergency' : dutyInfo.shift})`
            : `Removed without notification (${isEmergencyOverride ? 'Emergency' : dutyInfo.shift})`
        });
      }
    } catch (error: any) {
      console.error('Error updating crew status:', error);
      toast.error(error.message || 'Failed to remove crew from duty');
    }

    // Reset state
    setIsConfirmDialogOpen(false);
    setCrewToRemove(null);
    setShouldNotify(true); // Reset to default
  };
  
  // Handler for confirming activation (toggle ON)
  const handleConfirmActivation = async () => {
    if (!crewToActivate) return;

    // Determine shift display (same logic as in dialog)
    const today = new Date().toISOString().split('T')[0];
    const contextCrew = contextCrewMembers.find(c => c.id === crewToActivate.id);

    let activeShift = null;
    if (contextCrew) {
      const todayAssignments = contextAssignments.filter(
        a => a.crewId === contextCrew.id && a.date === today
      );

      for (const assignment of todayAssignments) {
        const shift = contextShifts.find(s => s.id === assignment.shiftId);
        if (shift) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentTime = currentHour * 60 + currentMinutes;

          const [startHour, startMin] = shift.startTime.split(':').map(Number);
          const [endHour, endMin] = shift.endTime.split(':').map(Number);
          let startTime = startHour * 60 + startMin;
          let endTime = endHour * 60 + endMin;

          if (endTime < startTime) {
            endTime += 24 * 60;
          }

          let adjustedCurrentTime = currentTime;
          if (currentTime < startTime && endTime > 24 * 60) {
            adjustedCurrentTime += 24 * 60;
          }

          if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
            activeShift = shift;
            break;
          }
        }
      }
    }

    const shiftDisplay = activeShift
      ? `${activeShift.name} (${activeShift.startTime} - ${activeShift.endTime})`
      : 'Emergency';

    try {
      // Update crew status to on-duty in backend
      const response = await fetch(`http://localhost:3001/api/crew/${crewToActivate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'on-duty',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update crew status');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Update context state with backend data
        const updatedContextCrew = contextCrewMembers.map(c =>
          c.id === crewToActivate.id ? { ...c, ...data.data } : c
        );
        setContextCrewMembers(updatedContextCrew);

        // Show success toast with notification status
        toast.success(`${crewToActivate.name} activated for duty`, {
          description: shouldNotifyActivate
            ? `App notification sent (${shiftDisplay})`
            : `Activated without notification (${shiftDisplay})`
        });
      }
    } catch (error: any) {
      console.error('Error updating crew status:', error);
      toast.error(error.message || 'Failed to activate crew member');
    }

    // Reset state
    setIsActivateDialogOpen(false);
    setCrewToActivate(null);
    setShouldNotifyActivate(true); // Reset to default
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Position", "Department", "Status", "Phone", "Onboard Contact", "Email"],
      ...sortedCrewMembers.map(crew => [
        crew.name,
        crew.position,
        crew.department,
        crew.status || 'off-duty',
        crew.phone || '-',
        crew.onBoardContact || '-',
        crew.email || '-'
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crew-list.csv";
    a.click();
    toast.success("Crew list exported successfully");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nickname: "",
      position: "",
      department: "Interior",
      status: "off-duty",
      contact: "",
      phone: "",
      onBoardContact: "",
      email: "",
      avatar: "",
      color: "#C8A96B",
      languages: [],
      skills: [],
      notes: "",
      leaveStart: "",
      leaveEnd: ""
    });
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setFormData({ ...formData, avatar: imageDataUrl });
    toast.success('Photo captured successfully');
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // On mobile, this will allow choosing from gallery
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData({ ...formData, avatar: e.target?.result as string });
          toast.success('Photo uploaded successfully');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const openEdit = (crew: CrewMember) => {
    // Use Details Dialog for editing (which has built-in edit mode)
    openDetails(crew);
  };

  const openDetails = (crew: CrewMember) => {
    // Find the crew member in context by ID
    const contextCrew = contextCrewMembers.find(c => c.id === crew.id);
    if (contextCrew) {
      setSelectedCrewForDetails(contextCrew);
      setIsDetailsDialogOpen(true);
    }
  };

  const handleUpdateCrewMember = (updatedCrew: CrewMember) => {
    // Update in context
    const updatedContextCrew = contextCrewMembers.map(cm => 
      cm.id === updatedCrew.id ? updatedCrew : cm
    );
    setContextCrewMembers(updatedContextCrew);
    toast.success('Crew member updated successfully');
  };

  // Get current on-duty crew members from duty roster
  // This automatically updates when assignments, shifts, or crew members change in AppDataContext
  // useMemo ensures it recalculates when any of these dependencies change
  const dutyStatus = useMemo(() => getCurrentDutyStatus(), [contextAssignments, contextShifts, contextCrewMembers, getCurrentDutyStatus]);

  return (
    <div className="space-y-6">
        {/* Duty Timer Card - Unified Status View */}
        <Card className="p-0 overflow-hidden">
          <DutyTimerCard />
        </Card>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search crew members..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsNotificationSettingsOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Bell className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport} 
              className="hidden sm:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <PermissionGuard permission="crew.add">
              <Button 
                size="sm" 
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                className="flex-1 sm:flex-none"
              >
                <UserPlus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Crew</span>
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Mobile Card View (hidden on md+ screens) */}
        <div className="md:hidden space-y-3">
          {sortedCrewMembers.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Users className="h-8 w-8" />
                <p>No crew members found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search or filters</p>
                )}
              </div>
            </Card>
          ) : (
            sortedCrewMembers.map((crew) => {
              const currentDutyInfo = dutyStatus.onDuty.find(d => d.name === crew.name);
              const isOnDuty = crew.status === 'on-leave' ? false : !!currentDutyInfo;
              const nextShift = dutyStatus.nextShift.find(d => d.name === crew.name);
              
              return (
                <CrewCardView
                  key={crew.id}
                  crew={crew}
                  isOnDuty={isOnDuty}
                  nextShift={nextShift}
                  onToggleDuty={(crew) => {
                    if (crew.status === 'on-leave') return;
                    
                    if (isOnDuty && currentDutyInfo) {
                      setCrewToRemove({ crew, dutyInfo: currentDutyInfo });
                      setIsConfirmDialogOpen(true);
                      return;
                    }
                    
                    setCrewToActivate(crew);
                    setIsActivateDialogOpen(true);
                  }}
                  onMessage={(crew) => {
                    setMessageRecipient({ name: crew.name, id: crew.id });
                    setIsMessageDialogOpen(true);
                  }}
                  onEdit={(crew) => openEdit(crew)}
                  onDelete={(crew) => handleDeleteCrew(crew)}
                  onClick={(crew) => openDetails(crew)}
                />
              );
            })
          )}
        </div>

        {/* Desktop Table View (hidden on mobile, shown on md+ screens) */}
        <Card className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[100px] cursor-pointer select-none"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    Status
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("position")}
                >
                  <div className="flex items-center gap-2">
                    Position
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Shift Schedule</TableHead>
                <TableHead className="text-center">Quick Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCrewMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8" />
                      <p>No crew members found</p>
                      {searchQuery && (
                        <p className="text-sm">Try adjusting your search or filters</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCrewMembers.map((crew) => {
                // Check if crew is assigned in Duty Roster (priority) or has manual status
                const currentDutyInfo = dutyStatus.onDuty.find(d => d.name === crew.name);
                // IMPORTANT: Crew on leave CANNOT be on duty, regardless of assignments
                const isOnDuty = crew.status === 'on-leave' ? false : !!currentDutyInfo;
                const nextShift = dutyStatus.nextShift.find(d => d.name === crew.name);
                
                return (
                  <TableRow 
                    key={crew.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetails(crew)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (crew.status === 'on-leave') return;
                          
                          // If crew is currently on duty, show removal confirmation
                          if (isOnDuty && currentDutyInfo) {
                            setCrewToRemove({ crew, dutyInfo: currentDutyInfo });
                            setIsConfirmDialogOpen(true);
                            return;
                          }
                          
                          // Toggle ON - show activation confirmation dialog
                          setCrewToActivate(crew);
                          setIsActivateDialogOpen(true);
                        }}
                        disabled={crew.status === 'on-leave'}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${crew.status === 'on-leave' 
                            ? 'bg-muted/50 cursor-not-allowed' 
                            : isOnDuty 
                              ? 'bg-success' 
                              : 'bg-input'
                          }
                          ${crew.status === 'on-leave' ? 'opacity-50' : 'cursor-pointer'}
                        `}
                        title={crew.status === 'on-leave' ? 'Crew member is on leave and cannot be assigned to duty' : ''}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full transition-transform
                            ${crew.status === 'on-leave' 
                              ? 'bg-muted-foreground/30 translate-x-1' 
                              : isOnDuty 
                                ? 'bg-white translate-x-6' 
                                : 'bg-white translate-x-1'
                            }
                          `}
                        />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={crew.avatar || getCrewAvatar(crew.name)} alt={crew.name} />
                          <AvatarFallback
                            className="text-white text-xs"
                            style={{ backgroundColor: crew.color }}
                          >
                            {crew.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{crew.name}</span>
                          {crew.nickname && (
                            <span className="text-xs text-muted-foreground">"{crew.nickname}"</span>
                          )}
                          {isOnDuty && (
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                              <span className="text-xs text-muted-foreground">On Duty</span>
                            </div>
                          )}
                          {crew.status === 'on-leave' && (
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <Badge variant="destructive" className="text-[10px] w-fit">On Leave</Badge>
                              {crew.leaveStart && crew.leaveEnd && (
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(crew.leaveStart).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(crew.leaveEnd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{crew.position}</TableCell>
                    <TableCell>
                      {currentDutyInfo ? (
                        <div className="flex items-center gap-2">
                          {currentDutyInfo.shift === 'Emergency' ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Emergency</Badge>
                          ) : (
                            <span className="text-sm">{currentDutyInfo.shift}</span>
                          )}
                        </div>
                      ) : nextShift ? (
                        <span className="text-sm text-muted-foreground">Next: {nextShift.shift}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMessageRecipient({ 
                                    name: crew.name, 
                                    id: crew.id 
                                  });
                                  setIsMessageDialogOpen(true);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Send Message</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(crew);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCrew(crew);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </Card>

      {/* Add Crew Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Crew Member</DialogTitle>
            <DialogDescription>
              Enter the details of the new crew member below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <Avatar className="h-24 w-24 border-2 border-border">
                {formData.avatar ? (
                  <AvatarImage src={formData.avatar} />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <UserPlus className="h-10 w-10" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFileUpload}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {formData.avatar ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCameraDialogMode('add');
                    setIsCameraDialogOpen(true);
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                {formData.avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, avatar: '' })}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Recommended: Square image, min 200x200px
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="col-span-2 grid gap-2">
                <Label htmlFor="nickname">Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Johnny"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Steward"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger id="department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interior">Interior</SelectItem>
                    <SelectItem value="Deck">Deck</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Galley">Galley</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 grid gap-2">
                <Label htmlFor="role">
                  User Role * 
                  <span className="ml-2 text-xs text-muted-foreground">(Login permissions)</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: Role) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {ROLE_NAMES.admin}
                      </div>
                    </SelectItem>
                    <SelectItem value="chief-stewardess">
                      {ROLE_NAMES['chief-stewardess']}
                    </SelectItem>
                    <SelectItem value="stewardess">
                      {ROLE_NAMES.stewardess}
                    </SelectItem>
                    <SelectItem value="crew">
                      {ROLE_NAMES.crew}
                    </SelectItem>
                    <SelectItem value="eto">
                      {ROLE_NAMES.eto}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This determines what they can access in Obedio. A user account will be created automatically.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "on-duty" | "off-duty" | "on-leave") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-duty">On Duty</SelectItem>
                    <SelectItem value="off-duty">Off Duty</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 555 0100"
                />
              </div>

              <div className="col-span-2 grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="crew@yacht.com"
                />
              </div>

              <div className="col-span-2 grid gap-2">
                <Label htmlFor="onBoardContact">On-Board Contact</Label>
                <Input
                  id="onBoardContact"
                  value={formData.onBoardContact}
                  onChange={(e) => setFormData({ ...formData, onBoardContact: e.target.value })}
                  placeholder="Extension or Radio"
                />
              </div>

              <div className="col-span-2 grid gap-2">
                <Label>Languages</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.languages.map((lang, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {lang}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            languages: formData.languages.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="language-input"
                    placeholder="Add language..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const lang = input.value.trim();
                        if (lang) {
                          setFormData({
                            ...formData,
                            languages: [...formData.languages, lang]
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const input = document.getElementById('language-input') as HTMLInputElement;
                      const lang = input.value.trim();
                      if (lang) {
                        setFormData({
                          ...formData,
                          languages: [...formData.languages, lang]
                        });
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="col-span-2 grid gap-2">
                <Label>Skills & Certifications</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter((_, i) => i !== index)
                          });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="skill-input"
                    placeholder="Add skill..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const skill = input.value.trim();
                        if (skill) {
                          setFormData({
                            ...formData,
                            skills: [...formData.skills, skill]
                          });
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const input = document.getElementById('skill-input') as HTMLInputElement;
                      const skill = input.value.trim();
                      if (skill) {
                        setFormData({
                          ...formData,
                          skills: [...formData.skills, skill]
                        });
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="col-span-2 grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCrew}>
              Add Crew Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crew Member Details Dialog */}
      {selectedCrewForDetails && (
        <CrewMemberDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          crewMember={selectedCrewForDetails}
          assignments={contextAssignments}
          shifts={contextShifts}
          onUpdate={handleUpdateCrewMember}
        />
      )}

      {/* Send Message Dialog */}
      {messageRecipient && (
        <SendMessageDialog
          open={isMessageDialogOpen}
          onOpenChange={setIsMessageDialogOpen}
          recipientName={messageRecipient.name}
          recipientId={messageRecipient.id}
        />
      )}

      {/* Confirmation Dialog for Removing Crew from Duty */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <AlertDialogTitle className="text-left">
                Warning! Remove crew from duty?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left pt-2">
              {crewToRemove && (
                <>
                  <span className="font-medium text-foreground">
                    {crewToRemove.crew.name}
                  </span>
                  {' '}is currently on duty{' '}
                  {crewToRemove.dutyInfo.shift === 'Emergency' ? (
                    <span className="font-medium text-destructive">(Emergency Override)</span>
                  ) : (
                    <>(<span className="font-medium text-foreground">
                      {crewToRemove.dutyInfo.shift}
                    </span>)</>
                  )}.
                  <br /><br />
                  {crewToRemove.dutyInfo.shift === 'Emergency' ? (
                    <>By removing from duty, the emergency override will be cleared.</>
                  ) : (
                    <>By removing from duty, the person will be automatically removed from the Duty Roster calendar.</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Checkbox for notification */}
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="notify-crew"
              checked={shouldNotify}
              onCheckedChange={(checked) => setShouldNotify(checked === true)}
            />
            <label
              htmlFor="notify-crew"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Notify crew member via App
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsConfirmDialogOpen(false);
              setCrewToRemove(null);
              setShouldNotify(true);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoval}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove from Duty
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Activating Crew (Toggle ON) */}
      <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Power className="h-5 w-5 text-primary" />
              </div>
              <AlertDialogTitle className="text-left">
                Activate crew member for duty?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left pt-2">
              {crewToActivate && (() => {
                // Check current duty assignments to see if crew has scheduled shift
                const today = new Date().toISOString().split('T')[0];
                
                // Find active shift for today
                let activeShift = null;
                const todayAssignments = contextAssignments.filter(
                  a => a.crewId === crewToActivate.id && a.date === today
                );
                
                // Check each assignment to see if it's currently active
                for (const assignment of todayAssignments) {
                    const shift = contextShifts.find(s => s.id === assignment.shiftId);
                    if (shift) {
                      // Simple check: is current time within shift range?
                      const now = new Date();
                      const currentHour = now.getHours();
                      const currentMinutes = now.getMinutes();
                      const currentTime = currentHour * 60 + currentMinutes;
                      
                      const [startHour, startMin] = shift.startTime.split(':').map(Number);
                      const [endHour, endMin] = shift.endTime.split(':').map(Number);
                      let startTime = startHour * 60 + startMin;
                      let endTime = endHour * 60 + endMin;
                      
                      // Handle overnight shifts
                      if (endTime < startTime) {
                        endTime += 24 * 60;
                      }
                      
                      let adjustedCurrentTime = currentTime;
                      if (currentTime < startTime && endTime > 24 * 60) {
                        adjustedCurrentTime += 24 * 60;
                      }
                      
                      if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
                        activeShift = shift;
                        break;
                      }
                    }
                  }
                
                const shiftDisplay = activeShift 
                  ? `${activeShift.name} (${activeShift.startTime} - ${activeShift.endTime})`
                  : 'Emergency';
                const isEmergency = !activeShift;
                
                return (
                  <>
                    <span className="font-medium text-foreground">
                      {crewToActivate.name}
                    </span>
                    {' '}will be activated for{' '}
                    {isEmergency ? (
                      <span className="font-medium text-destructive">Emergency Override</span>
                    ) : (
                      <>
                        <span className="font-medium text-foreground">{shiftDisplay}</span>
                      </>
                    )}.
                    <br /><br />
                    {isEmergency ? (
                      <>This is a manual override and not scheduled in the Duty Roster. The crew member should report immediately.</>
                    ) : (
                      <>The crew member is assigned to this shift in the Duty Roster calendar.</>
                    )}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Checkbox for notification */}
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="notify-crew-activate"
              checked={shouldNotifyActivate}
              onCheckedChange={(checked) => setShouldNotifyActivate(checked === true)}
            />
            <label
              htmlFor="notify-crew-activate"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Notify crew member via App
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsActivateDialogOpen(false);
              setCrewToActivate(null);
              setShouldNotifyActivate(true);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivation}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permissions Prompt Dialog - After Adding Crew */}
      <AlertDialog open={isPermissionsPromptOpen} onOpenChange={setIsPermissionsPromptOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <AlertDialogTitle className="text-left">
                Set Up Account Permissions?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left pt-2">
              {newlyAddedCrewName && (
                <>
                  <span className="font-medium text-foreground">{newlyAddedCrewName}</span> has been added successfully.
                  <br /><br />
                  Would you like to configure their role and account permissions now? You can also do this later in Settings.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsPermissionsPromptOpen(false);
              setNewlyAddedCrewName("");
            }}>
              Later
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsPermissionsPromptOpen(false);
                setNewlyAddedCrewName("");
                // Navigate to Settings page, Roles & Permissions tab
                if (onNavigateToSettingsRoles) {
                  onNavigateToSettingsRoles();
                }
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Take Me There
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Camera Dialog */}
      <CameraDialog
        open={isCameraDialogOpen}
        onOpenChange={setIsCameraDialogOpen}
        onCapture={handleCameraCapture}
      />

      {/* Notification Settings Dialog */}
      <NotificationSettingsDialog
        open={isNotificationSettingsOpen}
        onOpenChange={setIsNotificationSettingsOpen}
        onSave={updateNotificationSettings}
        initialSettings={notificationSettings}
      />

      {/* Credentials Dialog - Shows generated username/password */}
      {newCredentials && (
        <CredentialsDialog
          open={showCredentialsDialog}
          onClose={() => {
            setShowCredentialsDialog(false);
            setNewCredentials(null);
          }}
          credentials={newCredentials}
        />
      )}
    </div>
  );
}
