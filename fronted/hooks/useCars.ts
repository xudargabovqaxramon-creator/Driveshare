import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carsService } from '@/services/cars.service';
import { CreateCarPayload, FilterCarsParams, UpdateCarPayload } from '@/types';

export const CAR_KEYS = {
  all: ['cars'] as const,
  list: (params?: FilterCarsParams) => ['cars', 'list', params] as const,
  detail: (id: string) => ['cars', 'detail', id] as const,
  myListings: (page?: number, limit?: number) => ['cars', 'my', page, limit] as const,
};

export function useCars(params?: FilterCarsParams) {
  return useQuery({
    queryKey: CAR_KEYS.list(params),
    queryFn: () => carsService.getAll(params),
  });
}

export function useCar(id: string) {
  return useQuery({
    queryKey: CAR_KEYS.detail(id),
    queryFn: () => carsService.getOne(id),
    enabled: !!id,
  });
}

export function useMyListings(page = 1, limit = 10, disabled = false) {
  return useQuery({
    queryKey: CAR_KEYS.myListings(page, limit),
    queryFn: () => carsService.getMyListings(page, limit),
    enabled: !disabled,
  });
}

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCarPayload) => carsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CAR_KEYS.all }),
  });
}

export function useUpdateCar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCarPayload) => carsService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAR_KEYS.all });
      qc.invalidateQueries({ queryKey: CAR_KEYS.detail(id) });
    },
  });
}

export function useDeleteCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CAR_KEYS.all }),
  });
}
