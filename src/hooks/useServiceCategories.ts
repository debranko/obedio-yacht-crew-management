import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useServiceCategories() {
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const response = await api.get('/service-categories');
      return response.data.data as ServiceCategory[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
      const response = await api.post('/service-categories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ServiceCategory> & { id: string }) => {
      const response = await api.put(`/service-categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/service-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
  });
}

export function useReorderServiceCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categories: { id: string }[]) => {
      const response = await api.put('/service-categories/reorder', { categories });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] });
    },
  });
}