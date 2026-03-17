import React, { useState, useMemo } from 'react';
import { useInventoryCategories, useInventoryCategoryMutations } from '../hooks/index';
import CategoryExcelGrid from './CategoryExcelGrid';
import Spinner from '../../../ui/base/Spinner';
import CategoryStats from './categories/CategoryStats';
import CategoryControlBar from './categories/CategoryControlBar';
import CategoryGrid from './categories/CategoryGrid';

interface Props {
    onFilterProduct: (catName: string) => void;
}

interface Category {
    id: string;
    name: string;
    productsCount: number;
    totalStock: number;
    totalValue: number;
    hasAlert: boolean;
}

const CategoriesManagementView: React.FC<Props> = ({ onFilterProduct }) => {
    const { data: categories, isLoading } = useInventoryCategories();
    const { createCategory, deleteCategory, isCreating } = useInventoryCategoryMutations();
    const [newCatName, setNewCatName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('table');

    const filteredCategories = useMemo(() => {
        if (!categories) return [];
        if (!searchQuery) return categories;
        return categories.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [categories, searchQuery]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        createCategory(newCatName, { onSuccess: () => setNewCatName('') });
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Spinner size="lg" />
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">تحميل الأقسام...</span>
        </div>
    );

    const totalProducts = categories?.reduce((sum: number, c: any) => sum + (c.productsCount || 0), 0) || 0;
    const alertedCategories = categories?.filter((c: any) => c.hasAlert).length || 0;

    return (
        <div className="space-y-2 animate-in fade-in duration-500">
            <CategoryStats 
                categoriesCount={categories?.length || 0} 
                totalProducts={totalProducts} 
                alertedCategories={alertedCategories} 
            />

            <CategoryControlBar
                newCatName={newCatName}
                setNewCatName={setNewCatName}
                handleAdd={handleAdd}
                isCreating={isCreating}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
            />

            {displayMode === 'table' ? (
                <CategoryExcelGrid categories={filteredCategories as Category[]} onFilterProduct={onFilterProduct} />
            ) : (
                <CategoryGrid 
                    categories={filteredCategories as Category[]} 
                    onFilterProduct={onFilterProduct} 
                    deleteCategory={deleteCategory} 
                />
            )}
        </div>
    );
};

export default CategoriesManagementView;
