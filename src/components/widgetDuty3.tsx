import { useEffect, useState } from "react";

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
    <div className="w-full min-h-[460px] bg-gradient-to-r from-amber-100 to-cyan-100 p-6 rounded-2xl border">
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
                <div className="hidden sm:block text-right">
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
                    <div className="hidden sm:block text-right">
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
// Simple dev tests (console) so regressions are obvious
// ------------------------------------------------------------
(function __devTests__() {
  // 50% remaining of 1h with 72 ticks -> 36
  console.assert(visibleTicks(3600, 1800, 72) === 36, "Tick math 50% should be 36");
  // clamp to 0..1
  console.assert(visibleTicks(3600, -10, 72) === 0, "Negative remaining should clamp to 0");
  console.assert(visibleTicks(3600, 7200, 72) === 72, "Over-remaining should clamp to full");
})();

// ------------------------------------------------------------
// DEMO HARNESS – keeps the canvas preview working.
// Replace with your real data by importing DutyPanel and passing props.
// ------------------------------------------------------------
const demoBackup: Crew[] = [
  { id: "b1", name: "Emma Wilson", role: "Stewardess", avatar: "https://i.pravatar.cc/80?img=1" },
  { id: "b2", name: "Grace Williams", role: "Junior Stewardess", avatar: "https://i.pravatar.cc/80?img=2" },
  { id: "b3", name: "Isabella Rodriguez", role: "Sous Chef", avatar: "https://i.pravatar.cc/80?img=3" },
];
const demoOnDuty: Crew[] = [
  { id: "d1", name: "Sophie Martin", role: "Stewardess", avatar: "https://i.pravatar.cc/80?img=11" },
  { id: "d2", name: "Lana Cooper", role: "Housekeeper", avatar: "https://i.pravatar.cc/80?img=12" },
  { id: "d3", name: "Mia Carter", role: "Bar Stewardess", avatar: "https://i.pravatar.cc/80?img=13" },
];
const demoNextOnDuty: Crew[] = [
  { id: "n1", name: "Sarah Johnson", role: "Second Stewardess", avatar: "https://i.pravatar.cc/80?img=21" },
  { id: "n2", name: "Sophie Martin", role: "Stewardess", avatar: "https://i.pravatar.cc/80?img=22" },
  { id: "n3", name: "Amelia Thompson", role: "Stewardess", avatar: "https://i.pravatar.cc/80?img=23" },
];
const demoBackupNext: Crew[] = [demoBackup[0]];

export default function DutyPanelDemo() {
  const [remain, setRemain] = useState(100 * 60); // 1h40m remaining
  const total = 8 * 3600; // 8h shift for math

  useEffect(() => {
    const id = setInterval(() => setRemain((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <DutyPanel
      onDuty={demoOnDuty}
      backup={demoBackup}
      nextOnDuty={demoNextOnDuty}
      backupNextOnDuty={demoBackupNext}
      totalSec={total}
      remainSec={remain}
      onCallBackup={(c) => alert(`Calling backup: ${c.name}`)}
    />
  );
}

// ------------------------------------------------------------
// OPTIONAL: Example adapter for real backend shape
// Uncomment and adjust field names to match your API/store
// ------------------------------------------------------------
/*
// Example real shape:
// type AppUser = { id: string; fullName: string; position: string; avatarUrl?: string };
// type Roster = { onDuty: AppUser[]; backup: AppUser[]; next: AppUser[]; backupNext: AppUser[]; shift: { totalSec: number; remainSec: number } }

function mapRosterToProps(r: Roster): DutyPanelProps {
  const map = (u: AppUser): Crew => ({ id: u.id, name: u.fullName, role: u.position, avatar: u.avatarUrl });
  return {
    onDuty: r.onDuty.map(map),
    backup: r.backup.map(map),
    nextOnDuty: r.next.map(map),
    backupNextOnDuty: r.backupNext.map(map),
    totalSec: r.shift.totalSec,
    remainSec: r.shift.remainSec,
  };
}
*/
