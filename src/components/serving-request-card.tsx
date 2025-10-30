/**
 * Shared Serving Request Card Component
 * Used in both ServingNowWidget and Service Requests Page
 * Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Clock, MapPin, User, CheckCircle2, Image as ImageIcon, X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { ServiceRequest, UserPreferences } from "../contexts/AppDataContext";

interface ServingRequestCardProps {
  request: ServiceRequest;
  onComplete: (request: ServiceRequest) => void;
  onCancel: (request: ServiceRequest) => void;
  isFullscreen?: boolean;
  userPreferences: UserPreferences;
  currentTime?: Date; // For live timer
  compact?: boolean; // For widget vs full page display
}

export const ServingRequestCard = memo(function ServingRequestCard({
  request,
  onComplete,
  onCancel,
  isFullscreen = false,
  userPreferences,
  currentTime = new Date(),
  compact = false,
}: ServingRequestCardProps) {
  const formatDuration = (acceptedAt: Date) => {
    const diff = Math.floor((currentTime.getTime() - acceptedAt.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    
    if (minutes === 0) {
      return `${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
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

  // Compact version for widget
  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-lg border-2 border-success/50 bg-success/5">
        <div className="flex gap-3">
          {/* Location Image Thumbnail */}
          <div className="relative w-20 h-20 flex-shrink-0 bg-muted overflow-hidden rounded-l-lg">
            {request.cabinImage ? (
              <ImageWithFallback
                src={request.cabinImage}
                alt={request.guestCabin}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 p-3 pl-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                    <User className="h-4 w-4 text-success flex-shrink-0" />
                  ) : (
                    <MapPin className="h-4 w-4 text-success flex-shrink-0" />
                  )}
                  <h4 className="text-sm font-medium truncate">
                    {userPreferences.serviceRequestDisplayMode === 'guest-name' 
                      ? request.guestName 
                      : request.guestCabin}
                  </h4>
                  <Badge variant="outline" className="text-xs bg-success/10 border-success flex-shrink-0">
                    In Progress
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{request.guestCabin}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span className="truncate">{request.guestName}</span>
                    </span>
                  )}
                  {request.acceptedAt && (
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDuration(request.acceptedAt)}
                    </span>
                  )}
                </div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 ml-2" />
            </div>

            {/* Assigned To */}
            <div className="flex items-center justify-between pt-2 border-t border-success/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">Handled by {request.assignedTo}</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onCancel(request);
                  }}
                  className="h-7 text-xs border-destructive text-destructive hover:bg-destructive/10"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onComplete(request);
                  }}
                  className="h-7 text-xs border-success text-success hover:bg-success/10"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Finish
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full version for Service Requests page
  return (
    <Card className="relative overflow-hidden border-2 border-success/50 bg-success/5">
      <div className="flex gap-4">
        {/* Location Image */}
        <div className={`relative flex-shrink-0 bg-muted overflow-hidden ${isFullscreen ? 'w-40 h-40' : 'w-32 h-32'}`}>
          {request.cabinImage ? (
            <ImageWithFallback
              src={request.cabinImage}
              alt={request.guestCabin}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className={`${isFullscreen ? 'h-16 w-16' : 'h-12 w-12'} text-muted-foreground/30`} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${isFullscreen ? 'p-6' : 'p-4'} pl-0`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                <User className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} text-success`} />
              ) : (
                <MapPin className={`${isFullscreen ? 'h-6 w-6' : 'h-5 w-5'} text-success`} />
              )}
              <h4 className={isFullscreen ? 'text-xl' : 'text-base'}>
                {userPreferences.serviceRequestDisplayMode === 'guest-name' 
                  ? request.guestName 
                  : request.guestCabin}
              </h4>
              <Badge variant="outline" className={`${isFullscreen ? 'text-sm' : 'text-xs'} bg-success/10 border-success`}>
                In Progress
              </Badge>
            </div>
            <div className={`flex items-center gap-3 ${isFullscreen ? 'text-base' : 'text-sm'} text-muted-foreground`}>
              {userPreferences.serviceRequestDisplayMode === 'guest-name' ? (
                <span className="flex items-center gap-1.5">
                  <MapPin className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'}`} />
                  {request.guestCabin}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <User className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'}`} />
                  {request.guestName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className={`${isFullscreen ? 'h-4 w-4' : 'h-3 w-3'}`} />
                {getTimeAgo(request.timestamp)}
              </span>
            </div>
          </div>
          <CheckCircle2 className={`${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'} text-success`} />
        </div>

        {/* Voice Transcript - Compact */}
        {request.voiceTranscript && (
          <div className="mb-3 p-3 bg-muted/30 rounded-md">
            <p className={`${isFullscreen ? 'text-sm' : 'text-xs'} text-muted-foreground italic line-clamp-2`}>
              "{request.voiceTranscript}"
            </p>
          </div>
        )}

        {/* Assigned To */}
        <div className="flex items-center justify-between pt-3 border-t border-success/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Handled by {request.assignedTo}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(request)}
              className={`${isFullscreen ? 'h-10 px-4' : 'h-8'} border-destructive text-destructive hover:bg-destructive/10`}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onComplete(request)}
              className={`${isFullscreen ? 'h-10 px-4' : 'h-8'} border-success text-success hover:bg-success/10`}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Finish
            </Button>
          </div>
        </div>
        </div>
      </div>
    </Card>
  );
});
