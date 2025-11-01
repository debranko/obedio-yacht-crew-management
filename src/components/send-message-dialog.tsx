import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import { Send, Wifi, WifiOff, Battery, BatteryLow } from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "../contexts/AppDataContext";
import { useDevices } from "../hooks/useDevices";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  recipientId: string;
}

// NOTE: Mock locations for demonstration
// In production, these would come from useLocations hook / locations service
const YACHT_LOCATIONS = [
  "Owner's Stateroom",
  "VIP Cabin",
  "Cabin 6",
  "Main Salon",
  "Dining Room",
  "Music Salon",
  "VIP Office",
  "External Salon",
  "Conference Room",
  "Welcome Salon",
  "Sun Deck Lounge",
  "Gym",
  "Lazarette / Swimming Platform",
];

export function SendMessageDialog({
  open,
  onOpenChange,
  recipientName,
  recipientId,
}: SendMessageDialogProps) {
  const { sendMessage } = useAppData();
  const { data: allDevices = [] } = useDevices();
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<string>("none");
  const [priority, setPriority] = useState<"normal" | "urgent" | "emergency">("normal");

  // Get device info for recipient from database
  const deviceAssignment = allDevices.find(device => device.crewMemberId === recipientId);

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Send message through AppDataContext
    // TODO: Replace with actual current user from auth context
    sendMessage({
      from: "Current User", // In production, this would be current logged-in user
      to: [recipientName],
      message: message.trim(),
      location: location === "none" ? undefined : location,
      priority,
    });

    // Show success toast
    const priorityIcon = priority === "emergency" ? "🚨" : priority === "urgent" ? "⚠️" : "✓";
    toast.success(`${priorityIcon} Message sent to ${recipientName}`, {
      description: deviceAssignment
        ? `Delivered to ${deviceAssignment.name}`
        : "Crew member will receive notification",
    });

    // Reset form and close
    setMessage("");
    setLocation("none");
    setPriority("normal");
    onOpenChange(false);
  };

  const renderDeviceStatus = () => {
    if (!deviceAssignment) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm">No device assigned</span>
        </div>
      );
    }

    const statusConfig = {
      online: { icon: Wifi, text: "Connected", color: "text-success" },
      offline: { icon: WifiOff, text: "Disconnected", color: "text-muted-foreground" },
      low_battery: { icon: BatteryLow, text: "Low Battery", color: "text-warning" },
      error: { icon: WifiOff, text: "Error", color: "text-destructive" },
    };

    const config = statusConfig[deviceAssignment.status] || statusConfig.offline;
    const StatusIcon = config.icon;

    return (
      <div className={`flex items-center gap-2 ${config.color}`}>
        <StatusIcon className="h-4 w-4" />
        <span className="text-sm">
          {config.text} - {deviceAssignment.name}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
          <DialogDescription>
            Send a message directly to crew member's assigned device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message Textarea */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          {/* Location Selector (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Select a location..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {YACHT_LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selector */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={priority}
              onValueChange={(value) => setPriority(value as typeof priority)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="font-normal cursor-pointer">
                  Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="urgent" id="urgent" />
                <Label htmlFor="urgent" className="font-normal cursor-pointer">
                  Urgent
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="emergency" id="emergency" />
                <Label htmlFor="emergency" className="font-normal cursor-pointer text-destructive">
                  Emergency
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Device Status */}
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Device Status</span>
              {renderDeviceStatus()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="gap-2">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
