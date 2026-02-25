
import { Database } from '../../core/database.types';

export type CustomerStatus = 'active' | 'blocked';
export type CustomerView = 'list' | 'statements' | 'categories';

export type Customer = Database['public']['Tables']['parties']['Row'] & {
  status?: CustomerStatus;
  category?: string;
  email?: string;
  tax_number?: string;
  address?: string;
};

export interface CustomerFormData {
  name: string;
  type: 'customer';
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
  status: CustomerStatus;
  category?: string;
  category_id?: string | null;
  balance?: number;
}

export interface CustomerStats {
  totalCount: number;
  totalBalance: number;
  activeCount: number;
  blockedCount: number;
}
