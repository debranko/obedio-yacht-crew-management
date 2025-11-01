/**
 * Add Device Dialog
 * Simple form for adding new IoT devices (Smart Buttons, Watches, Repeaters)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Zap, Watch, Radio, Wifi, MapPin, User } from 'lucide-react';

interface AddDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (device: {
    deviceId: string;
    name: string;
    type: 'smart_button' | 'watch' | 'repeater' | 'mobile_app';
    subType?: string;
    locationId?: string;
    crewMemberId?: string;
    connectionType?: string;
  }) => void;
  locations: any[];
  crewMembers?: any[];
  defaultType?: 'smart_button' | 'watch' | 'repeater';
}

const DEVICE_TYPES = [
  { value: 'smart_button', label: 'Smart Button', icon: Zap },
  { value: 'watch', label: 'Smart Watch', icon: Watch },
  { value: 'repeater', label: 'Repeater', icon: Radio },
];

const CONNECTION_TYPES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'lora_868', label: 'LoRa 868 MHz' },
  { value: 'lora_915', label: 'LoRa 915 MHz' },
  { value: 'lora_433', label: 'LoRa 433 MHz' },
  { value: 'bluetooth', label: 'Bluetooth' },
];

const WATCH_SUBTYPES = [
  { value: 'esp32', label: 'ESP32 Watch' },
  { value: 'wear_os', label: 'Wear OS' },
];

const REPEATER_SUBTYPES = [
  { value: 'lora_wifi', label: 'LoRa-WiFi Bridge' },
  { value: 'esp32', label: 'ESP32 Repeater' },
];

export function AddDeviceDialog({
  open,
  onClose,
  onAdd,
  locations,
  crewMembers = [],
  defaultType = 'smart_button',
}: AddDeviceDialogProps) {
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'smart_button' | 'watch' | 'repeater'>(defaultType);
  const [subType, setSubType] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [crewMemberId, setCrewMemberId] = useState<string>('');
  const [connectionType, setConnectionType] = useState<string>('wifi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deviceId.trim() || !name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd({
        deviceId: deviceId.trim(),
        name: name.trim(),
        type,
        subType: subType || undefined,
        locationId: locationId || undefined,
        crewMemberId: crewMemberId || undefined,
        connectionType,
      });

      // Reset form
      setDeviceId('');
      setName('');
      setSubType('');
      setLocationId('');
      setCrewMemberId('');
      setConnectionType('wifi');
      onClose();
    } catch (error) {
      console.error('Failed to add device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDeviceId('');
      setName('');
      setSubType('');
      setLocationId('');
      setCrewMemberId('');
      setConnectionType('wifi');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>
            Register a new IoT device. You can configure detailed settings after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device Type */}
          <div className="space-y-2">
            <Label>Device Type</Label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_TYPES.map((dt) => {
                  const Icon = dt.icon;
                  return (
                    <SelectItem key={dt.value} value={dt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{dt.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Device ID */}
          <div className="space-y-2">
            <Label htmlFor="deviceId">
              Device ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="deviceId"
              placeholder="e.g., BTN-001, WATCH-001"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier from the device (MAC address or serial number)
            </p>
          </div>

          {/* Device Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Master Cabin Button, Captain's Watch"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* SubType for Watch and Repeater */}
          {type === 'watch' && (
            <div className="space-y-2">
              <Label>Watch Type</Label>
              <Select value={subType} onValueChange={setSubType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select watch type" />
                </SelectTrigger>
                <SelectContent>
                  {WATCH_SUBTYPES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'repeater' && (
            <div className="space-y-2">
              <Label>Repeater Type</Label>
              <Select value={subType} onValueChange={setSubType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repeater type" />
                </SelectTrigger>
                <SelectContent>
                  {REPEATER_SUBTYPES.map((st) => (
                    <SelectItem key={st.value} value={st.value}>
                      {st.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Connection Type */}
          <div className="space-y-2">
            <Label>Connection Type</Label>
            <Select value={connectionType} onValueChange={setConnectionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-3 w-3" />
                      <span>{ct.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location (for Smart Buttons and Repeaters) */}
          {(type === 'smart_button' || type === 'repeater') && (
            <div className="space-y-2">
              <Label>Location (Optional)</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{loc.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Crew Member (for Watches) */}
          {type === 'watch' && crewMembers.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned Crew Member (Optional)</Label>
              <Select value={crewMemberId} onValueChange={setCrewMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {crewMembers.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{crew.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !deviceId.trim() || !name.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Device'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
