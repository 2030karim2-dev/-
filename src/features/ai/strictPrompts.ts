/**
 * تعليمات صارمة لمنع التلفيق والكذب
 * يجب إضافتها لكل prompt يُرسل للذكاء الاصطناعي في عقل الجعفري
 */

export const STRICT_DATA_RULES = `
### ⛔ قواعد صارمة لا يمكن تجاوزها:
1. استخدم فقط الأرقام والبيانات المقدمة لك — لا تختلق أي رقم أو نسبة أو اسم
2. إذا كان الرقم = 0 أو غير متوفر، قل بوضوح "لا تتوفر بيانات كافية لهذا المؤشر"
3. لا تتوقع أرقام مستقبلية — لا تقل "متوقع زيادة 20%" إلا إذا كانت مبنية على بيانات حقيقية قدمتها
4. لا تجامل — إذا كان الوضع سيئاً قل ذلك بصراحة مع الحل المقترح
5. لا تذكر أي اسم عميل أو مورد أو منتج إلا إذا ذُكر صراحة في البيانات المقدمة
6. كل رقم تذكره يجب أن يكون مأخوذاً مباشرة من "بيانات النظام" المقدمة
7. إذا طُلب تحليل وليس لديك بيانات كافية، قل "البيانات المتاحة لا تكفي لهذا التحليل"
8. استخدم كلمة "حسب بيانات النظام" عند الإشارة لأي رقم
`;

export const STRICT_SYSTEM_ROLE = `أنت محلل بيانات دقيق. وظيفتك تحليل الأرقام الحقيقية المقدمة لك فقط.
- لا تختلق أي بيانات
- لا تجامل — كن صريحاً وصادقاً
- إذا البيانات سيئة قلها بوضوح
- كل رقم تذكره يجب أن يكون من البيانات المقدمة بالضبط
- رد بالعربية فقط
- لا JSON`;

/**
 * يبني سياق البيانات الحقيقية من كائن businessData
 */
export function buildRealDataContext(data: any): string {
    const lines: string[] = [
        '=== بيانات النظام الحية (من قاعدة البيانات مباشرة) ==='
    ];

    // Revenue & Expenses
    if (data.revenue > 0) {
        lines.push(`إجمالي الإيرادات: ${fmt(data.revenue)}`);
    } else {
        lines.push('إجمالي الإيرادات: لا توجد إيرادات مسجلة');
    }

    if (data.expenses > 0) {
        lines.push(`إجمالي المصروفات: ${fmt(data.expenses)}`);
    } else {
        lines.push('إجمالي المصروفات: لا توجد مصروفات مسجلة');
    }

    lines.push(`صافي الربح/الخسارة: ${fmt(data.netProfit)} (${data.netProfit >= 0 ? 'ربح' : 'خسارة'})`);
    lines.push(`هامش الربح: ${data.margin.toFixed(1)}%`);

    // Debts
    if (data.receivables > 0) {
        lines.push(`ديون العملاء (مبالغ لك): ${fmt(data.receivables)}`);
    } else {
        lines.push('ديون العملاء: لا توجد ديون للعملاء');
    }

    if (data.payables > 0) {
        lines.push(`التزامات الموردين (عليك): ${fmt(data.payables)}`);
    } else {
        lines.push('التزامات الموردين: لا توجد التزامات');
    }

    // Liquidity
    lines.push(`السيولة النقدية المتاحة: ${fmt(data.liquidity)}`);

    // Inventory
    lines.push(`عدد المنتجات الكلي: ${data.totalProducts || 0}`);
    lines.push(`منتجات بمخزون منخفض: ${data.lowStockCount || 0}`);

    // Revenue details
    if (data.revenues?.length > 0) {
        lines.push('\nتفصيل الإيرادات:');
        data.revenues.slice(0, 8).forEach((r: any) => {
            lines.push(`  - ${r.name}: ${fmt(r.netBalance)}`);
        });
    }

    // Expense details
    if (data.expenses_list?.length > 0) {
        lines.push('\nتفصيل المصروفات:');
        data.expenses_list.slice(0, 8).forEach((e: any) => {
            lines.push(`  - ${e.name}: ${fmt(e.netBalance)}`);
        });
    }

    // Debtors
    if (data.debtors?.length > 0) {
        lines.push('\nأكبر المديونين:');
        data.debtors.slice(0, 5).forEach((d: any) => {
            lines.push(`  - ${d.name}: ${fmt(d.balance)}`);
        });
    }

    lines.push('\n=== نهاية بيانات النظام ===');
    return lines.join('\n');
}

function fmt(val: number): string {
    if (val === 0 || val === undefined || val === null) return '0';
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);
}
