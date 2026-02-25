
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoFinancialLinker } from './AutoFinancialLinker';
import { accountingService } from '../../../features/accounting/services/index';

// Mock the accounting service dependency
vi.mock('../../../features/accounting/services/index', () => ({
  accountingService: {
    findAccountByCode: vi.fn(),
    createJournal: vi.fn(),
  }
}));

describe('AutoFinancialLinker Usecase', () => {
  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock returns for account lookups
    (accountingService.findAccountByCode as any).mockImplementation((_cid: string, code: string) => {
      return Promise.resolve({ id: `acc_id_${code}`, code });
    });
  });

  it('should create a correct journal entry for a Sale Invoice', async () => {
    const operation = {
      type: 'sale_invoice' as const,
      date: '2023-10-27',
      amount: 1150, // Total with Tax
      taxAmount: 150,
      referenceId: 'inv-001',
      referenceNumber: 'INV-100',
      partyId: 'cust-01',
      partyName: 'Test Customer',
      description: 'Test Sale'
    };

    await AutoFinancialLinker.linkOperation(operation, mockCompanyId, mockUserId);

    // Verify accountingService.createJournal was called
    expect(accountingService.createJournal).toHaveBeenCalledTimes(1);
    
    const callArg = (accountingService.createJournal as any).mock.calls[0][0];
    
    expect(callArg.date).toBe(operation.date);
    expect(callArg.reference_type).toBe('sale_invoice');
    
    // Verify Lines Logic (Double Entry)
    const lines = callArg.lines;
    
    // 1. Debit Receivables (Clients) = Total Amount
    const debitLine = lines.find((l: any) => l.account_id === 'acc_id_1100');
    expect(debitLine).toBeDefined();
    expect(debitLine.debit).toBe(1150);
    
    // 2. Credit Sales (Revenue) = Amount - Tax
    const creditSalesLine = lines.find((l: any) => l.account_id === 'acc_id_4010');
    expect(creditSalesLine).toBeDefined();
    expect(creditSalesLine.credit).toBe(1000); // 1150 - 150

    // 3. Credit VAT (Liability) = Tax
    const creditTaxLine = lines.find((l: any) => l.account_id === 'acc_id_2020');
    expect(creditTaxLine).toBeDefined();
    expect(creditTaxLine.credit).toBe(150);
  });

  it('should create a correct journal entry for a Receipt Bond', async () => {
    const operation = {
      type: 'receipt_bond' as const,
      date: '2023-10-27',
      amount: 500,
      taxAmount: 0,
      referenceId: 'bond-001',
      referenceNumber: 'RCT-500',
      partyName: 'Customer X'
    };

    await AutoFinancialLinker.linkOperation(operation, mockCompanyId, mockUserId);

    const callArg = (accountingService.createJournal as any).mock.calls[0][0];
    const lines = callArg.lines;

    // Debit Cash (Fund)
    const debitCash = lines.find((l: any) => l.account_id === 'acc_id_1010');
    expect(debitCash.debit).toBe(500);

    // Credit Receivables (Customer)
    const creditCustomer = lines.find((l: any) => l.account_id === 'acc_id_1100');
    expect(creditCustomer.credit).toBe(500);
  });
});
