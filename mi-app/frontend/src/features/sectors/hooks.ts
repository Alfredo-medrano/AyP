import { useQuery } from '@tanstack/react-query';
import * as sectorsApi from './api';

const SECTORS_KEY = ['sectors'];

export function useSectors() {
    return useQuery({
        queryKey: SECTORS_KEY,
        queryFn: sectorsApi.getSectors,
        staleTime: Infinity, // Sectors don't change often
    });
}

export function useSector(id: number) {
    return useQuery({
        queryKey: [...SECTORS_KEY, id],
        queryFn: () => sectorsApi.getSectorById(id),
        enabled: !!id,
    });
}
