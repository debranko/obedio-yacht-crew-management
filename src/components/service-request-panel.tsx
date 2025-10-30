import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import {
  Bell,
  CheckCircle2,
  UserCheck,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  MessageSquare,
  Send,
} from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import type { ServiceRequest } from '../contexts/AppDataContext';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useCompleteServiceRequest } from '../hooks/useServiceRequestsApi';
import { authService } from '../services/auth';
import { getPriorityColor, getPriorityBadgeColor, getTimeAgo } from '../utils/service-request-utils';

interface ServiceRequestPanelProps {
  serviceName: string; // e.g., "Galley", "Pantry", "Crew Mess"
}

export function ServiceRequestPanel({ serviceName }: ServiceRequestPanelProps) {
  const {
    serviceRequests,
    acceptServiceRequest,
    delegateServiceRequest,
    crewMembers,
    addActivityLog,
  } = useAppData();

  // Use mutation to complete service request (saves to backend database)
  const completeServiceRequestMutation = useCompleteServiceRequest();

  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [selectedCrewMember, setSelectedCrewMember] = useState('');

  // Get pending requests for this service area
  // Filter service requests that match this service category
  // In the future, this should filter by categoryId when service requests have that field
  const pendingRequests = serviceRequests.filter(request =>
    request.status === 'pending'
  );

  // Get on-duty crew members for delegation
  const onDutyCrewMembers = crewMembers.filter(
    (crew) => crew.status === 'on-duty' && crew.department === 'Interior'
  );

  const handleAccept = (request: ServiceRequest) => {
    const user = authService.getCurrentUser();
    const currentUserName = user?.name || user?.username || 'Staff';
    acceptServiceRequest(request.id, currentUserName);
    toast.success(`Request from ${request.guestName} accepted`);

    // ✅ Log to Activity Log
    if (addActivityLog) {
      addActivityLog({
        type: 'service',
        action: 'Request Accepted',
        user: currentUserName,
        location: request.guestCabin || 'Unknown Location',
        details: `${currentUserName} accepted ${request.requestType} request from ${request.guestName}`
      });
    }
  };

  const handleDelegateClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setDelegateDialogOpen(true);
  };

  const confirmDelegate = () => {
    if (!selectedRequest || !selectedCrewMember) return;

    delegateServiceRequest(selectedRequest.id, selectedCrewMember);
    toast.success(
      `Request delegated to ${selectedCrewMember}`
    );

    setDelegateDialogOpen(false);
    setSelectedRequest(null);
    setSelectedCrewMember('');
  };

  const handleComplete = async (request: ServiceRequest) => {
    try {
      // Complete request in backend database
      await completeServiceRequestMutation.mutateAsync(request.id);
      // Success toast is shown by the mutation hook

      // ✅ Log to Activity Log
      if (addActivityLog) {
        const user = authService.getCurrentUser();
        const currentUserName = user?.name || user?.username || 'Staff';

        addActivityLog({
          type: 'service',
          action: 'Request Completed',
          user: currentUserName,
          location: request.guestCabin || 'Unknown Location',
          details: `${currentUserName} completed ${request.requestType} request from ${request.guestName}`
        });
      }
    } catch (error) {
      console.error('Failed to complete service request:', error);
      // Error toast is shown by the mutation hook
    }
  };

  if (pendingRequests.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
          <h3 className="text-sm mb-1">No Active Requests</h3>
          <p className="text-xs text-muted-foreground">
            All requests for {serviceName} have been handled
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm mb-1">Active Service Requests</h3>
            <p className="text-xs text-muted-foreground">
              {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
            </p>
          </div>
          <Badge variant="destructive" className="animate-pulse">
            <Bell className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>

        {/* Request Cards */}
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card
              key={request.id}
              className={`relative overflow-hidden border-2 ${getPriorityColor(request.priority)}`}
            >
              {/* Cabin Image Background with Overlay */}
              {request.cabinImage && (
                <div className="absolute inset-0 z-0">
                  <ImageWithFallback
                    src={request.cabinImage}
                    alt={`${request.guestCabin} rendering`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/90 to-background/70" />
                </div>
              )}

              {/* Content */}
              <div className="relative z-10 p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-primary" />
                      <h4 className="text-sm">{request.guestName}</h4>
                      <Badge
                        variant={getPriorityBadgeColor(request.priority) as any}
                        className="text-xs uppercase"
                      >
                        {request.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.guestCabin} ({request.cabinId})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(request.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Request Type Badge */}
                  <Badge
                    variant={request.requestType === 'emergency' ? 'destructive' : 'outline'}
                    className="uppercase text-xs"
                  >
                    {request.requestType === 'emergency' && (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {request.requestType}
                  </Badge>
                </div>

                {/* Voice Transcript - Only show if exists */}
                {request.voiceTranscript && (
                  <div className="mb-4 p-3 rounded-lg bg-muted/30 backdrop-blur-sm border border-border">
                    <div className="flex items-start gap-2 mb-1">
                      <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Voice Transcript
                      </p>
                    </div>
                    <p className="text-sm opacity-60 italic leading-relaxed pl-5">
                      "{request.voiceTranscript}"
                    </p>
                  </div>
                )}

                {/* Request Type Info - Only show if no voice transcript and no message */}
                {!request.voiceTranscript && !request.message && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                    {request.requestType === 'call' && (
                      <>
                        <Bell className="h-3 w-3" />
                        <span>Service Call</span>
                      </>
                    )}
                    {request.requestType === 'service' && (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Service Request</span>
                      </>
                    )}
                    {request.requestType === 'emergency' && (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        <span>Emergency</span>
                      </>
                    )}
                  </div>
                )}

                {/* Request Message (if available) */}
                {!request.voiceTranscript && request.message && (
                  <div className="mb-3 text-sm">
                    <p className="text-muted-foreground">{request.message}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request)}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelegateClick(request)}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Delegate
                  </Button>
                </div>
              </div>

              {/* Priority Pulse Animation */}
              {request.priority === 'emergency' && (
                <div className="absolute top-2 right-2 z-20">
                  <div className="relative">
                    <div className="h-3 w-3 bg-destructive rounded-full animate-ping absolute" />
                    <div className="h-3 w-3 bg-destructive rounded-full" />
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Accepted/In Progress Requests */}
        {serviceRequests.filter(r => r.status === 'accepted').length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs text-muted-foreground mb-3">IN PROGRESS</h4>
            <div className="space-y-2">
              {serviceRequests
                .filter(r => r.status === 'accepted')
                .map((request) => (
                  <Card key={request.id} className="p-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{request.guestName}</p>
                          <Badge variant="outline" className="text-xs">
                            {request.guestCabin}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <UserCheck className="h-3 w-3" />
                          <span>Handled by {request.assignedTo}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleComplete(request)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>

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
              <Select value={selectedCrewMember} onValueChange={setSelectedCrewMember}>
                <SelectTrigger id="delegate-crew">
                  <SelectValue placeholder="Select crew member" />
                </SelectTrigger>
                <SelectContent>
                  {onDutyCrewMembers.map((crew) => (
                    <SelectItem key={crew.id} value={crew.name}>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3 w-3" />
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
                <AlertTriangle className="h-4 w-4 inline mr-2" />
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
              disabled={!selectedCrewMember || onDutyCrewMembers.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Delegate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
