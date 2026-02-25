// Invoice Settings Types
export interface InvoiceSettings {
    // Numbering
    invoice_prefix: string;
    invoice_start_number: number;
    invoice_suffix_format: string;
    quote_prefix: string;
    quote_start_number: number;
    return_prefix: string;

    // Defaults
    default_payment_terms: number;
    default_due_date_days: number;
    auto_generate_number: boolean;

    // Template
    invoice_template: 'simple' | 'detailed' | 'custom';
    show_logo: boolean;
    show_tax_details: boolean;
    show_bank_details: boolean;

    // Notes
    default_notes_ar: string;
    default_notes_en: string;
    default_terms_ar: string;
    default_terms_en: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
    invoice_prefix: 'INV-',
    invoice_start_number: 1,
    invoice_suffix_format: 'YYYY-MM-XXXX',
    quote_prefix: 'Q-',
    quote_start_number: 1,
    return_prefix: 'RET-',
    default_payment_terms: 30,
    default_due_date_days: 30,
    auto_generate_number: true,
    invoice_template: 'simple',
    show_logo: true,
    show_tax_details: true,
    show_bank_details: false,
    default_notes_ar: '',
    default_notes_en: '',
    default_terms_ar: '',
    default_terms_en: '',
};
