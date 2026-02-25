
import { z } from 'zod';

export const journalLineSchema = z.object({
  account_id: z.string().uuid(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
}).refine(data => (data.debit > 0 && data.credit === 0) || (data.credit > 0 && data.debit === 0), {
  message: "يجب أن يكون السطر إما مديناً أو دائناً فقط",
});

export const journalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(5),
  lines: z.array(journalLineSchema).min(2),
}).refine(data => {
  const totalDebit = data.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = data.lines.reduce((sum, l) => sum + l.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
  message: "القيد المحاسبي غير متوازن (إجمالي المدين لا يساوي إجمالي الدائن)",
});
