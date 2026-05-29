import { useQuery } from '@tanstack/react-query';
import { autoPartsApi, type VehicleCompatibility, type ArticleInfo } from '../services/autoPartsApi';
import { productsApi } from '../api/productsApi';
import { useAuthStore } from '../../auth/store';

interface CompatibilityResult {
  article: ArticleInfo | null;
  vehicles: VehicleCompatibility[];
}

export function useVehicleCompatibility(articleNo: string) {
  return useQuery<CompatibilityResult>({
    queryKey: ['vehicle_compatibility', articleNo],
    queryFn: () => autoPartsApi.getCompatibilityByArticle(articleNo),
    enabled: !!articleNo,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours of cache
    retry: 1,
  });
}

export function useLocalProductSearch(partNumber: string) {
  const { user } = useAuthStore();
  const companyId = user?.company_id;

  return useQuery({
    queryKey: ['local_products_by_part', companyId, partNumber],
    queryFn: async () => {
      if (!companyId || !partNumber) return [];
      const data = await productsApi.searchProduct(companyId, partNumber);
      return data || [];
    },
    enabled: !!companyId && !!partNumber,
  });
}
