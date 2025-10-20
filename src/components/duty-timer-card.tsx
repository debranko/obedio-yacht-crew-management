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

// Helper: Format time as HH:MM
function formatHm(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Premium Tick Countdown Ring - Discrete segmented ring with luxury feel
 * Shows remaining time as colored ticks that countdown, elapsed ticks are subtle
 */
function TickCountdownRing({
  totalSec,
  remainSec,
  shiftColor,
  ticks = 72, // 5° spacing for refined look
}: {
  totalSec: number;
  remainSec: number;
  shiftColor?: string;
  ticks?: number;
}) {
  // Urgency states
  const isUrgent = remainSec < 7200; // < 2 hours
  const isCritical = remainSec < 3600; // < 1 hour

  // Dynamic color based on urgency
  const getColor = () => {
    if (isCritical) return '#ef4444'; // red-500
    if (isUrgent) return '#f59e0b'; // amber-500
    return shiftColor || '#d4af37'; // gold default
  };

  const color = getColor();
  const size = 150; // Compact size (~60% of original 240px)
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 49; // inner radius (scaled down proportionally)
  const outerR = 58; // outer radius (tick thickness ≈ 9px)

  const pct = Math.max(0, Math.min(1, remainSec / Math.max(1, totalSec)));
  const visibleTicks = Math.round(ticks * pct);

  // Generate tick lines
  const lines = Array.from({ length: ticks }, (_, i) => {
    const angle = (-90 + (i / ticks) * 360) * (Math.PI / 180);
    const x1 = cx + innerR * Math.cos(angle);
    const y1 = cy + innerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy + outerR * Math.sin(angle);

    const on = i < visibleTicks;
    const stroke = on ? color : 'hsl(0 0% 100% / 0.08)'; // elapsed nearly invisible
    const width = on ? 2.5 : 1.8; // Scaled thin tick lines

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect for urgency */}
      {isUrgent && (
        <div
          className="absolute inset-0 rounded-full blur-xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            opacity: 0.5,
          }}
        />
      )}

      {/* SVG Tick Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
        style={{
          filter: isUrgent ? `drop-shadow(0 0 12px ${color}66)` : 'none',
        }}
      >
        {lines}
      </svg>

      {/* Center Content - Countdown INSIDE circle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center" style={{ maxWidth: '90px' }}>
          <div
            className="font-light tabular-nums tracking-tight text-foreground"
            style={{
              fontSize: '30px', // Scaled down from 48px
              lineHeight: 1,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
              marginBottom: '2px'
            }}
          >
            {formatHm(remainSec)}
          </div>
          <div 
            className="uppercase text-muted-foreground/70"
            style={{
              fontSize: '6.5px', // Scaled down from 8px
              letterSpacing: '0.1em',
              lineHeight: 1.2,
              paddingLeft: '4px',
              paddingRight: '4px'
            }}
          >
            {isCritical ? 'shift change soon' : isUrgent ? 'shift ending' : 'hours between shifts'}
          </div>
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
    <Avatar className="h-8 w-8 flex-shrink-0">
      <AvatarImage src={getCrewAvatar(name)} alt={name} />
      <AvatarFallback className="bg-primary/10 text-primary text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );

  const info = (
    <div className={`flex-1 min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <p className="font-medium text-xs truncate">{name}</p>
      <p className="text-[10px] text-muted-foreground truncate">{position}</p>
    </div>
  );

  // Only show badge for backup crew
  const badge = isBackup ? (
    <Badge 
      variant="outline"
      className="text-[10px] px-2 py-0.5 flex-shrink-0 bg-warning/10 border-warning/30 text-warning"
    >
      Backup
    </Badge>
  ) : null;

  return (
    <div 
      className={`flex items-center gap-2 transition-opacity ${isBackup ? "opacity-55" : ""}`}
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
    
    // DEBUG: Log current shift
    console.log('⏰ Current shift:', currentShift);
    
    if (!currentShift) {
      // Default to 8-hour shift if no active shift found
      const defaultEnd = "20:00";
      console.log('⚠️ No current shift found, using defaults');
      
      return {
        totalSec: 12 * 3600,
        remainSec: toSeconds(defaultEnd) - now,
        shiftEnd: defaultEnd,
        currentShiftColor: "#d4af37", // Gold
        nextShiftColor: "#d4af37" // Gold
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
      currentShiftColor: currentShift.color || "#d4af37", // Gold
      nextShiftColor: nextShift?.color || "#d4af37" // Gold
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
        {/* Left: Currently on duty - Gradient fades towards center */}
        <div
          className="flex-1 p-3 pl-4 relative"
          style={{
            background: `linear-gradient(to bottom, ${hexToRgba(currentShiftColor, 0.12)}, ${hexToRgba(currentShiftColor, 0.04)} 70%, transparent)`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">Currently on duty</p>
            {dutyStatus.backup.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[9px] gap-1 bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30"
                onClick={() => setCallBackupOpen(true)}
              >
                <Bell className="h-2.5 w-2.5" />
                Call Backup ({dutyStatus.backup.length})
              </Button>
            )}
          </div>
          <div className="space-y-1.5">
            {onDutyCrew.length > 0 ? (
              onDutyCrew.map((crew, i) => (
                <CrewItem key={`on-${i}`} {...crew} align="left" />
              ))
            ) : (
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground mb-0.5">No crew assigned</p>
                <p className="text-[10px] text-muted-foreground/70">Check Duty Roster</p>
              </div>
            )}
          </div>
        </div>

        {/* Center: Ring timer - Always centered */}
        <div className="flex items-center justify-center flex-shrink-0 px-2">
          <TickCountdownRing totalSec={totalSec} remainSec={remainSec} shiftColor={currentShiftColor} />
        </div>

        {/* Right: Next on duty - Gradient fades towards center */}
        <div
          className="flex-1 p-3 pr-4 relative"
          style={{
            background: `linear-gradient(to bottom, ${hexToRgba(nextShiftColor, 0.12)}, ${hexToRgba(nextShiftColor, 0.04)} 70%, transparent)`,
          }}
        >
          <p className="text-xs font-medium text-muted-foreground mb-2 lg:text-right">Next on duty</p>
          <div className="space-y-1.5">
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
