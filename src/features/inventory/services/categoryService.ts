// Category Service - Handles product category operations
import { inventoryApi } from '../api';

interface RawCategory {
    id: string;
    name?: string;
    name_ar?: string;
}

export const categoryService = {
    /**
     * Get all categories for a company
     */
    getCategories: async (companyId: string) => {
        const data = await inventoryApi.getCategories(companyId);
        const list = Array.isArray(data) ? data : (data as { data?: RawCategory[] })?.data || [];
        return list.map((c: RawCategory) => ({ id: c.id, name: c.name || c.name_ar }));
    },

    /**
     * Create a new category
     */
    createCategory: async (companyId: string, name: string) => {
        const { data, error } = await inventoryApi.createCategory(companyId, name);
        if (error) throw error;
        return data;
    },

    /**
     * Delete a category
     */
    deleteCategory: async (id: string) => {
        const { error } = await inventoryApi.deleteCategory(id);
        if (error) throw error;
    }
};

export default categoryService;
