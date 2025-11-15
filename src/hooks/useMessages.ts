/**
 * Messages Hook
 * React Query hooks for messaging system with WebSocket real-time updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MessageDTO } from '../services/api';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

const QUERY_KEY = ['messages'];

/**
 * Get all messages for authenticated user
 */
export function useMessages(params?: {
  type?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const query = useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => api.messages.getAll(params),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  return {
    messages: query.data?.messages || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get conversation with specific user
 */
export function useConversation(
  otherUserId: string | null,
  params?: { limit?: number; offset?: number }
) {
  const query = useQuery({
    queryKey: [...QUERY_KEY, 'conversation', otherUserId, params],
    queryFn: () => api.messages.getConversation(otherUserId!, params),
    enabled: !!otherUserId,
    staleTime: 1000 * 30,
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Get unread message count
 */
export function useUnreadCount() {
  const query = useQuery({
    queryKey: [...QUERY_KEY, 'unread-count'],
    queryFn: () => api.messages.getUnreadCount(),
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });

  return {
    count: query.data?.count || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Send a message mutation
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      receiverId?: string | null;
      content: string;
      type?: 'text' | 'system' | 'alert' | 'notification';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }) => api.messages.send(data),
    onSuccess: (newMessage) => {
      // Invalidate all message queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Message sent');
    },
    onError: (error: any) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Mark message as read mutation
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => api.messages.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: any) => {
      console.error('Failed to mark message as read:', error);
    },
  });
}

/**
 * Mark all messages as read mutation
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.messages.markAllAsRead(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(`Marked ${result.count} messages as read`);
    },
    onError: (error: any) => {
      console.error('Failed to mark all messages as read:', error);
      toast.error('Failed to mark messages as read');
    },
  });
}

/**
 * Delete message mutation
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => api.messages.delete(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Message deleted');
    },
    onError: (error: any) => {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    },
  });
}

/**
 * WebSocket real-time message updates
 * Subscribe to new_message and broadcast_message events
 */
export function useMessagesWebSocket() {
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useWebSocket();

  useEffect(() => {
    if (!on || !off) return;

    // Handle new direct message
    const handleNewMessage = (message: MessageDTO) => {
      console.log('📨 New message received:', message);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const senderName = message.sender
          ? `${message.sender.firstName || message.sender.username}`
          : 'Unknown';

        new Notification('New Message', {
          body: `${senderName}: ${message.content.substring(0, 100)}`,
          icon: '/obedio-icon.png',
        });
      }
    };

    // Handle broadcast message
    const handleBroadcastMessage = (message: MessageDTO) => {
      console.log('📢 Broadcast message received:', message);

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      // Show notification for broadcast
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Broadcast Message', {
          body: message.content.substring(0, 100),
          icon: '/obedio-icon.png',
        });
      }
    };

    const unsubscribeNew = on('new_message', handleNewMessage);
    const unsubscribeBroadcast = on('broadcast_message', handleBroadcastMessage);

    // Cleanup
    return () => {
      if (unsubscribeNew) unsubscribeNew();
      if (unsubscribeBroadcast) unsubscribeBroadcast();
    };
  }, [on, off, queryClient]);

  return { isConnected };
}
