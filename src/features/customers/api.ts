/**
 * @deprecated Use partiesApi directly from '../../parties/api'.
 * This module delegates to the shared partiesApi with type='customer' hardcoded.
 */
import { partiesApi } from '../parties/api';

export const customerApi = {
    getCustomers: (companyId: string) => partiesApi.getParties(companyId, 'customer'),
    searchCustomers: (companyId: string, searchTerm: string) => partiesApi.search(companyId, 'customer', searchTerm),
    getCustomerStats: (companyId: string) => partiesApi.getParties(companyId, 'customer'),
};
