/**
 * Service Request Panel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockServiceRequest, mockUsers } from '../../__tests__/utils/test-utils';
import { ServiceRequestPanel } from '../service-request-panel';

// Mock hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUsers.admin,
  }),
}));

describe('ServiceRequestPanel', () => {
  const mockOnAccept = vi.fn();
  const mockOnDelegate = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders service request details correctly', () => {
    render(
      <ServiceRequestPanel
        request={mockServiceRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Master Suite')).toBeInTheDocument();
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
  });

  it('shows Accept button for pending requests', () => {
    render(
      <ServiceRequestPanel
        request={mockServiceRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    expect(acceptButton).toBeInTheDocument();
  });

  it('calls onAccept when Accept button clicked', async () => {
    render(
      <ServiceRequestPanel
        request={mockServiceRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalledWith('req-1');
    });
  });

  it('shows Complete button for accepted requests', () => {
    const acceptedRequest = {
      ...mockServiceRequest,
      status: 'accepted' as const,
      assignedTo: 'Jane Smith',
      acceptedAt: new Date(),
    };

    render(
      <ServiceRequestPanel
        request={acceptedRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument();
  });

  it('displays completion time for completed requests', () => {
    const completedRequest = {
      ...mockServiceRequest,
      status: 'completed' as const,
      assignedTo: 'Jane Smith',
      acceptedAt: new Date('2025-01-24T10:00:00'),
      completedAt: new Date('2025-01-24T10:05:00'),
    };

    render(
      <ServiceRequestPanel
        request={completedRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/5 minutes/i)).toBeInTheDocument();
  });

  it('shows delegate button for accepted requests', () => {
    const acceptedRequest = {
      ...mockServiceRequest,
      status: 'accepted' as const,
      assignedTo: 'Jane Smith',
      acceptedAt: new Date(),
    };

    render(
      <ServiceRequestPanel
        request={acceptedRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByRole('button', { name: /delegate/i })).toBeInTheDocument();
  });

  it('highlights emergency requests', () => {
    const emergencyRequest = {
      ...mockServiceRequest,
      priority: 'emergency' as const,
    };

    const { container } = render(
      <ServiceRequestPanel
        request={emergencyRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    // Emergency requests should have red border or background
    const panel = container.querySelector('[data-priority="emergency"]');
    expect(panel).toHaveClass(/border-red/);
  });

  it('shows voice transcript when available', () => {
    const requestWithVoice = {
      ...mockServiceRequest,
      voiceTranscript: 'I need fresh towels please',
    };

    render(
      <ServiceRequestPanel
        request={requestWithVoice}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('I need fresh towels please')).toBeInTheDocument();
  });

  it('disables actions for unauthorized users', () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { ...mockUsers.crew, role: 'crew' },
      }),
    }));

    const acceptedRequest = {
      ...mockServiceRequest,
      status: 'accepted' as const,
      assignedTo: 'Someone Else',
    };

    render(
      <ServiceRequestPanel
        request={acceptedRequest}
        onAccept={mockOnAccept}
        onDelegate={mockOnDelegate}
        onComplete={mockOnComplete}
      />
    );

    // Crew member cannot complete requests assigned to others
    const completeButton = screen.queryByRole('button', { name: /complete/i });
    expect(completeButton).toBeDisabled();
  });
});
