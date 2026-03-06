
import { journalEntrySchema } from '../../validators/accounting';
import { journalsApi } from '../../../features/accounting/api/journalsApi';

export class PostTransactionUsecase {
  static async execute(data: any, companyId: string, userId: string) {
    // 1. التحقق من صحة البيانات (Client-Side Validation)
    const validatedData = journalEntrySchema.parse(data);

    // 2. الترحيل عبر المحرك المركزي (Server-Side Execution)
    // نستخدم RPC الآن بدلاً من الإدخال المباشر لضمان الـ Atomicity
    const journalId = await journalsApi.postJournalEntryRPC(
        companyId, 
        userId, 
        {
            date: validatedData.date,
            description: validatedData.description,
            lines: validatedData.lines,
            reference_type: 'manual'
        }
    );

    return journalId;
  }
}
