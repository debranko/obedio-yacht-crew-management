/**
 * Smart Button Simulator - Production Demo Tool
 * Enhanced layout with location sidebar for easier demonstrations
 * Simulates ESP32 button behavior for testing backend integration
 */

import { useState, useRef } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import { useLocations } from "../../hooks/useLocations";
import { DNDService } from "../../services/dnd";
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
  Settings as SettingsIcon,
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

// Button function types
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
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const allLocations = locations;
  const onDutyCrew = crew.filter(member => member.status === "on-duty");
  const currentLocation = locations.find(loc => loc.id === selectedLocation);

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      console.log('🎙️ Started recording audio');
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Microphone access denied');
    }
  };

  // Stop recording and upload
  const stopRecording = async () => {
    return new Promise<{
      transcript: string | null;
      audioUrl: string | null;
      serviceRequestId: string | null;
    }>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve({ transcript: null, audioUrl: null, serviceRequestId: null });
        return;
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        try {
          setIsTranscribing(true);
          const result = await uploadAudioToServer(audioBlob, recordingDuration);
          setIsTranscribing(false);
          resolve(result);
        } catch (error) {
          setIsTranscribing(false);
          resolve({ transcript: null, audioUrl: null, serviceRequestId: null });
        }
      };

      mediaRecorder.stop();
    });
  };

  // Upload audio to server
  const uploadAudioToServer = async (
    audioBlob: Blob,
    duration: number
  ): Promise<{
    transcript: string | null;
    audioUrl: string | null;
    serviceRequestId: string | null;
  }> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', duration.toFixed(2));
      
      if (selectedLocation) {
        formData.append('locationId', selectedLocation);
      }

      const response = await fetch('/api/upload/upload-audio', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Audio upload failed');

      const data = await response.json();

      if (data.success) {
        const englishText = data.data.translation || data.data.transcript;
        toast.success('Voice message uploaded!');
        
        return {
          transcript: englishText,
          audioUrl: data.data.audioUrl,
          serviceRequestId: data.data.serviceRequest?.id || null
        };
      }

      return { transcript: null, audioUrl: null, serviceRequestId: null };
    } catch (error) {
      toast.error('Failed to upload audio');
      return { transcript: null, audioUrl: null, serviceRequestId: null };
    }
  };

  // Generate service request
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
      toast.error("🔕 Do Not Disturb Active");
      return;
    }

    const location = currentLocation!;
    const guestsAtLocation = guests.filter(g => g.locationId === location.id);
    let guestAtLocation = guestsAtLocation[0] || getGuestByLocationId(location.id);

    const guestName = guestAtLocation 
      ? `${guestAtLocation.firstName} ${guestAtLocation.lastName}` 
      : 'Guest';

    addServiceRequest({
      guestName,
      guestCabin: location.name,
      cabinId: location.id,
      requestType: 'call',
      priority: 'normal',
      status: 'pending',
      voiceTranscript: isVoice ? `Voice: ${requestLabel}` : undefined,
      cabinImage: location.image,
      notes: requestLabel,
    });

    toast.success("Service Request Created", { description: `${requestLabel} from ${location.name}` });
  };

  // Main button handlers
  const handleMainButtonDown = () => {
    if (!selectedLocation) return;
    setIsMainPressed(true);
    
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingDuration(0);
      startRecording();
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    }, 500);
  };

  const handleMainButtonUp = async () => {
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
        const { transcript } = await stopRecording();
        const voiceMessage = transcript || "Voice Message";
        generateServiceRequest("main", voiceMessage, true, recordingDuration);
      } else {
        toast.error("Recording too short");
      }
      
      setRecordingDuration(0);
    } else {
      generateServiceRequest("main", "Service Call");
    }
  };

  // Aux button click
  const handleAuxButtonClick = (button: AuxButton) => {
    if (button.function === 'lights_toggle') {
      toast.success('💡 Lights toggled');
      return;
    }
    
    if (button.function === 'ac_control') {
      toast.success('❄️ Climate control adjusted');
      return;
    }
    
    const labels: Record<ButtonFunction, string> = {
      call_service: "Service Call",
      request_drink: "Drink Request",
      lights_toggle: "Lights Control",
      ac_control: "Climate Control",
      call_housekeeping: "Housekeeping Request",
      need_assistance: "Need Assistance"
    };
    
    generateServiceRequest(button.function, labels[button.function]);
  };

  // Configure button
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

  // Toggle DND
  const handleToggleDND = async () => {
    if (!currentLocation) return;

    const newDNDStatus = !currentLocation.doNotDisturb;
    const guest = getGuestByLocationId(currentLocation.id);

    try {
      const result = await DNDService.toggleDND(
        currentLocation.id,
        newDNDStatus,
        guest?.id,
        updateGuest,
        addActivityLog
      );

      if (result.success) {
        toast.success(newDNDStatus ? "🔕 DND Enabled" : "🔔 DND Disabled");
      }
    } catch (error) {
      toast.error("Failed to update DND status");
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* LEFT SIDEBAR - Location List */}
      <Card className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <h3 className="font-semibold">Select Location</h3>
          <Badge variant="outline" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {allLocations.length} Locations
          </Badge>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {allLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedLocation === location.id
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{location.name}</span>
                    </div>
                    {location.floor && (
                      <p className="text-xs text-muted-foreground mt-1 pl-6">{location.floor}</p>
                    )}
                    {location.smartButtonId && (
                      <p className="text-xs text-muted-foreground mt-1 pl-6 font-mono">{location.smartButtonId}</p>
                    )}
                  </div>
                  {location.doNotDisturb && (
                    <BellOff className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* RIGHT CONTENT - Button Simulator */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* IP Configuration Header */}
        <Card className="bg-gradient-to-r from-accent/10 to-accent/5">
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">Backend Configuration</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  HTTP API: <strong className="text-accent font-mono">10.10.0.207:5555</strong> •{' '}
                  MQTT: <strong className="text-accent font-mono">10.10.0.207:1883</strong>
                </p>
              </div>
              {currentLocation && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Current Location</p>
                  <p className="font-semibold">{currentLocation.name}</p>
                  {currentLocation.doNotDisturb && (
                    <Badge variant="destructive" className="mt-1">DND Active</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {!selectedLocation ? (
          <Card className="bg-muted/30">
            <div className="p-16 text-center space-y-3">
              <MapPin className="h-20 w-20 mx-auto text-muted-foreground opacity-30" />
              <div>
                <h3 className="font-semibold text-xl">Select a Location</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose a room from the sidebar to begin button simulation
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Button Visual */}
            <Card className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 border-accent/20">
              <div className="aspect-square flex items-center justify-center p-12 relative">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, transparent 0%, rgba(200, 169, 107, 0.1) 100%)`
                }} />
                
                <div className="relative w-full max-w-md aspect-square">
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
                          className={`w-14 h-14 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900
                                    border-2 border-accent flex items-center justify-center
                                    shadow-lg hover:shadow-xl transition-all relative group`}
                        >
                          <div className="absolute inset-0 rounded-full bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <ButtonIcon className="h-5 w-5 text-accent relative z-10" />
                        </motion.button>
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
                    onMouseDown={handleMainButtonDown}
                    onMouseUp={handleMainButtonUp}
                    onMouseLeave={handleMainButtonUp}
                    onTouchStart={handleMainButtonDown}
                    onTouchEnd={handleMainButtonUp}
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
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                              <Mic className="h-10 w-10 text-destructive" />
                            </motion.div>
                            <span className="text-xs text-destructive font-medium">
                              {recordingDuration.toFixed(1)}s
                            </span>
                          </motion.div>
                        ) : (
                          <motion.div key="idle" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Phone className="h-10 w-10 text-accent" />
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

              <div className="border-t border-accent/20 bg-black/20 px-6 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">OBEDIO Smart Button</span>
                  {currentLocation?.smartButtonId && (
                    <Badge variant="outline" className="border-accent/30 text-accent">
                      {currentLocation.smartButtonId}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Instructions */}
            <div className="space-y-4">
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold">Instructions</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Quick Tap</p>
                        <p className="text-muted-foreground">Service call</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <Mic className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Hold 500ms+</p>
                        <p className="text-muted-foreground">Voice message</p>
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <Bell className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Aux Buttons</p>
                        <p className="text-muted-foreground">Click ⚙️ to configure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold">Button Mapping</h3>
                  <div className="space-y-2">
                    {auxButtons.map((button) => {
                      const ButtonIcon = button.icon;
                      return (
                        <div key={button.id} className="flex items-center justify-between p-3 rounded-lg border">
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
                          <Button variant="ghost" size="sm" onClick={() => handleConfigureButton(button)}>
                            <SettingsIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
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
                  onValueChange={(value: string) => handleSaveButtonConfig(value as ButtonFunction)}
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
