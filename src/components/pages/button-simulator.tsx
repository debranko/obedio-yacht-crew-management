/**
 * Smart Button Simulator - Development Testing Tool
 * For testing ESP32 firmware integration with the application
 * Simulates physical button presses and generates real service requests
 */

import { useState, useRef } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import { useLocations } from "../../hooks/useLocations";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Mic, 
  Phone, 
  Coffee, 
  Lightbulb, 
  Fan,
  Bell,
  BellOff,
  Wind,
  Settings as SettingsIcon,
  CheckCircle2,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { Label } from "../ui/label";

// Button function types that can be mapped
type ButtonFunction = 
  | "call_service" 
  | "request_drink" 
  | "lights_toggle" 
  | "ac_control" 
  | "call_housekeeping"
  | "need_assistance";

interface AuxButton {
  id: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  function: ButtonFunction;
  label: string;
  icon: any;
}

const BUTTON_FUNCTIONS = [
  { value: "call_service", label: "Call Service", icon: Bell },
  { value: "request_drink", label: "Request Drink", icon: Coffee },
  { value: "lights_toggle", label: "Lights Control", icon: Lightbulb },
  { value: "ac_control", label: "Climate Control", icon: Fan },
  { value: "call_housekeeping", label: "Housekeeping", icon: Phone },
  { value: "need_assistance", label: "Need Assistance", icon: Phone },
];

const defaultAuxButtons: AuxButton[] = [
  { id: "aux-1", position: "top-left", function: "call_service", label: "Service", icon: Bell },
  { id: "aux-2", position: "top-right", function: "request_drink", label: "Drinks", icon: Coffee },
  { id: "aux-3", position: "bottom-left", function: "lights_toggle", label: "Lights", icon: Lightbulb },
  { id: "aux-4", position: "bottom-right", function: "ac_control", label: "Climate", icon: Fan },
];

export function ButtonSimulatorPage() {
  const { crew, guests, addServiceRequest, updateGuest, addActivityLog, getGuestByLocationId } = useAppData();
  const { locations, updateLocation } = useLocations();
  
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [auxButtons, setAuxButtons] = useState<AuxButton[]>(defaultAuxButtons);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingButton, setEditingButton] = useState<AuxButton | null>(null);
  
  const [isMainPressed, setIsMainPressed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get all locations (include DND locations for selection)
  const allLocations = locations;
  
  // Get on-duty crew
  const onDutyCrew = crew.filter(member => member.status === "on-duty");
  
  // Get current location details
  const currentLocation = locations.find(loc => loc.id === selectedLocation);

  // Generate service request based on button press
  const generateServiceRequest = (
    requestType: string, 
    requestLabel: string,
    isVoice: boolean = false,
    voiceDuration?: number
  ) => {
    if (!selectedLocation) {
      toast.error("Please select a location first");
      return;
    }

    if (currentLocation?.doNotDisturb) {
      toast.error("🔕 Do Not Disturb Active", {
        description: `${currentLocation.name} is not accepting service requests`
      });
      return;
    }

    const location = currentLocation!;
    
    // Find guest at this location using proper foreign key relationship
    const guestAtLocation = getGuestByLocationId(location.id) || guests[0];

    // Determine which crew member should handle this
    const assignedCrew = onDutyCrew[0]; // For now, assign to first on-duty crew

    const guestName = guestAtLocation 
      ? `${guestAtLocation.firstName} ${guestAtLocation.lastName}` 
      : 'Guest';

    // Mock audio URLs
    const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

    // Create actual service request and add to context
    const newRequest = addServiceRequest({
      guestName: guestName,
      guestCabin: location.name,
      cabinId: location.id,
      requestType: 'call' as const,
      priority: 'normal' as const,
      status: 'pending' as const,
      voiceTranscript: isVoice 
        ? `Voice message (${voiceDuration?.toFixed(1)}s): ${requestLabel}`
        : undefined,
      voiceAudioUrl: isVoice ? mockAudioUrl : undefined,
      cabinImage: location.image || 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      notes: requestLabel,
    });

    // Show toast notification (no longer shows full request details to avoid duplication with dialog)
    toast.success("Service Request Created", {
      description: `${requestLabel} from ${location.name}`,
      duration: 3000
    });

    // Log to console for ESP32 firmware development
    console.log("🔘 BUTTON PRESS SIMULATED:", {
      timestamp: new Date().toISOString(),
      buttonType: isVoice ? "MAIN_HOLD" : requestType === "main" ? "MAIN_TAP" : "AUX_" + requestType.toUpperCase(),
      location: {
        id: location.id,
        name: location.name,
        floor: location.floor,
        smartButtonId: location.smartButtonId
      },
      request: {
        id: newRequest.id,
        type: requestType,
        label: requestLabel,
        isVoice,
        voiceDuration: isVoice ? voiceDuration : null
      },
      guest: guestAtLocation ? {
        id: guestAtLocation.id,
        name: guestName
      } : null,
      assignedTo: assignedCrew ? {
        id: assignedCrew.id,
        name: assignedCrew.name,
        role: assignedCrew.role
      } : null
    });
  };

  // Main button - Press & Hold for voice
  const handleMainButtonDown = () => {
    setIsMainPressed(true);
    
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingDuration(0);
      toast.info("🎤 Recording voice message...", {
        description: "Release to send",
        duration: 30000
      });
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    }, 500);
  };

  const handleMainButtonUp = () => {
    setIsMainPressed(false);
    
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    if (isRecording) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      setIsRecording(false);
      
      if (recordingDuration > 0.5) {
        generateServiceRequest(
          "main", 
          "Voice Message", 
          true, 
          recordingDuration
        );
      } else {
        toast.error("Recording too short");
      }
      
      setRecordingDuration(0);
    } else {
      // Quick tap
      generateServiceRequest("main", "Service Call");
    }
  };

  // Auxiliary button press
  const handleAuxButtonClick = (button: AuxButton) => {
    // Environmental controls (Crestron integration) - Direct actions, no service request
    if (button.function === 'lights_toggle') {
      toast.success('💡 Lights toggled', {
        description: 'Crestron command sent'
      });
      return;
    }
    
    if (button.function === 'ac_control') {
      toast.success('❄️ Climate control adjusted', {
        description: 'Crestron command sent'
      });
      return;
    }
    
    // Service requests - Create actual service request for crew
    const labels: Record<ButtonFunction, string> = {
      call_service: "Service Call",
      request_drink: "Drink Request",
      lights_toggle: "Lights Control", // Won't reach here
      ac_control: "Climate Control", // Won't reach here
      call_housekeeping: "Housekeeping Request",
      need_assistance: "Need Assistance"
    };
    
    generateServiceRequest(button.function, labels[button.function]);
  };

  // Configure button function
  const handleConfigureButton = (button: AuxButton) => {
    setEditingButton(button);
    setIsConfigOpen(true);
  };

  const handleSaveButtonConfig = (newFunction: ButtonFunction) => {
    if (!editingButton) return;
    
    const functionInfo = BUTTON_FUNCTIONS.find(f => f.value === newFunction)!;
    
    setAuxButtons(prev => prev.map(btn => 
      btn.id === editingButton.id 
        ? { ...btn, function: newFunction, label: functionInfo.label, icon: functionInfo.icon }
        : btn
    ));
    
    setIsConfigOpen(false);
    setEditingButton(null);
    toast.success("Button function updated");
  };

  // Toggle DND for current location
  const handleToggleDND = async () => {
    if (!currentLocation) {
      toast.error("Please select a location first");
      return;
    }

    const newDNDStatus = !currentLocation.doNotDisturb;

    // Find guest assigned to this location using proper foreign key relationship
    const guest = getGuestByLocationId(currentLocation.id);

    try {
      // Update location DND status
      await updateLocation({
        id: currentLocation.id,
        doNotDisturb: newDNDStatus
      });

      // Update guest DND status if guest is in this location
      if (guest) {
        updateGuest(guest.id, { doNotDisturb: newDNDStatus });
      }

      // Log activity
      if (addActivityLog) {
        addActivityLog({
          type: 'dnd',
          action: newDNDStatus ? 'DND Activated' : 'DND Deactivated',
          location: currentLocation.name,
          user: 'Guest (Button Press)',
          details: `Do Not Disturb ${newDNDStatus ? 'enabled' : 'disabled'} from smart button${guest ? ` (${guest.firstName} ${guest.lastName})` : ''}`
        });
      }

      toast.success(
        newDNDStatus ? "🔕 Do Not Disturb Enabled" : "🔔 Do Not Disturb Disabled",
        {
          description: newDNDStatus 
            ? `${currentLocation.name} will not receive service requests`
            : `${currentLocation.name} can now receive service requests`
        }
      );
    } catch (error) {
      toast.error("Failed to update Do Not Disturb status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Location Selector */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <Label htmlFor="location-select" className="mb-2 block">
            Select Location (Simulating button in...)
          </Label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger id="location-select">
              <SelectValue placeholder="Choose a location..." />
            </SelectTrigger>
            <SelectContent>
              {allLocations.length === 0 ? (
                <SelectItem value="none" disabled>
                  No locations available
                </SelectItem>
              ) : (
                allLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{location.name}</span>
                      {location.floor && (
                        <span className="text-xs text-muted-foreground">({location.floor})</span>
                      )}
                      {location.doNotDisturb && (
                        <span className="text-xs text-destructive flex items-center gap-0.5">
                          <BellOff className="h-3 w-3" />
                          DND
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {currentLocation && (
            <div className="space-y-1 mt-1">
              <p className="text-xs text-muted-foreground">
                {currentLocation.smartButtonId ? (
                  <>Button ID: {currentLocation.smartButtonId}</>
                ) : (
                  <>No smart button assigned</>
                )}
              </p>
              {currentLocation.doNotDisturb && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <BellOff className="h-3 w-3" />
                  <span>Do Not Disturb is active - Service requests blocked</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* DND Toggle Button */}
          {currentLocation && (
            <Button
              variant={currentLocation.doNotDisturb ? "destructive" : "outline"}
              size="sm"
              onClick={handleToggleDND}
              className="gap-2"
            >
              <BellOff className="h-4 w-4" />
              {currentLocation.doNotDisturb ? "DND Active" : "Enable DND"}
            </Button>
          )}
          
          <Badge variant="outline" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Simulator Active
          </Badge>
        </div>
      </div>

      {/* Status Info */}
      {selectedLocation && (
        <Card className="bg-muted/50">
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">On Duty Crew</p>
                <p className="font-medium">{onDutyCrew.length} member{onDutyCrew.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Locations</p>
                <p className="font-medium">{allLocations.length} locations</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Guest</p>
                <p className="font-medium">
                  {guests.find(g => 
                    g.preferences?.cabin?.toLowerCase().includes(currentLocation?.name.toLowerCase() || '')
                  )?.name || "Not assigned"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Simulator */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Button Visual */}
        <Card className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-accent/20">
          <div className="aspect-square flex items-center justify-center p-12 relative">
            {!selectedLocation && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Select a location to start testing</p>
                </div>
              </div>
            )}

            {/* Decorative background */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, transparent 0%, rgba(200, 169, 107, 0.1) 100%)`
            }} />
            
            {/* Button Container */}
            <div className="relative w-full max-w-md aspect-square">
              {/* Stitching */}
              <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-accent/30" 
                   style={{ margin: '8px' }} />
              
              {/* Auxiliary Buttons */}
              {auxButtons.map((button) => {
                const ButtonIcon = button.icon;
                const positions = {
                  "top-left": "top-[15%] left-[15%]",
                  "top-right": "top-[15%] right-[15%]",
                  "bottom-left": "bottom-[15%] left-[15%]",
                  "bottom-right": "bottom-[15%] right-[15%]"
                };
                
                return (
                  <div key={button.id} className={`absolute ${positions[button.position]}`}>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleAuxButtonClick(button)}
                      disabled={!selectedLocation}
                      className={`w-14 h-14 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900
                                border-2 border-accent flex items-center justify-center
                                shadow-lg hover:shadow-xl transition-all relative
                                ${!selectedLocation ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                group`}
                    >
                      <div className="absolute inset-0 rounded-full bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ButtonIcon className="h-5 w-5 text-accent relative z-10" />
                    </motion.button>
                    {/* Config button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfigureButton(button);
                      }}
                      className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-muted border border-border
                               flex items-center justify-center hover:bg-accent hover:text-accent-foreground
                               transition-colors z-20"
                    >
                      <SettingsIcon className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}

              {/* Alignment dots */}
              <div className="absolute top-[50%] left-[35%] w-1.5 h-1.5 rounded-full bg-accent/60" />
              <div className="absolute top-[50%] right-[35%] w-1.5 h-1.5 rounded-full bg-accent/60" />

              {/* Main Button */}
              <motion.div
                animate={{
                  scale: isMainPressed ? 0.95 : 1,
                  boxShadow: isMainPressed 
                    ? "0 0 40px rgba(200, 169, 107, 0.6)" 
                    : "0 0 20px rgba(200, 169, 107, 0.3)"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                         w-36 h-36 rounded-full cursor-pointer"
                onMouseDown={selectedLocation ? handleMainButtonDown : undefined}
                onMouseUp={selectedLocation ? handleMainButtonUp : undefined}
                onMouseLeave={selectedLocation ? handleMainButtonUp : undefined}
                onTouchStart={selectedLocation ? handleMainButtonDown : undefined}
                onTouchEnd={selectedLocation ? handleMainButtonUp : undefined}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent via-accent to-accent/80
                              border-2 border-accent/50" />
                
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-neutral-900 to-black
                              flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {isRecording ? (
                      <motion.div
                        key="recording"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <Mic className="h-10 w-10 text-destructive" />
                        </motion.div>
                        <span className="text-xs text-destructive font-medium">
                          {recordingDuration.toFixed(1)}s
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Phone className="h-10 w-10 text-accent" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-destructive"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </motion.div>
            </div>
          </div>

          <div className="border-t border-accent/20 bg-black/20 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">OBEDIO Smart Button - ESP32 Simulator</span>
              {currentLocation?.smartButtonId && (
                <Badge variant="outline" className="border-accent/30 text-accent">
                  {currentLocation.smartButtonId}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <h3>Testing Instructions</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Main Button - Quick Tap</p>
                    <p className="text-muted-foreground">
                      Generates service call to selected location
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Mic className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Main Button - Hold 500ms+</p>
                    <p className="text-muted-foreground">
                      Records voice message (ready for Google Speech API)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Bell className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Auxiliary Buttons (4x)</p>
                    <p className="text-muted-foreground">
                      Configurable quick actions - click ⚙️ to change function
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-4">
              <h3>Current Button Mapping</h3>
              <div className="space-y-2">
                {auxButtons.map((button) => {
                  const ButtonIcon = button.icon;
                  return (
                    <div 
                      key={button.id} 
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <ButtonIcon className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{button.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {button.position.replace("-", " ")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfigureButton(button)}
                      >
                        <SettingsIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card className="bg-muted/30">
            <div className="p-6 space-y-3">
              <h3 className="text-sm">Console Output</h3>
              <p className="text-xs text-muted-foreground">
                All button presses are logged to browser console with full payload data for ESP32 firmware development.
                Open DevTools to see JSON output.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Configure Button Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Button Function</DialogTitle>
            <DialogDescription>
              Change the function assigned to this auxiliary button
            </DialogDescription>
          </DialogHeader>

          {editingButton && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Button Position</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {editingButton.position.replace("-", " ")}
                </p>
              </div>

              <div>
                <Label htmlFor="function-select">Function</Label>
                <Select 
                  defaultValue={editingButton.function}
                  onValueChange={(value) => handleSaveButtonConfig(value as ButtonFunction)}
                >
                  <SelectTrigger id="function-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_FUNCTIONS.map((func) => {
                      const FuncIcon = func.icon;
                      return (
                        <SelectItem key={func.value} value={func.value}>
                          <div className="flex items-center gap-2">
                            <FuncIcon className="h-4 w-4" />
                            <span>{func.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
