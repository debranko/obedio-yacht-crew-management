/**
 * Wear OS Watch Configuration Dialog
 * Assignment and configuration interface for Wear OS smart watches
 */

import { useState } from 'react';
import { Device } from '../../hooks/useDevices';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import {
  Watch,
  User,
  UserMinus,
  Battery,
  Signal,
  Activity,
} from 'lucide-react';

interface WatchConfigDialogProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
}

export function WatchConfigDialog({
  device,
  open,
  onClose,
  onSave,
}: WatchConfigDialogProps) {
  // Fetch crew members
  const { crewMembers, isLoading: isLoadingCrew } = useCrewMembers();

  const [crewMemberId, setCrewMemberId] = useState<string>(
    device?.crewmemberId || device?.crewmember?.id || ''
  );

  const handleSave = () => {
    onSave({ crewMemberId });
    toast.success('Watch assignment updated!');
    onClose();
  };

  const handleUnbind = () => {
    onSave({ crewMemberId: null });
    toast.success('Watch unbound from crew member');
    onClose();
  };

  const isAssigned = !!device?.crewmember;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Watch className="h-5 w-5 text-green-600" />
            Wear OS Watch Configuration
            {device && <span className="text-sm text-gray-500">({device.deviceId})</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Device Information */}
          {device && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">Device Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">Battery:</span>
                  <span className="font-medium">{device.batteryLevel || 0}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Signal:</span>
                  <span className="font-medium">{device.signalStrength || 'N/A'} dBm</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{device.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Watch className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{device.subType || 'Wear OS'}</span>
                </div>
              </div>
              {device.lastSeen && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                  Last seen: {new Date(device.lastSeen).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Current Assignment */}
          {isAssigned && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-700" />
                <span className="text-sm font-semibold text-green-900">Currently Assigned To</span>
              </div>
              <p className="text-base font-semibold text-green-800">{device?.crewmember?.name}</p>
              <p className="text-sm text-green-700">{device?.crewmember?.position || 'Crew Member'}</p>
            </div>
          )}

          {/* Crew Member Assignment */}
          <div className="space-y-3">
            <Label htmlFor="crewMember" className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              {isAssigned ? 'Reassign Watch to Crew Member' : 'Assign Watch to Crew Member'}
            </Label>
            <Select
              value={crewMemberId}
              onValueChange={setCrewMemberId}
              disabled={isLoadingCrew}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingCrew ? "Loading crew members..." : "Select crew member"} />
              </SelectTrigger>
              <SelectContent>
                {crewMembers.map((crew) => (
                  <SelectItem key={crew.id} value={crew.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{crew.name}</span>
                      <span className="text-xs text-gray-500">— {crew.position}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Wear OS watches are personal devices assigned to individual crew members for receiving service requests and notifications.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">About Wear OS Watches</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Receives real-time service request notifications</li>
              <li>• Bluetooth connectivity via Obedio mobile app</li>
              <li>• Battery monitoring and status tracking</li>
              <li>• One watch per crew member recommended</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isAssigned && (
            <Button
              variant="outline"
              onClick={handleUnbind}
              className="mr-auto"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Unbind Watch
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!crewMemberId || crewMemberId === device?.crewmember?.id}
          >
            <User className="h-4 w-4 mr-2" />
            {isAssigned ? 'Reassign Watch' : 'Assign Watch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
