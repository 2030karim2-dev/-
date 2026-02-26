
import React, { useState } from 'react';
import { useSalesStore } from '../../store';
import { useCreateInvoice, useNextInvoiceNumber } from '../../hooks';
import { useCompany, useCurrencies } from '../../../settings/hooks';
import { useSettingsStore } from '../../../settings/settingsStore';
import InvoiceHeader from './InvoiceHeader';
import InvoiceMeta from './InvoiceMeta';
import InteractiveInvoiceTable from './InteractiveInvoiceTable';
import InvoiceTotals from './InvoiceTotals';
import InvoiceActions from './InvoiceActions';
import PrintableInvoice from '../PrintableInvoice';
import { InvoiceStatus } from '../../types';
import PageLoader from '../../../../ui/base/PageLoader';
import ErrorDisplay from '../../../../ui/base/ErrorDisplay';

interface CreateInvoiceViewProps {
  onSuccess: () => void;
}

const CreateInvoiceView: React.FC<CreateInvoiceViewProps> = ({ onSuccess }) => {
  const { data: company, isLoading: companyLoading, error: companyError } = useCompany();
  const { data: nextInvoiceNumber, isLoading: numberLoading, error: numberError } = useNextInvoiceNumber();
  const {
    items, selectedCustomer, summary, resetCart, invoiceType, cashboxId, currency,
    setMetadata, setCustomer
  } = useSalesStore();
  const { mutate: createInvoice, isPending } = useCreateInvoice();
  const { rates } = useCurrencies();
  const { invoice: invoiceSettings } = useSettingsStore();

  // Apply defaults on mount
  React.useEffect(() => {
    // 1. Set default currency and invoice type from settings
    if (invoiceSettings.default_currency) {
      setMetadata('currency', invoiceSettings.default_currency);
    }
    if (invoiceSettings.default_invoice_type) {
      setMetadata('invoiceType', invoiceSettings.default_invoice_type);
    }

    // 2. Load "General Customer" if none selected
    if (!selectedCustomer) {
      import('../../../customers/service').then(({ customersService }) => {
        if (company?.id) {
          customersService.getOrCreateGeneralCustomer(company.id).then(customer => {
            setCustomer({
              id: customer.id,
              name: customer.name,
              phone: customer.phone || ''
            });
          });
        }
      });
    }
  }, [company?.id]);

  const getExchangeRate = (currCode: string) => {
    const history = (rates.data as any[])?.filter((r: any) => r.currency_code === currCode) || [];
    return history.length > 0 ? history[0].rate_to_base : 1;
  };

  const [isPrinting, setIsPrinting] = useState(false);

  const handleSave = (status: InvoiceStatus) => {
    const validItems = items.filter(item => item.productId && item.name && item.quantity > 0);
    if (validItems.length === 0) return;

    createInvoice({
      partyId: selectedCustomer?.id || null,
      items: validItems.map(item => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.price,
        costPrice: 0,
        taxRate: item.tax,
        maxStock: 100
      })),
      discount: summary.discountAmount,
      status: status,
      type: 'sale' as const,
      paymentMethod: invoiceType,
      treasuryAccountId: cashboxId,
      currency: currency || 'SAR',
      exchangeRate: getExchangeRate(currency || 'SAR')
    }, {
      onSuccess: () => {
        resetCart();
        onSuccess();
      },
    });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const invoiceForPrint = {
    company: company,
    invoice_number: nextInvoiceNumber || '...',
    issue_date: new Date().toISOString().split('T')[0],
    party_name: selectedCustomer?.name || 'عميل نقدي',
    items: items.filter(i => i.name),
    total_amount: summary.totalAmount,
  };

  if (companyLoading || numberLoading) return <PageLoader />;
  if (companyError || numberError) return <ErrorDisplay error={(companyError || numberError) as any} variant="full" />;

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-3 animate-in fade-in duration-500 pt-2 pb-24">
        <div className="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 shadow-2xl rounded-none flex flex-col overflow-hidden">
          {company && <InvoiceHeader company={company} />}
          <InvoiceMeta invoiceNumber={nextInvoiceNumber} />
          <InteractiveInvoiceTable />
          <InvoiceTotals />
        </div>

        <div className="flex justify-end">
          <InvoiceActions onSave={handleSave} onPrint={handlePrint} isSaving={isPending} />
        </div>
      </div>

      {isPrinting && <PrintableInvoice invoice={invoiceForPrint} />}
    </>
  );
};

export default CreateInvoiceView;
