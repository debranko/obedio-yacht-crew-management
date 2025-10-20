import React, { useState, useEffect } from "react";
import { useAppData } from "../contexts/AppDataContext";
import DutyPanel, { Crew, DutyPanelProps } from "./DutyPanel";
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

// Hook to calculate shift countdown
function useShiftCountdown() {
  const { shifts } = useAppData();
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

// Widget component for the grid system
export function DutyPanelWidget() {
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

export default DutyPanelWidget;