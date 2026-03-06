/**
 * @deprecated Use partiesApi directly from '../../parties/api'.
 * This module delegates to the shared partiesApi with type='supplier' hardcoded.
 */
import { partiesApi } from '../parties/api';

export const supplierApi = {
    getSuppliers: (companyId: string) => partiesApi.getParties(companyId, 'supplier'),
    searchSuppliers: (companyId: string, searchTerm: string) => partiesApi.search(companyId, 'supplier', searchTerm),
    getSupplierStats: (companyId: string) => partiesApi.getParties(companyId, 'supplier'),
};
