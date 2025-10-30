import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ShiftConfig } from './types';
import { Plus, Trash2 } from 'lucide-react';

interface CalendarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shifts: ShiftConfig[];
  onSave: (shifts: ShiftConfig[]) => void;
}

export function CalendarSettingsDialog({
  open,
  onOpenChange,
  shifts,
  onSave,
}: CalendarSettingsDialogProps) {
  const [localShifts, setLocalShifts] = useState<ShiftConfig[]>(shifts);

  const updateShift = (index: number, field: keyof ShiftConfig, value: string | number) => {
    const updated = [...localShifts];
    updated[index] = { ...updated[index], [field]: value };
    setLocalShifts(updated);
  };

  const addShift = () => {
    const newShift: ShiftConfig = {
      id: `shift-${Date.now()}`,
      name: `Shift ${localShifts.length + 1}`,
      startTime: '00:00',
      endTime: '08:00',
      primaryCount: 2,
      backupCount: 1,
    };
    setLocalShifts([...localShifts, newShift]);
  };

  const removeShift = (index: number) => {
    if (localShifts.length > 1) {
      setLocalShifts(localShifts.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    onSave(localShifts);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendar Settings</DialogTitle>
          <DialogDescription>
            Configure shift timelines and crew capacity for the duty roster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {localShifts.map((shift, index) => (
            <div key={shift.id} className="p-4 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4>Shift {index + 1}</h4>
                {localShifts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeShift(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shift Name</Label>
                  <Input
                    value={shift.name}
                    onChange={(e) => updateShift(index, 'name', e.target.value)}
                    placeholder="e.g. Morning"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={shift.startTime}
                      onChange={(e) => updateShift(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={shift.endTime}
                      onChange={(e) => updateShift(index, 'endTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Crew Count</Label>
                  <Input
                    type="number"
                    min="1"
                    value={shift.primaryCount}
                    onChange={(e) =>
                      updateShift(index, 'primaryCount', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Backup Crew Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={shift.backupCount}
                    onChange={(e) =>
                      updateShift(index, 'backupCount', parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {localShifts.length < 4 && (
            <Button variant="outline" onClick={addShift} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Button>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
