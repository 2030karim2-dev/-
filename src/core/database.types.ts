
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Functions: {
      get_warehouses_with_stats: {
        Args: {
          p_company_id: string
        }
        Returns: {
          id: string
          name_ar: string
          location: string
          status: string
          is_primary: boolean
          created_at: string
          stockValue: number
          itemCount: number
          totalStock: number
        }[]
      }
      commit_sales_invoice: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_party_id: string | null
          p_items: Json
          p_payment_method: string
          p_notes: string | null
          p_treasury_account_id: string | null
          p_currency: string
          p_exchange_rate: number
        }
        Returns: { id: string; invoice_number: string; total_amount: number; status: string }
      }
      commit_sale_return: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_party_id: string | null
          p_items: Json
          p_notes: string | null
          p_currency: string
          p_exchange_rate: number
          p_reference_invoice_id: string | null
          p_return_reason: string | null
        }
        Returns: { id: string; invoice_number: string; total_amount: number; status: string }
      }
      commit_purchase_invoice: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_supplier_id: string | null
          p_invoice_number: string | null
          p_issue_date: string
          p_items: Json
          p_notes: string | null
          p_currency: string
          p_exchange_rate: number
        }
        Returns: Json
      }
      commit_purchase_return: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_supplier_id: string | null
          p_original_invoice_number: string | null
          p_items: Json
          p_notes: string | null
          p_currency: string
          p_exchange_rate: number
          p_reference_invoice_id: string | null
          p_return_reason: string | null
        }
        Returns: Json
      }
      create_financial_bond: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_bond_type: string
          p_amount: number
          p_date: string
          p_cash_account_id: string | null
          p_counterparty_type: string
          p_counterparty_id: string | null
          p_description: string | null
          p_reference_number: string | null
          p_currency_code: string
          p_exchange_rate: number
          p_foreign_amount: number
        }
        Returns: Json
      }
      commit_payment: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_type: string
          p_amount: number
          p_date: string
          p_cash_account_id: string
          p_counterparty_type: string
          p_counterparty_id: string
          p_description: string | null
          p_payment_method: string
          p_reference_number: string | null
          p_currency_code: string
          p_exchange_rate: number
          p_foreign_amount: number
        }
        Returns: Json
      }
      commit_expense: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_category_id: string
          p_amount: number
          p_description: string
          p_date: string
          p_payment_method: string
          p_voucher_number: string | null
          p_currency: string
          p_exchange_rate: number
        }
        Returns: Json
      }
      void_expense: {
        Args: {
          p_expense_id: string
        }
        Returns: void
      }
      report_trial_balance: {
        Args: {
          p_company_id: string
          p_from: string
          p_to: string
        }
        Returns: {
          account_id: string
          account_code: string
          account_name: string
          account_type: string
          total_debit: number
          total_credit: number
          balance: number
        }[]
      }
      get_user_profile: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      get_next_sequence: {
        Args: {
          p_company_id: string
          p_type: string
        }
        Returns: string
      }
      process_stock_transfer: {
        Args: {
          p_company_id: string
          p_user_id: string
          p_from_warehouse_id: string
          p_to_warehouse_id: string
          p_items: Json
          p_notes: string | null
        }
        Returns: Json
      }
      search_inventory: {
        Args: {
          p_company_id: string
          p_query: string
        }
        Returns: Json
      }
      get_similar_products: {
        Args: {
          p_company_id: string
          p_product_id: string
        }
        Returns: Json
      }
      get_potential_duplicates: {
        Args: {
          p_company_id: string
        }
        Returns: Json
      }
      finalize_audit_session: {
        Args: {
          p_session_id: string
        }
        Returns: void
      }
      get_top_selling_products: {
        Args: {
          p_company_id: string
          p_limit?: number
        }
        Returns: Json
      }
    }
    Tables: {
      accounts: {
        Row: {
          id: string
          company_id: string
          code: string
          name_ar: string
          type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          parent_id: string | null
          balance: number
          currency_code: string
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          code: string
          name_ar: string
          type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
          parent_id?: string | null
          balance?: number
          currency_code?: string
          is_system?: boolean
        }
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      audit_items: {
        Row: {
          id: string
          session_id: string
          product_id: string
          expected_quantity: number
          counted_quantity: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          session_id: string
          product_id: string
          expected_quantity?: number
          counted_quantity?: number | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['audit_items']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          company_id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          details?: string | null
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
      }
      audit_sessions: {
        Row: {
          id: string
          company_id: string
          warehouse_id: string
          title: string
          status: 'active' | 'completed' | 'cancelled'
          created_by: string
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          warehouse_id: string
          title: string
          status?: 'active' | 'completed' | 'cancelled'
          created_by: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['audit_sessions']['Insert']>
      }
      branches: {
        Row: {
          id: string
          company_id: string
          name: string
          address: string | null
          phone: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          company_id: string
          name: string
          address?: string | null
          phone?: string | null
          status?: 'active' | 'inactive'
        }
        Update: Partial<Database['public']['Tables']['branches']['Insert']>
      }
      companies: {
        Row: {
          id: string
          name_ar: string
          name_en: string | null
          tax_number: string | null
          base_currency: string
          owner_id: string | null
          address: string | null
          phone: string | null
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_ar: string
          name_en?: string | null
          tax_number?: string | null
          base_currency?: string
          owner_id?: string | null
          address?: string | null
          phone?: string | null
          logo_url?: string | null
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      exchange_rates: {
        Row: {
          id: string
          company_id: string
          currency_code: string
          rate_to_base: number
          effective_date: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          currency_code: string
          rate_to_base: number
          effective_date?: string
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['exchange_rates']['Insert']>
      }
      expense_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          color: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          color?: string
          is_system?: boolean
        }
        Update: Partial<Database['public']['Tables']['expense_categories']['Insert']>
      }
      expenses: {
        Row: {
          id: string
          company_id: string
          category_id: string
          voucher_number: string | null
          description: string
          amount: number
          currency_code: string
          exchange_rate: number
          expense_date: string
          status: 'draft' | 'posted' | 'paid' | 'void'
          payment_method: 'cash' | 'bank' | 'credit'
          is_recurring: boolean
          frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date: string | null
          created_by: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          category_id: string
          voucher_number?: string | null
          description: string
          amount?: number
          currency_code?: string
          exchange_rate?: number
          expense_date?: string
          status?: 'draft' | 'posted' | 'paid' | 'void'
          payment_method?: 'cash' | 'bank' | 'credit'
          is_recurring?: boolean
          frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
          recurring_end_date?: string | null
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      fiscal_years: {
        Row: {
          id: string
          company_id: string
          name: string
          start_date: string
          end_date: string
          is_closed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          start_date: string
          end_date: string
          is_closed?: boolean
        }
        Update: Partial<Database['public']['Tables']['fiscal_years']['Insert']>
      }
      inventory_transactions: {
        Row: {
          id: string
          company_id: string
          product_id: string
          warehouse_id: string
          quantity: number
          transaction_type: 'purchase' | 'sale' | 'return_purchase' | 'return_sale' | 'transfer_in' | 'transfer_out' | 'adj_in' | 'adj_out' | 'initial'
          reference_type: string | null
          reference_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          product_id: string
          warehouse_id: string
          quantity: number
          transaction_type: 'purchase' | 'sale' | 'return_purchase' | 'return_sale' | 'transfer_in' | 'transfer_out' | 'adj_in' | 'adj_out' | 'initial'
          reference_type?: string | null
          reference_id?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['inventory_transactions']['Insert']>
      }
      invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          role: string
          status: 'pending' | 'accepted' | 'expired'
          created_by: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          role?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_by?: string | null
          expires_at?: string
        }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string | null
          description: string | null
          quantity: number
          unit_price: number
          cost_price: number
          tax_amount: number
          total: number
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id?: string | null
          description?: string | null
          quantity?: number
          unit_price?: number
          cost_price?: number
          tax_amount?: number
          total?: number
        }
        Update: Partial<Database['public']['Tables']['invoice_items']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          company_id: string
          party_id: string | null
          invoice_number: string | null
          type: 'sale' | 'purchase' | 'return_sale' | 'return_purchase'
          status: 'draft' | 'posted' | 'paid' | 'void'
          total_amount: number
          subtotal: number
          tax_amount: number
          discount_amount: number
          issue_date: string
          due_date: string | null
          notes: string | null
          payment_method: 'cash' | 'credit' | 'bank' | null
          created_by: string | null
          created_at: string
          currency_code: string
          exchange_rate: number
          deleted_at: string | null
          // Return-specific fields
          reference_invoice_id: string | null
          return_reason: string | null
        }
        Insert: {
          id?: string
          company_id: string
          party_id?: string | null
          invoice_number?: string | null
          type: 'sale' | 'purchase' | 'return_sale' | 'return_purchase'
          status?: 'draft' | 'posted' | 'paid' | 'void'
          total_amount?: number
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          issue_date?: string
          due_date?: string | null
          notes?: string | null
          payment_method?: 'cash' | 'credit' | 'bank' | null
          created_by?: string | null
          currency_code?: string
          exchange_rate?: number
          deleted_at?: string | null
          // Return-specific fields
          reference_invoice_id?: string | null
          return_reason?: string | null
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      journal_entries: {
        Row: {
          id: string
          company_id: string
          entry_number: number
          entry_date: string
          description: string | null
          reference_type: string | null
          reference_id: string | null
          status: 'draft' | 'posted' | 'void'
          created_by: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          entry_number?: number
          entry_date?: string
          description?: string | null
          reference_type?: string | null
          reference_id?: string | null
          status?: 'draft' | 'posted' | 'void'
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['journal_entries']['Insert']>
      }
      journal_entry_lines: {
        Row: {
          id: string
          journal_entry_id: string
          account_id: string
          debit_amount: number
          credit_amount: number
          description: string | null
          currency_code: string | null
          foreign_amount: number | null
          exchange_rate: number | null
        }
        Insert: {
          id?: string
          journal_entry_id: string
          account_id: string
          debit_amount?: number
          credit_amount?: number
          description?: string | null
          currency_code?: string | null
          foreign_amount?: number | null
          exchange_rate?: number | null
        }
        Update: Partial<Database['public']['Tables']['journal_entry_lines']['Insert']>
      }
      parties: {
        Row: {
          id: string
          company_id: string
          name: string
          type: 'customer' | 'supplier'
          phone: string | null
          email: string | null
          tax_number: string | null
          address: string | null
          balance: number
          status: 'active' | 'blocked'
          created_at: string
          category_id: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          type: 'customer' | 'supplier'
          phone?: string | null
          email?: string | null
          tax_number?: string | null
          address?: string | null
          balance?: number
          status?: 'active' | 'blocked'
          category_id?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['parties']['Insert']>
      }
      party_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          type: 'customer' | 'supplier'
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          type: 'customer' | 'supplier'
        }
        Update: Partial<Database['public']['Tables']['party_categories']['Insert']>
      }
      product_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
        }
        Update: Partial<Database['public']['Tables']['product_categories']['Insert']>
      }
      product_cross_references: {
        Row: {
          id: string
          company_id: string
          base_product_id: string
          alternative_product_id: string
          match_quality: 'exact' | 'partial' | 'interchangeable'
          notes: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          base_product_id: string
          alternative_product_id: string
          match_quality?: 'exact' | 'partial' | 'interchangeable'
          notes?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['product_cross_references']['Insert']>
      }
      product_kit_items: {
        Row: {
          id: string
          kit_product_id: string
          component_product_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          kit_product_id: string
          component_product_id: string
          quantity: number
        }
        Update: Partial<Database['public']['Tables']['product_kit_items']['Insert']>
      }
      product_supplier_prices: {
        Row: {
          id: string
          company_id: string
          product_id: string
          supplier_id: string
          cost_price: number
          lead_time_days: number | null
          supplier_part_number: string | null
          notes: string | null
          last_updated: string
        }
        Insert: {
          id?: string
          company_id: string
          product_id: string
          supplier_id: string
          cost_price: number
          lead_time_days?: number | null
          supplier_part_number?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['product_supplier_prices']['Insert']>
      }
      product_stock: {
        Row: {
          id: string
          product_id: string
          warehouse_id: string
          quantity: number
        }
        Insert: {
          id?: string
          product_id: string
          warehouse_id: string
          quantity?: number
        }
        Update: Partial<Database['public']['Tables']['product_stock']['Insert']>
      }
      products: {
        Row: {
          id: string
          company_id: string
          name_ar: string
          name_en: string | null
          sku: string
          part_number: string | null
          brand: string | null
          description: string | null
          size: string | null
          specifications: string | null
          unit: string | null
          purchase_price: number
          sale_price: number
          cost_price: number
          image_url: string | null
          barcode: string | null
          alternative_numbers: string | null
          status: 'active' | 'inactive' | 'archived'
          created_at: string
          updated_at: string
          min_stock_level: number | null
          category_id: string | null
          is_core: boolean
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name_ar: string
          name_en?: string | null
          sku: string
          part_number?: string | null
          brand?: string | null
          description?: string | null
          size?: string | null
          specifications?: string | null
          unit?: string | null
          purchase_price?: number
          sale_price?: number
          cost_price?: number
          image_url?: string | null
          barcode?: string | null
          alternative_numbers?: string | null
          status?: 'active' | 'inactive' | 'archived'
          min_stock_level?: number
          category_id?: string | null
          is_core?: boolean
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string
          avatar_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      stock_transfer_items: {
        Row: {
          id: string
          transfer_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          id?: string
          transfer_id: string
          product_id: string
          quantity: number
        }
        Update: Partial<Database['public']['Tables']['stock_transfer_items']['Insert']>
      }
      stock_transfers: {
        Row: {
          id: string
          company_id: string
          from_warehouse_id: string
          to_warehouse_id: string
          notes: string | null
          status: 'pending' | 'completed' | 'cancelled'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          from_warehouse_id: string
          to_warehouse_id: string
          notes?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          created_by: string
        }
        Update: Partial<Database['public']['Tables']['stock_transfers']['Insert']>
      }
      supported_currencies: {
        Row: {
          code: string
          name_ar: string
          symbol: string
          is_base: boolean
          exchange_operator: 'multiply' | 'divide'
        }
        Insert: {
          code: string
          name_ar: string
          symbol: string
          is_base?: boolean
          exchange_operator?: 'multiply' | 'divide'
        }
        Update: Partial<Database['public']['Tables']['supported_currencies']['Insert']>
      }
      user_company_roles: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role: 'owner' | 'admin' | 'accountant' | 'cashier' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          role?: 'owner' | 'admin' | 'accountant' | 'cashier' | 'viewer'
        }
        Update: Partial<Database['public']['Tables']['user_company_roles']['Insert']>
      }
      warehouses: {
        Row: {
          id: string
          company_id: string
          branch_id: string | null
          name_ar: string
          location: string | null
          status: 'active' | 'inactive'
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          branch_id?: string | null
          name_ar: string
          location?: string | null
          status?: 'active' | 'inactive'
          is_primary?: boolean
        }
        Update: Partial<Database['public']['Tables']['warehouses']['Insert']>
      }
      payments: {
        Row: {
          id: string
          company_id: string
          payment_number: string
          payment_date: string
          amount: number
          currency_code: string
          exchange_rate: number
          payment_method: 'cash' | 'bank' | 'check'
          type: 'receipt' | 'disbursement'
          notes: string | null
          status: 'draft' | 'posted' | 'void'
          party_id: string | null
          account_id: string | null
          created_by: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          payment_number?: string
          payment_date?: string
          amount: number
          currency_code?: string
          exchange_rate?: number
          payment_method?: 'cash' | 'bank' | 'check'
          type: 'receipt' | 'disbursement'
          notes?: string | null
          status?: 'draft' | 'posted' | 'void'
          party_id?: string | null
          account_id?: string | null
          created_by?: string | null
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
  }
}

