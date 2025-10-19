import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';
import { Bell, Clock, BellOff } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: NotificationSettings) => void;
  initialSettings?: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  shiftStartAdvanceTime: string; // e.g., "never", "15min", "30min", "1hour", "2hours", "1day"
  shiftEndAdvanceTime: string;
  shiftStartEnabled: boolean;
  shiftEndEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  shiftStartAdvanceTime: '1hour',
  shiftEndAdvanceTime: '30min',
  shiftStartEnabled: true,
  shiftEndEnabled: true,
};

const timeOptions = [
  { value: 'never', label: 'Never' },
  { value: '15min', label: '15 minutes before' },
  { value: '30min', label: '30 minutes before' },
  { value: '1hour', label: '1 hour before' },
  { value: '2hours', label: '2 hours before' },
  { value: '4hours', label: '4 hours before' },
  { value: '1day', label: '1 day before' },
];

export function NotificationSettingsDialog({
  open,
  onOpenChange,
  onSave,
  initialSettings,
}: NotificationSettingsDialogProps) {
  const [settings, setSettings] = useState<NotificationSettings>(
    initialSettings || DEFAULT_SETTINGS
  );

  const handleSave = () => {
    onSave(settings);
    toast.success('Notification settings saved');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure when crew members should be notified about their duties and schedules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              {settings.enabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label>Enable All Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Master switch for all crew notifications
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          {/* Shift Start Notifications */}
          <div className="space-y-3 opacity-100" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <Label>Shift Start Reminder</Label>
              </div>
              <Switch
                checked={settings.shiftStartEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, shiftStartEnabled: checked })
                }
                disabled={!settings.enabled}
              />
            </div>
            <div className="pl-6">
              <Label className="text-sm text-muted-foreground">Notify crew members</Label>
              <Select
                value={settings.shiftStartAdvanceTime}
                onValueChange={(value) =>
                  setSettings({ ...settings, shiftStartAdvanceTime: value })
                }
                disabled={!settings.enabled || !settings.shiftStartEnabled}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shift End Notifications */}
          <div className="space-y-3" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <Label>Shift End Reminder</Label>
              </div>
              <Switch
                checked={settings.shiftEndEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, shiftEndEnabled: checked })
                }
                disabled={!settings.enabled}
              />
            </div>
            <div className="pl-6">
              <Label className="text-sm text-muted-foreground">Notify crew members</Label>
              <Select
                value={settings.shiftEndAdvanceTime}
                onValueChange={(value) =>
                  setSettings({ ...settings, shiftEndAdvanceTime: value })
                }
                disabled={!settings.enabled || !settings.shiftEndEnabled}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
