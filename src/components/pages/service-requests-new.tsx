/**
 * Service Requests Page - REBUILT
 * Date: 2025-11-07
 * Reference: incoming-request-dialog.tsx (pop-up - GOLD STANDARD)
 *
 * This page displays all service requests in sections:
 * - Pending: New requests awaiting action
 * - Serving: Accepted requests in progress
 * - Completed: Recently completed requests with auto-clear timer
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Play, Volume2 } from 'lucide-react';
import { useAcceptServiceRequest, useCompleteServiceRequest } from '../../hooks/useServiceRequestsApi';

export default function ServiceRequestsNew() {
  // Auth
  const { user } = useAuth();

  // Data - from AppDataContext
  const {
    serviceRequests,
    crewMembers,
    getCurrentDutyStatus
  } = useAppData();

  // BACKEND API mutations - copied from OLD service-requests.tsx (WORKS!)
  const { mutate: acceptRequest } = useAcceptServiceRequest();
  const { mutate: completeRequest } = useCompleteServiceRequest();

  // State for dropdowns and audio - copied from pop-up lines 50-53
  const [showDelegateDropdown, setShowDelegateDropdown] = useState(false);
  const [showAvailableCrew, setShowAvailableCrew] = useState(false);
  const [showForwardDropdown, setShowForwardDropdown] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null); // Track which request is playing

  // Get crew organized by duty status - copied from pop-up lines 68-72
  const dutyStatus = getCurrentDutyStatus();
  const onDutyCrew = dutyStatus.onDuty;
  const availableCrew = crewMembers.filter(
    (crew) => crew.department === 'Interior' && crew.status !== 'on-leave' && !onDutyCrew.find(c => c.id === crew.id)
  );

  // REAL audio playback - copied from pop-up lines 149-192
  const handlePlayAudio = (requestId: string, voiceAudioUrl?: string, voiceTranscript?: string) => {
    if (!voiceTranscript && !voiceAudioUrl) {
      toast.error('No audio recording available');
      return;
    }

    setPlayingAudio(requestId);

    // Play actual audio file from voiceAudioUrl
    if (voiceAudioUrl) {
      try {
        const audio = new Audio(voiceAudioUrl);

        audio.onended = () => {
          setPlayingAudio(null);
        };

        audio.onerror = () => {
          setPlayingAudio(null);
          toast.error('Failed to play audio', {
            description: 'Audio file could not be loaded'
          });
        };

        audio.play().catch((error) => {
          console.error('Audio playback error:', error);
          setPlayingAudio(null);
          toast.error('Failed to play audio', {
            description: error.message
          });
        });

        toast.info('🎵 Playing voice message...');
      } catch (error) {
        console.error('Audio creation error:', error);
        setPlayingAudio(null);
        toast.error('Failed to play audio');
      }
    } else {
      toast.info('Playing voice message...', {
        description: voiceTranscript
      });
      setTimeout(() => {
        setPlayingAudio(null);
      }, 3000);
    }
  };

  // Accept handler - FIXED to use BACKEND API (like old service-requests.tsx)
  const handleAccept = (requestId: string, guestName: string) => {
    // Get current crew member from authenticated user
    const currentCrewMember = crewMembers.find(crew => crew.userId === user?.id);

    if (!currentCrewMember) {
      toast.error('You must be associated with a crew member to accept requests');
      return;
    }

    // Call BACKEND API (not local state!)
    acceptRequest(
      { id: requestId, crewId: currentCrewMember.id },
      {
        onSuccess: () => {
          toast.success(`Request from ${guestName} accepted`);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Failed to accept request');
        }
      }
    );
  };

  // Complete handler - FIXED to use BACKEND API
  const handleComplete = (requestId: string, guestName: string) => {
    // Call BACKEND API (not local state!)
    completeRequest(requestId, {
      onSuccess: () => {
        toast.success(`Request from ${guestName} completed`);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to complete request');
      }
    });
  };

  // Filter requests into sections - FIXED to match actual status values!
  const pendingRequests = useMemo(() =>
    serviceRequests.filter(req => req.status === 'pending'),
    [serviceRequests]
  );

  // Serving = accepted OR delegated (copy from old service-requests.tsx line 222)
  const servingRequests = useMemo(() =>
    serviceRequests.filter(req => req.status === 'accepted' || req.status === 'delegated'),
    [serviceRequests]
  );

  const completedRequests = useMemo(() =>
    serviceRequests.filter(req => req.status === 'completed'),
    [serviceRequests]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="p-6">
          <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground mt-1">
            Manage incoming service requests from guests
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* PENDING SECTION */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-warning">Pending</span>
              <span className="text-sm font-normal text-muted-foreground">({pendingRequests.length})</span>
            </h2>
            {pendingRequests.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
                No pending requests
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(request => (
                  <div key={request.id} className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{request.guestName}</div>
                        <div className="text-sm text-muted-foreground">{request.guestCabin}</div>
                        {request.voiceTranscript && (
                          <div className="text-sm mt-2">{request.voiceTranscript}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.priority}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SERVING SECTION */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-accent">Serving</span>
              <span className="text-sm font-normal text-muted-foreground">({servingRequests.length})</span>
            </h2>
            {servingRequests.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
                No active requests
              </div>
            ) : (
              <div className="space-y-3">
                {servingRequests.map(request => (
                  <div key={request.id} className="bg-card rounded-lg p-4 border border-accent">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{request.guestName}</div>
                        <div className="text-sm text-muted-foreground">{request.guestCabin}</div>
                        {request.assignedTo && (
                          <div className="text-sm text-accent mt-1">Assigned to: {request.assignedTo}</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETED SECTION */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-success">Completed</span>
              <span className="text-sm font-normal text-muted-foreground">({completedRequests.length})</span>
            </h2>
            {completedRequests.length === 0 ? (
              <div className="bg-muted/50 rounded-lg p-8 text-center text-muted-foreground">
                No completed requests
              </div>
            ) : (
              <div className="space-y-3">
                {completedRequests.map(request => (
                  <div key={request.id} className="bg-card rounded-lg p-4 border border-success/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{request.guestName}</div>
                        <div className="text-sm text-muted-foreground">{request.guestCabin}</div>
                      </div>
                      <div className="text-xs text-success">✓</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
