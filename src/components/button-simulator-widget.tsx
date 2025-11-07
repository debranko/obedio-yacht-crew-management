/**
 * Button Simulator Widget - Persistent sidebar tool
 * Always visible for quick ESP32 firmware testing
 */

import { useState, useRef, useEffect } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { useLocations } from "../hooks/useLocations";
import { useGuests } from "../hooks/useGuests";
import { DNDService } from "../services/dnd";
import { mqttClient } from "../services/mqtt-client";
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
  AlertTriangle,
  ChevronDown,
  ChevronUp
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
  // Connect to MQTT broker on mount - REAL MQTT CONNECTION
  useEffect(() => {
    // Check if already connected BEFORE attempting connection
    const wasConnected = mqttClient.getConnectionStatus();

    console.log('🔌 Button Simulator: Checking MQTT connection...');
    console.log('📍 MQTT Broker URL from env:', import.meta.env.VITE_MQTT_BROKER || 'NOT SET - using default ws://localhost:9001');
    console.log('🔍 Current MQTT connection status:', wasConnected);

    // Only show toast if we're establishing a NEW connection
    mqttClient.connect()
      .then(() => {
        const isConnected = mqttClient.getConnectionStatus();
        console.log('✅ Button Simulator: MQTT connection verified');
        console.log('🔍 MQTT connection status after connect:', isConnected);

        // Only show notification if we just connected (was disconnected before)
        if (!wasConnected && isConnected) {
          toast.success('MQTT Connected', {
            description: 'Button simulator ready to send real MQTT messages'
          });
        } else if (wasConnected) {
          console.log('📌 MQTT already connected, no notification shown');
        }
      })
      .catch((error) => {
        console.error('❌ Button Simulator: MQTT connection failed:', error);
        console.error('🔍 Error details:', error.message, error.stack);

        // Only show error if we weren't connected before (avoid spam on reconnect attempts)
        if (!wasConnected) {
          toast.error('MQTT Connection Failed', {
            description: 'Make sure Mosquitto is running on port 9001 (WebSocket)'
          });
        }
      });

    return () => {
      // Keep connection alive (don't disconnect on unmount)
      // This prevents reconnection spam when sidebar collapses/expands
    };
  }, []);

  // Use same source of truth as Dashboard and DNDWidget
  const { locations: locationsFromService = [], updateLocation } = useLocations();
  
  // Use React Query for guests (real-time updates from database)
  const { data: guestsData } = useGuests({ page: 1, limit: 1000 });
  const guests = (guestsData as any)?.items || [];
  
  const {
    crew = [],
    addServiceRequest,
    addActivityLog,
    updateGuest,
    getGuestByLocationId
  } = useAppData();

  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isMainPressed, setIsMainPressed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('esp32-simulator-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGenRef = useRef<{ key: string; t: number } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Use locations from service (React Query + locationsService)
  const allLocations = locationsFromService;
  const onDutyCrew = crew.filter(member => member.status === "on-duty");
  const currentLocation = allLocations.find(loc => loc.id === selectedLocation);

  const generateServiceRequest = (
    requestType: string, 
    requestLabel: string,
    isVoice: boolean = false,
    voiceDuration?: number,
    requestPriority: 'normal' | 'urgent' | 'emergency' = 'normal',
    audioUrl?: string
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
    // If multiple guests in same cabin, prefer owner > vip > partner > guest
    const guestsAtLocation = guests.filter((g: any) => g.locationId === location.id);
    let guestAtLocation = null;
    
    if (guestsAtLocation.length > 0) {
      // Sort by priority: owner > vip > partner > family > guest
      const priorityOrder = { owner: 1, vip: 2, partner: 3, family: 4, guest: 5 };
      guestsAtLocation.sort((a: any, b: any) => {
        const aPriority = priorityOrder[a.type as keyof typeof priorityOrder] || 10;
        const bPriority = priorityOrder[b.type as keyof typeof priorityOrder] || 10;
        return aPriority - bPriority;
      });
      guestAtLocation = guestsAtLocation[0];  // Take highest priority guest
    } else {
      // Fallback: try context helper, but don't default to guests[0]
      guestAtLocation = getGuestByLocationId(location.id);
    }
    
    const guestName = guestAtLocation 
      ? `${guestAtLocation.firstName} ${guestAtLocation.lastName}` 
      : 'Guest';
    
    const assignedCrew = onDutyCrew[0];

    // Build request notes - include critical medical info for EMERGENCY requests
    let requestNotes = hadDND 
      ? `DND REMOVED - ${location.floor ? location.floor + ' - ' : ''}${requestLabel}${location.smartButtonId ? ` (Device: ${location.smartButtonId})` : ''}`
      : `${location.floor ? location.floor + ' - ' : ''}${requestLabel}${location.smartButtonId ? ` (Device: ${location.smartButtonId})` : ''}`;
    
    // CRITICAL: Add medical information for EMERGENCY priority requests
    if (requestPriority === 'emergency' && guestAtLocation) {
      const medicalInfo: string[] = [];
      
      // Medical Conditions
      if (guestAtLocation.medicalConditions && guestAtLocation.medicalConditions.length > 0) {
        medicalInfo.push(`⚠️ MEDICAL CONDITIONS: ${guestAtLocation.medicalConditions.join(', ')}`);
      }
      
      // Allergies
      if (guestAtLocation.allergies && guestAtLocation.allergies.length > 0) {
        medicalInfo.push(`🚨 ALLERGIES: ${guestAtLocation.allergies.join(', ')}`);
      }
      
      // Dietary Restrictions (may be relevant in medical emergency)
      if (guestAtLocation.dietaryRestrictions && guestAtLocation.dietaryRestrictions.length > 0) {
        medicalInfo.push(`🍽️ DIETARY: ${guestAtLocation.dietaryRestrictions.join(', ')}`);
      }
      
      // Emergency Contact
      if (guestAtLocation.emergencyContactName || guestAtLocation.emergencyContactPhone) {
        const contact = [];
        if (guestAtLocation.emergencyContactName) contact.push(guestAtLocation.emergencyContactName);
        if (guestAtLocation.emergencyContactRelation) contact.push(`(${guestAtLocation.emergencyContactRelation})`);
        if (guestAtLocation.emergencyContactPhone) contact.push(guestAtLocation.emergencyContactPhone);
        medicalInfo.push(`📞 EMERGENCY CONTACT: ${contact.join(' ')}`);
      }
      
      // Preferences (may contain important info)
      if (guestAtLocation.preferences) {
        medicalInfo.push(`📋 PREFERENCES: ${guestAtLocation.preferences}`);
      }
      
      if (medicalInfo.length > 0) {
        requestNotes += '\n\n' + medicalInfo.join('\n');
      } else {
        requestNotes += '\n\n✓ No medical conditions or allergies on file';
      }
    }

    // ============================================
    // REAL MQTT PUBLISH - Simulates actual OBEDIO ESP32 Smart Button
    // ============================================
    const deviceId = location.smartButtonId || `BTN-${location.id.slice(-8)}`;

    // Determine button type
    let button: 'main' | 'aux1' | 'aux2' | 'aux3' | 'aux4' = 'main';
    let pressType: 'single' | 'double' | 'long' | 'shake' = 'single';
    
    if (isVoice) {
      pressType = 'long';
    } else if (requestType === 'shake') {
      pressType = 'shake';
    } else if (requestType === 'dnd') {
      button = 'aux1';
    } else if (requestType === 'lights') {
      button = 'aux2';
    } else if (requestType === 'prepare_food') {
      button = 'aux3';
    } else if (requestType === 'bring_drinks') {
      button = 'aux4';
    }

    // ============================================
    // EXACT ESP32 SPECIFICATION - DO NOT MODIFY
    // See: ESP32-FIRMWARE-DETAILED-SPECIFICATION.md lines 70-88
    // ============================================
    console.log('📤 MQTT: Publishing ESP32 button press (EXACT SPEC)', {
      deviceId,
      locationId: location.id,
      guestId: guestAtLocation?.id || null,
      pressType,
      button
    });

    // Send MQTT message to broker - matches real OBEDIO ESP32 Smart Button exactly
    mqttClient.publishButtonPress(deviceId, {
      locationId: location.id,
      guestId: guestAtLocation?.id || null,
      pressType,
      button,
      voiceTranscript: isVoice ? requestLabel : undefined,
      audioUrl: isVoice ? audioUrl : undefined
    });

    // Backend MQTT handler will:
    // 1. Receive this MQTT message
    // 2. Create service request in database
    // 3. Emit WebSocket event back to frontend
    // 4. Frontend will receive and display via WebSocket subscription
    //
    // DO NOT create service request via API here - it would create duplicates!

    // Log activity for tracking
    addActivityLog({
      type: 'service',
      user: guestName,
      action: requestPriority === 'emergency' ? 'Emergency call' : (isVoice ? 'Voice message' : 'Service call'),
      details: `${location.name} - ${requestLabel}${requestPriority === 'emergency' ? ' [EMERGENCY]' : ''}`
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

    console.log("🔘 BUTTON PRESS - MQTT MESSAGE SENT:", {
      timestamp: new Date().toISOString(),
      buttonType: isVoice ? "MAIN_HOLD" : requestType === "main" ? "MAIN_TAP" : "AUX_" + requestType.toUpperCase(),
      location: {
        id: location.id,
        name: location.name,
        floor: location.floor,
        smartButtonId: location.smartButtonId
      },
      requestDetails: {
        type: requestType,
        label: requestLabel,
        isVoice,
        voiceDuration,
        priority: requestPriority,
      },
      guest: guestAtLocation ? {
        id: guestAtLocation.id,
        name: guestName
      } : null,
      assignedTo: assignedCrew ? {
        id: assignedCrew.id,
        name: assignedCrew.name,
        role: assignedCrew.role
      } : null,
      note: "Service request will be created by backend MQTT handler"
    });
  };

  // Start real audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
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
      toast.error('Microphone access denied', {
        description: 'Please allow microphone access to use voice messages'
      });
    }
  };

  // Stop recording and transcribe
  const stopRecording = async () => {
    return new Promise<{ transcript: string | null; audioUrl: string | null }>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve({ transcript: null, audioUrl: null });
        return;
      }

      mediaRecorder.onstop = async () => {
        console.log('🎙️ Stopped recording, processing audio...');
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size, 'bytes');

        // Create audio URL for playback
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('🎵 Audio URL created:', audioUrl);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Transcribe audio
        try {
          setIsTranscribing(true);
          const transcript = await transcribeAudio(audioBlob, recordingDuration);
          setIsTranscribing(false);
          resolve({ transcript, audioUrl });
        } catch (error) {
          setIsTranscribing(false);
          console.error('Transcription failed:', error);
          resolve({ transcript: null, audioUrl });
        }
      };

      mediaRecorder.stop();
    });
  };

  // Send audio to backend for transcription
  const transcribeAudio = async (audioBlob: Blob, duration: number): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('duration', duration.toFixed(2));

      console.log('📤 Sending audio to backend for transcription...');

      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();

      // Backend returns { success, transcript, translation, language, duration }
      // We use TRANSLATION (English) for crew to read, but keep original AUDIO
      const englishText = data.translation || data.transcript; // Fallback to transcript if already English

      if (data.success && englishText) {
        console.log('✅ Transcription successful:', {
          original: data.transcript,
          english: englishText,
          language: data.language
        });
        toast.success('Voice message transcribed!', {
          description: englishText.substring(0, 100)
        });
        return englishText; // Return ENGLISH translation for crew
      }

      return null;
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio', {
        description: 'Using fallback mode'
      });
      return null;
    }
  };

  const handleMainButtonDown = () => {
    if (!selectedLocation) return;
    setIsMainPressed(true);
    pressTimerRef.current = setTimeout(() => {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start real audio recording
      startRecording();
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 0.1);
      }, 100);
    }, 500);
  };

  const handleMainButtonUp = async (e?: React.MouseEvent) => {
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
        // Stop recording and get transcript + audio URL
        const { transcript, audioUrl } = await stopRecording();
        
        // Use real transcript or fallback (plain text only, no formatting)
        const voiceMessage = transcript || "Voice Message";
        
        generateServiceRequest("main", voiceMessage, true, recordingDuration, 'normal', audioUrl || undefined);
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
    
    // Environmental controls (Crestron integration) - Direct actions, no service request
    if (button.function === 'lights') {
      toast.success('💡 Lights toggled', {
        description: 'Crestron command sent'
      });
      return;
    }
    
    // Service requests for crew
    const labels: Record<ButtonFunction, string> = {
      dnd: "Do Not Disturb Toggle", // Won't reach here
      lights: "Lights Control", // Won't reach here
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

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('esp32-simulator-collapsed', JSON.stringify(newState));
  };

  return (
    <div className="p-3 border-t border-sidebar-border space-y-3">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer hover:opacity-70 transition-opacity" 
        onClick={toggleCollapse}
      >
        <Label className="text-xs text-muted-foreground cursor-pointer">ESP32 Simulator</Label>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 overflow-hidden"
          >
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
            onTouchEnd={selectedLocation ? (e: any) => handleMainButtonUp(e) : undefined}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
