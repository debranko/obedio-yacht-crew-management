import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';
import type { ServiceRequest, InteriorTeam } from '../../contexts/AppDataContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ServiceRequestsSettingsDialog } from '../service-requests-settings-dialog';
import { ServingRequestCard } from '../serving-request-card';
import { useCreateServiceRequest, useCompleteServiceRequest, useCancelServiceRequest, useAcceptServiceRequest, useServiceRequestsApi } from '../../hooks/useServiceRequestsApi';
import { useServiceCategories } from '../../hooks/useServiceCategories';
import { useCrewMembers } from '../../hooks/useCrewMembers';
import { useAssignments } from '../../hooks/useAssignments';
import { useShifts } from '../../hooks/useShifts';
import { getOnDutyCrew } from '../../utils/crew-utils';
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
import { authService } from '../../services/auth';
import { getPriorityColor, getPriorityBadgeColor, getTimeAgo } from '../../utils/service-request-utils';

interface ServiceRequestsPageProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function ServiceRequestsPage({
  isFullscreen: externalFullscreen,
  onToggleFullscreen: externalToggleFullscreen
}: ServiceRequestsPageProps = {}) {
  const {
    acceptServiceRequest,
    delegateServiceRequest,
    // simulateNewRequest removed - using API directly
    // forwardServiceRequest removed - using service categories instead
    serviceRequestHistory,
    clearServiceRequestHistory,
    userPreferences,
    addActivityLog,
  } = useAppData();

  // ✅ GET DATA FROM REAL DATABASE (NOT MOCK DATA!)
  const { serviceRequests: apiServiceRequests, isLoading: isLoadingRequests, refetch: refetchRequests } = useServiceRequestsApi();
  const { crewMembers: apiCrewMembers } = useCrewMembers();
  const { data: apiAssignments = [] } = useAssignments({});
  const { data: apiShifts = [] } = useShifts();

  const createServiceRequest = useCreateServiceRequest();

  // Use mutation to accept service request (saves to backend database)
  const acceptServiceRequestMutation = useAcceptServiceRequest();

  // Use mutations to complete/cancel service request (saves to backend database)
  const completeServiceRequestMutation = useCompleteServiceRequest();
  const cancelServiceRequestMutation = useCancelServiceRequest();

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

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedCrewMember, setSelectedCrewMember] = useState('');
  const [selectedCrewMemberId, setSelectedCrewMemberId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

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

  // Transform API data to format expected by components
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

  // ✅ Get crew members currently on duty from REAL DATABASE ASSIGNMENTS
  const dutyStatus = getOnDutyCrew(apiCrewMembers, apiAssignments, apiShifts);
  const onDutyCrewMembers = dutyStatus.onDuty.filter(
    (crew) => crew.department === 'Interior'  // Filter for Interior department only
  );

  const handleAccept = useCallback((request: ServiceRequest) => {
    setSelectedRequest(request);
    setAcceptDialogOpen(true);
  }, []);

  const confirmAccept = useCallback(async () => {
    if (!selectedRequest || !selectedCrewMemberId) return;

    try {
      // Accept request via API
      await acceptServiceRequestMutation.mutateAsync({
        id: selectedRequest.id,
        crewMemberId: selectedCrewMemberId,
      });

      // ✅ Manually refetch to ensure immediate UI update
      await refetchRequests();

      // Close dialog and reset
      setAcceptDialogOpen(false);
      setSelectedRequest(null);
      setSelectedCrewMember('');
      setSelectedCrewMemberId('');

      console.log('✅ Accept completed and UI refreshed');
      // Note: Success toast is shown by the mutation hook
    } catch (error) {
      console.error('Failed to accept service request:', error);
      // Error toast is shown by the mutation hook
    }
  }, [selectedRequest, selectedCrewMemberId, acceptServiceRequestMutation, refetchRequests]);

  const handleDelegateClick = useCallback((request: ServiceRequest) => {
    setSelectedRequest(request);
    setDelegateDialogOpen(true);
  }, []);

  const handleForwardClick = useCallback((request: ServiceRequest) => {
    setSelectedRequest(request);
    setForwardDialogOpen(true);
  }, []);

  const confirmDelegate = useCallback(async () => {
    if (!selectedRequest || !selectedCrewMemberId) return;

    try {
      // Delegate request via API (same endpoint as accept)
      await acceptServiceRequestMutation.mutateAsync({
        id: selectedRequest.id,
        crewMemberId: selectedCrewMemberId,
      });

      // ✅ Manually refetch to ensure immediate UI update
      await refetchRequests();

      // Close dialog and reset
      setDelegateDialogOpen(false);
      setSelectedRequest(null);
      setSelectedCrewMember('');
      setSelectedCrewMemberId('');

      console.log('✅ Delegate completed and UI refreshed');
      // Note: Success toast is shown by the mutation hook
    } catch (error) {
      console.error('Failed to delegate service request:', error);
      // Error toast is shown by the mutation hook
    }
  }, [selectedRequest, selectedCrewMemberId, acceptServiceRequestMutation, refetchRequests]);

  const confirmForward = useCallback(() => {
    if (!selectedRequest || !selectedCategoryId) return;

    const selectedCategory = serviceCategories.find(cat => cat.id === selectedCategoryId);
    if (!selectedCategory) return;

    // In production, this would update the service request with the categoryId
    // For now, just show success message
    toast.success(`Request forwarded to ${selectedCategory.name}`);

    setForwardDialogOpen(false);
    setSelectedRequest(null);
    setSelectedCategoryId('');
  }, [selectedRequest, selectedCategoryId, serviceCategories]);

  const handleComplete = useCallback(async (request: ServiceRequest) => {
    console.log('🎯 [Service Requests Page] FINISH BUTTON CLICKED', {
      requestId: request.id,
      requestStatus: request.status,
      requestGuestName: request.guestName,
      requestCabin: request.guestCabin,
      hasAcceptedAt: !!request.acceptedAt
    });

    try {
      console.log('🚀 [Service Requests Page] Calling complete mutation...');
      const result = await completeServiceRequestMutation.mutateAsync(request.id);
      console.log('✅ [Service Requests Page] Complete mutation succeeded:', result);

      // ✅ Manually refetch to ensure immediate UI update
      await refetchRequests();
      console.log('✅ [Service Requests Page] Service requests refreshed after completion');

      // Start countdown timer
      const timeoutSeconds = userPreferences.servingNowTimeout || 5;
      setCompletingRequests(prev => ({ ...prev, [request.id]: timeoutSeconds }));

      // Note: Success toast is shown by the mutation hook
    } catch (error: any) {
      console.error('❌ [Service Requests Page] Failed to complete service request:', {
        error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        requestId: request.id
      });
      // Error toast is shown by the mutation hook
      toast.error(`Failed to complete: ${error?.message || 'Unknown error'}`);
    }
  }, [completeServiceRequestMutation, userPreferences.servingNowTimeout, refetchRequests]);

  const handleCancel = useCallback(async (request: ServiceRequest) => {
    console.log('🚫 [Service Requests Page] CANCEL BUTTON CLICKED', {
      requestId: request.id,
      requestStatus: request.status,
      requestGuestName: request.guestName,
      requestCabin: request.guestCabin
    });

    try {
      console.log('🚀 [Service Requests Page] Calling cancel mutation...');
      const result = await cancelServiceRequestMutation.mutateAsync(request.id);
      console.log('✅ [Service Requests Page] Cancel mutation succeeded:', result);

      // ✅ Log to Activity Log
      if (addActivityLog) {
        const user = authService.getCurrentUser();
        const currentUserName = user?.name || user?.username || 'Staff';

        addActivityLog({
          type: 'service',
          action: 'Request Cancelled',
          user: currentUserName,
          location: request.guestCabin || 'Unknown Location',
          details: `${currentUserName} cancelled ${request.requestType} request from ${request.guestName}`
        });
      }

      // ✅ Manually refetch to ensure immediate UI update
      await refetchRequests();
      console.log('✅ [Service Requests Page] Service requests refreshed after cancellation');

      // Note: Success toast is shown by the mutation hook
    } catch (error: any) {
      console.error('❌ [Service Requests Page] Failed to cancel service request:', {
        error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        requestId: request.id
      });
      // Error toast is shown by the mutation hook
      toast.error(`Failed to cancel: ${error?.message || 'Unknown error'}`);
    }
  }, [cancelServiceRequestMutation, refetchRequests]);

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

    // In production, this would play the actual audio file
    // For now, just simulate play state
    setPlayingAudio(requestId);
    toast.info('Playing voice message...');

    // Simulate audio playback
    setTimeout(() => {
      setPlayingAudio(null);
    }, 3000);
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

        {/* Request Cards */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className={`p-6 ${isFullscreen ? 'p-8' : ''}`}>
            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
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
                <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-2 gap-8' : 'grid-cols-1 max-w-5xl'}`}>
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

                        {/* Voice Transcript */}
                        {request.voiceTranscript && (
                          <div className="mb-4 p-4 bg-card/70 backdrop-blur-sm rounded-lg border border-border shadow-sm">
                            <div className="flex items-start gap-2 mb-2">
                              <MessageSquare className={`${isFullscreen ? 'h-5 w-5' : 'h-4 w-4'} text-muted-foreground mt-0.5`} />
                              <p className={`${isFullscreen ? 'text-sm' : 'text-xs'} font-medium text-muted-foreground`}>
                                Voice Transcript
                              </p>
                            </div>
                            <p className={`${isFullscreen ? 'text-base' : 'text-sm'} leading-relaxed pl-7`}>
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
            )}

            {/* Serving Now Section - Show after pending */}
            {servingRequests.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-transparent rounded-full" />
                  <h3 className={`${isFullscreen ? 'text-xl' : 'text-base'} font-medium`}>
                    Serving Now
                  </h3>
                  <Badge variant="default" className={`${isFullscreen ? 'text-base px-4 py-2' : ''}`}>
                    {servingRequests.length}
                  </Badge>
                  <div className="flex-1 h-1 bg-gradient-to-l from-primary to-transparent rounded-full" />
                </div>

                <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                  {servingRequests.map((request) => (
                    <ServingRequestCard
                      key={`${request.id}-${userPreferences.serviceRequestDisplayMode}`}
                      request={request}
                      onComplete={handleComplete}
                      onCancel={handleCancel}
                      isFullscreen={isFullscreen}
                      userPreferences={userPreferences}
                      currentTime={currentTime}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed with Timer Section */}
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

                <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-2 gap-6' : 'grid-cols-1'}`}>
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

            {/* Empty State */}
            {pendingRequests.length === 0 && servingRequests.length === 0 && completedRequestsWithTimer.length === 0 && (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <Bell className={`${isFullscreen ? 'h-20 w-20' : 'h-12 w-12'} mx-auto mb-3 text-muted-foreground opacity-20`} />
                  <h3 className={`${isFullscreen ? 'text-lg' : 'text-sm'} mb-1`}>No Active Requests</h3>
                  <p className={`${isFullscreen ? 'text-base' : 'text-xs'} text-muted-foreground`}>
                    All guest requests have been handled
                  </p>
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

      {/* Accept Dialog - Select crew member to assign */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Service Request</DialogTitle>
            <DialogDescription>
              {selectedRequest &&
                `Select a crew member to handle ${selectedRequest.guestName}'s request`}
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

            {/* Crew Member Selection */}
            <div className="space-y-2">
              <Label htmlFor="accept-crew">Assign to Crew Member</Label>
              <Select
                value={selectedCrewMemberId}
                onValueChange={(crewId) => {
                  setSelectedCrewMemberId(crewId);
                  const crew = onDutyCrewMembers.find((c) => c.id === crewId);
                  setSelectedCrewMember(crew?.name || '');
                }}
              >
                <SelectTrigger id="accept-crew">
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {onDutyCrewMembers.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{crew.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({crew.position})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {onDutyCrewMembers.length === 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-xs text-warning">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                No crew members available
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAccept}
              disabled={!selectedCrewMemberId || onDutyCrewMembers.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Accept
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

            {/* Crew Member Selection */}
            <div className="space-y-2">
              <Label htmlFor="delegate-crew">Assign to Crew Member</Label>
              <Select
                value={selectedCrewMemberId}
                onValueChange={(crewId) => {
                  setSelectedCrewMemberId(crewId);
                  const crew = onDutyCrewMembers.find((c) => c.id === crewId);
                  setSelectedCrewMember(crew?.name || '');
                }}
              >
                <SelectTrigger id="delegate-crew">
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {onDutyCrewMembers.map((crew) => (
                    <SelectItem key={crew.id} value={crew.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{crew.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({crew.position})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {onDutyCrewMembers.length === 0 && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-md text-xs text-warning">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                No crew members currently on duty
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDelegateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelegate}
              disabled={!selectedCrewMemberId || onDutyCrewMembers.length === 0}
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
    </div>
  );
}
