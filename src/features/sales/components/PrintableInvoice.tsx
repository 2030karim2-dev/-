
import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../../../core/utils';
import { generateZatcaBase64 } from '../../../core/utils/zatca';
import QRCode from 'qrcode';
import { useInvoiceSettings, usePrintSettings } from '../../settings/settingsStore';
import { useI18nStore } from '@/lib/i18nStore';

// Helper to ensure we always have a minimum number of rows for layout purposes
const padItems = (items: any[], minRows: number) => {
    const padded = [...items];
    while (padded.length < minRows) {
        padded.push({ id: `pad-${padded.length}`, name: '', quantity: '', price: '' });
    }
    return padded;
};

const PrintableInvoice = ({ invoice }: { invoice: any }) => {
    const { company, invoice_number, issue_date, party_name, items, total_amount, tax_amount, issuedBy } = invoice;
    const displayItems = padItems(items.filter((i: any) => i.name), 8);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

    // Get settings
    const invoiceSettings = useInvoiceSettings();
    const printSettings = usePrintSettings();
    const { lang } = useI18nStore();
    const isArabic = lang === 'ar';

    useEffect(() => {
        if (company && invoice) {
            // ZATCA TLV Encoding
            const base64TLV = generateZatcaBase64(
                company.name || 'Al-Zahra',
                company.tax_number || '300000000000003', // Demo VAT if missing
                new Date(issue_date).toISOString(),
                total_amount.toString(),
                tax_amount.toString()
            );

            QRCode.toDataURL(base64TLV, { errorCorrectionLevel: 'M', margin: 1, width: 128 })
                .then(url => setQrCodeDataUrl(url))
                .catch(err => console.error("QR Gen Error", err));
        }
    }, [invoice, company, issue_date, tax_amount, total_amount]);

    return (
        <div id="invoice-printable-content" className="printable-area bg-white text-black font-sans">
            <style>{`
        @media print {
            body { background-color: white !important; }
            .no-print { display: none !important; }
            .printable-area {
                display: block !important;
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                padding: 0; margin: 0; box-shadow: none; border: none;
            }
            @page { margin: 0; size: auto; }
        }
        .invoice-box {
            max-width: 210mm;
            margin: auto;
            padding: 10mm;
            background: white;
            font-family: 'Cairo', sans-serif;
            color: #000;
            line-height: 1.4;
        }
        .inv-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
        .inv-logo-area { text-align: center; }
        .inv-title { font-size: 24px; font-weight: 900; margin: 0; line-height: 1.2; }
        .inv-subtitle { font-size: 14px; font-weight: bold; color: #444; }
        .inv-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 14px; border: 1px solid #ddd; padding: 10px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        .inv-table th { background: #f3f3f3; border: 1px solid #000; padding: 8px; font-weight: 800; text-align: center; }
        .inv-table td { border: 1px solid #000; padding: 6px 8px; text-align: center; }
        .inv-table td.desc { text-align: right; }
        .inv-totals { display: flex; justify-content: flex-end; }
        .totals-box { width: 40%; border: 1px solid #000; }
        .totals-row { display: flex; justify-content: space-between; padding: 5px 10px; border-bottom: 1px solid #eee; }
        .totals-row.final { border-bottom: none; background: #f3f3f3; font-weight: 900; font-size: 16px; border-top: 1px solid #000; }
        .qr-section { margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .terms { font-size: 10px; color: #666; max-width: 60%; }
      `}</style>

            <div className="invoice-box" dir="rtl">
                <div className="inv-header">
                    <div className="text-right">
                        <h1 className="inv-title">{company?.name}</h1>
                        <p className="inv-subtitle">{company?.address}</p>
                        <p className="inv-subtitle">الرقم الضريبي: <span dir="ltr">{company?.tax_number}</span></p>
                    </div>
                    <div className="inv-logo-area">
                        {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="ZATCA QR" style={{ width: '110px', height: '110px' }} />}
                    </div>
                    <div className="text-left" dir="ltr">
                        <h1 className="inv-title">{company?.english_name || 'Al-Zahra Auto'}</h1>
                        <p className="inv-subtitle">Tax Invoice</p>
                        <p className="inv-subtitle">VAT ID: {company?.tax_number}</p>
                    </div>
                </div>

                <div className="inv-meta-grid">
                    <div>
                        <div className="meta-row"><strong>العميل:</strong> <span>{party_name}</span></div>
                        <div className="meta-row"><strong>العنوان:</strong> <span>-</span></div>
                        {issuedBy && <div className="meta-row"><strong>صدرت بواسطة:</strong> <span>{issuedBy}</span></div>}
                    </div>
                    <div>
                        <div className="meta-row"><strong>رقم الفاتورة:</strong> <span dir="ltr" className="font-bold">{invoice_number}</span></div>
                        <div className="meta-row"><strong>تاريخ الإصدار:</strong> <span dir="ltr">{issue_date}</span></div>
                    </div>
                </div>

                <table className="inv-table">
                    <thead>
                        <tr>
                            <th style={{ width: '5%' }}>#</th>
                            <th>وصف السلعة / الخدمة</th>
                            <th style={{ width: '10%' }}>الكمية</th>
                            <th style={{ width: '15%' }}>سعر الوحدة</th>
                            <th style={{ width: '15%' }}>المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayItems.map((item, i) => (
                            <tr key={item.id}>
                                <td>{item.name ? i + 1 : ''}</td>
                                <td className="desc">{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{item.price ? formatCurrency(item.price) : ''}</td>
                                <td>{item.price ? formatCurrency(Number(item.price) * Number(item.quantity)) : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="inv-totals">
                    <div className="totals-box">
                        <div className="totals-row">
                            <span>المجموع الخاضع للضريبة</span>
                            <span dir="ltr">{formatCurrency(total_amount - tax_amount)}</span>
                        </div>
                        <div className="totals-row">
                            <span>ضريبة القيمة المضافة (15%)</span>
                            <span dir="ltr">{formatCurrency(tax_amount)}</span>
                        </div>
                        <div className="totals-row final">
                            <span>الإجمالي المستحق</span>
                            <span dir="ltr">{formatCurrency(total_amount)}</span>
                        </div>
                    </div>
                </div>

                <div className="qr-section">
                    <div className="terms">
                        <strong>الشروط والأحكام:</strong>
                        <ul style={{ marginTop: '5px', paddingRight: '15px' }}>
                            <li>البضاعة المباعة لا ترد ولا تستبدل بعد 3 أيام.</li>
                            <li>يجب إحضار أصل الفاتورة عند الاسترجاع.</li>
                            <li>القطع الكهربائية لا ترد ولا تستبدل.</li>
                        </ul>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%' }}>
                        <div style={{ borderBottom: '1px solid #000', marginBottom: '5px', paddingBottom: '30px' }}>التوقيع / الختم</div>
                        <div style={{ fontSize: '12px' }}>Signature / Stamp</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintableInvoice;
