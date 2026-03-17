import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '../../auth/store';
import productService from '../services/productService';

export interface DuplicatePair {
    product_a_id: string;
    product_a_name: string;
    product_a_sku: string;
    product_a_brand: string;
    product_a_stock: number;
    product_a_price: number;
    product_b_id: string;
    product_b_name: string;
    product_b_sku: string;
    product_b_brand: string;
    product_b_stock: number;
    product_b_price: number;
    similarity: number;
}

export const useInventoryDedupe = (isOpen: boolean) => {
    const { user } = useAuthStore();
    const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const scanInventory = useCallback(async () => {
        if (!user?.company_id) return;
        setIsScanning(true);
        setError(null);
        try {
            const results = await productService.getPotentialDuplicates(user.company_id);
            setDuplicates(results);
        } catch (err) {
            console.error('Scan failed:', err);
            setError('فشل الفحص. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsScanning(false);
        }
    }, [user?.company_id]);

    useEffect(() => {
        if (isOpen) {
            scanInventory();
        }
    }, [isOpen, scanInventory]);

    return {
        duplicates,
        isScanning,
        error,
        scanInventory
    };
};
