
import { supabase } from '../../lib/supabaseClient';
import { BondFormData, BondType } from './types';

export const bondsApi = {
  getBonds: async (companyId: string, type?: BondType) => {
    // Map BondType → payments.type
    const paymentType = type === 'receipt' ? 'receipt' : 'disbursement';

    return await (supabase.from('payments') as any)
      .select(`
        id,
        payment_number,
        payment_date,
        amount,
        currency_code,
        exchange_rate,
        payment_method,
        type,
        notes,
        status,
        party:party_id(name),
        account:account_id(name_ar, code)
      `)
      .eq('company_id', companyId)
      .eq('type', paymentType)
      .is('deleted_at', null)
      .neq('status', 'void')
      .order('payment_date', { ascending: false });
  },

  createPaymentRPC: async (companyId: string, userId: string, data: BondFormData) => {
    if (!data.cash_account_id || !data.counterparty_id) {
      throw new Error("يجب اختيار الحسابات المطلوبة");
    }

    // Map BondType (receipt/payment) to payments.type (receipt/disbursement)
    const paymentType = data.type === 'receipt' ? 'receipt' : 'disbursement';

    const { data: result, error } = await supabase.rpc('commit_payment', {
      p_company_id: companyId,
      p_user_id: userId,
      p_type: paymentType,
      p_amount: data.amount,
      p_date: data.date,
      p_cash_account_id: data.cash_account_id,
      p_counterparty_type: data.counterparty_type,
      p_counterparty_id: data.counterparty_id,
      p_description: data.description,
      p_payment_method: data.payment_method || 'cash',
      p_reference_number: data.reference_number,
      p_currency_code: data.currency_code,
      p_exchange_rate: data.exchange_rate,
      p_foreign_amount: data.foreign_amount || 0
    } as any);

    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

    return result;
  }
};
