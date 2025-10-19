/**
 * Emergency Shake-to-Call Dialog
 * Loud, dramatic, impossible-to-miss emergency alert system
 * Triggered when a guest uses shake-to-call for emergency situations
 */

import { useEffect, useState, useRef } from "react";
import { 
  AlertTriangle,
  Phone,
  Users,
  MapPin,
  User,
  X,
  Bell,
  AlertCircle,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ServiceRequest } from "../contexts/AppDataContext";
import { Button } from "./ui/button";

interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  allergies?: string[];
  medicalConditions?: string[];
  dietaryRestrictions?: string[];
  [key: string]: any;
}

interface EmergencyShakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
  guest: Guest | null;
  onAccept: () => void;
  onCallAll: () => void;
}

export function EmergencyShakeDialog({
  isOpen,
  onClose,
  request,
  guest,
  onAccept,
  onCallAll
}: EmergencyShakeDialogProps) {
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Emergency alarm sound using Web Audio API
  useEffect(() => {
    if (!isOpen || !request) return;

    // Vibration API (if supported)
    if ('vibrate' in navigator) {
      // Vibrate in pattern: 200ms on, 100ms off, repeated
      const vibratePattern = [200, 100, 200, 100, 200];
      navigator.vibrate(vibratePattern);
    }

    // Create alarm sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      audioContextRef.current = audioContext;
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      // Configure siren sound (alternating frequencies)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      
      // Siren effect: sweep between 800Hz and 1200Hz
      let time = audioContext.currentTime;
      for (let i = 0; i < 6; i++) {
        oscillator.frequency.linearRampToValueAtTime(1200, time + 0.5);
        time += 0.5;
        oscillator.frequency.linearRampToValueAtTime(800, time + 0.5);
        time += 0.5;
      }

      // Volume envelope
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);

      // Connect and play
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      
      // Auto-stop after 6 seconds
      setTimeout(() => {
        if (oscillator) {
          oscillator.stop();
        }
      }, 6000);
    } catch (error) {
      console.error('Failed to play emergency sound:', error);
    }

    return () => {
      // Cleanup audio
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {
          // Already stopped
        }
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Stop vibration
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    };
  }, [isOpen, request]);

  const handleClose = () => {
    if (!showConfirmClose) {
      setShowConfirmClose(true);
      return;
    }
    setShowConfirmClose(false);
    onClose();
  };

  if (!request) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Animated Background - Pulsing Red */}
          <motion.div
            className="absolute inset-0 bg-error/95"
            animate={{
              opacity: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Radial Pulse Effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at center, transparent 0%, rgba(198, 40, 40, 0.3) 100%)'
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Content Container */}
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="relative z-10 w-full max-w-2xl mx-4"
          >
            {/* Close Button - Requires Confirmation */}
            <div className="absolute -top-4 -right-4 z-20">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
                className={`h-10 w-10 rounded-full border-2 shadow-lg transition-all ${
                  showConfirmClose 
                    ? 'bg-white text-error border-error animate-pulse' 
                    : 'bg-error/20 text-white border-white/50 hover:bg-error/30'
                }`}
              >
                {showConfirmClose ? (
                  <span className="text-xs font-bold">Close?</span>
                ) : (
                  <X className="h-5 w-5" />
                )}
              </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Emergency Header */}
              <div className="bg-error text-white p-8 text-center relative overflow-hidden">
                {/* Animated Stripes Background */}
                <motion.div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, white 20px, white 40px)'
                  }}
                  animate={{
                    x: [0, 40, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* Pulsing Warning Icon */}
                <motion.div
                  className="inline-flex mb-4"
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <AlertTriangle className="h-20 w-20" />
                </motion.div>

                <motion.h1
                  className="text-5xl font-bold mb-2 tracking-tight"
                  animate={{
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  EMERGENCY
                </motion.h1>
                <p className="text-xl opacity-90">Shake-to-Call Activated</p>
              </div>

              {/* Guest & Location Info */}
              <div className="p-8 space-y-6">
                {/* Location */}
                <div className="flex items-center gap-4 p-4 bg-error/5 rounded-xl border-2 border-error/20">
                  <div className="w-14 h-14 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-7 w-7 text-error" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Emergency Location</div>
                    <div className="text-2xl font-semibold text-error">{request.guestCabin}</div>
                  </div>
                </div>

                {/* Guest */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-7 w-7 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">Guest Name</div>
                    <div className="text-2xl font-semibold">{request.guestName}</div>
                  </div>
                </div>

                {/* CRITICAL: Medical & Allergy Information */}
                {guest && (guest.allergies?.length || guest.medicalConditions?.length || guest.dietaryRestrictions?.length) ? (
                  <div className="space-y-3">
                    {/* Medical Conditions */}
                    {guest.medicalConditions && guest.medicalConditions.length > 0 && (
                      <div className="p-4 bg-error/10 rounded-xl border-2 border-error/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Heart className="h-5 w-5 text-error" />
                          <span className="font-bold text-error">MEDICAL CONDITIONS</span>
                        </div>
                        <div className="space-y-1.5">
                          {guest.medicalConditions.map((condition, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-error mt-2 flex-shrink-0" />
                              <span className="text-base font-medium text-foreground">{condition}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Allergies */}
                    {guest.allergies && guest.allergies.length > 0 && (
                      <div className="p-4 bg-warning/10 rounded-xl border-2 border-warning/30">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-5 w-5 text-warning" />
                          <span className="font-bold text-warning">ALLERGIES</span>
                        </div>
                        <div className="space-y-1.5">
                          {guest.allergies.map((allergy, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                              <span className="text-base font-medium text-foreground">{allergy}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dietary Restrictions */}
                    {guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0 && (
                      <div className="p-4 bg-muted/50 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-muted-foreground text-sm">Dietary Restrictions</span>
                        </div>
                        <div className="space-y-1">
                          {guest.dietaryRestrictions.map((restriction, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{restriction}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : guest ? (
                  <div className="p-4 bg-success/10 rounded-xl border border-success/30">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-success" />
                      <span className="text-sm text-success font-medium">
                        No known allergies or medical conditions on file
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Message if available */}
                {request.voiceTranscript && (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="text-sm text-muted-foreground mb-2">Voice Message</div>
                    <p className="text-lg leading-relaxed">{request.voiceTranscript}</p>
                  </div>
                )}

                {/* Emergency Note */}
                <div className="p-4 bg-warning/10 rounded-xl border border-warning/30 flex items-start gap-3">
                  <Bell className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-warning">
                    <strong>Emergency Protocol:</strong> This is a priority alert. 
                    Respond immediately or escalate to all available crew.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-8 pt-0 space-y-3">
                <Button
                  onClick={onAccept}
                  className="w-full h-16 text-xl bg-error hover:bg-error/90 text-white shadow-lg"
                >
                  <Phone className="h-6 w-6 mr-3" />
                  Accept Emergency & Respond Now
                </Button>

                <Button
                  onClick={onCallAll}
                  variant="outline"
                  className="w-full h-14 text-lg border-2 border-error text-error hover:bg-error/10"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Call All Available Crew
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to listen for emergency shake-to-call events
 */
export function useEmergencyShake() {
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyRequest, setEmergencyRequest] = useState<ServiceRequest | null>(null);

  // This will be called by Button Simulator or actual device integration
  const triggerEmergency = (request: ServiceRequest) => {
    setEmergencyRequest(request);
    setShowEmergencyDialog(true);
  };

  const closeEmergencyDialog = () => {
    setShowEmergencyDialog(false);
  };

  return {
    showEmergencyDialog,
    emergencyRequest,
    triggerEmergency,
    closeEmergencyDialog
  };
}
