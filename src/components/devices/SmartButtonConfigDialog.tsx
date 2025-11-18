/**
 * Smart Button Configuration Dialog
 * Full configuration interface for ESP32 smart buttons
 */

import { useState } from 'react';
import { Device } from '../../hooks/useDevices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { toast } from 'sonner';
import {
  Zap,
  Mic,
  Volume2,
  Lightbulb,
  Settings,
  MapPin,
  Wifi,
  Radio,
} from 'lucide-react';

interface SmartButtonConfigDialogProps {
  device: Device | null;
  open: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  locations: any[];
}

// Button action types
const BUTTON_ACTIONS = [
  { value: 'call', label: 'Simple Call' },
  { value: 'urgent', label: 'Urgent Call' },
  { value: 'voice', label: 'Voice Message' },
  { value: 'emergency', label: 'Emergency (All Crew)' },
  { value: 'custom', label: 'Custom Message' },
  { value: 'disabled', label: 'Disabled' },
];

export function SmartButtonConfigDialog({
  device,
  open,
  onClose,
  onSave,
  locations,
}: SmartButtonConfigDialogProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [config, setConfig] = useState({
    // Basic Info
    name: device?.name || '',
    locationId: device?.locationId || '',
    connectionType: device?.connectionType || 'wifi',
    
    // Button Actions
    singlePress: device?.config?.singlePress || 'call',
    doublePress: device?.config?.doublePress || 'urgent',
    touch: device?.config?.touch || 'call',
    doubleTouchPress: device?.config?.doubleTouchPress || 'disabled',
    longPress: device?.config?.longPress || 'voice',
    shake: device?.config?.shake || 'emergency',
    customShakeMessage: device?.config?.customShakeMessage || '',
    shakeThreshold: device?.config?.shakeThreshold || 3,

    // Audio Settings
    micEnabled: device?.config?.micEnabled ?? true,
    micGain: device?.config?.micGain || 60,
    speakerVolume: device?.config?.speakerVolume || 70,

    // LED Settings
    ledEnabled: device?.config?.ledEnabled ?? true,
    ledBrightness: device?.config?.ledBrightness || 80,
    ledRingEnabled: device?.config?.ledRingEnabled ?? true,
    ledRingBrightness: device?.config?.ledRingBrightness || 80,
  });

  const handleSave = () => {
    // Validate
    if (!config.name.trim()) {
      toast.error('Please enter a device name');
      return;
    }
    if (!config.locationId) {
      toast.error('Please select a location');
      return;
    }

    onSave(config);
    toast.success('Button configuration saved!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Smart Button Configuration
            {device && <span className="text-sm text-gray-500">({device.deviceId})</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 bg-gray-200 p-2 rounded-lg mb-4 border border-gray-300 shadow-sm">
          <Button
            variant={activeTab === 'basic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('basic')}
            className="flex-1 h-10 font-medium"
          >
            Basic
          </Button>
          <Button
            variant={activeTab === 'actions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('actions')}
            className="flex-1 h-10 font-medium"
          >
            Actions
          </Button>
          <Button
            variant={activeTab === 'audio' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('audio')}
            className="flex-1 h-10 font-medium"
          >
            Audio
          </Button>
          <Button
            variant={activeTab === 'led' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('led')}
            className="flex-1 h-10 font-medium"
          >
            LED
          </Button>
          <Button
            variant={activeTab === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('advanced')}
            className="flex-1 h-10 font-medium"
          >
            Advanced
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Button Name</Label>
              <Input
                id="name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="e.g., Master Bedroom - Bedside"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={config.locationId}
                onValueChange={(value: string) => setConfig({ ...config, locationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {loc.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection">Connection Type</Label>
              <Select
                value={config.connectionType}
                onValueChange={(value: string) => setConfig({ ...config, connectionType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wifi">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      WiFi + MQTT
                    </div>
                  </SelectItem>
                  <SelectItem value="lora_868">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      LoRa 868 MHz (Europe)
                    </div>
                  </SelectItem>
                  <SelectItem value="lora_915">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      LoRa 915 MHz (USA)
                    </div>
                  </SelectItem>
                  <SelectItem value="lora_433">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      LoRa 433 MHz (Asia)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {device && (
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Battery:</span>
                    <span className="ml-2 font-medium">{device.batteryLevel}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Signal:</span>
                    <span className="ml-2 font-medium">{device.signalStrength} dBm</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium capitalize">{device.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Seen:</span>
                    <span className="ml-2 font-medium">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Button Actions Tab */}
          {activeTab === 'actions' && (
          <div className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure what happens when the button is pressed in different ways
              </p>

              <div className="space-y-2">
                <Label htmlFor="singlePress">Single Press</Label>
                <Select
                  value={config.singlePress}
                  onValueChange={(value: string) => setConfig({ ...config, singlePress: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doublePress">Double Press</Label>
                <Select
                  value={config.doublePress}
                  onValueChange={(value: string) => setConfig({ ...config, doublePress: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="touch">Touch</Label>
                <Select
                  value={config.touch}
                  onValueChange={(value: string) => setConfig({ ...config, touch: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doubleTouchPress">Double Touch + Press</Label>
                <Select
                  value={config.doubleTouchPress}
                  onValueChange={(value: string) => setConfig({ ...config, doubleTouchPress: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="longPress">Long Press (Voice Recording)</Label>
                <Select
                  value={config.longPress}
                  onValueChange={(value: string) => setConfig({ ...config, longPress: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shake">Shake to Call</Label>
                <Select
                  value={config.shake}
                  onValueChange={(value: string) => setConfig({ ...config, shake: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Shake Message - shown when shake is 'custom' */}
              {config.shake === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customShakeMessage">Custom Shake Message</Label>
                  <Input
                    id="customShakeMessage"
                    placeholder="Enter custom message (e.g., 'Need medical assistance')"
                    value={config.customShakeMessage}
                    onChange={(e) => setConfig({ ...config, customShakeMessage: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    This message will appear in the service request when the device is shaken
                  </p>
                </div>
              )}

              {/* Shake Sensitivity */}
              <div className="space-y-2">
                <Label htmlFor="shakeThreshold">Shake Sensitivity</Label>
                <Select
                  value={String(config.shakeThreshold)}
                  onValueChange={(value: string) => setConfig({ ...config, shakeThreshold: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Very Sensitive (2.0g)</SelectItem>
                    <SelectItem value="2">Sensitive (2.5g)</SelectItem>
                    <SelectItem value="3">Normal (3.5g)</SelectItem>
                    <SelectItem value="4">Less Sensitive (4.5g)</SelectItem>
                    <SelectItem value="5">Very Low (5.5g)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Lower = detects gentle shaking, Higher = requires vigorous shaking
                </p>
              </div>
            </div>
          </div>
          )}

          {/* Audio Settings Tab */}
          {activeTab === 'audio' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-600" />
                <div>
                  <Label htmlFor="micEnabled">Microphone</Label>
                  <p className="text-sm text-gray-500">Enable for voice messages</p>
                </div>
              </div>
              <Switch
                id="micEnabled"
                checked={config.micEnabled}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, micEnabled: checked })}
              />
            </div>

            {config.micEnabled && (
              <div className="space-y-2">
                <Label htmlFor="micGain">Microphone Gain: {config.micGain}%</Label>
                <Slider
                  id="micGain"
                  min={0}
                  max={100}
                  step={5}
                  value={[config.micGain]}
                  onValueChange={([value]: number[]) => setConfig({ ...config, micGain: value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Adjust microphone sensitivity (higher = more sensitive)
                </p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="h-5 w-5 text-blue-600" />
                <Label htmlFor="speakerVolume">Speaker Volume: {config.speakerVolume}%</Label>
              </div>
              <Slider
                id="speakerVolume"
                min={0}
                max={100}
                step={5}
                value={[config.speakerVolume]}
                onValueChange={([value]: number[]) => setConfig({ ...config, speakerVolume: value })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Volume for audio feedback and confirmations
              </p>
            </div>
          </div>
          )}

          {/* LED Settings Tab */}
          {activeTab === 'led' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <div>
                  <Label htmlFor="ledEnabled">LED Feedback</Label>
                  <p className="text-sm text-gray-500">Visual status indicators</p>
                </div>
              </div>
              <Switch
                id="ledEnabled"
                checked={config.ledEnabled}
                onCheckedChange={(checked: boolean) => setConfig({ ...config, ledEnabled: checked })}
              />
            </div>

            {config.ledEnabled && (
              <div className="space-y-2">
                <Label htmlFor="ledBrightness">LED Brightness: {config.ledBrightness}%</Label>
                <Slider
                  id="ledBrightness"
                  min={0}
                  max={100}
                  step={5}
                  value={[config.ledBrightness]}
                  onValueChange={([value]: number[]) => setConfig({ ...config, ledBrightness: value })}
                  className="w-full"
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label htmlFor="ledRingEnabled">LED Ring</Label>
                  <p className="text-sm text-gray-500">Circular LED indicator</p>
                </div>
                <Switch
                  id="ledRingEnabled"
                  checked={config.ledRingEnabled}
                  onCheckedChange={(checked: boolean) => setConfig({ ...config, ledRingEnabled: checked })}
                />
              </div>

              {config.ledRingEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="ledRingBrightness">
                    LED Ring Brightness: {config.ledRingBrightness}%
                  </Label>
                  <Slider
                    id="ledRingBrightness"
                    min={0}
                    max={100}
                    step={5}
                    value={[config.ledRingBrightness]}
                    onValueChange={([value]: number[]) =>
                      setConfig({ ...config, ledRingBrightness: value })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
          <div className="space-y-4">
            {device && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-500">Device ID</Label>
                    <p className="font-mono text-sm">{device.deviceId}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">MAC Address</Label>
                    <p className="font-mono text-sm">{device.macAddress || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">IP Address</Label>
                    <p className="font-mono text-sm">{device.ipAddress || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">Firmware Version</Label>
                    <p className="font-mono text-sm">{device.firmwareVersion}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">Hardware Version</Label>
                    <p className="font-mono text-sm">{device.hardwareVersion}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500">Created</Label>
                    <p className="text-sm">{new Date(device.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Firmware Update (OTA)
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}

        </div>

        <DialogFooter className="pt-3 mt-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
