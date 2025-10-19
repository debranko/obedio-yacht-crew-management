/**
 * Button Simulator Widget - Persistent sidebar tool
 * Always visible for quick ESP32 firmware testing
 */

import { useState, useRef } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useLocations } from "../hooks/useLocations";
import { DNDService } from "../services/dnd";
import { 
  Mic, 
  Phone, 
  Coffee, 
  Lightbulb, 
  UtensilsCrossed,
  Bell,
  BellOff,
  CheckCircle2,
  MapPin,
  Wine,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Label } from "./ui/label";
import { Button } from "./ui/button";

type ButtonFunction = 
  | "dnd" 
  | "lights" 
  | "prepare_food" 
  | "bring_drinks";

interface AuxButton {
  id: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  function: ButtonFunction;
  icon: any;
}

const auxButtons: AuxButton[] = [
  { id: "aux-1", position: "top-left", function: "dnd", icon: BellOff },
  { id: "aux-2", position: "top-right", function: "lights", icon: Lightbulb },
  { id: "aux-3", position: "bottom-left", function: "prepare_food", icon: UtensilsCrossed },
  { id: "aux-4", position: "bottom-right", function: "bring_drinks", icon: Wine },
];

export function ButtonSimulatorWidget() {
  // Use same source of truth as Dashboard and DNDWidget
  const { locations: locationsFromService = [], updateLocation } = useLocations();
  
  const {
    crew = [],
    guests = [],
    addServiceRequest,
    updateGuest,
    addActivityLog,
    getGuestByLocationId
  } = useAppData();
  
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isMainPressed, setIsMainPressed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGenRef = useRef<{ key: string; t: number } | null>(null);

  // Use locations from service (React Query + locationsService)
  const allLocations = locationsFromService;
  const onDutyCrew = crew.filter(member => member.status === "on-duty");
  const currentLocation = allLocations.find(loc => loc.id === selectedLocation);

  const generateServiceRequest = (
    requestType: string, 
    requestLabel: string,
    isVoice: boolean = false,
    voiceDuration?: number,
    requestPriority: 'normal' | 'urgent' | 'emergency' = 'normal'
  ) => {
    // ---- Guard against accidental double-fire within 500ms ----
    const key = `${selectedLocation}:${requestType}:${isVoice ? 'voice' : 'tap'}`;
    const now = Date.now();
    if (lastGenRef.current && lastGenRef.current.key === key && (now - lastGenRef.current.t) < 500) {
      return; // Drop duplicate
    }
    lastGenRef.current = { key, t: now };
    // ------------------------------------------------------------

    if (!selectedLocation) {
      toast.error("Select a location first");
      return;
    }

    const hadDND = currentLocation?.doNotDisturb || false;

    const location = currentLocation!;
    
    // If DND was active, remove it when guest presses button (async call to locationsService)
    if (hadDND) {
      updateLocation({
        id: location.id,
        doNotDisturb: false
      });
    }
    
    // Find guest by proper foreign key relationship
    const guestAtLocation = getGuestByLocationId(location.id) || guests[0];
    
    const guestName = guestAtLocation 
      ? `${guestAtLocation.firstName} ${guestAtLocation.lastName}` 
      : 'Guest';
    
    const assignedCrew = onDutyCrew[0];

    // Create actual service request and add to context
    const mockAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    const serviceRequest = addServiceRequest({
      guestName: guestName,
      guestCabin: location.name,
      cabinId: location.id,
      requestType: 'call' as const,
      priority: requestPriority,
      voiceTranscript: isVoice 
        ? `Voice message (${voiceDuration?.toFixed(1)}s): ${requestLabel}`
        : undefined, // Only set transcript for voice messages
      voiceAudioUrl: isVoice ? mockAudioUrl : undefined,
      cabinImage: location.image || 'https://images.unsplash.com/photo-1597126729864-51740ac05236?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      status: 'pending' as const,
      notes: hadDND 
        ? `DND REMOVED - ${location.floor ? location.floor + ' - ' : ''}${requestLabel}${location.smartButtonId ? ` (Device: ${location.smartButtonId})` : ''}`
        : `${location.floor ? location.floor + ' - ' : ''}${requestLabel}${location.smartButtonId ? ` (Device: ${location.smartButtonId})` : ''}`
    });

    toast.success(
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-semibold">
            {hadDND ? '🔕 DND Removed - Request Created' : 'Service Request Created'}
          </span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{location.name}</span>
          </div>
          {hadDND && (
            <div className="pl-5.5 text-warning text-xs">Guest pressed button - DND disabled</div>
          )}
          <div className="pl-5.5"><strong>{requestLabel}</strong></div>
          {isVoice && voiceDuration && (
            <div className="pl-5.5 text-accent">🎤 {voiceDuration.toFixed(1)}s</div>
          )}
          {guestAtLocation && (
            <div className="pl-5.5 text-muted-foreground text-xs">Guest: {guestName}</div>
          )}
          {assignedCrew && (
            <div className="pl-5.5 text-muted-foreground text-xs">→ {assignedCrew.name}</div>
          )}
        </div>
      </div>,
      { duration: 5000 }
    );

    console.log("🔘 BUTTON PRESS GENERATED SERVICE REQUEST:", {
      timestamp: new Date().toISOString(),
      buttonType: isVoice ? "MAIN_HOLD" : requestType === "main" ? "MAIN_TAP" : "AUX_" + requestType.toUpperCase(),
      location: { 
        id: location.id, 
        name: location.name, 
        floor: location.floor,
        smartButtonId: location.smartButtonId 
      },
      request: { 
        id: serviceRequest.id,
        type: requestType, 
        label: requestLabel, 
        isVoice, 
        voiceDuration,
        priority: requestPriority,
        status: 'pending'
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

  const handleMainButtonDown = () => {
    if (!selectedLocation) return;
    setIsMainPressed(true);
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    }, 500);
  };

  const handleMainButtonUp = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
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
      if (recordingDuration > 0.3) {
        generateServiceRequest("main", "Voice Message", true, recordingDuration, 'normal');
      }
      setRecordingDuration(0);
    } else {
      generateServiceRequest("main", "Service Call", false, undefined, 'normal');
    }
  };

  const handleAuxButtonClick = (button: AuxButton, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Special handling for DND button
    if (button.function === 'dnd') {
      handleDNDToggle();
      return;
    }
    
    const labels: Record<ButtonFunction, string> = {
      dnd: "Do Not Disturb Toggle",
      lights: "Lights Control",
      prepare_food: "Prepare Food",
      bring_drinks: "Bring Drinks"
    };
    generateServiceRequest(button.function, labels[button.function], false, undefined, 'normal');
  };

  const handleDNDToggle = async () => {
    if (!selectedLocation) {
      toast.error("Select a location first");
      return;
    }

    const location = currentLocation!;
    const newDNDState = !location.doNotDisturb;
    const guestAtLocation = getGuestByLocationId(location.id);

    try {
      // Use atomic DND service to prevent desync
      const result = await DNDService.toggleDND(
        location.id,
        newDNDState,
        guestAtLocation?.id,
        updateGuest,
        addActivityLog
      );

      if (result.success) {
        toast.success(
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BellOff className={`h-5 w-5 ${newDNDState ? 'text-warning' : 'text-success'}`} />
              <span className="font-semibold">
                {newDNDState ? 'DND Activated (Atomic)' : 'DND Deactivated (Atomic)'}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{location.name}</span>
              </div>
              {guestAtLocation && (
                <div className="pl-5.5 text-muted-foreground text-xs">
                  Guest: {guestAtLocation.firstName} {guestAtLocation.lastName}
                </div>
              )}
              <div className="pl-5.5 text-xs text-success">
                ✅ Atomic operation - No desync possible
              </div>
            </div>
          </div>,
          { duration: 5000 }
        );

        console.log("🔕 ATOMIC DND TOGGLE:", {
          timestamp: new Date().toISOString(),
          operation: 'atomic',
          location: { id: location.id, name: location.name },
          guest: guestAtLocation ? { id: guestAtLocation.id, name: `${guestAtLocation.firstName} ${guestAtLocation.lastName}` } : null,
          newState: newDNDState,
          locationUpdated: result.locationUpdated,
          guestUpdated: result.guestUpdated
        });
      } else {
        toast.error("Failed to update DND status", {
          description: result.error || "Atomic operation failed"
        });
      }
    } catch (error) {
      toast.error("Failed to update DND status", {
        description: "Atomic operation exception"
      });
    }
  };

  const handleShakeToCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedLocation) {
      toast.error("Select a location first");
      return;
    }
    
    // Shake to Call always creates EMERGENCY priority request
    generateServiceRequest("shake", "🚨 EMERGENCY - Shake to Call", false, undefined, 'emergency');
    
    toast.error(
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="font-bold">EMERGENCY ALERT ACTIVATED</span>
        </div>
        <div className="text-sm">Guest activated shake-to-call from {currentLocation?.name}</div>
      </div>,
      { 
        duration: 8000,
        style: { background: 'var(--color-error)', color: 'white' }
      }
    );
  };

  return (
    <div className="p-3 border-t border-sidebar-border space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">ESP32 Simulator</Label>
        <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
      </div>

      {/* Location Selector */}
      <div className="space-y-1.5">
        <Label htmlFor="sim-loc" className="text-xs">Select Room</Label>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger id="sim-loc" className="h-8 text-xs">
            <SelectValue placeholder="Choose location..." />
          </SelectTrigger>
          <SelectContent>
            {allLocations.length === 0 ? (
              <SelectItem value="none" disabled>No locations</SelectItem>
            ) : (
              allLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{location.name}</span>
                    {location.doNotDisturb && (
                      <BellOff className="h-3 w-3 text-warning" />
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Button Simulator */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border border-accent/20 rounded-lg p-4">
        <div className="relative w-full aspect-square max-w-[160px] mx-auto">
          {/* Decorative stitching */}
          <div className="absolute inset-0 rounded-2xl border border-dashed border-accent/20" style={{ margin: '4px' }} />
          
          {/* Aux Buttons */}
          {auxButtons.map((button) => {
            const ButtonIcon = button.icon;
            const positions = {
              "top-left": "top-[12%] left-[12%]",
              "top-right": "top-[12%] right-[12%]",
              "bottom-left": "bottom-[12%] left-[12%]",
              "bottom-right": "bottom-[12%] right-[12%]"
            };
            
            return (
              <motion.button
                key={button.id}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => handleAuxButtonClick(button, e)}
                disabled={!selectedLocation}
                className={`absolute ${positions[button.position]} 
                          w-8 h-8 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900
                          border border-accent flex items-center justify-center
                          shadow-md transition-all
                          ${!selectedLocation ? 'opacity-30' : 'hover:scale-110'}`}
              >
                <ButtonIcon className="h-3.5 w-3.5 text-accent" />
              </motion.button>
            );
          })}

          {/* Main Button */}
          <motion.div
            animate={{
              scale: isMainPressed ? 0.92 : 1,
              boxShadow: isMainPressed ? "0 0 20px rgba(200, 169, 107, 0.6)" : "0 0 10px rgba(200, 169, 107, 0.3)"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full cursor-pointer"
            style={{ touchAction: "none" }}
            onMouseDown={selectedLocation ? handleMainButtonDown : undefined}
            onMouseUp={selectedLocation ? handleMainButtonUp : undefined}
            onMouseLeave={() => {
              // CANCEL ONLY – no request here
              if (!selectedLocation) return;
              setIsMainPressed(false);
              if (pressTimerRef.current) {
                clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
              }
              if (isRecording && recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
                setIsRecording(false);
                setRecordingDuration(0);
              }
            }}
            onTouchStart={selectedLocation ? handleMainButtonDown : undefined}
            onTouchEnd={selectedLocation ? handleMainButtonUp : undefined}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent via-accent to-accent/80 border border-accent/50" />
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div key="rec" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Mic className="h-5 w-5 text-destructive" />
                    </motion.div>
                    <span className="text-[8px] text-destructive font-medium mt-0.5">{recordingDuration.toFixed(1)}s</span>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Phone className="h-5 w-5 text-accent" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border border-destructive"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Emergency Shake to Call Button */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShakeToCall}
        disabled={!selectedLocation}
        className="w-full gap-2 border-error/50 bg-error/5 hover:bg-error/10 hover:border-error text-error"
      >
        <motion.div
          animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <Bell className="h-3.5 w-3.5" />
        </motion.div>
        <span className="text-xs font-semibold">🚨 Emergency Shake</span>
      </Button>
    </div>
  );
}
