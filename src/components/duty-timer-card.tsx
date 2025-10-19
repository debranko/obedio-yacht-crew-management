import { useMemo, useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Bell } from "lucide-react";
import { getCrewAvatar } from "./crew-avatars";
import { useAppData } from "../contexts/AppDataContext";
import { CallBackupDialog } from "./call-backup-dialog";

// Helper: Convert HH:MM to seconds
function toSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 3600 + m * 60;
}

// Helper: Get current time as HH:MM
function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// Helper: Calculate ring metrics for SVG (same logic as example)
export function getRingMetrics(totalSec: number, remainSec: number) {
  const radius = 75; // Compact ring
  const stroke = 10; // Medium stroke
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.max(0, Math.min(1, remainSec / totalSec));
  const dashLength = Math.round(percentage * circumference); // Round to integer
  

  
  return { radius, stroke, circumference, percentage, dashLength };
}

// Circular countdown ring component (matches example implementation)
function RingTimer({ totalSec, remainSec }: { totalSec: number; remainSec: number }) {
  const { radius, stroke, circumference, dashLength } = getRingMetrics(totalSec, remainSec);
  const elapsed = totalSec - remainSec;
  
  const hrs = Math.floor(remainSec / 3600);
  const mins = Math.floor((remainSec % 3600) / 60);
  
  const elapsedHrs = Math.floor(elapsed / 3600);
  const elapsedMins = Math.floor((elapsed % 3600) / 60);

  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Ring - rotated to start from top (BEHIND time) */}
      <svg width={230} height={230} viewBox="0 0 230 230" className="-rotate-90 relative z-0">
        {/* Background ring (always visible light gray track) */}
        <circle
          cx="115"
          cy="115"
          r={radius}
          stroke="#EEF2F7"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress ring (gold/dark gray countdown) */}
        <circle
          cx="115"
          cy="115"
          r={radius}
          stroke="rgba(17, 24, 39, 0.35)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dashLength} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      
      {/* Time display (IN FRONT of ring with higher z-index) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="text-center">
          <div className="tabular-nums tracking-tight">
            <span className="text-5xl font-semibold">{hrs}</span>
            <span className="text-xl text-muted-foreground">h</span>
            <span className="text-lg text-muted-foreground mx-0.5">:</span>
            <span className="text-5xl font-semibold">{String(mins).padStart(2, "0")}</span>
            <span className="text-xl text-muted-foreground">m</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">remaining</p>
        </div>
      </div>
    </div>
  );
}

// Crew member item with avatar
function CrewItem({ 
  name, 
  position, 
  isBackup = false,
  align = "left" 
}: { 
  name: string; 
  position: string; 
  isBackup?: boolean;
  align?: "left" | "right";
}) {
  const initials = useMemo(
    () => name.split(" ").map(n => n[0]).slice(0, 2).join(""),
    [name]
  );

  const avatar = (
    <Avatar className="h-10 w-10 flex-shrink-0">
      <AvatarImage src={getCrewAvatar(name)} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  const info = (
    <div className={`flex-1 min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <p className="font-medium text-sm truncate">{name}</p>
      <p className="text-xs text-muted-foreground truncate">{position}</p>
    </div>
  );

  const badge = (
    <Badge 
      variant={isBackup ? "outline" : "secondary"}
      className={`text-[10px] px-2 py-0.5 flex-shrink-0 ${isBackup ? "bg-warning/10 border-warning/30 text-warning" : ""}`}
    >
      {isBackup ? "Backup" : "Interior"}
    </Badge>
  );

  return (
    <div 
      className={`flex items-center gap-3 transition-opacity ${isBackup ? "opacity-55" : ""}`}
    >
      {align === "right" ? (
        <>
          {badge}
          {info}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {info}
          {badge}
        </>
      )}
    </div>
  );
}

export function DutyTimerCard() {
  const { getCurrentDutyStatus, assignments, shifts, crewMembers, setCrewMembers } = useAppData();
  
  // Force re-render every minute for live countdown
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  
  // Call Backup dialog state
  const [callBackupOpen, setCallBackupOpen] = useState(false);
  
  // Handler when backup crew is called - activate them to on-duty
  const handleBackupCalled = (crewName: string, urgency: string, reason: string) => {
    // Find the crew member by name and set their status to 'on-duty'
    const updatedCrew = crewMembers.map(member => 
      member.name === crewName 
        ? { ...member, status: 'on-duty' as const }
        : member
    );
    setCrewMembers(updatedCrew);
  };
  
  useEffect(() => {
    // Update every second for smoother countdown, but UI shows minutes
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000); // Update every second for real-time feel
    
    return () => clearInterval(interval);
  }, []);

  // Get real-time duty status
  const dutyStatus = useMemo(() => {
    return getCurrentDutyStatus();
  }, [assignments, shifts, crewMembers, getCurrentDutyStatus]);
  
  // Calculate timer values
  const { totalSec, remainSec, shiftEnd, currentShiftColor, nextShiftColor } = useMemo(() => {
    const now = toSeconds(currentTime);
    
    // Find current shift based on time
    const currentShift = shifts.find(shift => {
      const start = toSeconds(shift.startTime);
      const end = toSeconds(shift.endTime);
      
      // Handle overnight shifts
      if (end < start) {
        return now >= start || now < end;
      }
      return now >= start && now < end;
    });
    
    if (!currentShift) {
      // Default to 8-hour shift if no active shift found
      const defaultEnd = "20:00";
      
      return {
        totalSec: 12 * 3600,
        remainSec: toSeconds(defaultEnd) - now,
        shiftEnd: defaultEnd,
        currentShiftColor: "#C8A96B",
        nextShiftColor: "#06B6D4"
      };
    }
    
    const start = toSeconds(currentShift.startTime);
    let end = toSeconds(currentShift.endTime);
    
    // Handle overnight
    if (end < start) {
      end += 24 * 3600;
    }
    
    const total = end - start;
    let remain = end - now;
    
    // Adjust for overnight
    if (remain < 0) {
      remain += 24 * 3600;
    }
    
    // Ensure positive values
    const finalRemain = Math.max(0, remain);
    const finalTotal = Math.max(1, total); // Avoid division by zero
    
    // Find next shift based on current time
    const nextShift = shifts.find(shift => {
      const [startHour, startMin] = shift.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const [currentHour, currentMin] = currentTime.split(':').map(Number);
      const nowTime = currentHour * 60 + currentMin;
      return startTime > nowTime;
    }) || shifts[0]; // Wrap to first shift of next day
    
    return {
      totalSec: finalTotal,
      remainSec: finalRemain,
      shiftEnd: currentShift.endTime,
      currentShiftColor: currentShift.color || "#C8A96B",
      nextShiftColor: nextShift?.color || "#06B6D4"
    };
  }, [currentTime, shifts]);

  // Prepare crew lists - show primary + backup crew members
  const primaryOnDuty = dutyStatus.onDuty.map(crew => ({
    name: crew.name,
    position: crew.position || crew.role || "Crew Member",
    isBackup: false
  }));
  
  const backupOnDuty = dutyStatus.backup.map(crew => ({
    name: crew.name,
    position: crew.position || crew.role || "Crew Member",
    isBackup: true
  }));
  
  // Combine primary and backup - show ALL crew from current shift
  const onDutyCrew = [...primaryOnDuty, ...backupOnDuty];
  
  // Show ALL next shift crew with backup
  const primaryNextShift = dutyStatus.nextShift.map(crew => ({
    name: crew.name,
    position: crew.position || crew.role || "Crew Member",
    isBackup: false
  }));
  
  const backupNextShift = dutyStatus.nextBackup.map(crew => ({
    name: crew.name,
    position: crew.position || crew.role || "Crew Member",
    isBackup: true
  }));
  
  // Combine primary and backup for next shift
  const nextDutyCrew = [...primaryNextShift, ...backupNextShift];

  // Color helpers
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
        {/* Body - Cards with Ring Timer */}
        <div className="flex items-stretch">
        {/* Left: Currently on duty - Full width card */}
        <div
          className="flex-1 p-4 pl-6 border-r border-border/50"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(currentShiftColor, 0.08)}, transparent)`,
            boxShadow: `0 1px 0 ${hexToRgba(currentShiftColor, 0.1)}`,
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-medium text-muted-foreground">Currently on duty</p>
            {dutyStatus.backup.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] gap-1 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30"
                onClick={() => setCallBackupOpen(true)}
              >
                <Bell className="h-3 w-3" />
                Call Backup ({dutyStatus.backup.length})
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {onDutyCrew.length > 0 ? (
              onDutyCrew.map((crew, i) => (
                <CrewItem key={`on-${i}`} {...crew} align="left" />
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-1">No crew assigned</p>
                <p className="text-xs text-muted-foreground/70">Check Duty Roster</p>
              </div>
            )}
          </div>
        </div>

        {/* Center: Ring timer */}
        <div className="flex items-center justify-center px-2">
          <RingTimer totalSec={totalSec} remainSec={remainSec} />
        </div>

        {/* Right: Next on duty - Full width card */}
        <div
          className="flex-1 p-4 pr-6 border-l border-border/50"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(nextShiftColor, 0.08)}, transparent)`,
            boxShadow: `0 1px 0 ${hexToRgba(nextShiftColor, 0.1)}`,
          }}
        >
          <p className="text-sm font-medium text-muted-foreground mb-2.5 lg:text-right">Next on duty</p>
          <div className="space-y-2">
            {nextDutyCrew.length > 0 ? (
              nextDutyCrew.map((crew, i) => (
                <CrewItem key={`next-${i}`} {...crew} align="right" />
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-1">No upcoming shift</p>
                <p className="text-xs text-muted-foreground/70">Check Duty Roster</p>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Call Backup Dialog */}
        <CallBackupDialog
          open={callBackupOpen}
          onOpenChange={setCallBackupOpen}
          backupCrew={dutyStatus.backup}
          onBackupCalled={handleBackupCalled}
        />
      </>
    );
}
