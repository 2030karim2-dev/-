
import { Database } from '../../core/database.types';

export type SupplierStatus = 'active' | 'blocked';
export type SupplierView = 'list' | 'statements' | 'categories';

export type Supplier = Database['public']['Tables']['parties']['Row'] & {
  status?: SupplierStatus;
  category?: string;
  tax_number?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export interface SupplierFormData {
  name: string;
  type: 'supplier';
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
  status: SupplierStatus;
  category: string;
  balance?: number;
}

export interface SupplierStats {
  totalCount: number;
  totalBalance: number;
  activeCount: number;
  blockedCount: number;
}
