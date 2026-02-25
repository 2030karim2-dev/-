import { AuthUser } from '../../../features/auth/types';

type Action = 
  | 'delete_product' 
  | 'create_product'
  | 'close_fiscal_year' 
  | 'edit_posted_invoice' 
  | 'view_financial_reports'
  | 'create_purchase'
  | 'delete_party'
  | 'post_journal_entry'
  | 'create_expense'
  | 'create_bond'
  | 'create_sale_return';

export class AuthorizeActionUsecase {
  private static rolePermissions: Record<string, Action[]> = {
    'owner': [
      'delete_product', 'create_product', 'close_fiscal_year', 
      'edit_posted_invoice', 'view_financial_reports', 
      'create_purchase', 'delete_party', 'post_journal_entry',
      'create_expense', 'create_bond', 'create_sale_return'
    ],
    'manager': [
      'create_product', 'delete_product', 'view_financial_reports', 
      'create_purchase', 'post_journal_entry', 'create_expense', 'create_bond',
      'create_sale_return'
    ],
    'accountant': [
      'view_financial_reports', 'post_journal_entry', 'create_expense', 'create_bond'
    ],
    'sales': ['create_product']
  };

  static canPerform(user: AuthUser | null, action: Action): boolean {
    if (!user || !user.role) return false;
    
    const permissions = this.rolePermissions[user.role.toLowerCase()] || [];
    return permissions.includes(action);
  }

  static requireAdmin(user: AuthUser | null) {
      if (user?.role !== 'owner') {
          throw new Error("هذه العملية تتطلب صلاحيات مدير النظام (Owner)");
      }
  }

  static validateAction(user: AuthUser | null, action: Action) {
      if (!this.canPerform(user, action)) {
          const actionNames: Record<string, string> = {
              'create_expense': 'تسجيل مصروفات',
              'create_bond': 'إصدار سندات مالية',
              'post_journal_entry': 'ترحيل قيود محاسبية',
              'delete_party': 'حذف جهات (عملاء/موردين)',
              'create_sale_return': 'إنشاء مرتجع مبيعات'
          };
          throw new Error(`عذراً، دورك الوظيفي لا يمنحك صلاحية: [${actionNames[action] || action}]`);
      }
  }
}