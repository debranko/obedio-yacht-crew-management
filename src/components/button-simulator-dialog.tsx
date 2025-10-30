/**
 * Button Simulator Dialog - Quick access dev tool
 * Compact version for header access
 */

import { useState, useRef } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { Button } from "./ui/button";
import { 
  Mic, 
  Phone, 
  Coffee, 
  Lightbulb, 
  Fan,
  Bell,
  CheckCircle2,
  MapPin,
  Settings as SettingsIcon
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

type ButtonFunction = 
  | "call_service" 
  | "request_drink" 
  | "lights_toggle" 
  | "ac_control";

interface AuxButton {
  id: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  function: ButtonFunction;
  label: string;
  icon: any;
}

const defaultAuxButtons: AuxButton[] = [
  { id: "aux-1", position: "top-left", function: "call_service", label: "Service", icon: Bell },
  { id: "aux-2", position: "top-right", function: "request_drink", label: "Drinks", icon: Coffee },
  { id: "aux-3", position: "bottom-left", function: "lights_toggle", label: "Lights", icon: Lightbulb },
  { id: "aux-4", position: "bottom-right", function: "ac_control", label: "Climate", icon: Fan },
];

interface ButtonSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ButtonSimulatorDialog({ open, onOpenChange }: ButtonSimulatorDialogProps) {
  const { locations = [], crew = [], guests = [] } = useAppData();
  
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [auxButtons] = useState<AuxButton[]>(defaultAuxButtons);
  
  const [isMainPressed, setIsMainPressed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeLocations = locations.filter(loc => !loc.doNotDisturb);
  const onDutyCrew = crew.filter(member => member.status === "on-duty");
  const currentLocation = locations.find(loc => loc.id === selectedLocation);

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
    const guestAtLocation = guests.find(g => 
      g.preferences?.cabin?.toLowerCase().includes(location.name.toLowerCase())
    ) || guests[0];
    const assignedCrew = onDutyCrew[0];

    toast.success(
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-semibold">Service Request Created</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span><strong>Location:</strong> {location.name}</span>
          </div>
          {location.floor && (
            <div className="text-muted-foreground pl-5.5">{location.floor}</div>
          )}
          <div className="pl-5.5"><strong>Request:</strong> {requestLabel}</div>
          {isVoice && voiceDuration && (
            <div className="pl-5.5 text-accent">🎤 Voice: {voiceDuration.toFixed(1)}s</div>
          )}
          {guestAtLocation && (
            <div className="pl-5.5 text-muted-foreground">Guest: {guestAtLocation.name}</div>
          )}
          {assignedCrew && (
            <div className="pl-5.5 text-muted-foreground">Assigned: {assignedCrew.name}</div>
          )}
        </div>
      </div>,
      { duration: 6000 }
    );

    console.log("🔘 BUTTON PRESS:", {
      timestamp: new Date().toISOString(),
      buttonType: isVoice ? "MAIN_HOLD" : requestType === "main" ? "MAIN_TAP" : "AUX_" + requestType.toUpperCase(),
      location: { id: location.id, name: location.name, floor: location.floor, smartButtonId: location.smartButtonId },
      request: { type: requestType, label: requestLabel, isVoice, voiceDuration: isVoice ? voiceDuration : null },
      guest: guestAtLocation ? { id: guestAtLocation.id, name: guestAtLocation.name } : null,
      assignedTo: assignedCrew ? { id: assignedCrew.id, name: assignedCrew.name, role: assignedCrew.role } : null
    });
  };

  const handleMainButtonDown = () => {
    setIsMainPressed(true);
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingDuration(0);
      toast.info("🎤 Recording voice...", { description: "Release to send", duration: 30000 });
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
        generateServiceRequest("main", "Voice Message", true, recordingDuration);
      } else {
        toast.error("Recording too short");
      }
      setRecordingDuration(0);
    } else {
      generateServiceRequest("main", "Service Call");
    }
  };

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
      ac_control: "Climate Control" // Won't reach here
    };
    generateServiceRequest(button.function, labels[button.function]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            ESP32 Button Simulator
            <Badge variant="secondary" className="ml-2">DEV TOOL</Badge>
          </DialogTitle>
          <DialogDescription>
            Test button presses for firmware development - Check console for JSON output
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Location Selector */}
          <div>
            <Label htmlFor="sim-location" className="mb-2 block">
              Select Location (Simulating button in...)
            </Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="sim-location">
                <SelectValue placeholder="Choose a location..." />
              </SelectTrigger>
              <SelectContent>
                {activeLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{location.name}</span>
                      {location.floor && (
                        <span className="text-xs text-muted-foreground">({location.floor})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentLocation && (
              <p className="text-xs text-muted-foreground mt-1">
                {currentLocation.smartButtonId ? `Button ID: ${currentLocation.smartButtonId}` : "No button assigned"}
              </p>
            )}
          </div>

          {/* Quick Stats */}
          {selectedLocation && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 text-xs">
              <div>
                <p className="text-muted-foreground">On Duty</p>
                <p className="font-medium">{onDutyCrew.length} crew</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active</p>
                <p className="font-medium">{activeLocations.length} locations</p>
              </div>
              <div>
                <p className="text-muted-foreground">Guest</p>
                <p className="font-medium truncate">
                  {guests.find(g => g.preferences?.cabin?.toLowerCase().includes(currentLocation?.name.toLowerCase() || ''))?.name || "None"}
                </p>
              </div>
            </div>
          )}

          {/* Button Simulator */}
          <div className="grid md:grid-cols-[1fr,300px] gap-6">
            {/* Visual Button */}
            <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border border-accent/20 rounded-xl overflow-hidden">
              <div className="aspect-square flex items-center justify-center p-8 relative">
                {!selectedLocation && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Select a location first</p>
                  </div>
                )}

                <div className="relative w-full max-w-sm aspect-square">
                  <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-accent/30" style={{ margin: '8px' }} />
                  
                  {/* Aux Buttons */}
                  {auxButtons.map((button) => {
                    const ButtonIcon = button.icon;
                    const positions = {
                      "top-left": "top-[15%] left-[15%]",
                      "top-right": "top-[15%] right-[15%]",
                      "bottom-left": "bottom-[15%] left-[15%]",
                      "bottom-right": "bottom-[15%] right-[15%]"
                    };
                    
                    return (
                      <motion.button
                        key={button.id}
                        whileTap={{ scale: 0.85 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleAuxButtonClick(button)}
                        disabled={!selectedLocation}
                        className={`absolute ${positions[button.position]} 
                                  w-12 h-12 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900
                                  border-2 border-accent flex items-center justify-center
                                  shadow-lg transition-all group
                                  ${!selectedLocation ? 'opacity-30' : ''}`}
                      >
                        <ButtonIcon className="h-4 w-4 text-accent" />
                      </motion.button>
                    );
                  })}

                  {/* Main Button */}
                  <motion.div
                    animate={{
                      scale: isMainPressed ? 0.95 : 1,
                      boxShadow: isMainPressed ? "0 0 30px rgba(200, 169, 107, 0.6)" : "0 0 15px rgba(200, 169, 107, 0.3)"
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full cursor-pointer"
                    onMouseDown={selectedLocation ? handleMainButtonDown : undefined}
                    onMouseUp={selectedLocation ? handleMainButtonUp : undefined}
                    onMouseLeave={selectedLocation ? handleMainButtonUp : undefined}
                    onTouchStart={selectedLocation ? handleMainButtonDown : undefined}
                    onTouchEnd={selectedLocation ? handleMainButtonUp : undefined}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent via-accent to-accent/80 border-2 border-accent/50" />
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isRecording ? (
                          <motion.div key="rec" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center gap-1">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                              <Mic className="h-8 w-8 text-destructive" />
                            </motion.div>
                            <span className="text-xs text-destructive font-medium">{recordingDuration.toFixed(1)}s</span>
                          </motion.div>
                        ) : (
                          <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Phone className="h-8 w-8 text-accent" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {isRecording && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-destructive"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-xs">Quick Tap</p>
                    <p className="text-xs text-muted-foreground">Service call</p>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                  <Mic className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-xs">Hold 500ms+</p>
                    <p className="text-xs text-muted-foreground">Voice recording</p>
                  </div>
                </div>
                <div className="flex gap-2 p-2 rounded-lg bg-muted/50">
                  <Bell className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-xs">Corner Buttons</p>
                    <p className="text-xs text-muted-foreground">Quick actions</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Button Mapping</h4>
                {auxButtons.map((button) => {
                  const ButtonIcon = button.icon;
                  return (
                    <div key={button.id} className="flex items-center justify-between p-2 rounded border border-border text-xs">
                      <div className="flex items-center gap-2">
                        <ButtonIcon className="h-3.5 w-3.5 text-accent" />
                        <span>{button.label}</span>
                      </div>
                      <span className="text-muted-foreground capitalize text-[10px]">
                        {button.position.replace("-", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-2 rounded bg-muted/30 text-[10px] text-muted-foreground">
                💡 All presses logged to console with JSON payload for ESP32 firmware
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
