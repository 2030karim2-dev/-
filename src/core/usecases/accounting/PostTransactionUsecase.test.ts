import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PostTransactionUsecase } from './PostTransactionUsecase';
import { journalsApi } from '../../../features/accounting/api/journalsApi';
import { journalEntrySchema } from '../../validators/accounting';

// Mock the dependencies
vi.mock('../../../features/accounting/api/journalsApi', () => ({
    journalsApi: {
        postJournalEntryRPC: vi.fn(),
    },
}));

vi.mock('../../validators/accounting', () => ({
    journalEntrySchema: {
        parse: vi.fn(),
    },
}));

describe('PostTransactionUsecase', () => {
    const mockCompanyId = 'company-123';
    const mockUserId = 'user-456';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should validate data and post journal entry successfully', async () => {
        const mockInputData = {
            date: '2023-10-01',
            description: 'Test entry',
            lines: [
                { account_id: 'acc1', debit: 100, credit: 0 },
                { account_id: 'acc2', debit: 0, credit: 100 }
            ]
        };

        const mockValidatedData = {
            date: '2023-10-01',
            description: 'Test entry',
            lines: [
                { account_id: 'acc1', debit: 100, credit: 0 },
                { account_id: 'acc2', debit: 0, credit: 100 }
            ]
        };

        const expectedJournalId = 'journal-789';

        // Setup mocks
        (journalEntrySchema.parse as any).mockReturnValue(mockValidatedData);
        (journalsApi.postJournalEntryRPC as any).mockResolvedValue(expectedJournalId);

        // Execute
        const result = await PostTransactionUsecase.execute(mockInputData, mockCompanyId, mockUserId);

        // Assertions
        expect(journalEntrySchema.parse).toHaveBeenCalledWith(mockInputData);
        expect(journalsApi.postJournalEntryRPC).toHaveBeenCalledWith(
            mockCompanyId,
            mockUserId,
            {
                date: mockValidatedData.date,
                description: mockValidatedData.description,
                lines: mockValidatedData.lines,
                reference_type: 'manual'
            }
        );
        expect(result).toBe(expectedJournalId);
    });

    it('should throw an error if validation fails', async () => {
        const invalidInputData = {
            description: 'Test entry',
            lines: []
        };

        const validationError = new Error('Validation failed');
        (journalEntrySchema.parse as any).mockImplementation(() => {
            throw validationError;
        });

        // Execute and assert
        await expect(PostTransactionUsecase.execute(invalidInputData, mockCompanyId, mockUserId))
            .rejects
            .toThrow('Validation failed');

        // Ensure API is not called if validation fails
        expect(journalsApi.postJournalEntryRPC).not.toHaveBeenCalled();
    });

    it('should throw an error if posting to API fails', async () => {
        const mockInputData = {
            date: '2023-10-01',
            description: 'Test entry',
            lines: [
                { account_id: 'acc1', debit: 100, credit: 0 },
                { account_id: 'acc2', debit: 0, credit: 100 }
            ]
        };

        (journalEntrySchema.parse as any).mockReturnValue(mockInputData);

        const apiError = new Error('Database error');
        (journalsApi.postJournalEntryRPC as any).mockRejectedValue(apiError);

        // Execute and assert
        await expect(PostTransactionUsecase.execute(mockInputData, mockCompanyId, mockUserId))
            .rejects
            .toThrow('Database error');
    });
});
