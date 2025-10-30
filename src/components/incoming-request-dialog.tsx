/**
 * Incoming Service Request Dialog
 * Eye-catching alert that pops up when a new service request arrives
 */

import { useEffect, useState, useMemo } from "react";
import { 
  AlertCircle, 
  Bell, 
  MapPin, 
  User, 
  Clock,
  CheckCircle2,
  Forward,
  UserCheck,
  Volume2,
  Play,
  UtensilsCrossed,
  Package,
  Home,
  Shirt,
  Wine,
  Waves,
  Wrench,
  Cog,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion } from "motion/react";
import { ServiceRequest, InteriorTeam } from "../contexts/AppDataContext";
import { useAppData } from "../contexts/AppDataContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { toast } from "sonner";
import { useAcceptServiceRequest, useCompleteServiceRequest, useServiceRequestsApi } from "../hooks/useServiceRequestsApi";
import { useCrewMembers } from "../hooks/useCrewMembers";
import { useAssignments } from "../hooks/useAssignments";
import { useShifts } from "../hooks/useShifts";
import { getOnDutyCrew } from "../utils/crew-utils";

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
  const { forwardServiceRequest, addActivityLog } = useAppData(); // Forward not yet implemented in backend

  // ✅ GET DATA FROM REAL DATABASE (NOT MOCK DATA!)
  const { crewMembers: apiCrewMembers } = useCrewMembers();
  const { data: apiAssignments = [] } = useAssignments({});
  const { data: apiShifts = [] } = useShifts();

  const acceptMutation = useAcceptServiceRequest();
  const [timeAgo, setTimeAgo] = useState<string>("Just now");
  const [showDelegateDropdown, setShowDelegateDropdown] = useState(false);
  const [showAvailableCrew, setShowAvailableCrew] = useState(false);
  const [showForwardDropdown, setShowForwardDropdown] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  // Department/Team options for forwarding
  const forwardOptions = [
    { value: 'Galley', label: 'Galley', icon: UtensilsCrossed },
    { value: 'Laundry', label: 'Laundry', icon: Shirt },
    { value: 'Engineering', label: 'Engineering', icon: Wrench },
    { value: 'ETO', label: 'ETO (Technical)', icon: Cog },
    { value: 'Housekeeping', label: 'Housekeeping', icon: Home },
    { value: 'Pantry', label: 'Pantry', icon: Package },
    { value: 'Bar Service', label: 'Bar Service', icon: Wine },
    { value: 'Deck Service', label: 'Deck Service', icon: Waves },
  ];

  // ✅ Get crew organized by duty status from REAL DATABASE ASSIGNMENTS
  const dutyStatus = getOnDutyCrew(apiCrewMembers, apiAssignments, apiShifts);
  const onDutyCrew = dutyStatus.onDuty;
  const availableCrew = apiCrewMembers.filter(
    (crew) => crew.department === 'Interior' && crew.status !== 'on-leave' && !onDutyCrew.find(c => c.id === crew.id)
  );

  useEffect(() => {
    if (!request) return;

    const updateTime = () => {
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
      setShowForwardDropdown(false);
    }
  }, [isOpen, request]);

  const handleAccept = () => {
    if (!request) return;

    // ✅ Get first on-duty crew member from REAL DATABASE ASSIGNMENTS
    const firstOnDutyCrew = onDutyCrew[0];

    if (!firstOnDutyCrew) {
      toast.error('No crew member currently on duty to accept request');
      console.log('❌ No on-duty crew found. onDutyCrew:', onDutyCrew);
      return;
    }

    console.log('✅ Accepting request with crew:', {
      requestId: request.id,
      crewId: firstOnDutyCrew.id,
      crewName: firstOnDutyCrew.name
    });

    // Call backend API to accept service request
    acceptMutation.mutate(
      { id: request.id, crewMemberId: firstOnDutyCrew.id },
      {
        onSuccess: () => {
          toast.success(`Request from ${request.guestName} accepted by ${firstOnDutyCrew.name}`);

          // ✅ Log to Activity Log
          if (addActivityLog) {
            addActivityLog({
              type: 'service',
              action: 'Request Accepted',
              user: firstOnDutyCrew.name,
              location: request.guestCabin || 'Unknown Location',
              details: `${firstOnDutyCrew.name} accepted ${request.requestType} request from ${request.guestName}`
            });
          }

          onClose();
        },
        onError: (error: any) => {
          console.error('❌ Accept failed:', error);
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

    console.log('✅ Delegating request to crew:', {
      requestId: request.id,
      crewId,
      crewName
    });

    // ✅ Use backend API to accept/delegate request
    acceptMutation.mutate(
      { id: request.id, crewMemberId: crewId },
      {
        onSuccess: () => {
          toast.success(`Request delegated to ${crewName}`);

          // ✅ Log to Activity Log
          if (addActivityLog) {
            addActivityLog({
              type: 'service',
              action: 'Request Delegated',
              user: crewName,
              location: request.guestCabin || 'Unknown Location',
              details: `Request from ${request.guestName} delegated to ${crewName}`
            });
          }

          setShowDelegateDropdown(false);
          setShowAvailableCrew(false);
          onClose();
        },
        onError: (error: any) => {
          console.error('❌ Delegate failed:', error);
          toast.error(error.message || 'Failed to delegate request');
        }
      }
    );
  };

  const handleForwardClick = () => {
    setShowDelegateDropdown(false); // Close delegate if open
    setShowForwardDropdown(!showForwardDropdown);
  };

  const handleSelectTeam = (teamValue: string) => {
    if (!request) return;
    
    forwardServiceRequest(request.id, teamValue as InteriorTeam);
    toast.success(`Request forwarded to ${teamValue}`);
    setShowForwardDropdown(false);
    onClose();
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
                <div className="font-semibold">{request.guestCabin}</div>
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
              </div>
            );
          })()}

          {request.notes && !request.voiceTranscript && (
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-2">Request Type</div>
              <p className="text-sm leading-relaxed">{request.notes}</p>
            </div>
          )}

          {/* Cabin Image */}
          {request.cabinImage && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img 
                src={request.cabinImage} 
                alt={request.guestCabin}
                className="w-full h-32 object-cover"
              />
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

          {/* Forward Dropdown */}
          {showForwardDropdown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="px-3 py-2 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">Forward to Team</p>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {forwardOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelectTeam(option.value)}
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
          
          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForwardClick}
              className="w-full"
            >
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to listen for new service requests with repeat notification support
 */
export function useIncomingRequests() {
  const { userPreferences } = useAppData();
  // ✅ GET SERVICE REQUESTS FROM REAL DATABASE (NOT MOCK DATA!)
  const { serviceRequests: apiServiceRequests } = useServiceRequestsApi();

  // Transform API data to expected format
  const serviceRequests = useMemo(() => {
    return apiServiceRequests.map((apiReq: any) => ({
      ...apiReq,
      timestamp: new Date(apiReq.createdAt),
      acceptedAt: apiReq.acceptedAt ? new Date(apiReq.acceptedAt) : undefined,
      guestName: apiReq.guest ? `${apiReq.guest.firstName} ${apiReq.guest.lastName}` : apiReq.guestName || 'Unknown Guest',
      guestCabin: apiReq.location?.name || apiReq.guestCabin || 'Unknown Location',
      cabinImage: apiReq.location?.imageUrl || apiReq.cabinImage,
    }));
  }, [apiServiceRequests]);

  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [lastShownTime, setLastShownTime] = useState<Record<string, number>>({});
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastClosedTime, setLastClosedTime] = useState<number>(0);
  const [initializationTime, setInitializationTime] = useState<number>(0);
  const [preExistingRequestIds, setPreExistingRequestIds] = useState<Set<string>>(new Set());

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

  // Mark as initialized after 2 seconds AND mark all existing pending requests as "already shown"
  // This prevents old pending requests from triggering dialogs
  useEffect(() => {
    const timer = setTimeout(() => {
      const now = Date.now();

      // Mark all existing pending requests as already shown (with timestamp WAY in past)
      // so they won't trigger dialogs unless repeat interval has passed
      const existingPendingRequests = serviceRequests.filter(req => req.status === 'pending');
      const initialShownTimes: Record<string, number> = {};
      const preExistingIds = new Set<string>();

      existingPendingRequests.forEach(req => {
        // Set to 1 hour ago so they won't show up immediately
        initialShownTimes[req.id] = now - (60 * 60 * 1000);
        // Remember this request as pre-existing (will never repeat)
        preExistingIds.add(req.id);
      });

      setLastShownTime(initialShownTimes);
      setPreExistingRequestIds(preExistingIds);
      setIsInitialized(true);
      setInitializationTime(now);

      console.log('🔔 Dialog initialized - marked', existingPendingRequests.length, 'existing requests as pre-existing (will not repeat)');
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

    console.log('🔍 Dialog check:', {
      pendingCount: pendingRequests.length,
      initTime: new Date(initializationTime).toISOString(),
      cooldownRemaining: Math.max(0, cooldownPeriod - (now - lastClosedTime))
    });

    for (const request of pendingRequests) {
      const age = now - request.timestamp.getTime();
      const lastShown = lastShownTime[request.id];

      // Additional guard: prevent showing same request if shown very recently (within 1500ms)
      const shownRecently = lastShown && (now - lastShown) < 1500;

      // Show if:
      // 1. New request created AFTER initialization (< 5 seconds old AND created after init) OR
      // 2. Repeat interval passed since last shown (ONLY for requests created AFTER initialization)
      const wasCreatedAfterInit = request.timestamp.getTime() > initializationTime;
      const isNewRequest = age < 5000 && request.id !== lastRequestId && wasCreatedAfterInit;

      // ✅ FIX: Don't repeat pre-existing requests (prevents showing old pending requests after page refresh)
      const isPreExisting = preExistingRequestIds.has(request.id);
      const shouldRepeat = !isPreExisting && repeatInterval > 0 && lastShown && (now - lastShown) >= repeatInterval;

      console.log('  Request', request.id.slice(-4), {
        age: Math.round(age / 1000) + 's',
        lastShown: lastShown ? Math.round((now - lastShown) / 1000) + 's ago' : 'never',
        wasCreatedAfterInit,
        isPreExisting,
        isNewRequest,
        shouldRepeat,
        shownRecently,
        willShow: (isNewRequest || shouldRepeat) && !shownRecently
      });

      if ((isNewRequest || shouldRepeat) && !shownRecently) {
        console.log('✅ Showing dialog for request:', request.id);
        setLastRequestId(request.id);
        setLastShownTime(prev => ({ ...prev, [request.id]: now }));
        setCurrentRequest(request);
        setShowDialog(true);
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
