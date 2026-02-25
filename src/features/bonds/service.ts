
import { bondsApi } from './api';
import { Bond, BondType, BondFormData } from './types';
import { messagingService } from '../notifications/messagingService';

export const bondsService = {
  fetchBonds: async (companyId: string, type: BondType): Promise<Bond[]> => {
    const { data, error } = await bondsApi.getBonds(companyId, type);
    if (error) throw error;

    return (data || []).map((p: any) => {
      // Convention: DB stores `amount` in base currency (SAR).
      // exchange_rate = كم SAR لكل وحدة أجنبية
      // للحصول على المبلغ بالعملة الأجنبية: base_amount / rate
      const isBaseCurrency = !p.currency_code || p.currency_code === 'SAR';
      const foreignAmount = isBaseCurrency
        ? p.amount
        : (p.foreign_amount || (p.amount / (p.exchange_rate || 1)));

      return {
        id: p.id,
        payment_number: p.payment_number || '-',
        date: p.payment_date,
        description: p.notes || '',
        amount: foreignAmount,
        base_amount: Number(p.amount) || 0,
        currency_code: p.currency_code || 'SAR',
        exchange_rate: p.exchange_rate || 1,
        type: p.type === 'receipt' ? 'receipt' : 'payment',
        party_name: p.party?.name,
        account_name: p.account?.name_ar || p.account?.code || '',
        status: p.status,
        payment_method: p.payment_method,
      };
    });
  },

  createBond: async (companyId: string, userId: string, data: BondFormData) => {
    const result = await bondsApi.createPaymentRPC(companyId, userId, data);

    // 🔔 Fire-and-forget notification
    if (result) {
      const eventType = data.type === 'receipt' ? 'bond_receipt' : 'bond_payment';
      messagingService.notify(companyId, eventType, {
        entryNumber: (result as any)?.payment_number || '',
        amount: data.amount || 0,
        currency: data.currency_code || 'SAR',
        description: data.description || '',
        accountName: '',
        date: new Date().toLocaleDateString('ar-SA'),
      }, (result as any)?.id);
    }

    return result;
  }
};
