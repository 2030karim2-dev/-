
export interface AIInsight {
  title: string;
  summary: string;
  health_score: number; // 0-100
  risk_analysis: {
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  opportunities: {
    opportunity: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  anomalies: string[];
  recommendations: string[];
  last_updated: string;
}

export interface FinancialDataSnapshot {
  revenue: number;
  expenses: number;
  netProfit: number;
  grossMargin: number; // New
  netMargin: number;   // New

  topExpenses: { name: string; amount: number }[];

  // Debt & Liquidity
  debt_metrics: {
    total_receivables: number;
    total_payables: number;
    cash_on_hand: number; // Estimate from cash accounts
  };

  // Inventory Health
  inventory_metrics: {
    total_valuation: number;
    low_stock_count: number;
  };

  // Growth & Trends (compared to previous period if available, otherwise 0)
  growth_metrics: {
    revenue_growth: number; // Percentage
    expense_growth: number; // Percentage
  };
}

export interface InventoryAIInsight {
  title: string;
  summary: string;
  health_score: number; // 0-100
  risk_analysis: {
    risk: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  opportunities: {
    opportunity: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  anomalies: string[];
  recommendations: string[];
  last_updated: string;
}

export interface InventoryDataSnapshot {
  total_valuation: number;
  total_products: number;
  total_qty: number;
  low_stock_count: number;
  out_of_stock_count: number;

  abc_summary: {
    a_items: number;
    b_items: number;
    c_items: number;
  };

  top_moving: { name: string; qtySold: number; revenue: number }[];
  stagnant_items: { name: string; days_stagnant: number; stock: number }[];
  critical_alerts: { name: string; stock: number; velocity: number; days_remaining: number }[];
}