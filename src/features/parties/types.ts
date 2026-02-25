
import { Database } from '../../core/database.types';

export type PartyType = 'customer' | 'supplier';
export type PartyStatus = 'active' | 'blocked';
export type PartyView = 'list' | 'statements' | 'categories';

export type Party = Database['public']['Tables']['parties']['Row'] & {
  category?: string;
  status?: PartyStatus;
  email?: string;
  tax_number?: string;
  address?: string;
  is_active?: boolean; // From DB but maybe not in type gen
};

export interface PartyFormData {
  name: string;
  type: PartyType;
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
  status: PartyStatus;
  category?: string;
  category_id?: string | null;
  /**
   * Fix: Added balance to PartyFormData to resolve API payload property errors
   */
  balance?: number;
}

export interface PartyStats {
  totalCount: number;
  totalBalance: number;
  activeCount: number;
  blockedCount: number;
}

export interface PartyCategory {
  id: string;
  name: string;
  type: PartyType;
  count?: number; // Optional for UI display
}
