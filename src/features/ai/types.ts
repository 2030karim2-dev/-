
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

export interface SmartPricingResult {
  suggestedPrice: number;
  reason: string;
}

export interface SalesForecastResult {
  forecast: number;
  trend: 'صاعد' | 'هابط' | 'مستقر';
  tips: string[];
}

export interface SmartPurchaseOrdersResult {
  items: {
    name: string;
    suggestedQty: number;
    priority: 'عاجل' | 'متوسط' | 'منخفض'
  }[];
  summary: string;
}

export interface InvoiceSuspicionResult {
  riskLevel: 'low' | 'medium' | 'high';
  alerts: string[];
}

export interface StockDepletionResult {
  items: {
    name: string;
    daysLeft: number;
    urgency: 'حرج' | 'تحذير' | 'آمن'
  }[];
}

export interface CustomerSegmentationResult {
  segments: {
    name: string;
    segment: 'VIP' | 'معرض للانسحاب' | 'جديد' | 'عادي';
    recommendation: string
  }[];
}

export interface CrossSellResult {
  suggestions: {
    name: string;
    reason: string
  }[];
}

export interface SupplierRatingResult {
  ratings: {
    name: string;
    score: number;
    strengths: string;
    weaknesses: string
  }[];
}

export interface InvoiceCommandResult {
  customerName: string;
  items: {
    name: string;
    quantity: number;
    price: number
  }[];
  paymentMethod: 'cash' | 'credit';
}

export interface JournalEntrySuggestion {
  debitAccount: string;
  creditAccount: string;
  explanation: string;
}

export interface BusinessHealthResult {
  score: number;
  grade: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'ضعيف';
  factors: {
    name: string;
    impact: 'إيجابي' | 'سلبي';
    score: number
  }[];
  advice: string;
}

export interface AnomalyDetectionResult {
  anomalies: {
    description: string;
    amount: number;
    reason: string;
    severity: 'عالي' | 'متوسط' | 'منخفض'
  }[];
}

export interface MarketPositionResult {
  insights: string[];
  opportunities: string[];
  threats: string[];
}