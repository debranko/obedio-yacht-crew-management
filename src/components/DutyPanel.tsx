import React, { useMemo } from "react";

// ---------------------------------------------
// Types
// ---------------------------------------------
export type Crew = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
};

export type DutyPanelProps = {
  onDuty: Crew[];
  backup: Crew[];                // leva lista - faded, compact, sa Call Backup
  nextOnDuty: Crew[];            // desna lista
  backupNextOnDuty: Crew[];      // desna lista, ispod linije, bez dugmadi
  totalSec: number;              // trajanje smene u sekundama
  remainSec: number;             // preostalo vreme u sekundama
  onCallBackup?: (c: Crew) => void;
};

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function toHHMM(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------
// Segmented countdown ring - remaining only
// ---------------------------------------------
function SegmentedRing({
  totalSec,
  remainSec,
  color = "#f0b400",
  ticks = 72,
}: {
  totalSec: number;
  remainSec: number;
  color?: string;
  ticks?: number;
}) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 96;
  const outerR = 118;

  const visible = useMemo(() => {
    const pct = clamp01(remainSec / Math.max(1, totalSec));
    return Math.round(ticks * pct);
  }, [remainSec, totalSec, ticks]);

  const lines = Array.from({ length: ticks }, (_, i) => {
    const ang = (-90 + (i / ticks) * 360) * (Math.PI / 180);
    const x1 = cx + innerR * Math.cos(ang);
    const y1 = cy + innerR * Math.sin(ang);
    const x2 = cx + outerR * Math.cos(ang);
    const y2 = cy + outerR * Math.sin(ang);
    const on = i < visible;
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={on ? color : "hsl(0 0% 100% / 0.12)"}
        strokeWidth={on ? 6.5 : 4.5}
        strokeLinecap="round"
      />
    );
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {lines}
      </svg>

      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="text-center">
          <div
            className="font-light tabular-nums tracking-tight text-foreground"
            style={{ fontSize: "72px", lineHeight: 1 }}
          >
            {toHHMM(remainSec)}
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground/70">
            Shift ending
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------
// Row - sa opcijom compact i Call Backup dugmetom
// ---------------------------------------------
function CrewRow({
  person,
  actionLabel,
  onCall,
  compact,
}: {
  person: Crew;
  actionLabel?: string;
  onCall?: (c: Crew) => void;
  compact?: boolean;
}) {
  return (
    <li className={`flex items-center ${compact ? "gap-2 py-1" : "gap-3 py-2"}`}>
      <img
        src={person.avatar}
        className={`rounded-full object-cover ${compact ? "h-7 w-7" : "h-10 w-10"}`}
        alt=""
      />
      <div className="flex-1 min-w-0">
        <div className={`truncate ${compact ? "text-xs font-medium" : "font-medium"}`}>
          {person.name}
        </div>
        <div className="text-xs text-muted-foreground truncate">{person.role}</div>
      </div>

      {onCall ? (
        <button
          onClick={() => onCall(person)}
          className={`shrink-0 inline-flex items-center gap-1 rounded-full border ${
            compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
          } font-medium hover:bg-amber-50 border-amber-300/70 text-amber-700`}
        >
          {/* bell icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {actionLabel ?? "Call Backup"}
        </button>
      ) : null}
    </li>
  );
}

// ---------------------------------------------
// Public component - koristi realne podatke iz props
// ---------------------------------------------
export default function DutyPanel({
  onDuty,
  backup,
  nextOnDuty,
  backupNextOnDuty,
  totalSec,
  remainSec,
  onCallBackup,
}: DutyPanelProps) {
  return (
    <div className="w-full min-h-[460px] bg-gradient-to-r from-amber-100 to-cyan-100 p-6 rounded-2xl border">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left - Currently on duty, pa Backup */}
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
                  <CrewRow
                    key={c.id}
                    person={c}
                    actionLabel="Call Backup"
                    onCall={onCallBackup}
                    compact
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Center - timer */}
        <div className="col-span-4 flex items-center justify-center">
          <SegmentedRing totalSec={totalSec} remainSec={remainSec} />
        </div>

        {/* Right - Next on duty, pa Backup - next on duty */}
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

          {backupNextOnDuty.length > 0 && (
            <>
              <div className="mt-6 text-sm font-semibold text-right text-foreground">
                Backup - next on duty
              </div>
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