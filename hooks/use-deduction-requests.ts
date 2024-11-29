import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface InventoryRequest {
  id: string;
  product_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
  approved_by_profile?: {
    full_name: string;
  };
}

export function useDeductionRequests() {
  const queryClient = useQueryClient();

  const {
    data: requests = [],
    isLoading,
    isError,
  } = useQuery<InventoryRequest[]>({
    queryKey: ["deduction-requests"],
    queryFn: async () => {
      const response = await fetch("/api/inventory-requests");
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep unused data for 5 minutes
  });

  const refreshRequests = async () => {
    await queryClient.invalidateQueries({ queryKey: ["deduction-requests"] });
  };

  return {
    requests,
    isLoading,
    isError,
    refreshRequests,
  };
} 