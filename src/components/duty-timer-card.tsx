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

// Modern animated progress ring with gradient and glow effects
function RingTimer({ totalSec, remainSec, shiftColor }: { totalSec: number; remainSec: number; shiftColor?: string }) {
  const { radius, stroke, circumference, percentage, dashLength } = getRingMetrics(totalSec, remainSec);
  
  const hrs = Math.floor(remainSec / 3600);
  const mins = Math.floor((remainSec % 3600) / 60);
  
  // Calculate percentage for display
  const percentDisplay = Math.round(percentage * 100);
  
  // DEBUG: Log shift color
  console.log('🎨 RingTimer shiftColor:', shiftColor);
  
  // Urgency states
  const isUrgent = remainSec < 7200; // < 2 hours
  const isCritical = remainSec < 3600; // < 1 hour
  
  // Dynamic colors based on urgency
  const getGradientColors = () => {
    if (isCritical) {
      return {
        from: '#ef4444', // red-500
        to: '#dc2626',   // red-600
        glow: 'rgba(239, 68, 68, 0.5)'
      };
    }
    if (isUrgent) {
      return {
        from: '#f59e0b', // amber-500
        to: '#d97706',   // amber-600
        glow: 'rgba(245, 158, 11, 0.4)'
      };
    }
    // Default: Use shift color or fallback to golden
    const baseColor = shiftColor || '#d4af37';
    return {
      from: baseColor,
      to: baseColor,
      glow: `${baseColor}66` // Add alpha for glow
    };
  };
  
  const colors = getGradientColors();
  const gradientId = `gradient-${isCritical ? 'critical' : isUrgent ? 'urgent' : 'normal'}`;

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect background */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-0 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          animation: isUrgent ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
          opacity: isUrgent ? 0.6 : 0
        }}
      />
      
      {/* SVG Ring with animated glow */}
      <svg 
        width={260} 
        height={260} 
        viewBox="0 0 260 260" 
        className="-rotate-90 relative z-0"
        style={{ 
          filter: isUrgent ? `drop-shadow(0 0 12px ${colors.glow})` : 'drop-shadow(0 0 4px rgba(0,0,0,0.1))'
        }}
      >
        {/* Define gradient - solid shift color */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colors.to} stopOpacity="1" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id={`glow-${gradientId}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background ring (track) */}
        <circle
          cx="130"
          cy="130"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted/15"
        />
        
        {/* Progress ring - countdown animates automatically via React re-render */}
        <circle
          cx="130"
          cy="130"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dashLength} ${circumference}`}
          filter={`url(#glow-${gradientId})`}
          opacity={Math.max(0.7, percentage)}
          style={{ 
            transition: 'stroke-dasharray 1s linear, opacity 1s linear',
            transformOrigin: 'center'
          }}
        >
          {/* Subtle pulse animation */}
          <animate 
            attributeName="stroke-width" 
            values={`${stroke};${stroke + 1};${stroke}`}
            dur="2s" 
            repeatCount="indefinite" 
          />
        </circle>
      </svg>
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="text-center">
          {/* Percentage badge */}
          <div className="mb-2">
            <span 
              className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                color: 'white',
                boxShadow: `0 2px 8px ${colors.glow}`
              }}
            >
              {percentDisplay}%
            </span>
          </div>
          
          {/* Time display - Luxury minimal style */}
          <div className="flex items-center justify-center gap-3">
            {/* Hours */}
            <div className="text-center">
              <div 
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300,
                  fontSize: '6rem',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'currentColor'
                }}
              >
                {String(hrs).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1 font-medium">hours</div>
            </div>
            
            {/* Separator */}
            <div 
              style={{ 
                fontSize: '4rem',
                fontWeight: 200,
                color: 'currentColor',
                opacity: 0.2,
                lineHeight: 1
              }}
            >
              :
            </div>
            
            {/* Minutes */}
            <div className="text-center">
              <div 
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                  fontWeight: 300,
                  fontSize: '6rem',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'currentColor'
                }}
              >
                {String(mins).padStart(2, "0")}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-1 font-medium">mins</div>
            </div>
          </div>
          
          {/* Label */}
          <p className="text-xs font-medium text-muted-foreground mt-1 tracking-wide uppercase">
            {isCritical ? 'Shift Change Soon!' : isUrgent ? 'Shift Ending' : 'Between Shifts'}
          </p>
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
          className="flex-1 p-4 pl-6 relative"
          style={{
            background: `linear-gradient(to right, ${hexToRgba(currentShiftColor, 0.12)}, ${hexToRgba(currentShiftColor, 0.04)} 70%, transparent)`,
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

        {/* Center: Ring timer - Closer to edges */}
        <div className="flex items-center justify-center px-0">
          <RingTimer totalSec={totalSec} remainSec={remainSec} shiftColor={currentShiftColor} />
        </div>

        {/* Right: Next on duty - Gradient fades towards center */}
        <div
          className="flex-1 p-4 pr-6 relative"
          style={{
            background: `linear-gradient(to left, ${hexToRgba(nextShiftColor, 0.12)}, ${hexToRgba(nextShiftColor, 0.04)} 70%, transparent)`,
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
