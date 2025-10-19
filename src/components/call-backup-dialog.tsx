import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { AlertTriangle, Bell } from "lucide-react";
import { toast } from "sonner";
import { getCrewAvatar } from "./crew-avatars";

interface BackupCrewMember {
  name: string;
  position?: string;
  role?: string;
}

interface CallBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupCrew: BackupCrewMember[];
  onBackupCalled?: (crewName: string, urgency: string, reason: string) => void;
}

const URGENCY_LEVELS = [
  { value: "routine", label: "Routine", icon: Bell, color: "text-muted-foreground" },
  { value: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-warning" },
  { value: "emergency", label: "Emergency", icon: AlertTriangle, color: "text-destructive" },
];

export function CallBackupDialog({
  open,
  onOpenChange,
  backupCrew,
  onBackupCalled,
}: CallBackupDialogProps) {
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("routine");
  const [reason, setReason] = useState("");

  const handleCallBackup = () => {
    if (!selectedBackup) {
      toast.error("Please select a backup crew member");
      return;
    }

    const selectedCrew = backupCrew.find(c => c.name === selectedBackup);
    const urgencyLabel = URGENCY_LEVELS.find(u => u.value === urgency)?.label || "Routine";

    // Call the callback to activate the backup crew member
    if (onBackupCalled) {
      onBackupCalled(selectedBackup, urgency, reason);
    }

    // Show success toast
    toast.success(`Backup crew activated`, {
      description: `${selectedCrew?.name} moved to active duty (${urgencyLabel})`,
    });

    // Reset form
    setSelectedBackup("");
    setUrgency("routine");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            Call Backup Crew
          </DialogTitle>
          <DialogDescription>
            Notify backup crew members to report for duty. Select urgency level and crew member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Urgency Level */}
          <div className="space-y-2">
            <Label>Urgency Level</Label>
            <div className="grid grid-cols-3 gap-3">
              {URGENCY_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    urgency === level.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={urgency === level.value}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="sr-only"
                  />
                  <level.icon className={`h-4 w-4 ${level.color}`} />
                  <span className="text-sm font-medium">{level.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Select Backup Crew */}
          <div className="space-y-2">
            <Label>Select Backup Crew Member</Label>
            {backupCrew.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {backupCrew.map((crew) => {
                  const initials = crew.name.split(" ").map(n => n[0]).slice(0, 2).join("");
                  return (
                    <label
                      key={crew.name}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedBackup === crew.name
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="backup"
                        value={crew.name}
                        checked={selectedBackup === crew.name}
                        onChange={(e) => setSelectedBackup(e.target.value)}
                        className="sr-only"
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={crew.avatar || getCrewAvatar(crew.name)} alt={crew.name} />
                        <AvatarFallback className="text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{crew.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {crew.position || crew.role || "Crew Member"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-warning/10 border-warning/30 text-warning text-[10px]">
                        Backup
                      </Badge>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No backup crew available
              </div>
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Brief explanation for calling backup..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCallBackup}
            disabled={!selectedBackup}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            Call Backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
