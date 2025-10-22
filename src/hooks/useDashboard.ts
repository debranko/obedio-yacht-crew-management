import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'sonner';

// Types
interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface DashboardLayout {
  layouts: Record<string, WidgetLayout[]>;
  activeWidgets: string[];
}

// API functions
const dashboardApi = {
  getLayout: async (): Promise<DashboardLayout> => {
    const { data } = await api.get('/dashboard/layout');
    return data;
  },

  saveLayout: async (layout: DashboardLayout): Promise<DashboardLayout> => {
    const { data } = await api.put('/dashboard/layout', layout);
    return data;
  },

  resetLayout: async (): Promise<DashboardLayout> => {
    const { data } = await api.post('/dashboard/reset');
    return data;
  },
};

// Hooks
export function useDashboardLayout() {
  return useQuery({
    queryKey: ['dashboard', 'layout'],
    queryFn: dashboardApi.getLayout,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dashboardApi.saveLayout,
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboard', 'layout'], data);
      toast.success('Dashboard layout saved successfully');
    },
    onError: (error: any) => {
      console.error('Failed to save dashboard layout:', error);
      toast.error(error.response?.data?.error || 'Failed to save dashboard layout');
    },
  });
}

export function useResetDashboardLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dashboardApi.resetLayout,
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboard', 'layout'], data);
      toast.success('Dashboard reset to default layout');
    },
    onError: (error: any) => {
      console.error('Failed to reset dashboard:', error);
      toast.error(error.response?.data?.error || 'Failed to reset dashboard');
    },
  });
}

// Utility function to merge layouts (for responsive design)
export function mergeLayouts(
  currentLayouts: Record<string, WidgetLayout[]>,
  newLayout: WidgetLayout[],
  breakpoint: string
): Record<string, WidgetLayout[]> {
  return {
    ...currentLayouts,
    [breakpoint]: newLayout,
  };
}