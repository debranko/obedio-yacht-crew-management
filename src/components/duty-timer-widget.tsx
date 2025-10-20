import { useEffect, useState } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { getCrewAvatar } from "./crew-avatars";

// ------------------------------------------------------------
// Types (align this with your real app model if different)
// ------------------------------------------------------------
export interface Crew {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface DutyPanelProps {
  onDuty: Crew[];
  backup: Crew[];                  // left backup list (compact, faded)
  nextOnDuty: Crew[];              // right column
  backupNextOnDuty: Crew[];        // right column, below a thin line
  totalSec: number;                // full shift duration
  remainSec: number;               // remaining time in seconds
  onCallBackup?: (c: Crew) => void;
}

// ------------------------------------------------------------
// Helpers (used also by simple dev tests)
// ------------------------------------------------------------
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function visibleTicks(totalSec: number, remainSec: number, ticks: number) {
  const pct = clamp01(remainSec / Math.max(1, totalSec));
  return Math.round(ticks * pct);
}

// ------------------------------------------------------------
// Segmented countdown ring (compact)
// ------------------------------------------------------------
function SegmentedRing({ totalSec, remainSec, color = "#d4af37", ticks = 72 }: { totalSec: number; remainSec: number; color?: string; ticks?: number }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 96;
  const outerR = 118;
  const vis = visibleTicks(totalSec, remainSec, ticks);

  const lines = Array.from({ length: ticks }, (_, i) => {
    const ang = (-90 + (i / ticks) * 360) * (Math.PI / 180);
    const x1 = cx + innerR * Math.cos(ang);
    const y1 = cy + innerR * Math.sin(ang);
    const x2 = cx + outerR * Math.cos(ang);
    const y2 = cy + outerR * Math.sin(ang);
    const on = i < vis;
    return (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? color : "hsl(0 0% 100% / 0.12)"} strokeWidth={on ? 6.5 : 4.5} strokeLinecap="round" />
    );
  });

  const h = Math.floor(remainSec / 3600);
  const m = Math.floor((remainSec % 3600) / 60);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{lines}</svg>
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div className="font-light tabular-nums tracking-tight text-foreground" style={{ fontSize: "72px", lineHeight: 1 }}>
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground/70">Shift ending</div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Crew row with inline Call Backup action (fixed signature)
// ------------------------------------------------------------
function CrewRow({ person, actionLabel, onCall, compact }: { person: Crew; actionLabel?: string; onCall?: (c: Crew) => void; compact?: boolean }) {
  return (
    <li className={`flex items-center ${compact ? 'gap-2 py-1' : 'gap-3 py-2'}`}>
      <img src={person.avatar} className={`rounded-full object-cover ${compact ? 'h-7 w-7' : 'h-10 w-10'}`} alt="" />
      <div className="flex-1 min-w-0">
        <div className={`truncate ${compact ? 'text-xs font-medium' : 'font-medium'}`}>{person.name}</div>
        <div className="text-xs text-muted-foreground truncate">{person.role}</div>
      </div>
      {onCall ? (
        <button
          onClick={() => onCall(person)}
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-medium hover:bg-amber-50 border-amber-300/70 text-amber-700`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {actionLabel ?? "Call Backup"}
        </button>
      ) : null}
    </li>
  );
}

// ------------------------------------------------------------
// DUTY PANEL – drop‑in component wired to real data via props
// ------------------------------------------------------------
export function DutyPanel({ onDuty, backup, nextOnDuty, backupNextOnDuty, totalSec, remainSec, onCallBackup }: DutyPanelProps) {
  return (
    <div className="w-full min-h-[460px] bg-gradient-to-r from-amber-100 to-cyan-100 p-6 rounded-2xl border" style={{ minWidth: "1200px" }}>
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left rail - Currently on duty above, Backup below */}
        <div className="col-span-4">
          <div className="text-sm font-semibold text-foreground mb-2">Currently on duty</div>
          <ul className="mb-4">
            {onDuty.map((c) => (
              <CrewRow key={c.id} person={c} />
            ))}
          </ul>

          {backup.length > 0 && (
            <>
              <div className="text-sm font-semibold text-foreground mb-1">Backup</div>
              <div className="h-px bg-gradient-to-r from-amber-300/60 to-transparent mb-3" />
              <ul className="text-muted-foreground" style={{ opacity: 0.55 }}>
                {backup.map((c) => (
                  <CrewRow key={c.id} person={c} actionLabel="Call Backup" onCall={onCallBackup} compact />
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Center - Countdown ring */}
        <div className="col-span-4 flex items-center justify-center">
          <SegmentedRing totalSec={totalSec} remainSec={remainSec} color="#f0b400" />
        </div>

        {/* Right rail - Next on duty */}
        <div className="col-span-4">
          <div className="text-sm font-semibold text-foreground mb-2 text-right">Next on duty</div>
          <ul>
            {nextOnDuty.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 justify-end">
                <div className="text-right">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.role}</div>
                </div>
                <img src={c.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
              </li>
            ))}
          </ul>

          {/* Backup - next on duty */}
          {backupNextOnDuty.length > 0 && (
            <>
              <div className="mt-6 text-sm font-semibold text-right text-foreground">Backup - next on duty</div>
              <div className="h-px bg-gradient-to-l from-cyan-300/60 to-transparent mb-3 ml-12" />
              <ul>
                {backupNextOnDuty.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2 justify-end">
                    <div className="text-right">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.role}</div>
                    </div>
                    <img src={c.avatar} className="h-10 w-10 rounded-full object-cover" alt="" />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Calculate real shift countdown based on current shift end time
// ------------------------------------------------------------
function useShiftCountdown() {
  const { shifts, getCurrentDutyStatus } = useAppData();
  const [shiftTime, setShiftTime] = useState({ totalSec: 8 * 3600, remainSec: 1 * 3600 });

  useEffect(() => {
    const calculateShiftTime = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinutes;

      // Find current shift
      const currentShift = shifts.find(shift => {
        const [startHour, startMin] = shift.startTime.split(':').map(Number);
        const [endHour, endMin] = shift.endTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        let endTime = endHour * 60 + endMin;
        
        // Handle overnight shifts
        if (endTime < startTime) {
          endTime += 24 * 60;
        }
        
        let adjustedCurrentTime = currentTime;
        if (currentTime < startTime && endTime > 24 * 60) {
          adjustedCurrentTime += 24 * 60;
        }
        
        return adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime;
      });

      if (currentShift) {
        const [endHour, endMin] = currentShift.endTime.split(':').map(Number);
        let endTime = endHour * 60 + endMin;
        
        // Handle overnight shifts
        if (endTime < currentTime) {
          endTime += 24 * 60;
        }
        
        const remainingMinutes = endTime - currentTime;
        const remainSec = Math.max(0, remainingMinutes * 60);
        
        // Calculate total shift duration
        const [startHour, startMin] = currentShift.startTime.split(':').map(Number);
        const startTime = startHour * 60 + startMin;
        let totalMinutes = endTime - startTime;
        
        if (totalMinutes < 0) {
          totalMinutes += 24 * 60;
        }
        
        const totalSec = totalMinutes * 60;

        setShiftTime({ totalSec, remainSec });
      } else {
        // Default fallback - 8 hour shift with 1 hour remaining
        setShiftTime({ totalSec: 8 * 3600, remainSec: 1 * 3600 });
      }
    };

    // Calculate immediately
    calculateShiftTime();
    
    // Update every minute
    const interval = setInterval(calculateShiftTime, 60000);
    
    return () => clearInterval(interval);
  }, [shifts]);

  return shiftTime;
}

// ------------------------------------------------------------
// Main Widget Component with Real Data Integration
// ------------------------------------------------------------
export function DutyTimerWidget() {
  const { getCurrentDutyStatus, setCrewMembers, crewMembers } = useAppData();
  const { totalSec, remainSec } = useShiftCountdown();

  // Get real crew data from AppDataContext
  const dutyStatus = getCurrentDutyStatus();

  // Map crew data to Crew interface
  const onDuty: Crew[] = dutyStatus.onDuty.map(c => ({
    id: c.id,
    name: c.name,
    role: c.position || "Crew Member",
    avatar: getCrewAvatar(c.name)
  }));

  const backup: Crew[] = dutyStatus.backup.map(c => ({
    id: c.id,
    name: c.name,
    role: c.position || "Crew Member",
    avatar: getCrewAvatar(c.name)
  }));

  // If no next shift data, add demo data to test layout
  const nextOnDuty: Crew[] = dutyStatus.nextShift.length > 0
    ? dutyStatus.nextShift.map(c => ({
        id: c.id,
        name: c.name,
        role: c.position || "Crew Member",
        avatar: getCrewAvatar(c.name)
      }))
    : [
        { id: "demo-next-1", name: "Sarah Johnson", role: "Second Stewardess", avatar: getCrewAvatar("Sarah Johnson") },
        { id: "demo-next-2", name: "Sophie Martin", role: "Stewardess", avatar: getCrewAvatar("Sophie Martin") },
        { id: "demo-next-3", name: "Amelia Thompson", role: "Stewardess", avatar: getCrewAvatar("Amelia Thompson") }
      ];

  const backupNext: Crew[] = dutyStatus.nextBackup.length > 0
    ? dutyStatus.nextBackup.map(c => ({
        id: c.id,
        name: c.name,
        role: c.position || "Crew Member",
        avatar: getCrewAvatar(c.name)
      }))
    : [
        { id: "demo-backup-next-1", name: "Emma Wilson", role: "Stewardess", avatar: getCrewAvatar("Emma Wilson") }
      ];

  // Handle calling backup crew (move to active duty)
  const handleCallBackup = (crew: Crew) => {
    // Update crew member status to on-duty
    const updatedCrew = crewMembers.map(c =>
      c.id === crew.id ? { ...c, status: 'on-duty' as const } : c
    );
    setCrewMembers(updatedCrew);
    
    // Show confirmation
    alert(`Backup crew activated: ${crew.name} is now on duty`);
  };

  return (
    <DutyPanel
      onDuty={onDuty}
      backup={backup}
      nextOnDuty={nextOnDuty}
      backupNextOnDuty={backupNext}
      totalSec={totalSec}
      remainSec={remainSec}
      onCallBackup={handleCallBackup}
    />
  );
}

// ------------------------------------------------------------
// Simple dev tests (console) so regressions are obvious
// ------------------------------------------------------------
(function __devTests__() {
  // 50% remaining of 1h with 72 ticks -> 36
  console.assert(visibleTicks(3600, 1800, 72) === 36, "Tick math 50% should be 36");
  // clamp to 0..1
  console.assert(visibleTicks(3600, -10, 72) === 0, "Negative remaining should clamp to 0");
  console.assert(visibleTicks(3600, 7200, 72) === 72, "Over-remaining should clamp to full");
})();

// Export both components for compatibility
export default DutyTimerWidget;
