
/**
 * DEPRECATED: This logic has been moved to Database RPCs (Stored Procedures).
 * Do not use this class for new implementations.
 * Refer to supabase/rpc.sql for logic details.
 */
export class AutoFinancialLinker {
  static async linkOperation(op: any, companyId: string, userId: string) {
    console.warn("[AutoFinancialLinker] This method is deprecated. DB Triggers/RPCs handle accounting now.");
    return Promise.resolve();
  }
}
