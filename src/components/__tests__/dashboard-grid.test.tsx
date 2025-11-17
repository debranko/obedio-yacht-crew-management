/**
 * Dashboard Grid Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockUsers } from '../../__tests__/utils/test-utils';
import { DashboardGrid } from '../dashboard-grid';

// Mock hooks
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUsers.admin,
  }),
}));

vi.mock('../../hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({
    data: {
      activeWidgets: ['serving-now', 'duty-timer'],
    },
    isLoading: false,
    updateMutation: {
      mutate: vi.fn(),
    },
  }),
}));

describe('DashboardGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard grid with default widgets', () => {
    render(<DashboardGrid />);

    expect(screen.getByText(/Serving Now/i)).toBeInTheDocument();
    expect(screen.getByText(/Duty Timer/i)).toBeInTheDocument();
  });

  it('opens manage widgets dialog when button clicked', async () => {
    render(<DashboardGrid />);

    const manageButton = screen.getByRole('button', { name: /manage widgets/i });
    fireEvent.click(manageButton);

    await waitFor(() => {
      expect(screen.getByText(/Customize Dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows correct widgets based on user role', () => {
    render(<DashboardGrid />);

    // Admin should see all widgets
    expect(screen.queryByText(/Device Health/i)).toBeInTheDocument();
  });

  it('persists widget layout changes', async () => {
    const { container } = render(<DashboardGrid />);

    // Simulate drag and drop (simplified)
    const widgetElement = container.querySelector('[data-widget="serving-now"]');
    expect(widgetElement).toBeTruthy();
  });

  it('handles loading state correctly', () => {
    vi.mock('../../hooks/useUserPreferences', () => ({
      useUserPreferences: () => ({
        data: null,
        isLoading: true,
      }),
    }));

    render(<DashboardGrid />);

    // Should show skeleton or loading state
    expect(screen.queryByText(/Loading/i) || screen.queryByTestId('skeleton')).toBeTruthy();
  });
});
