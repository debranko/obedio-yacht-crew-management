import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Bell, Calendar, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar } from "./ui/avatar";
import { getCrewAvatarUrl } from "./crew-avatars";
import { CrewChange } from "../contexts/AppDataContext";

interface NotifyCrewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changes: CrewChange[];
  onConfirm: () => void;
}

export function NotifyCrewDialog({ open, onOpenChange, changes, onConfirm }: NotifyCrewDialogProps) {
  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'bg-success/10 text-success border-success/20';
      case 'removed': return 'bg-error/10 text-error border-error/20';
      case 'moved_to_primary': return 'bg-primary/10 text-primary border-primary/20';
      case 'moved_to_backup': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'added': return 'Added to Shift';
      case 'removed': return 'Removed from Shift';
      case 'moved_to_primary': return 'Moved to Primary';
      case 'moved_to_backup': return 'Moved to Backup';
      default: return type;
    }
  };

  // Get unique crew members
  const uniqueCrewMembers = Array.from(new Set(changes.map(c => c.crewMember)));
  const crewCount = uniqueCrewMembers.length;

  const handleConfirm = () => {
    onConfirm();
    
    // Show single success toast
    toast.success(`Notifications sent successfully`, {
      description: `${crewCount} crew ${crewCount === 1 ? 'member' : 'members'} notified about duty changes`,
    });

    onOpenChange(false);
  };

  if (changes.length === 0) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notify Crew Members
          </AlertDialogTitle>
          <AlertDialogDescription>
            The following crew members will be notified about their roster changes. 
            Notifications will include the date, shift details, and type of change.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[280px] pr-4">
          <div className="space-y-2">
            {changes.map((change, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-accent/30 border border-border"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{change.crewMember}</p>
                    <p className="text-xs text-muted-foreground truncate">{change.details}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`${getChangeTypeColor(change.changeType)} text-xs whitespace-nowrap`}>
                  {getChangeTypeLabel(change.changeType)}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 border border-border p-3">
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Notification message:
              </span>
            </div>
            <p className="text-sm font-medium mt-2">
              "Your duty has changed. Check your duty roster."
            </p>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <p className="text-sm">
              <span className="font-medium text-primary">{crewCount}</span> crew {crewCount === 1 ? 'member' : 'members'} will receive notifications via their preferred communication channels.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            <Bell className="h-4 w-4 mr-2" />
            Send Notifications
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
