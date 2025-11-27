/**
 * Service Requests Settings Dialog
 * Settings for Chief Stewardess to configure Service Requests behavior
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  User,
  MapPin,
  Clock,
  Bell,
  Zap,
  LayoutGrid,
  Archive,
  AlertTriangle,
  Volume2,
  Eye,
  Timer
} from 'lucide-react';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { toast } from 'sonner';

interface ServiceRequestsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceRequestsSettingsDialog({
  open,
  onOpenChange
}: ServiceRequestsSettingsDialogProps) {
  // Get user preferences from backend API
  const { preferences, updateServiceRequests, isUpdatingServiceRequests } = useUserPreferences();

  // Local state for settings with proper defaults from backend
  const [displayMode, setDisplayMode] = useState<'guest-name' | 'location'>('location');
  const [servingNowTimeout, setServingNowTimeout] = useState(5);
  const [viewStyle, setViewStyle] = useState<'expanded' | 'compact'>('expanded');
  const [sortOrder, setSortOrder] = useState<'newest' | 'priority' | 'location'>('newest');
  const [showGuestPhotos, setShowGuestPhotos] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [visualFlash, setVisualFlash] = useState(false);
  const [responseTimeWarning, setResponseTimeWarning] = useState<number>(5);
  const [autoArchiveTime, setAutoArchiveTime] = useState<number>(30);
  const [autoPriorityVIP, setAutoPriorityVIP] = useState(true);
  const [autoPriorityMasterSuite, setAutoPriorityMasterSuite] = useState(false);

  // Load preferences from backend when dialog opens or preferences change
  useEffect(() => {
    if (open && preferences) {
      setDisplayMode((preferences.serviceRequestDisplayMode as 'guest-name' | 'location') || 'location');
      setServingNowTimeout(preferences.serviceRequestServingTimeout || 5);
      setViewStyle((preferences.serviceRequestViewStyle as 'expanded' | 'compact') || 'expanded');
      setSortOrder((preferences.serviceRequestSortOrder as 'newest' | 'priority' | 'location') || 'newest');
      setShowGuestPhotos(preferences.serviceRequestShowGuestPhotos ?? true);
      setSoundAlerts(preferences.serviceRequestSoundAlerts ?? true);
      setVisualFlash(preferences.serviceRequestVisualFlash ?? false);
      setResponseTimeWarning(preferences.serviceRequestResponseWarning || 5);
      setAutoArchiveTime(preferences.serviceRequestAutoArchive || 30);
      setAutoPriorityVIP(preferences.serviceRequestAutoPriorityVIP ?? true);
      setAutoPriorityMasterSuite(preferences.serviceRequestAutoPriorityMaster ?? false);
    }
  }, [open, preferences]);

  const handleSave = () => {
    // Save all Service Requests preferences to backend API
    updateServiceRequests({
      serviceRequestDisplayMode: displayMode,
      serviceRequestServingTimeout: servingNowTimeout || 5,
      serviceRequestViewStyle: viewStyle,
      serviceRequestSortOrder: sortOrder,
      serviceRequestShowGuestPhotos: showGuestPhotos,
      serviceRequestSoundAlerts: soundAlerts,
      serviceRequestVisualFlash: visualFlash,
      serviceRequestResponseWarning: responseTimeWarning,
      serviceRequestAutoArchive: autoArchiveTime,
      serviceRequestAutoPriorityVIP: autoPriorityVIP,
      serviceRequestAutoPriorityMaster: autoPriorityMasterSuite,
    });

    // Close dialog after save
    onOpenChange(false);
  };

  const handleReset = () => {
    setDisplayMode('guest-name');
    setServingNowTimeout(5);
    setViewStyle('expanded');
    setSortOrder('newest');
    setShowGuestPhotos(true);
    setSoundAlerts(true);
    setVisualFlash(false);
    setResponseTimeWarning(5);
    setAutoArchiveTime(30);
    setAutoPriorityVIP(true);
    setAutoPriorityMasterSuite(false);
    toast.success('Settings reset to defaults');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Service Requests Settings</DialogTitle>
          <DialogDescription>
            Configure how service requests are displayed and handled
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
          </TabsList>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6 py-4">
            {/* Display Mode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Request Card Title</Label>
                <Badge variant="secondary" className="text-xs">Primary Display</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDisplayMode('guest-name')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    displayMode === 'guest-name'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <User className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm">Guest Name</p>
                  <p className="text-xs text-muted-foreground mt-1">Show guest identity</p>
                </button>
                <button
                  onClick={() => setDisplayMode('location')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    displayMode === 'location'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <MapPin className="h-5 w-5 mx-auto mb-2 text-primary" />
                  <p className="text-sm">Location</p>
                  <p className="text-xs text-muted-foreground mt-1">Show cabin/area</p>
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose whether to show guest names or location names as the primary identifier on request cards
              </p>
            </div>

            {/* View Style */}
            <div className="space-y-3">
              <Label>Card View Style</Label>
              <Select value={viewStyle} onValueChange={(value: any) => setViewStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expanded">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      <span>Expanded - Full details</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="compact">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      <span>Compact - Minimal</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-3">
              <Label>Default Sort Order</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="priority">Priority First</SelectItem>
                  <SelectItem value="location">By Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Guest Photos */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="show-photos">Show Guest Photos</Label>
                  <p className="text-xs text-muted-foreground">Display guest avatars on cards</p>
                </div>
              </div>
              <Switch
                id="show-photos"
                checked={showGuestPhotos}
                onCheckedChange={setShowGuestPhotos}
              />
            </div>

            {/* Serving Now Timeout */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <Label>"Serving Now" Display Duration</Label>
              </div>
              <Select
                value={servingNowTimeout?.toString() || '5'}
                onValueChange={(value: string) => setServingNowTimeout(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds (Default)</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How long completed requests stay visible before disappearing
              </p>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6 py-4">
            {/* Sound Alerts */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="sound-alerts">Sound Alerts</Label>
                  <p className="text-xs text-muted-foreground">Play sound on new requests</p>
                </div>
              </div>
              <Switch
                id="sound-alerts"
                checked={soundAlerts}
                onCheckedChange={setSoundAlerts}
              />
            </div>

            {/* Visual Flash */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-warning" />
                <div>
                  <Label htmlFor="visual-flash">Visual Flash Alert</Label>
                  <p className="text-xs text-muted-foreground">Screen flash for urgent/emergency</p>
                </div>
              </div>
              <Switch
                id="visual-flash"
                checked={visualFlash}
                onCheckedChange={setVisualFlash}
              />
            </div>

            {/* Response Time Warning */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <Label>Response Time Warning</Label>
              </div>
              <Select
                value={responseTimeWarning.toString()}
                onValueChange={(value: string) => setResponseTimeWarning(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="5">5 minutes (Default)</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="0">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Alert if a request hasn't been accepted within this time
              </p>
            </div>
          </TabsContent>

          {/* Automation Settings */}
          <TabsContent value="automation" className="space-y-6 py-4">
            {/* Auto-Priority VIP */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="auto-priority-vip">Auto-Priority for VIP Guests</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically mark VIP guest requests as urgent
                  </p>
                </div>
              </div>
              <Switch
                id="auto-priority-vip"
                checked={autoPriorityVIP}
                onCheckedChange={setAutoPriorityVIP}
              />
            </div>

            {/* Auto-Priority Owner's Stateroom */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="auto-priority-master">Auto-Priority for Owner's Stateroom</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically mark Owner's Stateroom requests as urgent
                  </p>
                </div>
              </div>
              <Switch
                id="auto-priority-master"
                checked={autoPriorityMasterSuite}
                onCheckedChange={setAutoPriorityMasterSuite}
              />
            </div>

            {/* Auto-Archive Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-muted-foreground" />
                <Label>Auto-Archive Completed Requests</Label>
              </div>
              <Select
                value={autoArchiveTime.toString()}
                onValueChange={(value: string) => setAutoArchiveTime(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">After 15 minutes</SelectItem>
                  <SelectItem value="30">After 30 minutes (Default)</SelectItem>
                  <SelectItem value="60">After 1 hour</SelectItem>
                  <SelectItem value="120">After 2 hours</SelectItem>
                  <SelectItem value="0">Never (Manual only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Automatically move completed requests to history
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1">
                    <strong>Chief Stewardess Permissions:</strong>
                  </p>
                  <p>
                    These settings apply system-wide and affect how all crew members see and interact with service requests. 
                    Changes are saved immediately and synced across devices.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdatingServiceRequests}>
              {isUpdatingServiceRequests ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
