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

interface ServingNowWidgetProps {
  onNavigate?: (page: string) => void;
}

export function ServingNowWidget({ onNavigate }: ServingNowWidgetProps) {
  const { serviceRequests, completeServiceRequest, userPreferences } = useAppData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for duration display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get only ACCEPTED requests (crew confirmed on watch, actively serving)
  // Note: 'delegated' = waiting for watch acceptance, should NOT show here
  // Note: Completed requests are auto-removed by AppDataContext after timeout
  const servingNow = serviceRequests.filter(
    req => req.status === 'accepted'
  );

  const handleHeaderClick = () => {
    if (onNavigate) {
      onNavigate('service-requests');
    }
  };

  const handleComplete = (request: any) => {
    completeServiceRequest(request.id);
    toast.success("Request completed", {
      description: `${request.guestCabin} - ${request.voiceTranscript || 'Service request'}`
    });
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
