/**
 * Incoming Service Request Dialog
 * Eye-catching alert that pops up when a new service request arrives
 */

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bell,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  UserCheck,
  Volume2,
  Play,
  Send,
  MessageSquare,
  UtensilsCrossed,
  Wine,
  ChevronDown,
  ChevronUp,
  Cog
} from "lucide-react";
import { playNotificationSound, playEmergencySound } from '../utils/notification-sound';
import { motion } from "motion/react";
import { ServiceRequest } from "../contexts/AppDataContext";
import { useAppData } from "../contexts/AppDataContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAcceptServiceRequest } from "../hooks/useServiceRequestsApi";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from "sonner";

interface IncomingRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest | null;
}

export function IncomingRequestDialog({
  isOpen,
  onClose,
  request,
}: IncomingRequestDialogProps) {
  const { user } = useAuth();
  const { delegateServiceRequest, crewMembers, getCurrentDutyStatus } = useAppData();
  const { mutate: acceptRequest } = useAcceptServiceRequest();
  const [timeAgo, setTimeAgo] = useState<string>("Just now");
  const [showDelegateDropdown, setShowDelegateDropdown] = useState(false);
  const [showAvailableCrew, setShowAvailableCrew] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  
  // Get crew organized by duty status
  const dutyStatus = getCurrentDutyStatus();
  const onDutyCrew = dutyStatus.onDuty;
  const availableCrew = crewMembers.filter(
    (crew) => crew.department === 'Interior' && crew.status !== 'on-leave' && !onDutyCrew.find(c => c.id === crew.id)
  );

  useEffect(() => {
    if (!request) return;

    const updateTime = () => {
      // Guard: Handle missing or invalid timestamp
      if (!request.timestamp || !(request.timestamp instanceof Date)) {
        setTimeAgo("Just now");
        return;
      }

      const now = new Date();
      const diff = Math.floor((now.getTime() - request.timestamp.getTime()) / 1000);

      if (diff < 10) setTimeAgo("Just now");
      else if (diff < 60) setTimeAgo(`${diff}s ago`);
      else setTimeAgo(`${Math.floor(diff / 60)}m ago`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [request]);

  // Reset dropdowns when dialog closes or request changes
  useEffect(() => {
    if (!isOpen) {
      setShowDelegateDropdown(false);
      setShowAvailableCrew(false);
    }
  }, [isOpen, request]);

  const handleAccept = () => {
    if (!request) return;

    // DEBUG: Log current state
    console.log('🔍 DEBUG Accept button clicked:');
    console.log('  - Current user ID:', user?.id);
    console.log('  - All crew members:', crewMembers.map(c => ({ id: c.id, name: c.name, userId: c.userId })));
    console.log('  - Looking for crew with userId:', user?.id);

    // Get current crew member from authenticated user
    const currentCrewMember = crewMembers.find(crew => crew.userId === user?.id);

    console.log('  - Found crew member:', currentCrewMember);

    if (!currentCrewMember) {
      console.error('❌ No crew member found for user:', user?.id);
      toast.error('You must be associated with a crew member to accept requests');
      return;
    }

    console.log('✅ Calling backend API to accept request');
    console.log('  - Request ID:', request.id);
    console.log('  - Crew ID:', currentCrewMember.id);

    // Call BACKEND API (not local state!)
    acceptRequest(
      { id: request.id, crewId: currentCrewMember.id },
      {
        onSuccess: () => {
          console.log('✅ Backend accepted request successfully');
          toast.success(`Request from ${request.guestName} accepted`);
          onClose();
        },
        onError: (error: any) => {
          console.error('❌ Backend error:', error);
          toast.error(error.message || 'Failed to accept request');
        }
      }
    );
  };

  const handleDelegateClick = () => {
    setShowDelegateDropdown(!showDelegateDropdown);
  };

  const handleSelectCrew = (crewId: string, crewName: string) => {
    if (!request) return;

    console.log('🔄 Delegating request to crew member:', crewName, crewId);

    // Call BACKEND API to assign request to selected crew member
    acceptRequest(
      { id: request.id, crewId: crewId },
      {
        onSuccess: () => {
          console.log('✅ Request delegated successfully via backend API');
          toast.success(`Request delegated to ${crewName}`);
          setShowDelegateDropdown(false);
          onClose();
        },
        onError: (error: any) => {
          console.error('❌ Failed to delegate request:', error);
          toast.error(error.message || 'Failed to delegate request');
        }
      }
    );
  };

  const handlePlayAudio = () => {
    if (!request?.voiceTranscript && !request?.voiceAudioUrl) return;
    
    setPlayingAudio(true);
    
    // Play actual audio file from voiceAudioUrl
    if (request.voiceAudioUrl) {
      try {
        const audio = new Audio(request.voiceAudioUrl);
        
        audio.onended = () => {
          setPlayingAudio(false);
        };
        
        audio.onerror = () => {
          setPlayingAudio(false);
          toast.error('Failed to play audio', {
            description: 'Audio file could not be loaded'
          });
        };
        
        audio.play().catch((error) => {
          console.error('Audio playback error:', error);
          setPlayingAudio(false);
          toast.error('Failed to play audio', {
            description: error.message
          });
        });
        
        toast.info('🎵 Playing voice message...');
      } catch (error) {
        console.error('Audio creation error:', error);
        setPlayingAudio(false);
        toast.error('Failed to play audio');
      }
    } else {
      toast.info('Playing voice message...', { 
        description: request.voiceTranscript 
      });
      setTimeout(() => {
        setPlayingAudio(false);
      }, 3000);
    }
  };

  const handleQuickResponse = (responseType: 'unclear' | 'on-way') => {
    if (!request) return;

    // Immediately accept the request
    handleAccept();

    // Send automated response
    if (responseType === 'unclear') {
      toast.info('Auto-response sent', {
        description: '"Could you please repeat your request?"'
      });

      // TODO: Integrate with messaging system when available
      // sendGuestMessage(request.guestId, "Could you please repeat your request?");

    } else if (responseType === 'on-way') {
      toast.success('Auto-response sent', {
        description: '"I\'m on my way to assist you!"'
      });

      // TODO: Integrate with messaging system when available
      // sendGuestMessage(request.guestId, "I'm on my way to assist you!");
    }
  };

  if (!request) return null;

  const priorityConfig = {
    emergency: {
      bg: "bg-error/10",
      border: "border-error",
      text: "text-error",
      icon: AlertCircle,
      label: "EMERGENCY"
    },
    urgent: {
      bg: "bg-warning/10",
      border: "border-warning",
      text: "text-warning",
      icon: Bell,
      label: "URGENT"
    },
    normal: {
      bg: "bg-accent/10",
      border: "border-accent",
      text: "text-accent",
      icon: Bell,
      label: "NEW REQUEST"
    }
  };

  const config = priorityConfig[request.priority];
  const PriorityIcon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg p-0 gap-0 border-2 overflow-hidden"
        style={{ borderColor: `var(--color-${request.priority === 'emergency' ? 'error' : request.priority === 'urgent' ? 'warning' : 'accent'})` }}
      >
        {/* Accessible title and description */}
        <DialogTitle className="sr-only">
          {config.label} - Service Request from {request.guestCabin}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Service request from {request.guestName} in {request.guestCabin}. 
          {request.voiceTranscript ? `Message: ${request.voiceTranscript}` : request.notes ? `Request: ${request.notes}` : ''}
        </DialogDescription>

        {/* Animated Header Bar */}
        <motion.div 
          className={`${config.bg} border-b-2 ${config.border} px-6 py-4`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <PriorityIcon className={`h-6 w-6 ${config.text}`} />
            </motion.div>
            <div>
              <div className={`text-sm font-semibold ${config.text}`}>
                {config.label}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Location Image - Large and Beautiful */}
        {request.cabinImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={request.cabinImage}
              alt={request.guestCabin}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                {request.guestCabin}
              </h3>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Location & Guest */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Location</div>
                <div className="font-bold text-lg">{request.guestCabin}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <User className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Guest</div>
                <div className="font-semibold">{request.guestName}</div>
              </div>
            </div>

            {/* Request Type Badge */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                {request.requestType === 'voice' ? (
                  <Volume2 className="h-5 w-5 text-accent" />
                ) : request.requestType === 'dnd' ? (
                  <Bell className="h-5 w-5 text-accent" />
                ) : request.requestType === 'lights' ? (
                  <Cog className="h-5 w-5 text-accent" />
                ) : request.requestType === 'prepare_food' ? (
                  <UtensilsCrossed className="h-5 w-5 text-accent" />
                ) : request.requestType === 'bring_drinks' ? (
                  <Wine className="h-5 w-5 text-accent" />
                ) : request.requestType === 'emergency' ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <Bell className="h-5 w-5 text-accent" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Request Type</div>
                <div className="font-semibold capitalize">
                  {request.requestType === 'call' ? 'Service Call' :
                   request.requestType === 'voice' ? 'Voice Message' :
                   request.requestType === 'dnd' ? 'Do Not Disturb' :
                   request.requestType === 'lights' ? 'Lights Control' :
                   request.requestType === 'prepare_food' ? 'Food Service' :
                   request.requestType === 'bring_drinks' ? 'Drinks Service' :
                   request.requestType === 'emergency' ? 'EMERGENCY' :
                   request.requestType}
                </div>
              </div>
            </div>
          </div>

          {/* Request Details */}
          {request.voiceTranscript && (() => {
            // Parse voice message format: "Voice message (3.0s): Bring us coffee."
            const match = request.voiceTranscript.match(/^Voice message \(([\d.]+)s\):\s*(.+)$/i);
            const duration = match ? match[1] : null;
            const transcript = match ? match[2] : request.voiceTranscript;
            
            return (
              <div className="bg-muted/50 rounded-lg p-5 border border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Message</div>
                    {/* Voice message indicator with duration - smaller, muted */}
                    {duration && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Voice message ({duration}s)
                      </div>
                    )}
                    {/* Three dots separator */}
                    <div className="text-muted-foreground mb-2">• • •</div>
                    {/* Transcript text - large and prominent */}
                    <p className="text-xl font-semibold leading-relaxed text-foreground">{transcript}</p>
                  </div>
                  {(request.voiceTranscript || request.voiceAudioUrl) && (
                    <button
                      onClick={handlePlayAudio}
                      disabled={playingAudio}
                      className="flex-shrink-0 w-12 h-12 rounded-full bg-accent/10 hover:bg-accent/20 border-2 border-accent flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                      aria-label="Play voice message"
                    >
                      {playingAudio ? (
                        <Volume2 className="h-5 w-5 text-accent animate-pulse" />
                      ) : (
                        <Play className="h-5 w-5 text-accent" />
                      )}
                    </button>
                  )}
                </div>

                {/* Quick Response Buttons - Only for Voice Messages */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickResponse('unclear')}
                    className="flex-1 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1.5" />
                    Couldn't Understand
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleQuickResponse('on-way')}
                    className="flex-1 text-xs bg-accent hover:bg-accent/90"
                  >
                    <Send className="h-3 w-3 mr-1.5" />
                    On My Way
                  </Button>
                </div>
              </div>
            );
          })()}

          {request.notes && !request.voiceTranscript && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Request Type</div>
              <p className="text-sm leading-relaxed">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-border bg-muted/30 px-6 py-4">
          {/* Primary Actions */}
          <div className="flex gap-2 mb-3">
            <Button
              onClick={handleAccept}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={handleDelegateClick}
              className="flex-1"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Delegate
            </Button>
          </div>

          {/* Delegate Dropdown */}
          {showDelegateDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* On-Duty Crew Section - Always Visible */}
              {onDutyCrew.length > 0 && (
                <div className={availableCrew.length > 0 ? "border-b border-border" : ""}>
                  <div className="px-3 py-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">On Duty</p>
                  </div>
                  <div className="divide-y divide-border">
                    {onDutyCrew.map((crew) => (
                      <button
                        key={crew.id}
                        onClick={() => handleSelectCrew(crew.id, crew.name)}
                        className="w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                          <span className="font-medium truncate">{crew.name}</span>
                          <span className="text-xs text-muted-foreground truncate">({crew.role})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Crew Section - Collapsible */}
              {availableCrew.length > 0 && (
                <div>
                  {/* Collapsible Header */}
                  <button
                    onClick={() => setShowAvailableCrew(!showAvailableCrew)}
                    className="w-full px-3 py-2 bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-muted-foreground">Available Crew ({availableCrew.length})</p>
                    {showAvailableCrew ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Collapsible Content */}
                  {showAvailableCrew && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="divide-y divide-border max-h-48 overflow-y-auto"
                    >
                      {availableCrew.map((crew) => (
                        <button
                          key={crew.id}
                          onClick={() => handleSelectCrew(crew.id, crew.name)}
                          className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-muted flex-shrink-0" />
                            <span className="truncate">{crew.name}</span>
                            <span className="text-xs text-muted-foreground truncate">({crew.role})</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {onDutyCrew.length === 0 && availableCrew.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No crew members available
                </div>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to listen for new service requests with repeat notification support
 */
export function useIncomingRequests() {
  const { serviceRequests, userPreferences } = useAppData();
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [lastShownTime, setLastShownTime] = useState<Record<string, number>>({});
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastClosedTime, setLastClosedTime] = useState<number>(0);
  const [initializationTime, setInitializationTime] = useState<number>(0);

  // Import WebSocket hook
  const { on, off } = useWebSocket();

  // Listen for service request updates via WebSocket
  useEffect(() => {
    if (!on || !off) return;

    const handleRequestUpdate = (updatedRequest: any) => {
      console.log('📞 Dialog: Service request updated via WebSocket:', updatedRequest);

      // If the currently displayed request was updated to non-pending status, close the dialog
      if (currentRequest && updatedRequest.id === currentRequest.id) {
        if (updatedRequest.status !== 'pending') {
          console.log('✅ Request accepted/updated - closing dialog');
          setShowDialog(false);
          setLastClosedTime(Date.now());
        }
      }
    };

    const unsubscribe = on('service-request:updated', handleRequestUpdate);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [on, off, currentRequest]);

  // Mark as initialized after 2 seconds to ignore initial mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
      setInitializationTime(Date.now());
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Don't show dialogs during initialization (ignore mock data)
    if (!isInitialized) return;
    if (serviceRequests.length === 0) return;

    const now = Date.now();
    const repeatInterval = (userPreferences.requestDialogRepeatInterval ?? 60) * 1000; // Convert to ms
    const cooldownPeriod = 2000; // 2 seconds cooldown after closing a dialog

    // Don't show new dialogs if we just closed one (cooldown period)
    if (now - lastClosedTime < cooldownPeriod) {
      return;
    }

    // Find oldest pending request that should be shown
    const pendingRequests = serviceRequests.filter(req => req.status === 'pending');

    for (const request of pendingRequests) {
      // Guard: Skip requests with missing or invalid timestamp
      if (!request.timestamp || !(request.timestamp instanceof Date)) {
        console.warn('⚠️ Request has invalid timestamp:', request.id);
        continue;
      }

      const age = now - request.timestamp.getTime();
      const lastShown = lastShownTime[request.id];

      // Additional guard: prevent showing same request if shown very recently (within 1500ms)
      const shownRecently = lastShown && (now - lastShown) < 1500;

      // Show if:
      // 1. New request created AFTER initialization (< 5 seconds old AND created after init) OR
      // 2. Repeat interval passed since last shown (if repeatInterval > 0)
      const wasCreatedAfterInit = request.timestamp.getTime() > initializationTime;
      const isNewRequest = age < 5000 && request.id !== lastRequestId && wasCreatedAfterInit;
      const shouldRepeat = repeatInterval > 0 && lastShown && (now - lastShown) >= repeatInterval;

      if ((isNewRequest || shouldRepeat) && !shownRecently) {
        setLastRequestId(request.id);
        setLastShownTime(prev => ({ ...prev, [request.id]: now }));
        setCurrentRequest(request);
        setShowDialog(true);

        // Play sound based on user preferences (same settings as Service Requests page)
        if (userPreferences?.serviceRequestSoundAlerts !== false) {
          if (request.priority === 'emergency') {
            playEmergencySound();
          } else {
            playNotificationSound();
          }
        }

        break; // Show only one at a time
      }
    }
  }, [serviceRequests, lastRequestId, isInitialized, userPreferences.requestDialogRepeatInterval, lastClosedTime, initializationTime]);

  const closeDialog = () => {
    setShowDialog(false);
    setLastClosedTime(Date.now()); // Record when dialog was closed
  };

  return {
    showDialog,
    currentRequest,
    closeDialog
  };
}
