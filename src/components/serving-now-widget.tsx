/**
 * Serving Now Widget
 * Displays currently active (accepted) service requests
 */

import { CheckCircle2 } from "lucide-react";
import { Card } from "./ui/card";
import { useAppData } from "../contexts/AppDataContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ServingRequestCard } from "./serving-request-card";
import { useCompleteServiceRequest, useCancelServiceRequest, useServiceRequestsApi } from "../hooks/useServiceRequestsApi";

interface ServingNowWidgetProps {
  onNavigate?: (page: string) => void;
}

export function ServingNowWidget({ onNavigate }: ServingNowWidgetProps) {
  const { userPreferences } = useAppData();
  const { serviceRequests: apiServiceRequests, isLoading, refetch: refetchRequests } = useServiceRequestsApi(); // Get from backend API
  const [currentTime, setCurrentTime] = useState(new Date());

  // Use mutations to complete/cancel service request (saves to backend database)
  const completeServiceRequestMutation = useCompleteServiceRequest();
  const cancelServiceRequestMutation = useCancelServiceRequest();

  // Update time every second for duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Transform API data to format expected by ServingRequestCard
  const transformApiRequest = (apiReq: any) => ({
    ...apiReq,
    timestamp: new Date(apiReq.createdAt),
    acceptedAt: apiReq.acceptedAt ? new Date(apiReq.acceptedAt) : undefined,
    guestName: apiReq.guest ? `${apiReq.guest.firstName} ${apiReq.guest.lastName}` : apiReq.guestName || 'Unknown Guest',
    guestCabin: apiReq.location?.name || apiReq.guestCabin || 'Unknown Location',
    cabinImage: apiReq.location?.imageUrl || apiReq.cabinImage,
  });

  // Get accepted requests (currently being served) from backend API and transform them
  const servingNow = apiServiceRequests
    .filter(req => req.status === 'accepted')
    .map(transformApiRequest);

  const handleHeaderClick = () => {
    if (onNavigate) {
      onNavigate('service-requests');
    }
  };

  const handleComplete = async (request: any) => {
    console.log('🎯 FINISH BUTTON CLICKED', {
      requestId: request.id,
      requestStatus: request.status,
      requestGuestName: request.guestName,
      requestCabin: request.guestCabin,
      hasAcceptedAt: !!request.acceptedAt
    });

    try {
      console.log('🚀 Calling complete mutation...');
      const result = await completeServiceRequestMutation.mutateAsync(request.id);
      console.log('✅ Complete mutation succeeded:', result);

      // ✅ Manually refetch to ensure immediate UI update
      await refetchRequests();
      console.log('✅ Service requests refreshed after completion');

      // Success toast is shown by the mutation hook
      // No need for additional toast here
    } catch (error: any) {
      console.error('❌ Failed to complete service request:', {
        error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        requestId: request.id
      });
      // Error toast is shown by the mutation hook
      toast.error(`Failed to complete: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleCancel = async (request: any) => {
    console.log('🚫 CANCEL BUTTON CLICKED', {
      requestId: request.id,
      requestStatus: request.status,
      requestGuestName: request.guestName,
      requestCabin: request.guestCabin
    });

    try {
      console.log('🚀 Calling cancel mutation...');
      const result = await cancelServiceRequestMutation.mutateAsync(request.id);
      console.log('✅ Cancel mutation succeeded:', result);

      // ✅ Manually refetch to ensure immediate UI update
      await refetchRequests();
      console.log('✅ Service requests refreshed after cancellation');

      // Success toast is shown by the mutation hook
    } catch (error: any) {
      console.error('❌ Failed to cancel service request:', {
        error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        requestId: request.id
      });
      // Error toast is shown by the mutation hook
      toast.error(`Failed to cancel: ${error?.message || 'Unknown error'}`);
    }
  };

  if (servingNow.length === 0) {
    return (
      <Card className="p-4 h-full flex flex-col">
        <div 
          className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={handleHeaderClick}
        >
          <CheckCircle2 className="h-4 w-4 text-success" />
          <h3 className="text-sm font-semibold">Serving Now</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={handleHeaderClick}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            No active service requests
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 h-full flex flex-col">
      {/* Header - Clickable */}
      <div 
        className="flex items-center gap-2 mb-3 flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
        onClick={handleHeaderClick}
      >
        <CheckCircle2 className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold">Serving Now</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {servingNow.length} active
        </span>
      </div>

      {/* Active Requests List - Scrollable */}
      <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
        {servingNow.slice(0, 5).map((request) => (
          <ServingRequestCard
            key={request.id}
            request={request}
            onComplete={handleComplete}
            onCancel={handleCancel}
            userPreferences={userPreferences}
            currentTime={currentTime}
            compact={true}
          />
        ))}
        
        {servingNow.length > 5 && (
          <button
            onClick={handleHeaderClick}
            className="w-full text-xs text-center text-muted-foreground hover:text-primary pt-2 transition-colors"
          >
            +{servingNow.length - 5} more - Click to view all
          </button>
        )}
      </div>
    </Card>
  );
}
