
export type InventoryView = 'products' | 'warehouses' | 'low-stock' | 'transfers' | 'audit' | 'analysis';

export interface CarCompatibility {
  make: string;
  model: string;
  years: string[];
}

export interface warehouseStock {
  warehouse_id: string; // Added warehouse_id
  warehouse_name: string;
  quantity: number;
  location: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  submodel?: string | null;
  year_start: number;
  year_end: number;
  body_type?: string | null;
  engine?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  drive_type?: string | null;
  vin_prefix?: string | null;
  region?: string | null;
}

export interface ProductFitment {
  id: string;
  product_id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  notes?: string | null;
  created_at?: string;
}

export interface ProductCrossReference {
  id: string;
  company_id: string;
  base_product_id: string;
  alternative_product_id: string;
  alternative_product?: Product;
  match_quality: 'exact' | 'partial' | 'interchangeable';
  notes?: string | null;
  created_at: string;
  created_by?: string;
}

export interface ProductKitItem {
  id: string;
  kit_product_id: string;
  component_product_id: string;
  component_product?: Product;
  quantity: number;
  created_at: string;
}

export interface ProductSupplierPrice {
  id: string;
  company_id: string;
  product_id: string;
  supplier_id: string;
  supplier_name?: string;
  cost_price: number;
  lead_time_days?: number | null;
  supplier_part_number?: string | null;
  notes?: string | null;
  last_updated: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  sku: string;
  part_number: string | null;
  alternative_numbers: string | null; // Added for Cross-Reference
  brand: string | null;
  manufacturer?: string; // Potential alias for brand
  supplier_id?: string | null; // Foreign Key
  supplier_name?: string | null; // Added to fix build error
  category: string | null;
  category_id?: string | null;
  size: string | null;
  specifications: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  image_url?: string | null;

  // Auto Parts Specific Features
  is_kit?: boolean;
  has_core_charge?: boolean;
  core_charge_amount?: number;

  created_at: string;

  alternatives: string[];
  cross_references?: ProductCrossReference[];
  kit_components?: ProductKitItem[];
  supplier_prices?: ProductSupplierPrice[];
  compatibility: CarCompatibility[];
  warehouse_distribution: warehouseStock[];

  total_purchases_qty: number;
  total_sales_qty: number;
  last_invoice_date: string;
  total_profit: number;
  total_loss: number;

  isLowStock: boolean;
  location?: string;
  locations?: {
    warehouse_id: string;
    aisle: string;
    shelf: string;
    bin: string;
  }[];
}

export interface ProductFormData {
  name: string;
  sku?: string | null;
  part_number?: string | null;
  brand?: string | null;
  size?: string | null;
  specifications?: string | null;
  alternative_numbers?: string | null;
  image_url?: string | null;
  barcode?: string | null;
  cost_price?: number | string | null;
  selling_price?: number | string | null;
  min_stock_level?: number | string | null;
  stock_quantity?: number | string | null;
  location?: string | null;
  unit?: 'piece' | 'set';
  category?: string;
  is_core?: boolean;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  lowStock?: boolean;
  warehouse_id?: string;
}

export interface Warehouse {
  id: string;
  company_id?: string;
  name_ar: string;
  name_en?: string;
  location: string | null;
  status: string;
  is_active?: boolean;
  created_at?: string;
}

export interface WarehouseFormData {
  name_ar: string;
  name_en?: string;
  location: string;
  is_active?: boolean;
}

export interface StockTransfer {
  id: string;
  company_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  items: { product_id: string; quantity: number }[];
  notes?: string;
  created_at: string;
  created_by: string;
}

export interface TransferFormData {
  from_warehouse_id: string;
  to_warehouse_id: string;
  items: { product_id: string; quantity: number }[];
  notes?: string;
}

export interface CreateTransferDTO {
  from_warehouse_id: string;
  to_warehouse_id: string;
  items: { product_id: string; quantity: number }[];
  notes?: string;
  company_id: string;
  user_id: string;
}

export interface CreateAuditDTO {
  title: string;
  warehouse_id: string;
  category: string;
}

export interface InventoryAnalysisData {
  summary: {
    stockValue: number;
    turnoverRate: number;
    outOfStockItems: number;
    potentialRevenue: number;
  };
  trendData: { date: string; in: number; out: number }[];
  topMovingItems: { name: string; qty: number; trend: string }[];
  categoryDistribution: { name: string; value: number; fill: string }[];
}

export interface InventoryStats {
  count: number;
  totalValue: number;
  lowStockCount: number;
}

export interface InventoryTransaction {
  company_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  transaction_type: 'purchase' | 'sale' | 'return_purchase' | 'return_sale' | 'transfer_in' | 'transfer_out' | 'adj_in' | 'adj_out' | 'initial';
  reference_type?: string;
  reference_id?: string;
  created_by: string;
  created_at?: Date;
}
