import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Bell,
  AlertCircle,
  Play,
  CheckCircle2,
  Send,
  Clock,
  User,
  MapPin,
  MessageSquare,
  Volume2,
  Maximize,
  Minimize,
  ArrowRight,
  UtensilsCrossed,
  Package,
  Home,
  Shirt,
  Wine,
  Waves,
  Settings,
  Wifi,
  WifiOff,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAppData } from '../../contexts/AppDataContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import type { ServiceRequest, InteriorTeam } from '../../contexts/AppDataContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ServiceRequestsSettingsDialog } from '../service-requests-settings-dialog';
import { ServingRequestCard } from '../serving-request-card';
import { useCreateServiceRequest, useAcceptServiceRequest, useCompleteServiceRequest, useUpdateServiceRequest } from '../../hooks/useServiceRequestsApi';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { api } from '../../services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface ServiceRequestsPageProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function ServiceRequestsPage({
  isFullscreen: externalFullscreen,
  onToggleFullscreen: externalToggleFullscreen
}: ServiceRequestsPageProps = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { preferences } = useUserPreferences();

  const {
    serviceRequests,
    delegateServiceRequest,
    // simulateNewRequest removed - using API directly
    // forwardServiceRequest removed - using service categories instead
    serviceRequestHistory,
    clearServiceRequestHistory,
    crewMembers,
    getCurrentDutyStatus,
  } = useAppData();

  // Get user preferences from backend API
  const userPreferences = {
    serviceRequestDisplayMode: (preferences?.serviceRequestDisplayMode || 'location') as 'guest-name' | 'location',
    servingNowTimeout: preferences?.serviceRequestServingTimeout || 5,
    requestDialogRepeatInterval: preferences?.requestDialogRepeatInterval || 60,
    soundEnabled: preferences?.serviceRequestSoundAlerts !== false,
  };

  const createServiceRequest = useCreateServiceRequest();
  const { mutate: acceptRequest } = useAcceptServiceRequest();
  const { mutate: completeRequest } = useCompleteServiceRequest();
  const { mutate: updateRequest } = useUpdateServiceRequest();

  // Clear all service requests mutation
  const clearAllMutation = useMutation({
    mutationFn: () => api.serviceRequests.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['service-requests-api'] });
      toast.success('All service requests cleared');
      setClearAllDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear requests');
    }
  });

  // WebSocket for real-time updates
  const { isConnected: wsConnected, on: wsOn, off: wsOff } = useWebSocket();

  // Track completing requests with timers
  const [completingRequests, setCompletingRequests] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every second for live timers in ServingRequestCard
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket listeners for sound notifications only
  // NOTE: Query invalidation is handled in useServiceRequestsApi hook to prevent duplicate fetches
  useEffect(() => {
    if (!wsOn || !wsOff) return;

    // Handle new service request sound notification
    const handleServiceRequestCreated = (data: any) => {
      console.log('📞 New service request - playing sound');

      // Play notification sound for new requests
      if (userPreferences?.soundEnabled !== false) {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch((e) => console.log('Could not play notification sound:', e));
        } catch (e) {
          console.log('Notification sound not available');
        }
      }
    };

    const unsubscribeCreated = wsOn('service-request:created', handleServiceRequestCreated);

    // Cleanup
    return () => {
      if (unsubscribeCreated) unsubscribeCreated();
    };
  }, [wsOn, wsOff, userPreferences]);

  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedCrewMember, setSelectedCrewMember] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [showAvailableCrew, setShowAvailableCrew] = useState(false);

  // Use external fullscreen state if provided, otherwise use internal
  const isFullscreen = externalFullscreen !== undefined ? externalFullscreen : internalFullscreen;

  // Toggle fullscreen using Fullscreen API
  const toggleFullscreen = useCallback(() => {
    if (externalToggleFullscreen) {
      externalToggleFullscreen();
      return;
    }

    // Check if Fullscreen API is available and allowed
    if (!document.fullscreenEnabled) {
      // Fallback: Use CSS-based fullscreen simulation
      setInternalFullscreen(!internalFullscreen);
      if (!internalFullscreen) {
        toast.success('Fullscreen mode activated');
      }
      return;
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        // Silently fallback to CSS fullscreen instead of showing error
        console.warn('Fullscreen API not available, using CSS fallback:', err.message);
        setInternalFullscreen(true);
        toast.success('Fullscreen mode activated');
      });
      setInternalFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {
        // Fallback for exit
        setInternalFullscreen(false);
      });
      setInternalFullscreen(false);
    }
  }, [externalToggleFullscreen, internalFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (externalFullscreen === undefined) {
        setInternalFullscreen(!!document.fullscreenElement);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [externalFullscreen]);

  // Get service categories from backend
  const { data: serviceCategories = [], isLoading: categoriesLoading } = useServiceCategories();
  const activeCategories = serviceCategories.filter(cat => cat.isActive);

  // Separate pending, serving, and completing requests
  const pendingRequests = useMemo(() => {
    return serviceRequests.filter(request => request.status === 'pending');
  }, [serviceRequests]);

  const servingRequests = useMemo(() => {
    return serviceRequests.filter(request => request.status === 'accepted');
  }, [serviceRequests]);

  const completedRequestsWithTimer = useMemo(() => {
    return serviceRequests.filter(request => 
      request.status === 'completed' && completingRequests[request.id] !== undefined
    );
  }, [serviceRequests, completingRequests]);

  // Get stats
  const stats = useMemo(() => {
    const pending = serviceRequests.filter(r => r.status === 'pending').length;
    const urgent = serviceRequests.filter(r => r.priority === 'urgent' && r.status === 'pending').length;
    const emergency = serviceRequests.filter(r => r.priority === 'emergency' && r.status === 'pending').length;
    const accepted = serviceRequests.filter(r => r.status === 'accepted').length;

    return { pending, urgent, emergency, accepted };
  }, [serviceRequests]);

  // Get crew organized by duty status (matching popup window implementation)
  const dutyStatus = getCurrentDutyStatus();
  const onDutyCrewMembers = dutyStatus.onDuty.filter(
    (crew) => crew.department === 'Interior'
  );

  // Get available (off-duty) crew members for delegation
  const availableCrewMembers = crewMembers.filter(
    (crew) => crew.department === 'Interior' &&
     crew.status !== 'on-leave' &&
     !onDutyCrewMembers.find(c => c.id === crew.id)
  );

  const handleAccept = (request: ServiceRequest) => {
    // Get current crew member from authenticated user
    const currentCrewMember = crewMembers.find(crew => crew.userId === user?.id);

    if (!currentCrewMember) {
      toast.error('You must be associated with a crew member to accept requests');
      console.error('No crew member found for user:', user?.id);
      return;
    }

    acceptRequest(
      { id: request.id, crewId: currentCrewMember.id },
      {
        onSuccess: () => {
          toast.success(`Now serving ${userPreferences.serviceRequestDisplayMode === 'guest-name' ? request.guestName : request.guestCabin}`);
        },
        onError: (error) => {
          toast.error('Failed to accept request');
          console.error(error);
        }
      }
    );
  };

  const handleDelegateClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setSelectedCrewMember(''); // Reset selection
    setShowAvailableCrew(false); // Start with Available Crew collapsed
    setDelegateDialogOpen(true);
  };

  const handleForwardClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setForwardDialogOpen(true);
  };

  const confirmDelegate = () => {
    if (!selectedRequest || !selectedCrewMember) return;

    // Find crew member name from both on-duty and available crew
    const allCrew = [...onDutyCrewMembers, ...availableCrewMembers];
    const crewMember = allCrew.find(c => c.id === selectedCrewMember);
    const crewName = crewMember?.name || 'crew member';

    // Use same API method as popup window (acceptRequest hook)
    acceptRequest(
      { id: selectedRequest.id, crewId: selectedCrewMember },
      {
        onSuccess: () => {
          toast.success(`Request delegated to ${crewName}`);
          setDelegateDialogOpen(false);
          setSelectedRequest(null);
          setSelectedCrewMember('');
          setShowAvailableCrew(false); // Reset collapsible state
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to delegate request');
        }
      }
    );
  };

  const confirmForward = () => {
    if (!selectedRequest || !selectedCategoryId) return;

    const selectedCategory = serviceCategories.find(cat => cat.id === selectedCategoryId);
    if (!selectedCategory) return;

    // Update service request with categoryId
    updateRequest(
      {
        id: selectedRequest.id,
        data: {
          categoryId: selectedCategoryId,
          // Don't change status - backend doesn't support 'delegated'
          // Request keeps its current status (pending/IN_PROGRESS/etc)
        },
      },
      {
        onSuccess: () => {
          toast.success(`Request forwarded to ${selectedCategory.name}`);
          setForwardDialogOpen(false);
          setSelectedRequest(null);
          setSelectedCategoryId('');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to forward request');
        },
      }
    );
  };

  const handleComplete = (request: ServiceRequest) => {
    completeRequest(request.id, {
      onSuccess: () => {
        // Start countdown timer
        const timeoutSeconds = userPreferences.servingNowTimeout || 5;
        setCompletingRequests(prev => ({ ...prev, [request.id]: timeoutSeconds }));

        toast.success(`Completed! Removing in ${timeoutSeconds}s...`);
      },
      onError: (error) => {
        toast.error('Failed to complete request');
        console.error(error);
      }
    });
  };

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCompletingRequests(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(requestId => {
          if (updated[requestId] > 0) {
            updated[requestId] -= 1;
            hasChanges = true;
          } else {
            // Timer reached 0, remove from tracking
            delete updated[requestId];
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePlayAudio = (requestId: string, audioUrl?: string) => {
    if (!audioUrl) {
      toast.error('No audio recording available');
      return;
    }

    // Stop currently playing audio if any
    if (playingAudio) {
      setPlayingAudio(null);
    }

    // Create audio element and play
    const audio = new Audio(audioUrl);
    setPlayingAudio(requestId);
    
    audio.onended = () => {
      setPlayingAudio(null);
    };
    
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      toast.error('Failed to play audio recording');
      setPlayingAudio(null);
    };
    
    audio.onloadeddata = () => {
      toast.success('Playing voice message...');
    };
    
    audio.play().catch(err => {
      console.error('Audio play error:', err);
      toast.error('Failed to play audio. Please check the audio file.');
      setPlayingAudio(null);
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'bg-destructive/20 border-destructive text-destructive';
      case 'urgent':
        return 'bg-warning/20 border-warning/50 text-foreground';
      default:
        return 'bg-card border-border text-foreground';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'emergency':
        return 'destructive';
      case 'urgent':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  return (
    <div className={`flex h-full overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999] bg-background' : ''}`}>
      {/* Main Content - NO LEFT SIDEBAR */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Only Simulate Request and Fullscreen buttons */}
        <div className="border-b border-border bg-background">
          <div className={`px-6 pt-4 pb-4 ${isFullscreen ? 'px-8' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="mb-1">Service Requests</h2>
                <p className="text-sm text-muted-foreground">
                  Live guest call button requests from all cabins
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* WebSocket Status Indicator */}
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                    wsConnected
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'bg-red-500/10 text-red-700 dark:text-red-400'
                  }`}
                  title={wsConnected ? 'Real-time updates active' : 'Real-time updates offline'}
                >
                  {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  <span className="hidden sm:inline">{wsConnected ? 'Live' : 'Offline'}</span>
                </div>

                {/* Status Badge - Show count */}
                {stats.pending > 0 && (
                  <Badge variant="destructive" className={`animate-pulse ${isFullscreen ? 'text-lg px-6 py-3' : 'text-base px-4 py-2'}`}>
                    {stats.pending} Active
                  </Badge>
                )}

                {/* Test Request Button - Creates real service request via API */}
                <Button
                  variant="secondary"
                  size={isFullscreen ? 'lg' : 'default'}
                  onClick={() => {
                    // Create a test request - in production this would come from smart buttons
                    createServiceRequest.mutate({
                      priority: 'normal',
                      message: 'Test service request created from UI',
                      status: 'pending'
                    });
                  }}
                  disabled={createServiceRequest.isPending}
                  className={`gap-2 ${isFullscreen ? 'h-14 px-6' : ''}`}
                >
                  <Bell className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  {createServiceRequest.isPending ? 'Creating...' : 'Test Request'}
                </Button>

                {/* Clear All Requests Button */}
                <Button
                  variant="destructive"
                  size={isFullscreen ? 'lg' : 'default'}
                  onClick={() => setClearAllDialogOpen(true)}
                  disabled={clearAllMutation.isPending || serviceRequests.length === 0}
                  className={`gap-2 ${isFullscreen ? 'h-14 px-6' : ''}`}
                >
                  <Trash2 className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                  {clearAllMutation.isPending ? 'Clearing...' : 'Clear All'}
                </Button>

                {/* Settings Button */}
                <Button
                  variant="outline"
                  size={isFullscreen ? 'lg' : 'default'}
                  onClick={() => setSettingsDialogOpen(true)}
                  className={isFullscreen ? 'h-14 px-6' : ''}
                >
                  <Settings className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                  Settings
                </Button>

                {/* Fullscreen Toggle */}
                <Button
                  variant="outline"
                  size={isFullscreen ? 'lg' : 'default'}
                  onClick={toggleFullscreen}
                  className={isFullscreen ? 'h-14 px-6' : ''}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize className="h-5 w-5 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Maximize className="h-4 w-4 mr-2" />
                      Fullscreen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Request Cards - Two Column Layout */}
        <div className="flex-1 overflow-hidden bg-background flex">
          {/* LEFT COLUMN - Pending Requests */}
          <div className={`flex-1 overflow-y-auto border-r border-border ${isFullscreen ? 'p-8' : 'p-6'}`}>
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-6 sticky top-0 bg-background pb-4 z-10">
                  <div className="h-1 w-12 bg-gradient-to-r from-destructive/50 to-transparent rounded-full" />
                  <h3 className={`${isFullscreen ? 'text-xl' : 'text-base'} font-medium`}>
                    Pending Requests
                  </h3>
                  <Badge variant="destructive" className={`${isFullscreen ? 'text-base px-4 py-2 animate-pulse' : 'animate-pulse'}`}>
                    {pendingRequests.length}
                  </Badge>
                  <div className="flex-1 h-1 bg-gradient-to-l from-destructive/50 to-transparent rounded-full" />
                </div>

                {/* Pending Request Cards with Beautiful Yacht Room Images */}
                <div className="grid gap-6">
                  {pendingRequests.map((request) => (
                    <Card
                      key={`${request.id}-${userPreferences.serviceRequestDisplayMode}`}
                      className={`relative overflow-hidden border-2 ${getPriorityColor(request.priority)} group hover:shadow-xl transition-all`}
                    >
                      {/* Cabin/Location Image Background with LIGHT Overlay to show image */}
                      {request.cabinImage && (
                        <div className="absolute inset-0 z-0">
                          <ImageWithFallback
                            src={request.cabinImage}
                            alt={`${request.guestCabin} interior`}
                            className="w-full h-full object-cover"
                          />
                          {/* Much lighter gradient to showcase beautiful yacht images */}
                          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/70 to-background/50" />
                        </div>
                      )}

                      {/* Content */}
                      <div className={`relative z-10 ${isFullscreen ? 'p-8' : 'p-6'}`}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                                <User className={`${isFullscreen ? 'h-7 w-7' : 'h-6 w-6'} text-primary`} />
                              ) : (
                                <MapPin className={`${isFullscreen ? 'h-7 w-7' : 'h-6 w-6'} text-primary`} />
                              )}
                              <h4 className={isFullscreen ? 'text-2xl' : 'text-xl'}>
                                {userPreferences.serviceRequestDisplayMode === 'guest-name' 
                                  ? request.guestName 
                                  : request.guestCabin}
                              </h4>
                              <Badge
                                variant={getPriorityBadgeColor(request.priority) as any}
                                className={`${isFullscreen ? 'text-sm px-3 py-1' : 'text-xs'} uppercase`}
                              >
                                {request.priority}
                              </Badge>
                              {request.category && (
                                <Badge
                                  variant="secondary"
                                  className={`${isFullscreen ? 'text-sm px-3 py-1' : 'text-xs'}`}
                                  style={{ backgroundColor: `${request.category.color}20`, color: request.category.color, borderColor: request.category.color }}
                                >
                                  <span className="mr-1">{request.category.icon}</span>
                                  {request.category.name}
                                </Badge>
                              )}
                            </div>
                            <div className={`flex items-center gap-4 ${isFullscreen ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                              {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                                <span className="flex items-center gap-2">
                                  <MapPin className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                                  {request.guestCabin}
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <User className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                                  {request.guestName}
                                </span>
                              )}
                              <span className="flex items-center gap-2">
                                <Clock className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                                {getTimeAgo(request.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          <Bell className={`${isFullscreen ? 'h-10 w-10' : 'h-8 w-8'} text-destructive animate-pulse`} />
                        </div>

                        {/* Voice Transcript - LARGE & PROMINENT */}
                        {request.voiceTranscript && (
                          <div className="mb-6 p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl border-2 border-primary/30 shadow-lg">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-start gap-3">
                                <MessageSquare className={`${isFullscreen ? 'h-7 w-7' : 'h-6 w-6'} text-primary mt-1`} />
                                <p className={`${isFullscreen ? 'text-lg' : 'text-base'} font-semibold text-primary`}>
                                  Voice Transcript
                                </p>
                              </div>
                              {request.voiceAudioUrl && (
                                <Button
                                  size={isFullscreen ? 'default' : 'sm'}
                                  variant="outline"
                                  onClick={() => handlePlayAudio(request.id, request.voiceAudioUrl)}
                                  className={`gap-2 ${playingAudio === request.id ? 'animate-pulse' : ''}`}
                                >
                                  <Volume2 className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'}`} />
                                  {playingAudio === request.id ? 'Playing...' : 'Play Audio'}
                                </Button>
                              )}
                            </div>
                            <p className={`${isFullscreen ? 'text-3xl' : 'text-2xl'} font-medium leading-relaxed pl-10 text-foreground`}>
                              "{request.voiceTranscript}"
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                          <Button
                            size={isFullscreen ? 'lg' : 'default'}
                            onClick={() => handleAccept(request)}
                            className={`flex-1 ${isFullscreen ? 'h-12 text-base' : ''}`}
                          >
                            <Play className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                            Accept
                          </Button>
                          <Button
                            size={isFullscreen ? 'lg' : 'default'}
                            variant="outline"
                            onClick={() => handleDelegateClick(request)}
                            className={`flex-1 ${isFullscreen ? 'h-12 text-base' : ''}`}
                          >
                            <Send className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                            Delegate
                          </Button>
                          <Button
                            size={isFullscreen ? 'lg' : 'default'}
                            variant="outline"
                            onClick={() => handleForwardClick(request)}
                            className={`${isFullscreen ? 'h-12 px-6 text-base' : ''}`}
                          >
                            <ArrowRight className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                            Forward
                          </Button>
                        </div>
                      </div>

                      {/* Priority Pulse Animation for Emergency */}
                      {request.priority === 'emergency' && (
                        <div className="absolute top-3 right-3 z-20">
                          <div className="relative">
                            <div className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'} bg-destructive rounded-full animate-ping absolute`} />
                            <div className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'} bg-destructive rounded-full`} />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <Bell className={`${isFullscreen ? 'h-20 w-20' : 'h-12 w-12'} mx-auto mb-3 text-muted-foreground opacity-20`} />
                  <h3 className={`${isFullscreen ? 'text-lg' : 'text-sm'} mb-1`}>No Pending Requests</h3>
                  <p className={`${isFullscreen ? 'text-base' : 'text-xs'} text-muted-foreground`}>
                    All requests have been handled
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Serving Now */}
          <div className={`flex-1 overflow-y-auto ${isFullscreen ? 'p-8' : 'p-6'}`}>
            {/* Serving Now Section */}
            {servingRequests.length > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-6 sticky top-0 bg-background pb-4 z-10">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent rounded-full" />
                  <h3 className={`${isFullscreen ? 'text-xl' : 'text-base'} font-medium`}>
                    Serving Now
                  </h3>
                  <Badge variant="default" className={`${isFullscreen ? 'text-base px-4 py-2' : ''}`}>
                    {servingRequests.length}
                  </Badge>
                  <div className="flex-1 h-1 bg-gradient-to-l from-primary to-transparent rounded-full" />
                </div>

                <div className="grid gap-4">
                  {servingRequests.map((request) => (
                    <ServingRequestCard
                      key={`${request.id}-${userPreferences.serviceRequestDisplayMode}`}
                      request={request}
                      onComplete={handleComplete}
                      isFullscreen={isFullscreen}
                      userPreferences={userPreferences}
                      currentTime={currentTime}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <CheckCircle2 className={`${isFullscreen ? 'h-20 w-20' : 'h-12 w-12'} mx-auto mb-3 text-muted-foreground opacity-20`} />
                  <h3 className={`${isFullscreen ? 'text-lg' : 'text-sm'} mb-1`}>No Active Service</h3>
                  <p className={`${isFullscreen ? 'text-base' : 'text-xs'} text-muted-foreground`}>
                    Accept requests to begin serving
                  </p>
                </div>
              </div>
            )}

            {/* Completed with Timer Section - Show below Serving Now in right column */}
            {completedRequestsWithTimer.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-chart-3/50 to-transparent rounded-full" />
                  <h3 className={`${isFullscreen ? 'text-xl' : 'text-base'} font-medium`}>
                    Completed (Clearing...)
                  </h3>
                  <Badge variant="outline" className={`${isFullscreen ? 'text-base px-4 py-2' : ''} bg-chart-3/10 border-chart-3`}>
                    {completedRequestsWithTimer.length}
                  </Badge>
                  <div className="flex-1 h-1 bg-gradient-to-l from-chart-3/50 to-transparent rounded-full" />
                </div>

                <div className="grid gap-4">
                  {completedRequestsWithTimer.map((request) => {
                    const timeLeft = completingRequests[request.id] || 0;
                    return (
                      <Card
                        key={`${request.id}-${userPreferences.serviceRequestDisplayMode}`}
                        className="relative overflow-hidden border-2 border-chart-3/30 bg-chart-3/5"
                      >
                        <div className={`relative z-10 ${isFullscreen ? 'p-6' : 'p-4'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                                  <User className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} text-chart-3`} />
                                ) : (
                                  <MapPin className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} text-chart-3`} />
                                )}
                                <h4 className={isFullscreen ? 'text-xl' : 'text-base'}>
                                  {userPreferences.serviceRequestDisplayMode === 'guest-name' 
                                    ? request.guestName 
                                    : request.guestCabin}
                                </h4>
                                <Badge variant="outline" className={`${isFullscreen ? 'text-sm' : 'text-xs'} bg-chart-3/10 border-chart-3`}>
                                  ✓ Complete
                                </Badge>
                                {request.category && (
                                  <Badge
                                    variant="secondary"
                                    className={`${isFullscreen ? 'text-sm px-3 py-1' : 'text-xs'}`}
                                    style={{ backgroundColor: `${request.category.color}20`, color: request.category.color, borderColor: request.category.color }}
                                  >
                                    <span className="mr-1">{request.category.icon}</span>
                                    {request.category.name}
                                  </Badge>
                                )}
                              </div>
                              <div className={`flex items-center gap-3 ${isFullscreen ? 'text-base' : 'text-sm'} text-muted-foreground`}>
                                <span className="flex items-center gap-1.5">
                                  <Clock className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                  Clearing in {timeLeft}s
                                </span>
                              </div>
                            </div>
                            <div className={`${isFullscreen ? 'text-4xl' : 'text-3xl'} font-bold text-chart-3`}>
                              {timeLeft}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forward to Team Dialog */}
      <Dialog open={forwardDialogOpen} onOpenChange={setForwardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forward to Team</DialogTitle>
            <DialogDescription>
              {selectedRequest &&
                `Forward ${selectedRequest.guestName}'s request to a specific Interior team`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Request Summary */}
            {selectedRequest && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {selectedRequest.guestName} - {selectedRequest.guestCabin}
                    </p>
                    {selectedRequest.voiceTranscript && (
                      <p className="text-xs text-muted-foreground italic">
                        "{selectedRequest.voiceTranscript.substring(0, 100)}..."
                      </p>
                    )}
                  </div>
                  <Badge variant={getPriorityBadgeColor(selectedRequest.priority) as any}>
                    {selectedRequest.priority}
                  </Badge>
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="forward-category">Forward to Service Category</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger id="forward-category">
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Loading categories...
                    </div>
                  ) : activeCategories.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No active service categories
                    </div>
                  ) : (
                    activeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setForwardDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmForward}
              disabled={!selectedCategoryId || categoriesLoading}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={delegateDialogOpen} onOpenChange={setDelegateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate Request</DialogTitle>
            <DialogDescription>
              {selectedRequest &&
                `Assign ${selectedRequest.guestName}'s request to another crew member`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Request Summary */}
            {selectedRequest && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {selectedRequest.guestName} - {selectedRequest.guestCabin}
                    </p>
                    {selectedRequest.voiceTranscript && (
                      <p className="text-xs text-muted-foreground italic">
                        "{selectedRequest.voiceTranscript.substring(0, 80)}..."
                      </p>
                    )}
                  </div>
                  <Badge variant={getPriorityBadgeColor(selectedRequest.priority) as any}>
                    {selectedRequest.priority}
                  </Badge>
                </div>
              </div>
            )}

            {/* Crew Member Selection - Two Section UI */}
            <div className="space-y-2">
              <Label>Assign to Crew Member</Label>

              <div className="rounded-lg border border-border bg-card overflow-hidden">
                {/* On-Duty Crew Section - Always Visible */}
                {onDutyCrewMembers.length > 0 && (
                  <div className={availableCrewMembers.length > 0 ? "border-b border-border" : ""}>
                    <div className="px-3 py-2 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground">On Duty</p>
                    </div>
                    <div className="divide-y divide-border">
                      {onDutyCrewMembers.map((crew) => (
                        <button
                          key={crew.id}
                          onClick={() => setSelectedCrewMember(crew.id)}
                          className={`w-full px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors text-left ${
                            selectedCrewMember === crew.id ? 'bg-primary/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                            <span className="font-medium truncate">{crew.name}</span>
                            <span className="text-xs text-muted-foreground truncate">({crew.position})</span>
                          </div>
                          {selectedCrewMember === crew.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Crew Section - Collapsible */}
                {availableCrewMembers.length > 0 && (
                  <div>
                    {/* Collapsible Header */}
                    <button
                      onClick={() => setShowAvailableCrew(!showAvailableCrew)}
                      className="w-full px-3 py-2 bg-muted/30 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-xs font-medium text-muted-foreground">Available Crew ({availableCrewMembers.length})</p>
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
                        {availableCrewMembers.map((crew) => (
                          <button
                            key={crew.id}
                            onClick={() => setSelectedCrewMember(crew.id)}
                            className={`w-full px-3 py-2.5 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left ${
                              selectedCrewMember === crew.id ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-muted flex-shrink-0" />
                              <span className="truncate">{crew.name}</span>
                              <span className="text-xs text-muted-foreground truncate">({crew.position})</span>
                            </div>
                            {selectedCrewMember === crew.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}

                {onDutyCrewMembers.length === 0 && availableCrewMembers.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No crew members available
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDelegateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelegate}
              disabled={!selectedCrewMember || (onDutyCrewMembers.length === 0 && availableCrewMembers.length === 0)}
            >
              <Send className="h-4 w-4 mr-2" />
              Delegate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <ServiceRequestsSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />

      {/* Clear All Requests Confirmation Dialog */}
      <Dialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Service Requests?</DialogTitle>
            <DialogDescription>
              This will permanently delete all service requests from the database.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">
                    Warning: This will delete {serviceRequests.length} service request{serviceRequests.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All pending, active, and completed requests will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setClearAllDialogOpen(false)}
              disabled={clearAllMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearAllMutation.isPending ? 'Clearing...' : 'Clear All Requests'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
