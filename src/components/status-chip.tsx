interface StatusChipProps {
  status: "online" | "offline" | "low-battery" | "provisioning" | "attention" | "on-duty" | "off-duty" | "on-leave" | "onboard" | "departed";
  className?: string;
}

const statusConfig = {
  "online": { bg: "bg-success/10", text: "text-success", label: "Online" },
  "offline": { bg: "bg-muted", text: "text-muted-foreground", label: "Offline" },
  "low-battery": { bg: "bg-warning/10", text: "text-warning", label: "Low Battery" },
  "provisioning": { bg: "bg-primary/10", text: "text-primary", label: "Provisioning" },
  "attention": { bg: "bg-error/10", text: "text-error", label: "Needs Attention" },
  "on-duty": { bg: "bg-success/10", text: "text-success", label: "On Duty" },
  "off-duty": { bg: "bg-muted", text: "text-muted-foreground", label: "Off Duty" },
  "on-leave": { bg: "bg-warning/10", text: "text-warning", label: "On Leave" },
  "onboard": { bg: "bg-success/10", text: "text-success", label: "Onboard" },
  "departed": { bg: "bg-muted", text: "text-muted-foreground", label: "Departed" }
};

export function StatusChip({ status, className = "" }: StatusChipProps) {
  const config = statusConfig[status];
  
  // Add pulse animation for active statuses
  const shouldPulse = status === 'on-duty' || status === 'online' || status === 'onboard';
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}>
      {shouldPulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.bg}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.text.replace('text-', 'bg-')}`}></span>
        </span>
      )}
      {config.label}
    </span>
  );
}
